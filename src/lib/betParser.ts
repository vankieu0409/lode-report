import { NumberPoint } from "@/types";
import { formatNumber2 } from "./format";

type BetKind = "lo" | "de";

const KIND_RE = /(^|[\s,.:])(lô|lo|đề|de|dề|đe)(?=[\s,.:]|$)/giu;

export function normalizeBetText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[，、]/g, ",")
    .replace(/[;]/g, ".")
    .replace(/\bL6\b/giu, "Lô")
    .replace(/\bLo\b/giu, "Lô")
    .replace(/\bDe\b/giu, "Đề")
    .replace(/\bDề\b/giu, "Đề")
    .replace(/\bĐe\b/giu, "Đề")
    .replace(/\bmỗi\s+con\b/giu, "mc")
    .replace(/\bdiem\b/giu, "điểm")
    .replace(/[^\p{L}\p{N}\s.,:=đĐkK]/gu, " ")
    .replace(/[ \t]+/g, " ")
    .trim();
}

export function aggregateNumberPoints(items: NumberPoint[]): NumberPoint[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const number = formatNumber2(item.number);
    map.set(number, (map.get(number) ?? 0) + item.points);
  }
  return [...map.entries()]
    .map(([number, points]) => ({ number, points }))
    .sort((a, b) => a.number.localeCompare(b.number));
}

export function parseBetText(text: string): { lo: NumberPoint[]; de: NumberPoint[] } {
  const lo: NumberPoint[] = [];
  const de: NumberPoint[] = [];
  const normalized = normalizeBetText(text);

  normalized
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .forEach((line, index) => {
      const parts = splitLineByKind(line);
      if (parts.length === 0) {
        throw new Error(`Dòng ${index + 1}: không nhận diện được Lô hoặc Đề.`);
      }

      for (const part of parts) {
        const parsed = part.kind === "lo" ? parseLoPart(part.content, index + 1) : parseDePart(part.content, index + 1);
        if (part.kind === "lo") {
          lo.push(...parsed);
        } else {
          de.push(...parsed);
        }
      }
    });

  return {
    lo: aggregateNumberPoints(lo),
    de: aggregateNumberPoints(de),
  };
}

function splitLineByKind(line: string): Array<{ kind: BetKind; content: string }> {
  const matches = [...line.matchAll(KIND_RE)];
  return matches.map((match, index) => {
    const raw = match[2].toLowerCase();
    const next = matches[index + 1]?.index ?? line.length;
    const kindStart = (match.index ?? 0) + match[1].length;
    return {
      kind: raw.includes("l") ? "lo" : "de",
      content: line.slice(kindStart + match[2].length, next).replace(/^[\s,.:]+|[\s,.:]+$/g, ""),
    };
  });
}

function parseLoPart(content: string, lineNumber: number): NumberPoint[] {
  const mcMatch = content.match(/\bmc\b\s*([0-9][0-9.,]*\s*(?:d|đ|điểm|diem|k)?)/iu);
  if (mcMatch) {
    const numbersText = content.slice(0, mcMatch.index).trim();
    const numbers = extractTwoDigitNumbers(numbersText);
    const points = parsePoints(mcMatch[1]);
    return buildNumberPoints(numbers, points, lineNumber, "Lô");
  }

  const tokens = [...content.matchAll(/\d{1,3}(?:[.,]\d{3})?\s*(?:d|đ|điểm|diem|k)?|\d{2}/giu)].map((m) => m[0]);
  const amountIndex = tokens.findIndex((token) => /(?:d|đ|điểm|diem|k)$/iu.test(token.trim()));
  if (amountIndex === -1) {
    throw new Error(`Dòng ${lineNumber}: Lô thiếu điểm cược.`);
  }

  const numbers = extractTwoDigitNumbers(tokens.slice(0, amountIndex).join(" "));
  const points = parsePoints(tokens[amountIndex]);
  return buildNumberPoints(numbers, points, lineNumber, "Lô");
}

function parseDePart(content: string, lineNumber: number): NumberPoint[] {
  const pairMatches = [...content.matchAll(/(\d{2})\s*=\s*([0-9][0-9.,]*\s*(?:k|đ|d)?)/giu)];
  if (pairMatches.length > 0) {
    return pairMatches.map((match) => ({
      number: formatNumber2(match[1]),
      points: parsePoints(match[2]),
    }));
  }

  const mcMatch = content.match(/\bmc\b\s*([0-9][0-9.,]*\s*(?:k|đ|d|điểm|diem)?)/iu);
  if (!mcMatch) {
    throw new Error(`Dòng ${lineNumber}: Đề thiếu dạng "=" hoặc "mc".`);
  }

  const numbersText = content.slice(0, mcMatch.index).trim();
  const numbers = extractTwoDigitNumbers(numbersText);
  const points = parsePoints(mcMatch[1]);
  return buildNumberPoints(numbers, points, lineNumber, "Đề");
}

function extractTwoDigitNumbers(text: string): string[] {
  return [...text.matchAll(/\d{2}/g)].map((match) => formatNumber2(match[0]));
}

function parsePoints(raw: string): number {
  const text = raw.trim().toLowerCase();
  const hasThousandsFormat = /\d[.,]\d{3}/.test(text);
  const numeric = Number(text.replace(/[^\d]/g, ""));
  if (!Number.isFinite(numeric) || numeric <= 0) {
    throw new Error(`Không đọc được điểm cược: ${raw}`);
  }
  return hasThousandsFormat || numeric >= 1000 ? numeric / 1000 : numeric;
}

function buildNumberPoints(numbers: string[], points: number, lineNumber: number, label: string): NumberPoint[] {
  if (numbers.length === 0) {
    throw new Error(`Dòng ${lineNumber}: ${label} thiếu số cược.`);
  }
  return numbers.map((number) => ({ number, points }));
}
