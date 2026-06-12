export type Language = 'python' | 'javascript' | 'go' | 'rust' | 'java' | 'custom';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type RecordType = 'challenge' | 'training';

export interface CodeSnippet {
  id: string;
  title: string;
  language: Language;
  difficulty: Difficulty;
  code: string;
  isCustom?: boolean;
  createdAt?: number;
}

export interface KeyError {
  expected: string;
  typed: string;
  count: number;
}

export interface FunctionStat {
  name: string;
  startIndex: number;
  endIndex: number;
  totalChars: number;
  errorChars: number;
  accuracy: number;
}

export interface TypingRecord {
  id: string;
  snippetId: string;
  snippetTitle: string;
  playerName: string;
  cpm: number;
  accuracy: number;
  totalTime: number;
  totalChars: number;
  correctChars: number;
  errorCount: number;
  errors: KeyError[];
  functionStats: FunctionStat[];
  timestamp: number;
  recordType: RecordType;
}

export interface Player {
  name: string;
  totalGames: number;
  bestCpm: number;
  bestAccuracy: number;
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'finished';

export interface CharState {
  char: string;
  status: 'pending' | 'correct' | 'incorrect' | 'current';
}

export interface TournamentPlayer {
  name: string;
  record?: TypingRecord;
  finished: boolean;
}

export type TournamentStatus = 'setup' | 'in_progress' | 'finished';

export interface Tournament {
  id: string;
  snippetId: string;
  snippetTitle: string;
  players: TournamentPlayer[];
  currentPlayerIndex: number;
  status: TournamentStatus;
  createdAt: number;
}
