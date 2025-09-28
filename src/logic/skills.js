import CREW_SKILLS from '../data/crewSkills.js';

export const SKILL_XP_PER_LEVEL = 100;

export const levelForXp = (xp = 0) => {
  const safeXp = Number.isFinite(xp) ? Math.max(0, xp) : 0;
  return Math.floor(safeXp / SKILL_XP_PER_LEVEL) + 1;
};

export const xpForLevel = (level = 1) => {
  const safeLevel = Number.isFinite(level) ? Math.max(1, Math.floor(level)) : 1;
  return (safeLevel - 1) * SKILL_XP_PER_LEVEL;
};

export const createSkillEntry = (xp = 0) => {
  const totalXp = Number.isFinite(xp) ? Math.max(0, Math.floor(xp)) : 0;
  return {
    xp: totalXp,
    level: levelForXp(totalXp),
  };
};

export const createDefaultSkillState = () =>
  CREW_SKILLS.reduce((acc, skill) => {
    acc[skill] = createSkillEntry(0);
    return acc;
  }, {});

export const normalizeSkillState = (skills = {}) => {
  const normalized = createDefaultSkillState();
  if (skills && typeof skills === 'object') {
    Object.entries(skills).forEach(([skill, value]) => {
      if (!CREW_SKILLS.includes(skill)) return;
      const xp = typeof value === 'number' ? value : Number(value?.xp ?? 0);
      normalized[skill] = createSkillEntry(xp);
    });
  }
  return normalized;
};

export const addSkillXp = (skills, xpAwards = {}) => {
  const updated = normalizeSkillState(skills);
  Object.entries(xpAwards).forEach(([skill, xp]) => {
    if (!CREW_SKILLS.includes(skill)) return;
    const delta = Number(xp);
    if (!Number.isFinite(delta) || delta <= 0) return;
    const current = updated[skill]?.xp ?? 0;
    updated[skill] = createSkillEntry(current + delta);
  });
  return updated;
};

export const getSkillProgress = (entry) => {
  const xp = Number.isFinite(entry?.xp) ? Math.max(0, entry.xp) : 0;
  const level = entry?.level ?? levelForXp(xp);
  const levelFloor = xpForLevel(level);
  const nextLevel = level + 1;
  const nextLevelFloor = xpForLevel(nextLevel);
  const intoLevel = xp - levelFloor;
  const needed = nextLevelFloor - levelFloor;
  return {
    xp,
    level,
    progressXp: intoLevel,
    neededXp: needed,
    remainingXp: Math.max(0, needed - intoLevel),
  };
};
