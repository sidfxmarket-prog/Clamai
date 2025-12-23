
import { UserStats, Badge } from '../types';
import { supabase } from './supabaseClient';

const INITIAL_STATS = (userId: string): UserStats => ({
  xp: 0,
  level: 1,
  totalSessions: 0,
  totalLogs: 0,
  badges: [],
  lastActivityDate: new Date().toISOString(),
  streak: 0,
});

export const BADGES: Badge[] = [
  { id: 'first_breath', name: 'First Breath', icon: 'fa-leaf', description: 'Completed your first rescue session.' },
  { id: 'streak_3', name: 'Inner Peace', icon: 'fa-fire', description: 'Maintained a 3-day wellness streak.' },
  { id: 'deep_thinker', name: 'Deep Thinker', icon: 'fa-brain', description: 'Used the AI Companion for 5 conversations.' },
  { id: 'persistent', name: 'The Anchor', icon: 'fa-anchor', description: 'Logged your mood for 5 consecutive days.' },
  { id: 'level_5', name: 'Zen Master', icon: 'fa-mountain', description: 'Reached Level 5 in your journey.' },
];

export const getXPForNextLevel = (level: number) => level * 100;

/**
 * Fetches stats from Supabase with a graceful fallback.
 * If the table doesn't exist or fetch fails, it returns initial stats
 * so the app remains interactive.
 */
export const fetchStats = async (): Promise<UserStats | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // PGRST116: No rows found (Expected for new users)
    // 42P01: Relation (table) does not exist
    if (error) {
      if (error.code === 'PGRST116') {
        const initial = INITIAL_STATS(user.id);
        // Attempt to create the record, but don't block on failure
        supabase.from('user_stats').insert([{ 
          user_id: user.id,
          xp: initial.xp,
          level: initial.level,
          total_sessions: initial.totalSessions,
          total_logs: initial.totalLogs,
          badges: initial.badges,
          last_activity_date: initial.lastActivityDate,
          streak: initial.streak
        }]).then(({ error: e }) => {
          if (e) console.warn('Supabase: Could not auto-create stats row.', e.message);
        });
        return initial;
      }
      
      console.warn(`Supabase Fetch Notice [${error.code}]:`, error.message);
      // Fallback to local stats so the Home screen renders
      return INITIAL_STATS(user.id);
    }

    return {
      xp: data.xp,
      level: data.level,
      totalSessions: data.total_sessions,
      totalLogs: data.total_logs,
      badges: data.badges || [],
      lastActivityDate: data.last_activity_date,
      streak: data.streak
    };
  } catch (err: any) {
    console.error('Critical error in fetchStats:', err.message);
    return null;
  }
};

export const updateXPAndActivity = async (xpAmount: number, activityType?: 'session' | 'log' | 'chat') => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const currentStats = await fetchStats();
    if (!currentStats) return null;

    let { xp, level, totalSessions, totalLogs, streak, lastActivityDate, badges } = currentStats;
    const newlyUnlocked: Badge[] = [];

    xp += xpAmount;
    while (xp >= getXPForNextLevel(level)) {
      xp -= getXPForNextLevel(level);
      level += 1;
      
      if (level === 5 && !badges.includes('level_5')) {
        badges.push('level_5');
        newlyUnlocked.push(BADGES.find(b => b.id === 'level_5')!);
      }
    }

    if (activityType === 'session') totalSessions += 1;
    if (activityType === 'log') totalLogs += 1;

    if (activityType) {
      const today = new Date().toLocaleDateString();
      const last = new Date(lastActivityDate).toLocaleDateString();
      
      if (today !== last) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        if (last === yesterday.toLocaleDateString()) {
          streak += 1;
        } else {
          streak = 1;
        }
        lastActivityDate = new Date().toISOString();
      }
    }

    // Badge triggers
    if (totalSessions === 1 && !badges.includes('first_breath')) {
      badges.push('first_breath');
      newlyUnlocked.push(BADGES.find(b => b.id === 'first_breath')!);
    }
    if (streak === 3 && !badges.includes('streak_3')) {
      badges.push('streak_3');
      newlyUnlocked.push(BADGES.find(b => b.id === 'streak_3')!);
    }

    // Update DB (non-blocking)
    const { error } = await supabase
      .from('user_stats')
      .update({
        xp,
        level,
        total_sessions: totalSessions,
        total_logs: totalLogs,
        streak,
        last_activity_date: lastActivityDate,
        badges
      })
      .eq('user_id', user.id);

    if (error) {
      console.warn('Supabase Update Error:', error.message, JSON.stringify(error));
    }

    return { 
      stats: { xp, level, totalSessions, totalLogs, streak, lastActivityDate, badges }, 
      newBadges: newlyUnlocked 
    };
  } catch (err: any) {
    console.error('Error in updateXPAndActivity:', err.message);
    return null;
  }
};
