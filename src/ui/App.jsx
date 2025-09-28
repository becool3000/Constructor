import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import TabBar from './components/TabBar.jsx';
import Dashboard from './Tabs/Dashboard.jsx';
import Jobs from './Tabs/Jobs.jsx';
import ToolsTab from './Tabs/Tools.jsx';
import CrewTab from './Tabs/Crew.jsx';
import FleetTab from './Tabs/Fleet.jsx';
import UpgradesTab from './Tabs/Upgrades.jsx';
import PoliciesTab from './Tabs/Policies.jsx';
import FinanceTab from './Tabs/Finance.jsx';
import PrestigeTab from './Tabs/Prestige.jsx';
import {
  takeGig,
  buyTool,
  buyMaterials,
  assignCrew,
  hireCrewMember,
  togglePolicy,
  endTurn,
  workJob,
  endDay,
  promoteStage,
  bidJob,
  buyUpgrade,
  recalculateDerived,
} from '../logic/actions.js';
import {
  loadGame,
  saveGame,
  exportSave,
  importSave,
  clearSave,
  baseTurns,
} from '../logic/save.js';
import { validateContent, getJob, content, availableTools, availableUpgrades, STAGE_ORDER } from '../logic/content.js';
import { advanceTick } from '../logic/tick.js';
import { availablePrestigeChoices, canPrestige, chartersEarned, performPrestige } from '../logic/prestige.js';

const TABS = ['Dashboard', 'Jobs', 'Tools', 'Crew', 'Fleet', 'Upgrades', 'Policies', 'Finance', 'Prestige'];

const useDevFlag = () => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('dev') === '1';
};

const App = () => {
  useEffect(() => {
    validateContent();
  }, []);

  const [state, setState] = useState(() => recalculateDerived(loadGame()));
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const devEnabled = useDevFlag();

  const updateState = useCallback((updater) => {
    setState((prev) => {
      const result = typeof updater === 'function' ? updater(prev) : updater;
      stateRef.current = result;
      return result;
    });
  }, []);

  useEffect(() => {
    saveGame(state);
  }, [state]);

  useEffect(() => () => {
    saveGame(stateRef.current);
  }, []);

  const wrapAction = useCallback(
    (fn) =>
      (...args) => {
        updateState((prev) => {
          const updated = fn(prev, ...args);
          if (updated === prev) return prev;
          return recalculateDerived(updated);
        });
      },
    [updateState],
  );

  const actions = useMemo(
    () => ({
      takeGig: wrapAction(takeGig),
      buyTool: wrapAction(buyTool),
      buyMaterials: wrapAction(buyMaterials),
      assignCrew: wrapAction(assignCrew),
      hireCrewMember: wrapAction(hireCrewMember),
      togglePolicy: wrapAction(togglePolicy),
      endTurn: wrapAction(endTurn),
      workJob: wrapAction(workJob),
      endDay: wrapAction(endDay),
      promoteStage: wrapAction(promoteStage),
      bidJob: wrapAction(bidJob),
      buyUpgrade: wrapAction(buyUpgrade),
    }),
    [wrapAction],
  );

  const setActiveTab = useCallback(
    (tab) => {
      updateState((prev) => ({
        ...prev,
        ui: { ...prev.ui, activeTab: tab },
      }));
    },
    [updateState],
  );

  const handleExport = useCallback(() => exportSave(stateRef.current), []);

  const handleImport = useCallback(
    (raw) => {
      try {
        const imported = importSave(raw);
        updateState(recalculateDerived(imported));
        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
    [updateState],
  );

  const handlePrestige = useCallback(
    (selected) => {
      const next = performPrestige(stateRef.current, selected);
      updateState(recalculateDerived(next));
    },
    [updateState],
  );

  const devActions = useMemo(() => {
    if (!devEnabled) return null;
    return {
      addCash: () =>
        updateState((prev) => ({
          ...prev,
          resources: { ...prev.resources, cash: prev.resources.cash + 1000 },
        })),
      addMaterials: () =>
        updateState((prev) => ({
          ...prev,
          resources: {
            ...prev.resources,
            lumber: prev.resources.lumber + 10,
            steel: prev.resources.steel + 5,
            concrete: prev.resources.concrete + 5,
            fuel: prev.resources.fuel + 20,
          },
        })),
      fastTurn: () =>
        updateState((prev) => {
          let nextState = prev;
          for (let i = 0; i < 5; i += 1) {
            if (nextState.turnsLeft <= 0) break;
            nextState = endTurn(nextState);
          }
          return nextState;
        }),
      finishJob: () =>
        updateState((prev) => {
          if (prev.jobs.active.length === 0) return prev;
          const job = prev.jobs.active[0];
          const required = job.turnsRequired ?? job.durationH ?? 1;
          const completedJob = { ...job, progress: required, turnsRequired: required };
          return advanceTick({
            ...prev,
            jobs: {
              ...prev.jobs,
              active: [completedJob, ...prev.jobs.active.slice(1)],
            },
          });
        }),
      reset: () => {
        clearSave();
        updateState(recalculateDerived(loadGame()));
      },
    };
  }, [devEnabled, updateState]);

  const nextMilestone = useMemo(
    () => content.milestones.find((milestone) => !state.milestones.completed.includes(milestone.id)),
    [state.milestones.completed],
  );

  const milestoneReady = useMemo(() => {
    if (!nextMilestone) return false;
    if (nextMilestone.stageReq) {
      if (STAGE_ORDER.indexOf(state.stage) < STAGE_ORDER.indexOf(nextMilestone.stageReq)) return false;
    }
    if (nextMilestone.repReq && state.resources.reputation < nextMilestone.repReq) return false;
    if (typeof nextMilestone.jobReq === 'number') {
      if (state.jobs.completed.length < nextMilestone.jobReq) return false;
    } else if (typeof nextMilestone.jobReq === 'string') {
      if (!state.jobs.completed.some((job) => job.id === nextMilestone.jobReq)) return false;
    }
    return true;
  }, [nextMilestone, state.jobs.completed, state.resources.reputation, state.stage]);

  const availableJobs = state.jobs.queue
    .map((jobId) => getJob(jobId))
    .filter(Boolean)
    .sort((a, b) => a.payout - b.payout);

  const ownedToolIds = state.tools.owned;
  const availableToolList = availableTools(ownedToolIds);
  const availableUpgradeList = availableUpgrades(state.upgrades.owned, state.stage);

  const prestigeState = {
    canPrestige: canPrestige(state),
    choices: availablePrestigeChoices(),
    earned: chartersEarned(state),
    banked: state.prestige.charters,
  };

  const renderActiveTab = () => {
    switch (state.ui.activeTab) {
      case 'Dashboard':
        return (
          <Dashboard
            state={state}
            onEndTurn={null}
            onEndDay={actions.endDay}
            onPromote={milestoneReady ? actions.promoteStage : null}
            nextMilestone={nextMilestone}
            onExport={handleExport}
            onImport={handleImport}
            devActions={devActions}
          />
        );
      case 'Jobs':
        return (
          <Jobs
            state={state}
            jobs={availableJobs}
            onTakeGig={actions.takeGig}
            onBid={actions.bidJob}
            onWorkJob={actions.workJob}
          />
        );
      case 'Tools':
        return <ToolsTab state={state} tools={availableToolList} onBuy={actions.buyTool} />;
      case 'Crew':
        return (
          <CrewTab
            state={state}
            onHire={actions.hireCrewMember}
            onAssign={actions.assignCrew}
          />
        );
      case 'Fleet':
        return <FleetTab state={state} />;
      case 'Upgrades':
        return <UpgradesTab state={state} upgrades={availableUpgradeList} onBuy={actions.buyUpgrade} />;
      case 'Policies':
        return <PoliciesTab state={state} onChange={actions.togglePolicy} />;
      case 'Finance':
        return (
          <FinanceTab
            state={state}
            onExport={handleExport}
            onImport={handleImport}
            onBuyMaterials={actions.buyMaterials}
          />
        );
      case 'Prestige':
        return (
          <PrestigeTab
            state={state}
            prestige={prestigeState}
            onPrestige={handlePrestige}
          />
        );
      default:
        return null;
    }
  };

  const unlockedTabs = TABS.filter((tab) => state.ui.unlockedTabs.includes(tab));
  const activeTab = state.ui.activeTab ?? unlockedTabs[0];

  useEffect(() => {
    if (!state.ui.unlockedTabs.includes('Crew') && state.stage === 'Foreman') {
      updateState((prev) => ({
        ...prev,
        ui: { ...prev.ui, unlockedTabs: [...prev.ui.unlockedTabs, 'Crew'] },
      }));
    }
  }, [state.stage, state.ui.unlockedTabs, updateState]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>Construction Career Clicker</h1>
        <p>
          Day {state.day} · Turns Left {state.turnsLeft}/{baseTurns(state.stage, state.modifiers)} · Stage {state.stage}
        </p>
      </header>
      <div className="app-content">
        <TabBar tabs={unlockedTabs} active={activeTab} onSelect={setActiveTab} />
        <div className="tab-panel">{renderActiveTab()}</div>
      </div>
    </div>
  );
};

export default App;
