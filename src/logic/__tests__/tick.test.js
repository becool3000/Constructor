import { describe, expect, it } from 'vitest';
import { createInitialState } from '../save.js';
import { recalculateDerived, takeGig, buyTool, endTurn, endDay } from '../actions.js';

const runTurns = (state, turns) => {
  let next = state;
  let remaining = turns;
  while (remaining > 0) {
    if (next.turnsLeft <= 0) {
      next = endDay(next);
    } else {
      next = endTurn(next);
      remaining -= 1;
    }
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
    const totalTurns = job.turnsRequired ?? job.durationH ?? 1;
    const completed = runTurns(state, Math.ceil(totalTurns) + 1);
    expect(completed.jobs.active.length).toBe(0);
    expect(completed.jobs.completed.some((j) => j.id === 'yard_cleanup')).toBe(true);
    expect(completed.resources.cash).toBeGreaterThan(state.resources.cash);
  });
});
