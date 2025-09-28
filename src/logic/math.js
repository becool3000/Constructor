const clone = (value) => {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

export const deepCopy = clone;

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const softCap = (value, min, max) => {
  if (value < min) return min;
  if (value > max) {
    const excess = value - max;
    return max + excess * 0.5;
  }
  return value;
};

export const calculateCharters = ({ cash, reputation, landmarks = 0 }) => {
  return Math.floor(cash / 50000 + reputation / 200 + landmarks * 2);
};

export const sumEffects = (acc, effectKey, value) => {
  const current = acc[effectKey] ?? 0;
  acc[effectKey] = current + value;
  return acc;
};

export const applyEffectBundle = (state, effects) => {
  if (!effects) return state;
  const next = deepCopy(state);
  Object.entries(effects).forEach(([key, value]) => {
    switch (key) {
      case 'buildSpeed':
        next.rates.buildSpeed = Math.max(0, next.rates.buildSpeed + value);
        break;
      case 'crewEff':
        next.rates.crewEff = Math.max(0, next.rates.crewEff + value);
        break;
      case 'incomePerSec':
        next.rates.incomePerSec = Math.max(0, next.rates.incomePerSec + value);
        break;
      case 'winRate':
        next.rates.winRate = clamp(next.rates.winRate + value, 0.05, 0.95);
        break;
      case 'moraleCap':
        next.modifiers.moraleCap += value;
        break;
      case 'moraleFloor':
        next.modifiers.moraleFloor = Math.max(0, next.modifiers.moraleFloor + value);
        break;
      case 'moraleDaily':
        next.modifiers.moraleDaily += value;
        break;
      case 'materialsMod':
        next.modifiers.materials += value;
        break;
      case 'fuelCostMod':
        next.modifiers.fuel += value;
        break;
      case 'permitsPassive':
        next.modifiers.permitsPassive += value;
        break;
      case 'job.concreteSpeed':
        next.modifiers.concreteSpeed += value;
        break;
      case 'job.structureSpeed':
        next.modifiers.structureSpeed += value;
        break;
      case 'crewCap':
        next.crew.capacity += value;
        break;
      case 'turnsPerDay':
        next.modifiers.turnsPerDay = (next.modifiers.turnsPerDay ?? 0) + value;
        break;
      case 'truck.capacity':
        next.truck.capacity += value;
        break;
      case 'truck.condition':
        next.truck.condition = clamp(next.truck.condition + value, 0, 1.5);
        break;
      default: {
        const nested = key.split('.');
        if (nested.length === 2 && nested[0] === 'rates') {
          next.rates[nested[1]] = (next.rates[nested[1]] ?? 0) + value;
        }
      }
    }
  });
  return next;
};

export const applyMultipleEffects = (state, bundles) =>
  bundles.reduce((acc, bundle) => applyEffectBundle(acc, bundle), state);

export const moraleClamp = (value, floor, cap) => clamp(value, floor, cap);
