
import { UserStats, Badge } from '../types';

const INITIAL_STATS: UserStats = {
  xp: 0,
  level: 1,
  totalSessions: 0,
  totalLogs: 0,
  badges: [],
  lastActivityDate: new Date().toISOString(),
  streak: 0,
};

export const BADGES: Badge[] = [
  { id: 'first_breath', name: 'First Breath', icon: 'fa-leaf', description: 'Completed your first rescue session.' },
  { id: 'streak_3', name: 'Inner Peace', icon: 'fa-fire', description: 'Maintained a 3-day wellness streak.' },
  { id: 'deep_thinker', name: 'Deep Thinker', icon: 'fa-brain', description: 'Used the AI Companion for 5 conversations.' },
  { id: 'persistent', name: 'The Anchor', icon: 'fa-anchor', description: 'Logged your mood for 5 consecutive days.' },
  { id: 'level_5', name: 'Zen Master', icon: 'fa-mountain', description: 'Reached Level 5 in your journey.' },
];

export const getXPForNextLevel = (level: number) => level * 100;

export const getStats = (): UserStats => {
  const saved = localStorage.getItem('user_stats');
  if (!saved) return INITIAL_STATS;
  return JSON.parse(saved);
};

export const saveStats = (stats: UserStats) => {
  localStorage.setItem('user_stats', JSON.stringify(stats));
};

export const addXP = (amount: number): { stats: UserStats, leveledUp: boolean, newBadges: Badge[] } => {
  const stats = getStats();
  const oldLevel = stats.level;
  const newlyUnlocked: Badge[] = [];
  
  stats.xp += amount;
  
  // Leveling logic
  while (stats.xp >= getXPForNextLevel(stats.level)) {
    stats.xp -= getXPForNextLevel(stats.level);
    stats.level += 1;
  }
  
  const leveledUp = stats.level > oldLevel;
  
  // Badge logic
  if (leveledUp && stats.level === 5 && !stats.badges.includes('level_5')) {
    stats.badges.push('level_5');
    newlyUnlocked.push(BADGES.find(b => b.id === 'level_5')!);
  }

  saveStats(stats);
  return { stats, leveledUp, newBadges: newlyUnlocked };
};

export const recordActivity = (type: 'session' | 'log' | 'chat') => {
  const stats = getStats();
  const today = new Date().toLocaleDateString();
  const last = new Date(stats.lastActivityDate).toLocaleDateString();
  
  if (type === 'session') stats.totalSessions += 1;
  if (type === 'log') stats.totalLogs += 1;
  
  // Streak logic
  if (today !== last) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (last === yesterday.toLocaleDateString()) {
      stats.streak += 1;
    } else {
      stats.streak = 1;
    }
    stats.lastActivityDate = new Date().toISOString();
  }

  // Trigger badges based on activity
  const newlyUnlocked: Badge[] = [];
  if (type === 'session' && stats.totalSessions === 1 && !stats.badges.includes('first_breath')) {
    stats.badges.push('first_breath');
    newlyUnlocked.push(BADGES.find(b => b.id === 'first_breath')!);
  }
  
  if (stats.streak === 3 && !stats.badges.includes('streak_3')) {
    stats.badges.push('streak_3');
    newlyUnlocked.push(BADGES.find(b => b.id === 'streak_3')!);
  }

  saveStats(stats);
  return { stats, newBadges: newlyUnlocked };
};
