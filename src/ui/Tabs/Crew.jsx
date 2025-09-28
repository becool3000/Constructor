import React, { useState } from 'react';
import crewSkills from '../../data/crewSkills.js';

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
      <CrewCreator
        disabled={state.crew.members.length >= state.crew.capacity}
        onHire={onHire}
      />
      <span>
        {state.crew.members.length}/{state.crew.capacity} crew deployed
      </span>
      {state.crew.members.length === 0 ? (
        <p>No crew members hired yet.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Skill</th>
              <th>Assignment</th>
            </tr>
          </thead>
          <tbody>
            {state.crew.members.map((member) => (
              <tr key={member.id}>
                <td>{member.name}</td>
                <td>{member.skill ?? crewSkills[0]}</td>
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

const CrewCreator = ({ disabled, onHire }) => {
  const defaultSkill = crewSkills[0];
  const [name, setName] = useState('');
  const [skill, setSkill] = useState(defaultSkill);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (disabled) return;
    onHire(name, skill);
    setName('');
    setSkill(defaultSkill);
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        gap: '0.5rem',
        alignItems: 'center',
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
      }}
    >
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Crew name"
        aria-label="Crew member name"
        disabled={disabled}
        style={{ minWidth: '12rem' }}
      />
      <select
        value={skill}
        onChange={(event) => setSkill(event.target.value)}
        aria-label="Crew member skill"
        disabled={disabled}
      >
        {crewSkills.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <button type="submit" className="primary" disabled={disabled}>
        Create Crew Member
      </button>
    </form>
  );
};
