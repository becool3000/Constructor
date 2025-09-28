import { applyEffectBundle, deepCopy } from './math.js';
import { content, BASE_TURNS_BY_STAGE, jobsForStage } from './content.js';
import CREW_SKILLS from '../data/crewSkills.js';

const STORAGE_KEY = 'constructor-career-clicker-save';
const AUTOSAVE_INTERVAL_MS = 5000;

const getStorage = () => {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
};

export const getAutosaveInterval = () => AUTOSAVE_INTERVAL_MS;

const DEFAULT_CREW_SKILL = CREW_SKILLS[0];
const DEFAULT_PLAYER_NAME = 'Founder';

const baseState = {
  day: 1,
  turnsLeft: BASE_TURNS_BY_STAGE.Laborer,
  stage: 'Laborer',
  resources: {
    cash: 100,
    reputation: 0,
    morale: 1.0,
    permits: 0,
    fuel: 20,
    lumber: 0,
    steel: 0,
    concrete: 0,
  },
  rates: {
    incomePerSec: 0,
    buildSpeed: 1.0,
    crewEff: 1.0,
    winRate: 0.4,
  },
  player: {
    name: DEFAULT_PLAYER_NAME,
    skill: DEFAULT_CREW_SKILL,
  },
  truck: {
    condition: 1.0,
    capacity: 10,
    mpg: 18,
    baseCapacity: 10,
  },
  tools: { owned: [] },
  crew: { unlocked: false, members: [], capacity: 0, baseCapacity: 0 },
  fleet: { vehicles: [{ id: 'pickup', name: '3/4 Ton Pickup', capacity: 10, condition: 1 }], maintenanceDue: 0 },
  jobs: {
    active: [],
    queue: jobsForStage('Laborer').map((job) => job.id),
    completed: [],
  },
  policies: { overtime: false, safety: 1, greenCodes: 0 },
  upgrades: { owned: [] },
  prestige: { charters: 0, permanentMods: {} },
  milestones: { completed: [] },
  progression: { bonusTurns: 0 },
  rngSeed: 1337,
  version: 1,
  modifiers: {
    materials: 1,
    fuel: 1,
    moraleFloor: 0.5,
    moraleCap: 1.5,
    moraleDaily: 0,
    concreteSpeed: 0,
    structureSpeed: 0,
    permitsPassive: 0,
    turnsPerDay: 0,
  },
  ledger: [],
  settings: { devMode: false },
  ui: {
    activeTab: 'Dashboard',
    unlockedTabs: ['Dashboard', 'Jobs', 'Tools', 'Upgrades', 'Policies', 'Finance', 'Fleet'],
    showDev: false,
  },
  lastSave: 0,
};

export const createInitialState = (permanentMods = {}) => {
  const initial = deepCopy(baseState);
  if (permanentMods && Object.keys(permanentMods).length > 0) {
    const withMods = applyEffectBundle(initial, permanentMods);
    withMods.prestige.permanentMods = permanentMods;
    return withMods;
  }
  return initial;
};

const normalizeCrewMembers = (members = []) =>
  members.map((member, index) => {
    const normalizedSkill = CREW_SKILLS.includes(member?.skill) ? member.skill : DEFAULT_CREW_SKILL;
    const assignment = typeof member?.assignment === 'string' && member.assignment.length > 0 ? member.assignment : null;
    return {
      ...member,
      id: member?.id ?? `crew-${index + 1}`,
      name: typeof member?.name === 'string' && member.name.trim().length > 0 ? member.name : `Crew-${index + 1}`,
      assignment,
      skill: normalizedSkill,
    };
  });

const normalizePlayer = (player = {}) => {
  const name = typeof player?.name === 'string' && player.name.trim().length > 0 ? player.name.trim() : DEFAULT_PLAYER_NAME;
  const skill = CREW_SKILLS.includes(player?.skill) ? player.skill : DEFAULT_CREW_SKILL;
  return { name, skill };
};

const mergeState = (loaded) => {
  const initial = createInitialState(loaded?.prestige?.permanentMods ?? {});
  const merged = {
    ...initial,
    ...loaded,
    resources: { ...initial.resources, ...loaded?.resources },
    rates: { ...initial.rates, ...loaded?.rates },
    truck: { ...initial.truck, ...loaded?.truck },
    tools: { ...initial.tools, ...loaded?.tools },
    crew: { ...initial.crew, ...loaded?.crew },
    fleet: { ...initial.fleet, ...loaded?.fleet },
    jobs: {
      active: loaded?.jobs?.active ?? initial.jobs.active,
      queue: loaded?.jobs?.queue ?? initial.jobs.queue,
      completed: loaded?.jobs?.completed ?? initial.jobs.completed,
    },
    policies: { ...initial.policies, ...loaded?.policies },
    upgrades: { ...initial.upgrades, ...loaded?.upgrades },
    prestige: { ...initial.prestige, ...loaded?.prestige },
    milestones: { ...initial.milestones, ...loaded?.milestones },
    progression: { ...initial.progression, ...loaded?.progression },
    modifiers: { ...initial.modifiers, ...loaded?.modifiers },
    ledger: loaded?.ledger ?? initial.ledger,
    settings: { ...initial.settings, ...loaded?.settings },
    ui: { ...initial.ui, ...loaded?.ui },
    lastSave: loaded?.lastSave ?? 0,
  };
  merged.player = normalizePlayer(loaded?.player ?? merged.player);
  merged.crew.members = normalizeCrewMembers(merged.crew.members);
  return ensureJobQueue(merged);
};

export const loadGame = () => {
  const storage = getStorage();
  if (!storage) return createInitialState();
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return createInitialState();
  try {
    const parsed = JSON.parse(raw);
    return mergeState(parsed);
  } catch (err) {
    console.warn('Failed to parse save, starting fresh', err);
    return createInitialState();
  }
};

export const saveGame = (state) => {
  const storage = getStorage();
  if (!storage) return;
  try {
    const snapshot = { ...state, lastSave: Date.now() };
    storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (err) {
    console.warn('Unable to persist save', err);
  }
};

export const exportSave = (state) => JSON.stringify(state, null, 2);

export const importSave = (raw) => {
  try {
    const parsed = JSON.parse(raw);
    return mergeState(parsed);
  } catch (err) {
    throw new Error('Invalid save data');
  }
};

export const clearSave = () => {
  const storage = getStorage();
  storage?.removeItem(STORAGE_KEY);
};

export const recordLedger = (state, entry) => {
  const next = deepCopy(state);
  const ledger = next.ledger ?? [];
  ledger.push({ ...entry, id: `${Date.now()}-${ledger.length}` });
  next.ledger = ledger.slice(-25);
  return next;
};

export const ensureJobQueue = (state) => {
  const next = deepCopy(state);
  const stageJobs = jobsForStage(next.stage).map((job) => job.id);
  next.jobs.queue = Array.from(new Set([...next.jobs.queue, ...stageJobs]));
  return next;
};

export const shouldUnlockTab = (state, tabName) => state.ui.unlockedTabs.includes(tabName);

export const unlockTab = (state, tabName) => {
  if (state.ui.unlockedTabs.includes(tabName)) return state;
  const next = deepCopy(state);
  next.ui.unlockedTabs = [...next.ui.unlockedTabs, tabName];
  return next;
};

export const setActiveTab = (state, tabName) => {
  if (state.ui.activeTab === tabName) return state;
  const next = deepCopy(state);
  next.ui.activeTab = tabName;
  return next;
};

export const updateDevMode = (state, flag) => {
  const next = deepCopy(state);
  next.settings.devMode = flag;
  return next;
};

export const baseTurns = (stage, modifiers = {}) => {
  const base = BASE_TURNS_BY_STAGE[stage] ?? 8;
  const bonus = modifiers.turnsPerDay ?? 0;
  return Math.max(4, Math.round(base + bonus));
};
