import { describe, expect, it } from 'vitest';
import { createInitialState } from '../save.js';
import { recalculateDerived, buyTool, endDay, takeGig, togglePolicy, workJob } from '../actions.js';

const init = () => recalculateDerived(createInitialState());

describe('actions', () => {
  it('purchases tools and applies effects', () => {
    let state = init();
    state = { ...state, resources: { ...state.resources, cash: 1000 } };
    const cashBefore = state.resources.cash;
    state = buyTool(state, 'work_boots');
    expect(state.tools.owned).toContain('work_boots');
    expect(state.resources.cash).toBeLessThan(cashBefore);
    expect(state.rates.buildSpeed).toBeGreaterThan(1);
  });

  it('takes a gig and consumes a turn', () => {
    let state = init();
    state = { ...state, resources: { ...state.resources, cash: 1000 } };
    state = buyTool(state, 'work_boots');
    const turns = state.turnsLeft;
    state = takeGig(state, 'yard_cleanup');
    expect(state.jobs.active.length).toBe(1);
    expect(state.turnsLeft).toBeLessThan(turns);
  });

  it('spending a turn progresses active jobs', () => {
    let state = init();
    state = { ...state, resources: { ...state.resources, cash: 1000 } };
    state = buyTool(state, 'work_boots');
    state = takeGig(state, 'yard_cleanup');
    const turnsBefore = state.turnsLeft;
    state = workJob(state, state.jobs.active[0].id);
    expect(state.turnsLeft).toBe(turnsBefore - 1);
    expect(state.jobs.active[0].progress).toBeGreaterThan(0);
  });

  it('working a job only progresses the selected gig', () => {
    let state = init();
    state = { ...state, resources: { ...state.resources, cash: 1000 } };
    state = buyTool(state, 'work_boots');
    state = takeGig(state, 'pull_weeds');
    state = takeGig(state, 'yard_cleanup');
    const [firstJob, secondJob] = state.jobs.active;
    const turnsBefore = state.turnsLeft;
    state = workJob(state, firstJob.id);
    expect(state.turnsLeft).toBe(turnsBefore - 1);
    const updatedFirst = state.jobs.active.find((job) => job.id === firstJob.id);
    const updatedSecond = state.jobs.active.find((job) => job.id === secondJob.id);
    expect(updatedFirst?.progress ?? 0).toBeGreaterThan(0);
    expect(updatedSecond?.progress ?? 0).toBe(0);
  });

  it('endDay resets turns to stage base', () => {
    let state = init();
    state = { ...state, turnsLeft: 0 };
    state = endDay(state);
    expect(state.turnsLeft).toBeGreaterThan(0);
  });

  it('applies policy changes', () => {
    let state = init();
    const moraleBefore = state.modifiers.moraleCap;
    state = togglePolicy(state, 'safety', 2);
    expect(state.modifiers.moraleCap).toBeGreaterThan(moraleBefore);
  });
});
