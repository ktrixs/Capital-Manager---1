
export interface PredictionResult {
  homeWin: number;
  draw: number;
  awayWin: number;
  doubleChance1X: number; // Home or Draw
  doubleChanceX2: number; // Away or Draw
  over05: number;
  over15: number;
  reasoning: string;
  confidence: number;
}

export interface MatchData {
  homeTeam: string;
  awayTeam: string;
  date: string;
  league: string;
}

export interface MarketOdds {
  doubleChance: number;
  over05: number;
  over15: number;
}

export interface KellyResult {
  fraction: number;
  stake: number;
  expectedValue: number;
}

export enum ViewState {
  ARCHITECTURE = 'ARCHITECTURE',
  DATABASE = 'DATABASE',
  PREDICTION = 'PREDICTION',
  CALCULATOR = 'CALCULATOR',
  EV_CALCULATOR = 'EV_CALCULATOR',
  SIMULATION = 'SIMULATION',
  DASHBOARD = 'DASHBOARD',
  JOURNAL = 'JOURNAL',
  CYCLE = 'CYCLE',
  ALLOCATION = 'ALLOCATION'
}

export enum BetResult {
  WIN = 'WIN',
  LOSS = 'LOSS',
  PUSH = 'PUSH',
  PENDING = 'PENDING',
  HALF_WIN = 'HALF_WIN',
  HALF_LOSS = 'HALF_LOSS'
}

export enum ConfidenceLevel {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export interface Bet {
  id: string;
  date: string;
  sport: string;
  league: string;
  match: string;
  selection: string; // The specific bet (e.g., "Home Team -0.5")
  odds: number;
  stake: number;
  result: BetResult;
  bookmaker: string;
  confidence: ConfidenceLevel;
  marketType?: string; // New field for performance segmentation
  emotionalState?: string; // New field for performance segmentation
  notes?: string;
  closingLine?: number; // Optional CLV tracking
  expectedValue?: number; // Optional EV tracking
}

export interface JournalStats {
  totalBets: number;
  totalStake: number;
  totalReturn: number;
  profit: number;
  roi: number; // Return on Investment %
  yield: number; // Profit / Turnover %
  winRate: number;
  maxDrawdown: number;
  currentBankroll: number;
  averageOdds: number;
}

export interface LadderStep {
  step: number;
  stake: number;
  target: number;
  status: 'PENDING' | 'WIN' | 'LOSS' | 'SKIPPED';
}

export interface CycleHistoryItem {
  id: string;
  date: string;
  startCapital: number;
  endBankroll: number;
  profit: number;
  status: 'COMPLETED' | 'FAILED';
  stepsCompleted: number;
  totalSteps: number;
}

export interface CycleState {
  startCapital: number;
  steps: number;
  baseOdds: number;
  currentStep: number;
  cycleBankroll: number;
  cycleStatus: 'IDLE' | 'ACTIVE' | 'COMPLETED' | 'FAILED';
  wins: number;
  losses: number;
  ladder: LadderStep[];
  history: CycleHistoryItem[];
}

// Capital Allocation Types
export interface AssetConfig {
  crypto: number;
  realEstate: number;
  cash: number;
  other: number;
}

export interface AllocationPolicy {
  bettingSplit: number;
  cryptoSplit: number;
  cashSplit: number;
  emergencySplit: number;
}

export interface AllocationSettings {
  targetGoal: number;
  startNetWorth: number; // For monthly growth calc
  exchangeRate: number; // USD to Local
  autoReinvest: boolean;
  reinvestThreshold: number;
  frequency: string;
}

export interface AllocationState {
  assets: AssetConfig;
  policy: AllocationPolicy;
  settings: AllocationSettings;
  monthlySchedule: Record<string, number[]>;
}