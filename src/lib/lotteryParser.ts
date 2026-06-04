import { LotteryResult } from "@/types";
import { formatNumber2 } from "./format";

const LABEL_RE = /(DB|ĐB|G1|G2|G3|G4|G5|G6|G7)\s*:/giu;

export function parseLotteryResult(text: string): LotteryResult {
  const source = text.replace(/\r/g, "").replace(LABEL_RE, "\n$1:");
  const matches = [...source.matchAll(LABEL_RE)];
  const prizes: Record<string, string[]> = {};

  if (matches.length === 0) {
    throw new Error("Kết quả xổ số thiếu nhãn DB/G1/G2...");
  }

  matches.forEach((match, index) => {
    const label = normalizeLabel(match[1]);
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[index + 1]?.index ?? source.length;
    const value = source.slice(start, end);
    prizes[label] = extractTwoDigits(value);
  });

  const specialPrize = prizes.DB?.[0];
  if (!specialPrize) {
    throw new Error("Kết quả xổ số thiếu giải đặc biệt DB.");
  }

  return {
    specialPrize,
    prizes,
    allTwoDigitNumbers: Object.values(prizes).flat(),
  };
}

function normalizeLabel(label: string): string {
  const upper = label.toUpperCase();
  return upper === "ĐB" ? "DB" : upper;
}

function extractTwoDigits(text: string): string[] {
  return [...text.matchAll(/\d+/g)].map((match) => formatNumber2(match[0]));
}
