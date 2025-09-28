import { deepCopy, clamp } from './math.js';
import {
  content,
  STAGE_ORDER,
  getJob,
  getTool,
  getUpgrade,
  getPolicy,
  jobsForStage,
} from './content.js';
import { recordLedger, baseTurns } from './save.js';
import { advanceTick } from './tick.js';
import { createRng } from './rng.js';
import CREW_SKILLS from '../data/crewSkills.js';

const BASE_RATES = {
  incomePerSec: 0,
  buildSpeed: 1,
  crewEff: 1,
  winRate: 0.4,
};

const BASE_MODIFIERS = {
  materials: 1,
  fuel: 1,
  moraleFloor: 0.5,
  moraleCap: 1.5,
  moraleDaily: 0,
  concreteSpeed: 0,
  structureSpeed: 0,
  permitsPassive: 0,
  turnsPerDay: 0,
};

const MATERIAL_PRICES = {
  fuel: 25,
  lumber: 40,
  steel: 65,
  concrete: 90,
};

const CREW_NAMES = [
  'Harper',
  'Quinn',
  'Logan',
  'Riley',
  'Jordan',
  'Hayes',
  'Skylar',
  'Phoenix',
];

const DEFAULT_CREW_SKILL = CREW_SKILLS[0];
const DEFAULT_PLAYER_NAME = 'Founder';

const stageIndex = (stage) => STAGE_ORDER.indexOf(stage);

const cloneState = (state) => deepCopy(state);

const consumeTurn = (state, amount = 1) => {
  if (state.turnsLeft <= 0) return state;
  const next = cloneState(state);
  next.turnsLeft = Math.max(0, next.turnsLeft - amount);
  return next;
};

const TURN_SECONDS = 3600;

const nextCrewName = (state) => {
  const used = new Set(state.crew.members.map((m) => m.name));
  return CREW_NAMES.find((name) => !used.has(name)) ?? `Crew-${state.crew.members.length + 1}`;
};

const collectPolicyEffect = (policyId, value) => {
  const policy = getPolicy(policyId);
  if (!policy) return null;
  const lookupKey = typeof value === 'boolean' ? String(value) : String(value ?? 0);
  return policy.effectsByLevel?.[lookupKey] ?? null;
};

const gatherEffects = (state) => {
  const effects = [];
  if (state.prestige?.permanentMods) {
    effects.push(state.prestige.permanentMods);
  }
  state.tools.owned.forEach((toolId) => {
    const tool = getTool(toolId);
    if (tool?.effects) effects.push(tool.effects);
  });
  state.upgrades.owned.forEach((upgradeId) => {
    const upgrade = getUpgrade(upgradeId);
    if (upgrade?.effects) effects.push(upgrade.effects);
  });
  Object.entries(state.policies).forEach(([policyId, value]) => {
    const effect = collectPolicyEffect(policyId, value);
    if (effect) effects.push(effect);
  });
  return effects;
};

export const recalculateDerived = (state) => {
  const next = cloneState(state);
  const template = {
    rates: { ...BASE_RATES },
    modifiers: {
      ...BASE_MODIFIERS,
      turnsPerDay: next.progression?.bonusTurns ?? 0,
    },
    crew: {
      ...next.crew,
      capacity: next.crew.baseCapacity ?? next.crew.capacity ?? 0,
    },
    truck: {
      ...next.truck,
      capacity: next.truck.baseCapacity ?? next.truck.capacity ?? 10,
    },
  };

  const effects = gatherEffects(next);
  const derived = effects.reduce((acc, bundle) => {
    Object.entries(bundle).forEach(([key, value]) => {
      switch (key) {
        case 'buildSpeed':
          acc.rates.buildSpeed = Math.max(0, acc.rates.buildSpeed + value);
          break;
        case 'crewEff':
          acc.rates.crewEff = Math.max(0, acc.rates.crewEff + value);
          break;
        case 'incomePerSec':
          acc.rates.incomePerSec = Math.max(0, acc.rates.incomePerSec + value);
          break;
        case 'winRate':
          acc.rates.winRate = clamp(acc.rates.winRate + value, 0.05, 0.99);
          break;
        case 'moraleCap':
          acc.modifiers.moraleCap += value;
          break;
        case 'moraleFloor':
          acc.modifiers.moraleFloor = Math.max(0, acc.modifiers.moraleFloor + value);
          break;
        case 'moraleDaily':
          acc.modifiers.moraleDaily += value;
          break;
        case 'materialsMod':
          acc.modifiers.materials += value;
          break;
        case 'fuelCostMod':
          acc.modifiers.fuel += value;
          break;
        case 'permitsPassive':
          acc.modifiers.permitsPassive += value;
          break;
        case 'job.concreteSpeed':
          acc.modifiers.concreteSpeed += value;
          break;
        case 'job.structureSpeed':
          acc.modifiers.structureSpeed += value;
          break;
        case 'crewCap':
          acc.crew.capacity += value;
          break;
        case 'turnsPerDay':
          acc.modifiers.turnsPerDay += value;
          break;
        case 'truck.capacity':
          acc.truck.capacity += value;
          break;
        case 'truck.condition':
          acc.truck.condition = clamp(acc.truck.condition + value, 0, 1.5);
          break;
        default: {
          const [group, prop] = key.split('.');
          if (group === 'rates' && prop) {
            acc.rates[prop] = (acc.rates[prop] ?? 0) + value;
          }
        }
      }
    });
    return acc;
  }, template);

  next.rates = derived.rates;
  next.modifiers = derived.modifiers;
  next.crew.capacity = Math.max(derived.crew.capacity, next.crew.members.length);
  next.truck.capacity = derived.truck.capacity;
  next.truck.condition = derived.truck.condition;
  return next;
};

const checkMaterials = (resources, costObj) =>
  Object.entries(costObj).every(([key, value]) => (resources[key] ?? 0) >= value);

const removeMaterials = (resources, costObj) => {
  const next = { ...resources };
  Object.entries(costObj).forEach(([key, value]) => {
    next[key] = (next[key] ?? 0) - value;
  });
  return next;
};

export const takeGig = (state, jobId) => {
  if (state.turnsLeft <= 0) return state;
  const job = getJob(jobId);
  if (!job) return state;
  if (!state.jobs.queue.includes(jobId)) return state;
  if (stageIndex(state.stage) < stageIndex(job.stage)) return state;
  const hasTools = job.reqTools.every((tool) => state.tools.owned.includes(tool));
  if (!hasTools) return state;
  if (!checkMaterials(state.resources, job.materials ?? {})) return state;

  const next = cloneState(state);
  next.resources = removeMaterials(next.resources, job.materials ?? {});
  next.jobs.queue = next.jobs.queue.filter((id) => id !== jobId);
  next.jobs.active = [
    ...next.jobs.active,
    {
      id: job.id,
      name: job.name,
      turnsRequired: job.turnsRequired,
      durationH: job.turnsRequired,
      progress: 0,
      materials: job.materials ?? {},
      assignedCrew: [],
    },
  ];
  const consumed = consumeTurn(next);
  const materialSummary = Object.entries(job.materials ?? {})
    .filter(([, value]) => value > 0)
    .map(([key, value]) => `${value} ${key}`)
    .join(', ');

  return recordLedger(recalculateDerived(consumed), {
    type: 'job-start',
    label: `Mobilized ${job.name}`,
    delta: materialSummary ? `-${materialSummary}` : 'ready',
  });
};

export const endTurn = (state) => {
  if (state.turnsLeft <= 0) return state;
  const progressed = advanceTick(state, TURN_SECONDS);
  const consumed = consumeTurn(progressed);
  return recalculateDerived(consumed);
};

export const workJob = (state, jobId) => {
  if (state.turnsLeft <= 0) return state;
  if (!jobId) return state;
  const activeJob = state.jobs.active.find((job) => job.id === jobId);
  if (!activeJob) return state;
  const progressed = advanceTick(state, TURN_SECONDS, jobId);
  if (progressed === state) return state;
  const consumed = consumeTurn(progressed);
  return recalculateDerived(consumed);
};

export const buyTool = (state, toolId) => {
  const tool = getTool(toolId);
  if (!tool) return state;
  if (state.tools.owned.includes(toolId)) return state;
  if (state.resources.cash < tool.cost) return state;
  const next = cloneState(state);
  next.resources = { ...next.resources, cash: next.resources.cash - tool.cost };
  next.tools = { ...next.tools, owned: [...next.tools.owned, toolId] };
  const recalculated = recalculateDerived(next);
  return recordLedger(recalculated, {
    type: 'purchase',
    label: `Bought ${tool.name}`,
    delta: `-$${tool.cost}`,
  });
};

export const buyUpgrade = (state, upgradeId) => {
  const upgrade = getUpgrade(upgradeId);
  if (!upgrade) return state;
  if (state.upgrades.owned.includes(upgradeId)) return state;
  if (upgrade.reqStage && stageIndex(state.stage) < stageIndex(upgrade.reqStage)) return state;
  if (state.resources.cash < upgrade.cost) return state;
  const next = cloneState(state);
  next.resources = { ...next.resources, cash: next.resources.cash - upgrade.cost };
  next.upgrades = { ...next.upgrades, owned: [...next.upgrades.owned, upgradeId] };
  const recalculated = recalculateDerived(next);
  return recordLedger(recalculated, {
    type: 'upgrade',
    label: `Installed ${upgrade.name}`,
    delta: `-$${upgrade.cost}`,
  });
};

export const buyMaterials = (state, bundle) => {
  const materials = bundle?.materials ?? {};
  const next = cloneState(state);
  let totalCost = bundle?.cost ?? 0;
  if (totalCost === 0) {
    totalCost = Object.entries(materials).reduce((sum, [key, qty]) => {
      const base = MATERIAL_PRICES[key] ?? 50;
      return sum + qty * base;
    }, 0);
  }
  const adjustedCost = Math.round(totalCost * Math.max(0.1, next.modifiers.materials));
  if (next.resources.cash < adjustedCost) return state;
  next.resources = { ...next.resources, cash: next.resources.cash - adjustedCost };
  Object.entries(materials).forEach(([key, qty]) => {
    next.resources[key] = (next.resources[key] ?? 0) + qty;
  });
  return recordLedger(next, {
    type: 'materials',
    label: 'Purchased materials',
    delta: `-$${adjustedCost}`,
  });
};

export const assignCrew = (state, jobId, memberId) => {
  if (state.turnsLeft <= 0) return state;
  if (!state.crew.unlocked) return state;
  const memberIndex = state.crew.members.findIndex((member) => member.id === memberId);
  if (memberIndex === -1) return state;
  const jobIndexActive = jobId ? state.jobs.active.findIndex((job) => job.id === jobId) : -1;
  if (jobId && jobIndexActive === -1) return state;
  const next = cloneState(state);
  next.crew.members = next.crew.members.map((member, index) =>
    index === memberIndex ? { ...member, assignment: jobId || null } : member,
  );
  next.jobs.active = next.jobs.active.map((job, index) => {
    const currentList = new Set(job.assignedCrew ?? []);
    if (jobId && index === jobIndexActive) {
      currentList.add(memberId);
    } else {
      currentList.delete(memberId);
    }
    return { ...job, assignedCrew: Array.from(currentList) };
  });
  return consumeTurn(next);
};

export const hireCrewMember = (state, name, skill) => {
  if (!state.crew.unlocked) return state;
  if (state.crew.members.length >= state.crew.capacity) return state;
  const next = cloneState(state);
  const id = `crew-${next.crew.members.length + 1}`;
  const desiredName = typeof name === 'string' && name.trim().length > 0 ? name.trim() : nextCrewName(state);
  const normalizedSkill = CREW_SKILLS.includes(skill) ? skill : DEFAULT_CREW_SKILL;
  next.crew.members = [
    ...next.crew.members,
    { id, name: desiredName, assignment: null, skill: normalizedSkill },
  ];
  return next;
};

export const updatePlayerProfile = (state, name) => {
  const next = cloneState(state);
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  next.player = {
    ...next.player,
    name: trimmedName.length > 0 ? trimmedName : DEFAULT_PLAYER_NAME,
  };
  return next;
};

export const togglePolicy = (state, policyId, value) => {
  if (state.turnsLeft <= 0) return state;
  const policy = getPolicy(policyId);
  if (!policy) return state;
  const validValues = new Set(policy.values.map((v) => String(v)));
  if (!validValues.has(String(value))) return state;
  const next = cloneState(state);
  next.policies = { ...next.policies, [policyId]: value };
  const consumed = consumeTurn(next);
  return recalculateDerived(consumed);
};

export const endDay = (state) => {
  if (state.turnsLeft > 0) return state;
  const next = cloneState(state);
  next.day += 1;
  const moraleDrift = next.modifiers.moraleDaily ?? 0;
  const newMorale = clamp(
    (next.resources.morale ?? 1) + moraleDrift,
    next.modifiers.moraleFloor,
    next.modifiers.moraleCap,
  );
  next.resources = { ...next.resources, morale: newMorale };
  next.turnsLeft = baseTurns(next.stage, next.modifiers);
  return next;
};

export const promoteStage = (state) => {
  const nextMilestone = content.milestones.find((milestone) =>
    !state.milestones?.completed?.includes(milestone.id),
  );
  if (!nextMilestone) return state;
  if (nextMilestone.stageReq && STAGE_ORDER.indexOf(state.stage) < STAGE_ORDER.indexOf(nextMilestone.stageReq)) {
    return state;
  }
  if (nextMilestone.repReq && state.resources.reputation < nextMilestone.repReq) return state;
  if (typeof nextMilestone.jobReq === 'number') {
    if ((state.jobs.completed?.length ?? 0) < nextMilestone.jobReq) return state;
  } else if (typeof nextMilestone.jobReq === 'string') {
    const completedIds = new Set(state.jobs.completed?.map((j) => j.id));
    if (!completedIds.has(nextMilestone.jobReq)) return state;
  }

  const next = cloneState(state);
  next.milestones = {
    completed: [...(next.milestones?.completed ?? []), nextMilestone.id],
  };

  if (nextMilestone.reward?.stageSet) {
    next.stage = nextMilestone.reward.stageSet;
  }
  if (nextMilestone.reward?.turnsDelta) {
    next.progression = {
      ...next.progression,
      bonusTurns: (next.progression?.bonusTurns ?? 0) + nextMilestone.reward.turnsDelta,
    };
  }
  if (nextMilestone.reward?.unlockTab) {
    const tabName = nextMilestone.reward.unlockTab;
    if (!next.ui.unlockedTabs.includes(tabName)) {
      next.ui = {
        ...next.ui,
        unlockedTabs: [...next.ui.unlockedTabs, tabName],
      };
    }
  }
  if (next.stage === 'Foreman') {
    next.crew.unlocked = true;
    next.crew.baseCapacity = Math.max(next.crew.baseCapacity ?? 0, 2);
    next.crew.capacity = Math.max(next.crew.capacity, next.crew.baseCapacity);
  }
  next.turnsLeft = baseTurns(next.stage, next.modifiers);
  next.jobs = {
    ...next.jobs,
    queue: Array.from(new Set([...next.jobs.queue, ...jobsForStage(next.stage).map((job) => job.id)])),
  };
  return recalculateDerived(next);
};

export const bidJob = (state, jobId) => {
  if (state.turnsLeft <= 0) return state;
  if (stageIndex(state.stage) < stageIndex('Contractor')) return state;
  const job = getJob(jobId);
  if (!job) return state;
  const rng = createRng(state.rngSeed ?? 1337);
  const repFactor = clamp(0.5 + state.resources.reputation / 200, 0.5, 2);
  const chance = clamp(state.rates.winRate * repFactor, 0, 0.95);
  const success = rng.chance(chance);
  const next = cloneState(state);
  next.rngSeed = Math.floor(rng.next() * 1_000_000);
  const consumed = consumeTurn(next);
  if (success) {
    consumed.jobs.queue = Array.from(new Set([...consumed.jobs.queue, jobId]));
    return recordLedger(recalculateDerived(consumed), {
      type: 'bid-win',
      label: `Won bid for ${job.name}`,
      delta: '+rep',
    });
  }
  return recordLedger(recalculateDerived(consumed), {
    type: 'bid-loss',
    label: `Lost bid for ${job.name}`,
    delta: 'no change',
  });
};

export const addFinanceEntry = recordLedger;
