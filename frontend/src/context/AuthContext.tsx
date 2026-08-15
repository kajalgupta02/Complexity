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
  SAVED: 'complexity_saved_analyses_v1',
  HISTORY: 'complexity_history_v1',
  PROGRESS: 'complexity_learning_progress_v1',
};

const DEFAULT_DEMO_USER: User = {
  id: 'usr-demo-77',
  name: 'Alex Rivera',
  email: 'alex.rivera@engineer.dev',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  role: 'Senior Software Engineer',
  plan: 'Pro',
  joinedDate: 'August 2024',
  xp: 480,
  streak: 5,
  level: 3,
};

const INITIAL_SAVED_ANALYSES: SavedAnalysis[] = [
  {
    id: 'saved-1',
    title: 'Two Sum - Hash Map Optimization',
    code: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    language: 'javascript',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    tags: ['LeetCode #1', 'HashMap', 'Optimized'],
    isFavorite: true,
    notes: 'Transformed from naive O(n²) nested search to linear pass with hash table.',
  },
  {
    id: 'saved-2',
    title: 'Merge Sort - Divide & Conquer',
    code: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}`,
    language: 'javascript',
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
    tags: ['Divide and Conquer', 'Recursion', 'Sorting'],
    isFavorite: false,
    notes: 'Standard recurrence relation T(n) = 2T(n/2) + O(n).',
  },
  {
    id: 'saved-3',
    title: 'Binary Search Implementation',
    code: `def binary_search(arr, target):
    low = 0
    high = len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,
    language: 'python',
    timeComplexity: 'O(log n)',
    spaceComplexity: 'O(1)',
    timestamp: new Date(Date.now() - 3600000 * 72).toISOString(),
    tags: ['Python', 'Binary Search', 'Logarithmic'],
    isFavorite: true,
    notes: 'Halves the search space at each iteration.',
  },
];

const INITIAL_LEARNING_PROGRESS: UserLearningProgress = {
  completedLessonIds: ['lesson-1', 'lesson-2'],
  quizScores: { 'lesson-1': 100, 'lesson-2': 100 },
  totalXp: 480,
  streakDays: 5,
  lastActiveDate: new Date().toISOString(),
  earnedBadgeIds: ['first_analysis', 'o1_master'],
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
      return saved ? JSON.parse(saved) : INITIAL_SAVED_ANALYSES;
    } catch {
      return INITIAL_SAVED_ANALYSES;
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
      return saved ? JSON.parse(saved) : INITIAL_LEARNING_PROGRESS;
    } catch {
      return INITIAL_LEARNING_PROGRESS;
    }
  });

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
      xp: learningProgress.totalXp,
      streak: Math.max(1, learningProgress.streakDays),
      level: Math.floor(learningProgress.totalXp / 150) + 1,
    };
    setUser(loggedInUser);
    return true;
  };

  const signup = async (name: string, email: string): Promise<boolean> => {
    const newUser: User = {
      id: 'usr-' + Math.random().toString(36).substring(2, 9),
      name,
      email,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(name)}`,
      role: 'Algorithm Engineer',
      plan: 'Free',
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      xp: 100,
      streak: 1,
      level: 1,
    };
    setUser(newUser);
    return true;
  };

  const loginAsGuest = () => {
    setUser(DEFAULT_DEMO_USER);
  };

  const logout = () => {
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
