import { BetRound, GrandTotal, RoundCalculationResult } from "@/types";
import { parseBetText } from "./betParser";
import { parseLotteryResult } from "./lotteryParser";

const LO_COST_PER_POINT = 22000;
const LO_WIN_PER_POINT_PER_HIT = 80000;
const DE_COST_PER_POINT = 1000;
const DE_WIN_PER_POINT = 80000;

export function calculateRound(round: BetRound): RoundCalculationResult {
  const { lo, de } = parseBetText(round.betText);
  const lottery = parseLotteryResult(round.resultText);
  const hitCounts = lottery.allTwoDigitNumbers.reduce<Record<string, number>>((acc, number) => {
    acc[number] = (acc[number] ?? 0) + 1;
    return acc;
  }, {});

  const loWins = lo
    .map((item) => {
      const hits = hitCounts[item.number] ?? 0;
      return {
        number: item.number,
        points: item.points,
        hits,
        winMoney: item.points * hits * LO_WIN_PER_POINT_PER_HIT,
      };
    })
    .filter((item) => item.hits > 0);

  const deResults = de.map((item) => {
    const isWin = item.number === lottery.specialPrize;
    return {
      number: item.number,
      points: item.points,
      isWin,
      winMoney: isWin ? item.points * DE_WIN_PER_POINT : 0,
    };
  });

  const totalLoPoints = sum(lo.map((item) => item.points));
  const totalDePoints = sum(de.map((item) => item.points));
  const loCost = totalLoPoints * LO_COST_PER_POINT;
  const deCost = totalDePoints * DE_COST_PER_POINT;
  const loWinMoney = sum(loWins.map((item) => item.winMoney));
  const deWinMoney = sum(deResults.map((item) => item.winMoney));
  const totalWinMoney = loWinMoney + deWinMoney;
  const totalCost = loCost + deCost;

  return {
    round,
    loBets: lo,
    deBets: de,
    loWins,
    deResults,
    totalLoPoints,
    totalDePoints,
    loCost,
    deCost,
    totalCost,
    totalWinningLoPoints: sum(loWins.map((item) => item.points)),
    loWinMoney,
    deWinMoney,
    totalWinMoney,
    profit: totalWinMoney - totalCost,
  };
}

export function calculateAll(rounds: BetRound[]): RoundCalculationResult[] {
  return rounds.map(calculateRound);
}

export function calculateGrandTotal(results: RoundCalculationResult[]): GrandTotal {
  const totalCost = sum(results.map((item) => item.totalCost));
  const totalWinMoney = sum(results.map((item) => item.totalWinMoney));
  return {
    totalCost,
    totalWinMoney,
    profit: totalWinMoney - totalCost,
  };
}

function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
