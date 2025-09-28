import { deepCopy, clamp } from './math.js';
import { getJob } from './content.js';
import { getAutosaveInterval, saveGame } from './save.js';

const TICK_RATE = 10;
const MS_PER_TICK = 1000 / TICK_RATE;

let tickHandle = null;
let updateStateFn = null;
let readStateFn = null;
let lastAutosave = 0;

const crewBonus = (job) => 1 + (job.assignedCrew?.length ?? 0) * 0.05;

const requiresConcrete = (job) => (job.materials?.concrete ?? 0) > 0;
const isStructureJob = (job) => (job.materials?.lumber ?? 0) + (job.materials?.steel ?? 0) > 0;

export const advanceTick = (state, dtSeconds = 1 / TICK_RATE, targetJobId = null) => {
  const dtHours = dtSeconds / 3600;
  const next = deepCopy(state);
  next.resources = { ...next.resources };
  next.jobs = {
    ...next.jobs,
    active: next.jobs.active.map((job) => ({ ...job })),
    completed: [...(next.jobs.completed ?? [])],
    queue: [...next.jobs.queue],
  };

  if (next.rates.incomePerSec > 0) {
    next.resources.cash += (next.rates.incomePerSec * dtSeconds) / 1;
  }

  if (next.modifiers.permitsPassive > 0) {
    next.resources.permits += next.modifiers.permitsPassive * dtHours;
  }

  const ledger = [...(next.ledger ?? [])];
  const remainingJobs = [];

  let anyProgress = false;
  next.jobs.active.forEach((job) => {
    if (targetJobId && job.id !== targetJobId) {
      remainingJobs.push(job);
      return;
    }
    const required = job.turnsRequired ?? job.durationH ?? 1;
    const speedBase = next.rates.buildSpeed * next.rates.crewEff * (next.resources.morale ?? 1);
    let multiplier = speedBase * crewBonus(job);
    if (requiresConcrete(job)) {
      multiplier *= 1 + (next.modifiers.concreteSpeed ?? 0);
    }
    if (isStructureJob(job)) {
      multiplier *= 1 + (next.modifiers.structureSpeed ?? 0);
    }
    const progress = job.progress + multiplier * dtHours;
    if (progress >= required) {
      const jobDef = getJob(job.id);
      if (jobDef) {
        next.resources.cash += jobDef.payout;
        next.resources.reputation += jobDef.rep;
        ledger.push({
          id: `${job.id}-complete-${Date.now()}`,
          type: 'job-complete',
          label: `Completed ${jobDef.name}`,
          delta: `+$${jobDef.payout}`,
        });
        next.jobs.completed.push({ id: job.id, name: jobDef.name, day: next.day });
        if (!next.jobs.queue.includes(job.id)) {
          next.jobs.queue.push(job.id);
        }
      }
      anyProgress = true;
    } else {
      remainingJobs.push({ ...job, progress, turnsRequired: required });
      anyProgress = true;
    }
  });

  next.jobs.active = remainingJobs;
  if (targetJobId && !anyProgress) {
    return state;
  }
  next.resources.morale = clamp(
    next.resources.morale,
    next.modifiers.moraleFloor,
    next.modifiers.moraleCap,
  );
  next.ledger = ledger.slice(-25);
  return next;
};

const tickStep = () => {
  if (!updateStateFn) return;
  updateStateFn((prev) => advanceTick(prev));
  if (!readStateFn) return;
  const now = Date.now();
  if (now - lastAutosave > getAutosaveInterval()) {
    const snapshot = readStateFn();
    if (snapshot) {
      saveGame(snapshot);
    }
    lastAutosave = now;
  }
};

export const configureTick = ({ getState, setState }) => {
  readStateFn = getState;
  updateStateFn = setState;
};

export const startTick = () => {
  if (tickHandle) return;
  lastAutosave = Date.now();
  tickHandle = setInterval(tickStep, MS_PER_TICK);
};

export const stopTick = () => {
  if (tickHandle) {
    clearInterval(tickHandle);
    tickHandle = null;
  }
};
