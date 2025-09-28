import React, { useState } from 'react';
import ProgressBar from '../components/ProgressBar.jsx';
import Stat from '../components/Stat.jsx';

const Dashboard = ({ state, onEndDay, onPromote, nextMilestone, onExport, onImport, devActions }) => {
  const [saveText, setSaveText] = useState('');
  const [status, setStatus] = useState('');

  const handleExport = () => {
    const data = onExport();
    setSaveText(data);
    setStatus('Save copied to editor. Copy and store it safely.');
  };

  const handleImport = () => {
    if (!saveText) return;
    const success = onImport(saveText);
    setStatus(success ? 'Save imported.' : 'Import failed.');
  };

  const resources = state.resources;
  const stats = [
    { label: 'Cash', value: `$${resources.cash.toFixed(0)}` },
    { label: 'Reputation', value: resources.reputation.toFixed(0) },
    { label: 'Morale', value: resources.morale.toFixed(2) },
    { label: 'Permits', value: resources.permits.toFixed(1) },
  ];

  return (
    <div className="panel">
      <div className="grid two">
        <div className="panel">
          <h2>Operations</h2>
          <div className="grid two">
            {stats.map((stat) => (
              <Stat key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            <button type="button" className="primary" onClick={onEndDay} aria-label="End Day">
              End Day
            </button>
            {onPromote ? (
              <button type="button" className="secondary" onClick={onPromote} aria-label="Promote Stage">
                Promote
              </button>
            ) : null}
          </div>
          {nextMilestone ? (
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Next Milestone: <strong>{nextMilestone.id.replace('milestone_', '')}</strong>{' '}
              {nextMilestone.repReq ? `· Rep ${nextMilestone.repReq}` : ''}
            </p>
          ) : (
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>All milestones complete.</p>
          )}
        </div>
        <div className="panel">
          <h2>Save Data</h2>
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <button type="button" onClick={handleExport} className="secondary">
              Export Save
            </button>
            <button type="button" onClick={handleImport} className="secondary">
              Import Save
            </button>
          </div>
          <textarea
            style={{ width: '100%', minHeight: '120px', background: 'rgba(15,23,42,0.8)', color: 'inherit' }}
            value={saveText}
            onChange={(event) => setSaveText(event.target.value)}
            aria-label="Save data"
          />
          {status ? <div style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>{status}</div> : null}
        </div>
      </div>
      <div className="panel">
        <h2>Active Jobs</h2>
        {state.jobs.active.length === 0 ? (
          <p>No active jobs. Visit the Jobs tab to take on new work.</p>
        ) : (
          state.jobs.active.map((job) => (
            <ProgressBar
              key={job.id}
              value={job.progress}
              max={job.durationH}
              label={`${job.name}`}
            />
          ))
        )}
      </div>
      {devActions ? (
        <div className="panel">
          <h2>Dev Controls</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button type="button" className="secondary" onClick={devActions.addCash}>
              +$1k
            </button>
            <button type="button" className="secondary" onClick={devActions.addMaterials}>
              +Materials
            </button>
            <button type="button" className="secondary" onClick={devActions.fastTick}>
              x10 Tick
            </button>
            <button type="button" className="secondary" onClick={devActions.finishJob}>
              Finish Active Job
            </button>
            <button type="button" className="secondary" onClick={devActions.reset}>
              Reset Run
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Dashboard;
