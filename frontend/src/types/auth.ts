export type SupportedLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'c'
  | 'cpp'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'swift'
  | 'kotlin'
  | 'php'
  | 'ruby';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  plan: 'Free' | 'Pro' | 'Enterprise';
  joinedDate: string;
  xp: number;
  streak: number;
  level: number;
}

export interface SavedAnalysis {
  id: string;
  title: string;
  code: string;
  language: SupportedLanguage;
  timeComplexity: string;
  spaceComplexity: string;
  timestamp: string;
  tags: string[];
  isFavorite?: boolean;
  notes?: string;
}

export interface AnalysisHistoryItem {
  id: string;
  summary: string;
  language: SupportedLanguage;
  timeComplexity: string;
  spaceComplexity: string;
  timestamp: string;
  code: string;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LearningLesson {
  id: string;
  title: string;
  slug: string;
  category: 'Fundamentals' | 'Time Complexity' | 'Space Complexity' | 'Advanced Algorithms';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  complexity: string;
  description: string;
  estimatedMinutes: number;
  xpReward: number;
  theory: string[];
  codeExample: {
    language: SupportedLanguage;
    code: string;
    explanation: string;
  };
  keyTakeaways: string[];
  quiz: QuizQuestion[];
}

export interface UserLearningProgress {
  completedLessonIds: string[];
  quizScores: Record<string, number>; // lessonId -> score percentage
  totalXp: number;
  streakDays: number;
  lastActiveDate: string;
  earnedBadgeIds: string[];
}
