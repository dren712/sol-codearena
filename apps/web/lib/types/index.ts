export type ChallengeCategory = 'foundations' | 'programs' | 'tokens' | 'advanced';
export type ChallengeDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type ValidationMode = 'knowledge' | 'code' | 'onchain';

export interface TestCase {
  id: string;
  name: string;
  description: string;
  expected?: any;
}

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  order: number;
  category: ChallengeCategory;
  categoryLabel: string;
  difficulty: ChallengeDifficulty;
  points: number;
  estimatedMinutes: number;
  mode: ValidationMode;
  description: string;
  concepts: {
    title: string;
    content: string;
    diagram?: string;
    codeSnippet?: string;
  }[];
  task: string;
  starterCode: string;
  solutionCode: string;
  testCases: TestCase[];
  hints: string[];
  docLinks: { title: string; url: string }[];
}

export interface TestResult {
  id: string;
  name: string;
  passed: boolean;
  message?: string;
  expected?: string;
  actual?: string;
}

export interface ValidationResult {
  success: boolean;
  score: number;
  message: string;
  output: string;
  testResults: TestResult[];
  logs?: string[];
  txSignature?: string;
  pdaAddress?: string;
  explorerUrl?: string;
}

export interface UserProgress {
  walletAddress: string;
  username?: string;
  completedCount: number;
  totalScore: number;
  completedChallenges: string[]; // slugs or IDs
  categoryProgress: {
    foundations: { completed: number; total: number };
    programs: { completed: number; total: number };
    tokens: { completed: number; total: number };
    advanced: { completed: number; total: number };
  };
}

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  username: string;
  completedCount: number;
  score: number;
  lastActive: string;
  onchainVerified: boolean;
}

export interface AITutorRequest {
  challengeSlug: string;
  userCode: string;
  action: 'hint' | 'explain-concept' | 'debug-error' | 'explain-tx' | 'ask';
  errorOutput?: string;
  question?: string;
}

export interface AITutorResponse {
  answer: string;
  suggestedAction?: string;
  codeSnippet?: string;
}
