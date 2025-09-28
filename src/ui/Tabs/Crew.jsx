import React from 'react';

const CrewTab = ({ state, onHire, onAssign }) => {
  if (!state.crew.unlocked) {
    return (
      <div className="panel">
        <h2>Crew</h2>
        <p>Build reputation to Foreman to unlock crew management.</p>
      </div>
    );
  }

  return (
    <div className="panel">
      <h2>Crew</h2>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button type="button" className="primary" onClick={onHire} disabled={state.crew.members.length >= state.crew.capacity}>
          Add Crew Member
        </button>
        <span>
          {state.crew.members.length}/{state.crew.capacity} crew deployed
        </span>
      </div>
      {state.crew.members.length === 0 ? (
        <p>No crew members hired yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Assignment</th>
            </tr>
          </thead>
          <tbody>
            {state.crew.members.map((member) => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>
                  <select
                    value={member.assignment ?? ''}
                    onChange={(event) => onAssign(event.target.value, member.id)}
                    aria-label={`Assign ${member.name}`}
                  >
                    <option value="">Bench</option>
                    {state.jobs.active.map((job) => (
                      <option key={job.id} value={job.id}>
                        {job.name}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CrewTab;
