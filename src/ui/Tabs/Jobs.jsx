import React from 'react';
import ProgressBar from '../components/ProgressBar.jsx';
import { STAGE_ORDER } from '../../logic/content.js';

const Jobs = ({ state, jobs, onTakeGig, onBid }) => {
  const canBid = STAGE_ORDER.indexOf(state.stage) >= STAGE_ORDER.indexOf('Contractor');
  return (
    <div className="panel">
      <h2>Available Gigs</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Job</th>
            <th>Duration</th>
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
                <td>{job.durationH}h</td>
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
        <h2>Active Jobs</h2>
        {state.jobs.active.length === 0 ? (
          <p>No active jobs in progress.</p>
        ) : (
          state.jobs.active.map((job) => (
            <ProgressBar key={job.id} value={job.progress} max={job.durationH} label={job.name} />
          ))
        )}
      </div>
    </div>
  );
};

export default Jobs;
