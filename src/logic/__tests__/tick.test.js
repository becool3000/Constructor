import { describe, expect, it } from 'vitest';
import { advanceTick } from '../tick.js';
import { createInitialState } from '../save.js';
import { recalculateDerived, takeGig, buyTool } from '../actions.js';

const runTicks = (state, seconds) => {
  let next = state;
  const step = 1 / 10;
  const total = Math.ceil(seconds / step);
  for (let i = 0; i < total; i += 1) {
    next = advanceTick(next, step);
  }
  return next;
};

describe('tick loop', () => {
  it('completes a job with expected payout', () => {
    let state = recalculateDerived(createInitialState());
    state = { ...state, resources: { ...state.resources, cash: 1000 } };
    state = buyTool(state, 'work_boots');
    state = takeGig(state, 'yard_cleanup');
    const job = state.jobs.active[0];
    const hours = job.durationH;
    const seconds = hours * 3600;
    const completed = runTicks(state, seconds * 1.1);
    expect(completed.jobs.active.length).toBe(0);
    expect(completed.jobs.completed.some((j) => j.id === 'yard_cleanup')).toBe(true);
    expect(completed.resources.cash).toBeGreaterThan(state.resources.cash);
  });
});
