import { calculateCharters, deepCopy } from './math.js';
import { createInitialState } from './save.js';

const PRESTIGE_CHOICES = [
  { id: 'win_rate', label: '+2% Bid Win Rate', effects: { winRate: 0.02 } },
  { id: 'turns', label: '+1 Base Turn per Day', effects: { turnsPerDay: 1 } },
  { id: 'build_speed', label: '+5% Build Speed', effects: { buildSpeed: 0.05 } },
  { id: 'materials', label: '-5% Material Costs', effects: { materialsMod: -0.05 } },
  { id: 'morale_floor', label: '+0.05 Morale Floor', effects: { moraleFloor: 0.05 } },
  { id: 'crew_cap', label: '+1 Crew Capacity', effects: { crewCap: 1 } },
];

const landmarkCount = (state) =>
  state.jobs?.completed?.filter((job) => job.id === 'duplex_frame' || job.id === 'office_ti').length ?? 0;

export const canPrestige = (state) => {
  if (!state) return false;
  const hasLandmark = landmarkCount(state) > 0;
  const reputationGate = state.resources?.reputation >= 90;
  return hasLandmark || reputationGate;
};

export const availablePrestigeChoices = () => PRESTIGE_CHOICES;

export const chartersEarned = (state) =>
  calculateCharters({
    cash: state.resources?.cash ?? 0,
    reputation: state.resources?.reputation ?? 0,
    landmarks: landmarkCount(state),
  });

const mergeEffects = (target, effects) => {
  const next = deepCopy(target);
  Object.entries(effects).forEach(([key, value]) => {
    next[key] = (next[key] ?? 0) + value;
  });
  return next;
};

export const performPrestige = (state, selected = []) => {
  const earned = chartersEarned(state);
  let banked = (state.prestige?.charters ?? 0) + earned;
  let mods = { ...(state.prestige?.permanentMods ?? {}) };

  selected.forEach((choiceId) => {
    if (banked <= 0) return;
    const choice = PRESTIGE_CHOICES.find((option) => option.id === choiceId);
    if (!choice) return;
    mods = mergeEffects(mods, choice.effects);
    banked -= 1;
  });

  const nextState = createInitialState(mods);
  nextState.prestige = {
    charters: banked,
    permanentMods: mods,
  };
  return nextState;
};
