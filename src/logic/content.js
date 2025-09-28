import jobs from '../data/jobs.json';
import tools from '../data/tools.json';
import upgrades from '../data/upgrades.json';
import policies from '../data/policies.json';
import milestones from '../data/milestones.json';

export const STAGE_ORDER = [
  'Laborer',
  'Apprentice',
  'Foreman',
  'SiteManager',
  'Contractor',
  'Owner',
];

export const BASE_TURNS_BY_STAGE = {
  Laborer: 8,
  Apprentice: 8,
  Foreman: 9,
  SiteManager: 9,
  Contractor: 10,
  Owner: 10,
};

const indexById = (items) =>
  items.reduce((acc, item) => {
    acc[item.id] = item;
    return acc;
  }, {});

const jobIndex = indexById(jobs);
const toolIndex = indexById(tools);
const upgradeIndex = indexById(upgrades);
const policyIndex = indexById(policies);
const milestoneIndex = indexById(milestones);

export const content = {
  jobs,
  tools,
  upgrades,
  policies,
  milestones,
  jobIndex,
  toolIndex,
  upgradeIndex,
  policyIndex,
  milestoneIndex,
};

export const getJob = (id) => jobIndex[id];
export const getTool = (id) => toolIndex[id];
export const getUpgrade = (id) => upgradeIndex[id];
export const getPolicy = (id) => policyIndex[id];
export const getMilestone = (id) => milestoneIndex[id];

export const jobsForStage = (stage) => {
  const stageIndex = STAGE_ORDER.indexOf(stage);
  return jobs.filter((job) => STAGE_ORDER.indexOf(job.stage) <= stageIndex);
};

export const availableTools = (owned) =>
  tools.filter((tool) => !owned.includes(tool.id));

export const availableUpgrades = (owned, stage) => {
  const stageIndex = STAGE_ORDER.indexOf(stage);
  return upgrades.filter((upgrade) => {
    if (owned.includes(upgrade.id)) return false;
    if (!upgrade.reqStage) return true;
    return STAGE_ORDER.indexOf(upgrade.reqStage) <= stageIndex;
  });
};

export const policyValues = (policyId) => policyIndex[policyId]?.values ?? [];

export const validateContent = () => {
  if (!Array.isArray(jobs) || jobs.length < 6) throw new Error('Job content missing');
  if (!Array.isArray(tools) || tools.length < 8) throw new Error('Tool content missing');
  if (!Array.isArray(upgrades) || upgrades.length < 10) throw new Error('Upgrade content missing');
  if (!Array.isArray(policies) || policies.length < 3) throw new Error('Policy content missing');
  if (!Array.isArray(milestones) || milestones.length < 3)
    throw new Error('Milestone content missing');
  return true;
};
