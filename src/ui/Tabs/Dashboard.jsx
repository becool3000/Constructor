import React, { useEffect, useMemo, useState } from 'react';
import ProgressBar from '../components/ProgressBar.jsx';
import Stat from '../components/Stat.jsx';
import { getSkillProgress, normalizeSkillState, SKILL_XP_PER_LEVEL } from '../../logic/skills.js';

const Dashboard = ({
  state,
  onEndTurn,
  onEndDay,
  onPromote,
  nextMilestone,
  onExport,
  onImport,
  onReset,
  devActions,
  onUpdateProfile,
}) => {
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
    { label: 'Turns Left', value: state.turnsLeft.toFixed(0) },
  ];
  const showEndTurnButton = typeof onEndTurn === 'function';

  return (
    <div className="panel">
      <div className="grid two">
        <div className="panel">
          <h2>Operations</h2>
          <PlayerProfileEditor player={state.player} onUpdate={onUpdateProfile} />
          <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
            You are <strong>{state.player?.name}</strong>. Complete jobs to earn experience and level up your specializations.
          </p>
          <div className="grid two">
            {stats.map((stat) => (
              <Stat key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginTop: '1rem',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {showEndTurnButton ? (
              <button
                type="button"
                className="primary"
                onClick={onEndTurn}
                aria-label="End Turn"
                disabled={state.turnsLeft <= 0}
              >
                End Turn
              </button>
            ) : (
              <span style={{ fontSize: '0.85rem' }}>
                Work jobs from the Jobs tab to spend turns.
              </span>
            )}
            {state.turnsLeft <= 0 ? (
              <button type="button" className="secondary" onClick={onEndDay} aria-label="End Day">
                End Day
              </button>
            ) : null}
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
          <SkillOverview skills={state.player?.skills} />
        </div>
        <div className="panel">
          <h2>Save Data</h2>
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              flexWrap: 'wrap',
            }}
          >
            <button type="button" onClick={handleExport} className="secondary">
              Export Save
            </button>
            <button type="button" onClick={handleImport} className="secondary">
              Import Save
            </button>
            {onReset ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Reset and start a new game? This cannot be undone.')) {
                    onReset();
                    setSaveText('');
                    setStatus('New game started.');
                  }
                }}
                className="danger"
              >
                Reset Game
              </button>
            ) : null}
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
          state.jobs.active.map((job) => {
            const totalTurns = job.turnsRequired ?? job.durationH ?? 1;
            const turnsDone = Math.min(totalTurns, job.progress ?? 0);
            return (
              <ProgressBar
                key={job.id}
                value={turnsDone}
                max={totalTurns}
                label={`${job.name} · ${turnsDone.toFixed(1)}/${totalTurns} turns`}
              />
            );
          })
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
            <button type="button" className="secondary" onClick={devActions.fastTurn}>
              +5 Turns
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

const PlayerProfileEditor = ({ player, onUpdate }) => {
  const defaultName = player?.name ?? '';
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (typeof onUpdate === 'function') {
      onUpdate(name);
    }
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
        placeholder="Your name"
        aria-label="Player name"
        style={{ minWidth: '12rem' }}
      />
      <button type="submit" className="secondary">
        Update Profile
      </button>
    </form>
  );
};

const SkillOverview = ({ skills }) => {
  const rows = useMemo(() => {
    const normalized = normalizeSkillState(skills ?? {});
    return Object.entries(normalized)
      .map(([name, entry]) => {
        const progress = getSkillProgress(entry);
        const neededXp = progress.neededXp > 0 ? progress.neededXp : SKILL_XP_PER_LEVEL;
        const percent = neededXp > 0 ? Math.min(1, progress.progressXp / neededXp) : 1;
        return {
          name,
          level: progress.level,
          xp: progress.xp,
          percent,
          progressXp: progress.progressXp,
          neededXp,
        };
      })
      .sort((a, b) => {
        if (b.level !== a.level) return b.level - a.level;
        if (b.xp !== a.xp) return b.xp - a.xp;
        return a.name.localeCompare(b.name);
      });
  }, [skills]);

  return (
    <div style={{ marginTop: '1.25rem' }}>
      <h3 style={{ marginBottom: '0.5rem', fontSize: '1rem' }}>Specialization Skills</h3>
      <div
        style={{
          maxHeight: '220px',
          overflowY: 'auto',
          borderRadius: '0.5rem',
          border: '1px solid rgba(148,163,184,0.2)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '0.5rem', position: 'sticky', top: 0, background: 'rgba(15,23,42,0.95)' }}>
                Skill
              </th>
              <th style={{ textAlign: 'right', padding: '0.5rem', position: 'sticky', top: 0, background: 'rgba(15,23,42,0.95)' }}>
                Level
              </th>
              <th style={{ textAlign: 'left', padding: '0.5rem', position: 'sticky', top: 0, background: 'rgba(15,23,42,0.95)' }}>
                Progress
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const percent = Math.round(row.percent * 100);
              const needed = row.neededXp > 0 ? row.neededXp : SKILL_XP_PER_LEVEL;
              return (
                <tr key={row.name} style={{ borderTop: '1px solid rgba(148,163,184,0.2)' }}>
                  <td style={{ padding: '0.5rem' }}>{row.name}</td>
                  <td style={{ padding: '0.5rem', textAlign: 'right' }}>Lv {row.level}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <div
                      style={{
                        width: '100%',
                        height: '0.5rem',
                        borderRadius: '999px',
                        background: 'rgba(148,163,184,0.15)',
                        overflow: 'hidden',
                        marginBottom: '0.35rem',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, percent)}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #38bdf8, #34d399)',
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'rgba(226,232,240,0.75)' }}>
                      {percent}% · {Math.round(row.progressXp)}/{Math.round(needed)} XP
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
