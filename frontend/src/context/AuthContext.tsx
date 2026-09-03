import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  User,
  SavedAnalysis,
  AnalysisHistoryItem,
  UserLearningProgress,
  Badge,
} from '@/types/auth';
import { BADGES } from '@/data/learningCurriculum';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  savedAnalyses: SavedAnalysis[];
  analysisHistory: AnalysisHistoryItem[];
  learningProgress: UserLearningProgress;
  badges: Badge[];
  earnedBadges: Badge[];
  login: (email: string, pass: string) => Promise<boolean>;
  signup: (name: string, email: string, pass: string) => Promise<boolean>;
  loginAsGuest: () => void;
  logout: () => void;
  saveAnalysis: (analysis: Omit<SavedAnalysis, 'id' | 'timestamp'>) => SavedAnalysis;
  deleteSavedAnalysis: (id: string) => void;
  toggleFavorite: (id: string) => void;
  recordAnalysisHistory: (item: Omit<AnalysisHistoryItem, 'id' | 'timestamp'>) => void;
  completeLesson: (lessonId: string, scorePercent: number, xpReward: number) => void;
  isLessonCompleted: (lessonId: string) => boolean;
  addXp: (amount: number) => void;
}

const STORAGE_KEYS = {
  USER: 'complexity_user_session_v1',
  SAVED: 'complexity_saved_analyses_v2',
  HISTORY: 'complexity_history_v2',
  PROGRESS: 'complexity_learning_progress_v2',
};

const EMPTY_LEARNING_PROGRESS: UserLearningProgress = {
  completedLessonIds: [],
  quizScores: {},
  totalXp: 0,
  streakDays: 0,
  lastActiveDate: '',
  earnedBadgeIds: [],
};

const DEFAULT_DEMO_USER: User = {
  id: 'usr-demo-77',
  name: 'Alex Rivera',
  email: 'alex.rivera@engineer.dev',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'Senior Software Engineer',
  plan: 'Pro',
  joinedDate: 'August 2024',
  xp: 0,
  streak: 0,
  level: 1,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [savedAnalyses, setSavedAnalyses] = useState<SavedAnalysis[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SAVED);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [learningProgress, setLearningProgress] = useState<UserLearningProgress>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      return saved ? JSON.parse(saved) : EMPTY_LEARNING_PROGRESS;
    } catch {
      return EMPTY_LEARNING_PROGRESS;
    }
  });

  const resetUserData = () => {
    setSavedAnalyses([]);
    setAnalysisHistory([]);
    setLearningProgress(EMPTY_LEARNING_PROGRESS);
  };

  // Sync to localStorage
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED, JSON.stringify(savedAnalyses));
    } catch { /* ignore */ }
  }, [savedAnalyses]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(analysisHistory));
    } catch { /* ignore */ }
  }, [analysisHistory]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(learningProgress));
    } catch { /* ignore */ }
  }, [learningProgress]);

  const login = async (email: string): Promise<boolean> => {
    resetUserData();
    const namePart = email.split('@')[0] || 'Developer';
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
    const loggedInUser: User = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      name: formattedName,
      email,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(email)}`,
      role: 'Software Engineer',
      plan: 'Pro',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      xp: 0,
      streak: 0,
      level: 1,
    };
    setUser(loggedInUser);
    return true;
  };

  const signup = async (name: string, email: string): Promise<boolean> => {
    resetUserData();
    const newUser: User = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      role: 'Algorithm Engineer',
      plan: 'Free',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      xp: 0,
      streak: 0,
      level: 1,
    };
    setUser(newUser);
    return true;
  };

  const loginAsGuest = () => {
    resetUserData();
    setUser(DEFAULT_DEMO_USER);
  };

  const logout = () => {
    resetUserData();
    setUser(null);
  };

  const saveAnalysis = (item: Omit<SavedAnalysis, 'id' | 'timestamp'>): SavedAnalysis => {
    const newItem: SavedAnalysis = {
      ...item,
      id: 'saved-' + Date.now(),
      timestamp: new Date().toISOString(),
    };
    setSavedAnalyses((prev) => [newItem, ...prev]);
    addXp(30);
    return newItem;
  };

  const deleteSavedAnalysis = (id: string) => {
    setSavedAnalyses((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleFavorite = (id: string) => {
    setSavedAnalyses((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      )
    );
  };

  const recordAnalysisHistory = (item: Omit<AnalysisHistoryItem, 'id' | 'timestamp'>) => {
    const record: AnalysisHistoryItem = {
      ...item,
      id: 'hist-' + Date.now(),
      timestamp: new Date().toISOString(),
    };
    setAnalysisHistory((prev) => [record, ...prev.slice(0, 49)]); // Keep last 50
    addXp(10);
  };

  const addXp = useCallback((amount: number) => {
    setLearningProgress((prev) => {
      const nextXp = prev.totalXp + amount;
      return {
        ...prev,
        totalXp: nextXp,
      };
    });
    setUser((prev) => {
      if (!prev) return null;
      const nextXp = prev.xp + amount;
      const nextLevel = Math.floor(nextXp / 150) + 1;
      return {
        ...prev,
        xp: nextXp,
        level: nextLevel,
      };
    });
  }, []);

  const completeLesson = (lessonId: string, scorePercent: number, xpReward: number) => {
    setLearningProgress((prev) => {
      const alreadyCompleted = prev.completedLessonIds.includes(lessonId);
      const nextCompleted = alreadyCompleted
        ? prev.completedLessonIds
        : [...prev.completedLessonIds, lessonId];
      
      const nextScores = { ...prev.quizScores, [lessonId]: scorePercent };
      const nextXp = alreadyCompleted ? prev.totalXp : prev.totalXp + xpReward;

      // Check badges to unlock
      const nextBadges = [...prev.earnedBadgeIds];
      if (nextCompleted.length >= 1 && !nextBadges.includes('first_analysis')) {
        nextBadges.push('first_analysis');
      }
      if (nextCompleted.length >= 3 && !nextBadges.includes('quiz_champion')) {
        nextBadges.push('quiz_champion');
      }
      if (lessonId === 'lesson-2' && !nextBadges.includes('o1_master')) {
        nextBadges.push('o1_master');
      }
      if (lessonId === 'lesson-3' && !nextBadges.includes('log_wizard')) {
        nextBadges.push('log_wizard');
      }
      if (lessonId === 'lesson-4' && !nextBadges.includes('linear_architect')) {
        nextBadges.push('linear_architect');
      }
      if (lessonId === 'lesson-7' && !nextBadges.includes('space_guardian')) {
        nextBadges.push('space_guardian');
      }

      return {
        ...prev,
        completedLessonIds: nextCompleted,
        quizScores: nextScores,
        totalXp: nextXp,
        earnedBadgeIds: nextBadges,
        lastActiveDate: new Date().toISOString(),
      };
    });

    addXp(xpReward);
  };

  const isLessonCompleted = (lessonId: string) => {
    return learningProgress.completedLessonIds.includes(lessonId);
  };

  const earnedBadges = BADGES.filter((b) =>
    learningProgress.earnedBadgeIds.includes(b.id)
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        savedAnalyses,
        analysisHistory,
        learningProgress,
        badges: BADGES,
        earnedBadges,
        login,
        signup,
        loginAsGuest,
        logout,
        saveAnalysis,
        deleteSavedAnalysis,
        toggleFavorite,
        recordAnalysisHistory,
        completeLesson,
        isLessonCompleted,
        addXp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
