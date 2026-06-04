import { describe, expect, it } from "vitest";
import { BetRound } from "@/types";
import { calculateAll, calculateGrandTotal, calculateRound } from "./calculator";

const resultText = `DB: 36
G1: 66
G2: 30 79
G3: 70 58 13 38 35 69
G4: 23 22 51 98
G5: 76 95 71 98 48 18
G6: 74 13 55
G7: 52 90 77 34`;

const round1: BetRound = {
  id: "1",
  name: "Lần 1",
  date: "2026-06-04",
  hideDate: false,
  betText: `Lô 42 50d.
Lô 67.76 mc 25d.
Lô 46.64 mc 15d, đề 23=90k, 32=30k
Lo 16,61,17,71,24,42,25,52 mc 25d`,
  resultText,
};

const round2: BetRound = {
  id: "2",
  name: "Lần 2",
  date: "2026-06-04",
  hideDate: false,
  betText: `Lô 58.85.68.86.08.80.18.81 mc 25d
Lô 18.81.58.85 mc 15d
Lô 00.99.24.42 mc 25d
Đề 68.86.66.88.29.92.32.61 mc 30k
Lô 24.42 mc 25d
Đề 58.85.68.86.40.41.42 mc 36k`,
  resultText,
};

describe("calculator", () => {
  it("calculates sample round 1", () => {
    const result = calculateRound(round1);

    expect(result.totalLoPoints).toBe(330);
    expect(result.totalDePoints).toBe(120);
    expect(result.totalCost).toBe(7380000);
    expect(result.loWins.map((item) => item.number)).toEqual(["52", "71", "76"]);
    expect(result.totalWinningLoPoints).toBe(75);
    expect(result.loWinMoney).toBe(6000000);
    expect(result.deWinMoney).toBe(0);
    expect(result.profit).toBe(-1380000);
  });

  it("calculates sample round 2", () => {
    const result = calculateRound(round2);

    expect(result.totalLoPoints).toBe(410);
    expect(result.totalDePoints).toBe(492);
    expect(result.totalCost).toBe(9512000);
    expect(result.loWins.map((item) => item.number)).toEqual(["18", "58"]);
    expect(result.totalWinningLoPoints).toBe(80);
    expect(result.loWinMoney).toBe(6400000);
    expect(result.deWinMoney).toBe(0);
    expect(result.profit).toBe(-3112000);
  });

  it("calculates grand total", () => {
    const results = calculateAll([round1, round2]);
    const total = calculateGrandTotal(results);

    expect(total.totalCost).toBe(16892000);
    expect(total.totalWinMoney).toBe(12400000);
    expect(total.profit).toBe(-4492000);
  });
});
