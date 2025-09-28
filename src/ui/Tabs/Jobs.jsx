import React from 'react';
import ProgressBar from '../components/ProgressBar.jsx';
import { STAGE_ORDER } from '../../logic/content.js';

const Jobs = ({ state, jobs, onTakeGig, onBid, onWorkJob }) => {
  const canBid = STAGE_ORDER.indexOf(state.stage) >= STAGE_ORDER.indexOf('Contractor');
  return (
    <div className="panel">
      <h2>Available Gigs</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Job</th>
            <th>Turns</th>
            <th>Payout</th>
            <th>Rep</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => {
            const locked = job.reqTools.some((tool) => !state.tools.owned.includes(tool));
            return (
              <tr key={job.id}>
                <td>{job.name}</td>
                <td>{job.turnsRequired ?? job.durationH}</td>
                <td>${job.payout}</td>
                <td>{job.rep}</td>
                <td>
                  <button
                    type="button"
                    className="primary"
                    onClick={() => onTakeGig(job.id)}
                    disabled={locked || state.turnsLeft <= 0}
                  >
                    Take Gig
                  </button>
                  {canBid ? (
                    <button
                      type="button"
                      className="secondary"
                      style={{ marginLeft: '0.5rem' }}
                      onClick={() => onBid(job.id)}
                      disabled={state.turnsLeft <= 0}
                    >
                      Bid
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="panel" style={{ marginTop: '1rem' }}>
        <h2>Job Queue</h2>
        <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
          Turns remaining today: <strong>{state.turnsLeft}</strong>
        </p>
        {state.jobs.active.length === 0 ? (
          <p>No active jobs in progress.</p>
        ) : (
          state.jobs.active.map((job) => {
            const totalTurns = job.turnsRequired ?? job.durationH ?? 1;
            const turnsDone = Math.min(totalTurns, job.progress ?? 0);
            const turnsRemaining = Math.max(0, totalTurns - turnsDone);
            const disabled = state.turnsLeft <= 0 || turnsRemaining <= 0;
            return (
              <div
                key={job.id}
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ flex: '1 1 220px', minWidth: '220px' }}>
                  <ProgressBar
                    value={turnsDone}
                    max={totalTurns}
                    label={`${job.name} · ${turnsDone.toFixed(1)}/${totalTurns} turns`}
                  />
                </div>
                <div style={{ fontSize: '0.85rem', minWidth: '120px' }}>
                  {turnsRemaining.toFixed(1)} turns remaining
                </div>
                <button
                  type="button"
                  className="primary"
                  onClick={() => onWorkJob(job.id)}
                  disabled={disabled}
                  aria-label={`Work on ${job.name}`}
                >
                  Work Turn
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Jobs;
