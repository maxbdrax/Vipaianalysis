export type UserRole = 'ADMIN' | 'ANALYST' | 'VIEWER';

export type BigSmallType = 'Big' | 'Small';
export type OddEvenType = 'Odd' | 'Even';
export type ColorType = 'Red' | 'Green' | 'Purple' | 'RedPurple' | 'GreenPurple';

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface DrawResult {
  drawId: string;
  result: number; // 0 - 9
  bigSmall: BigSmallType;
  color: ColorType;
  oddEven: OddEvenType;
  timestamp: number;
  dateStr?: string;
  timeStr?: string;
  source?: string;
  notes?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'IMPORT' | 'SETTINGS_UPDATE';
  recordId?: string;
  oldValue?: string;
  newValue?: string;
  timestamp: number;
}

export interface TransitionStat {
  candidate: number;
  count: number;
  percentage: number;
  recentCount: number;
  recentPercentage: number;
  overallFrequency: number;
  gap: number;
  score: number;
}

export interface SequenceContinuation {
  nextNumber: number;
  count: number;
  percentage: number;
  recencyIndex: number;
  modelScore: number;
}

export interface SequenceAnalysisResult {
  pattern: string; // e.g. "2 → 4" or "2 → 4 → 7"
  steps: number[];
  sampleSize: number;
  isSufficient: boolean;
  continuations: SequenceContinuation[];
  topCandidate: number | null;
}

export interface StatisticalCandidate {
  rank: number;
  number: number;
  modelScore: number;
  historicalCount: number;
  historicalPercentage: number;
  gap: number;
  recentFrequency: number;
  modelBreakdown: { [modelName: string]: number };
}

export interface NextDrawAnalysis {
  previousResult: number | null;
  currentSequence2: number[] | null; // e.g. [2, 4]
  currentSequence3: number[] | null; // e.g. [9, 2, 4]
  candidates: StatisticalCandidate[];
  modelAgreement: number;
  sampleSize: number;
  dataWindow: number;
  bigSmallCandidate: {
    prediction: BigSmallType;
    probability: number;
    sampleSize: number;
  };
  colorCandidate: {
    prediction: 'Red' | 'Green' | 'Purple';
    probability: number;
    sampleSize: number;
  };
}

export interface BacktestStep {
  drawIndex: number;
  drawId: string;
  actualResult: number;
  actualBigSmall: BigSmallType;
  actualColor: ColorType;
  top1Candidate: number;
  top2Candidate: number;
  top3Candidate: number;
  predictedBigSmall: BigSmallType;
  predictedColor: 'Red' | 'Green' | 'Purple';
  hitTop1: boolean;
  hitTop2: boolean;
  hitTop3: boolean;
  hitBigSmall: boolean;
  hitColor: boolean;
  sampleSize: number;
  ensembleScore: number;
}

export interface BacktestReport {
  totalEvaluated: number;
  top1Hits: number;
  top1Rate: number;
  top2Hits: number;
  top2Rate: number;
  top3Hits: number;
  top3Rate: number;
  bigSmallHits: number;
  bigSmallRate: number;
  colorHits: number;
  colorRate: number;
  maxConsecutiveHits: number;
  maxConsecutiveMisses: number;
  baselineRandomTop1: number; // 10%
  baselineRandomTop3: number; // 30%
  baselineFreqTop1Rate: number;
  baselineRecentTop1Rate: number;
  steps: BacktestStep[];
  modelPerformances: {
    modelName: string;
    top1Rate: number;
    top3Rate: number;
    description: string;
  }[];
}
