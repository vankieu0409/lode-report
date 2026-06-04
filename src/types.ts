export type BetRound = {
  id: string;
  name: string;
  date?: string;
  hideDate: boolean;
  betText: string;
  resultText: string;
  imageDataUrl?: string;
};

export type NumberPoint = {
  number: string;
  points: number;
};

export type LoWinResult = {
  number: string;
  points: number;
  hits: number;
  winMoney: number;
};

export type DeResult = {
  number: string;
  points: number;
  isWin: boolean;
  winMoney: number;
};

export type LotteryResult = {
  specialPrize: string;
  prizes: Record<string, string[]>;
  allTwoDigitNumbers: string[];
};

export type RoundCalculationResult = {
  round: BetRound;
  loBets: NumberPoint[];
  deBets: NumberPoint[];
  loWins: LoWinResult[];
  deResults: DeResult[];
  totalLoPoints: number;
  totalDePoints: number;
  loCost: number;
  deCost: number;
  totalCost: number;
  totalWinningLoPoints: number;
  loWinMoney: number;
  deWinMoney: number;
  totalWinMoney: number;
  profit: number;
};

export type GrandTotal = {
  totalCost: number;
  totalWinMoney: number;
  profit: number;
};
