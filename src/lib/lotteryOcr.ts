import { formatNumber2 } from "./format";

export type LotteryOcrNormalizeResult = {
  text: string;
  numbers: string[];
  warning?: string;
};

const PRIZE_LAYOUT = [
  ["DB", 1],
  ["G1", 1],
  ["G2", 2],
  ["G3", 6],
  ["G4", 4],
  ["G5", 6],
  ["G6", 3],
  ["G7", 4],
] as const;

const TOTAL_NUMBERS = PRIZE_LAYOUT.reduce((total, [, count]) => total + count, 0);
const LABEL_RE = /(DB|ĐB|D[B8]|G\s*[1-7])\s*[:.\-]?/giu;

export function normalizeLotteryOcrText(rawText: string): LotteryOcrNormalizeResult {
  const text = rawText
    .replace(/\r/g, "")
    .replace(/[Oo](?=\d)/g, "0")
    .replace(/(?<=\d)[Oo]/g, "0")
    .replace(/[Il|](?=\d)/g, "1")
    .replace(/(?<=\d)[Il|]/g, "1")
    .replace(/\bĐB\b/giu, "DB")
    .replace(/Đ8|D8/giu, "DB")
    .replace(/[^\p{L}\p{N}\s:.\-]/gu, " ")
    .replace(/[ \t]+/g, " ")
    .trim();

  const fromLabels = extractByLabels(text);
  if (fromLabels.length === TOTAL_NUMBERS) {
    return { text: formatLotteryNumbers(fromLabels), numbers: fromLabels };
  }

  const numbers = extractCandidateNumbers(text);
  const selected = selectBestWindow(numbers);
  const warning =
    numbers.length > TOTAL_NUMBERS
      ? `OCR KQXS nhận ${numbers.length} số, app đã lấy 27 số phù hợp nhất. Hãy kiểm tra lại trước khi tính.`
      : selected.length !== TOTAL_NUMBERS
        ? `OCR KQXS nhận ${selected.length}/27 số. Hãy sửa text kết quả xổ số trước khi tính.`
        : undefined;

  return {
    text: formatLotteryNumbers(selected),
    numbers: selected,
    warning,
  };
}

export function formatLotteryNumbers(numbers: string[]): string {
  let index = 0;
  return PRIZE_LAYOUT.map(([label, count]) => {
    const values = numbers.slice(index, index + count);
    index += count;
    return `${label}: ${values.join(" ")}`;
  }).join("\n");
}

function extractByLabels(text: string): string[] {
  const byLine = extractByLabelLines(text);
  if (byLine.length === TOTAL_NUMBERS) {
    return byLine;
  }

  const matches = [...text.matchAll(LABEL_RE)];
  if (matches.length < 3) {
    return [];
  }

  const values: string[] = [];
  for (const [label, count] of PRIZE_LAYOUT) {
    const matchIndex = matches.findIndex((match) => normalizeLabel(match[1]) === label);
    if (matchIndex === -1) {
      return [];
    }

    const match = matches[matchIndex];
    const start = (match.index ?? 0) + match[0].length;
    const end = matches[matchIndex + 1]?.index ?? text.length;
    const sectionNumbers = extractCandidateNumbers(text.slice(start, end)).slice(0, count);
    if (sectionNumbers.length < count) {
      return [];
    }
    values.push(...sectionNumbers);
  }
  return values;
}

function extractByLabelLines(text: string): string[] {
  const lineMap = new Map<string, string[]>();

  for (const line of text.split("\n")) {
    const match = line.match(/^\s*(DB|ĐB|D[B8]|G\s*[1-7])\s*[:.\-]?\s*(.*)$/iu);
    if (!match) continue;
    lineMap.set(normalizeLabel(match[1]), extractCandidateNumbers(match[2]));
  }

  const values: string[] = [];
  for (const [label, count] of PRIZE_LAYOUT) {
    const section = lineMap.get(label)?.slice(0, count);
    if (!section || section.length < count) {
      return [];
    }
    values.push(...section);
  }
  return values;
}

function normalizeLabel(label: string): string {
  const compact = label.toUpperCase().replace(/\s/g, "");
  if (compact.startsWith("D") || compact.startsWith("Đ")) {
    return "DB";
  }
  return compact;
}

function extractCandidateNumbers(text: string): string[] {
  const cleaned = text.replace(/\bG\s*[1-7]\b/giu, " ").replace(/\b(?:DB|ĐB|D[B8])\b/giu, " ");
  const numbers: string[] = [];
  const matches = [...cleaned.matchAll(/\d{1,5}/g)];

  for (const match of matches) {
    const value = match[0];
    const index = match.index ?? 0;
    const before = cleaned[index - 1] ?? "";
    const after = cleaned[index + value.length] ?? "";
    const compactAround = cleaned.slice(Math.max(0, index - 3), index + value.length + 6);

    if (before === ":" || after === ":" || after === "%") continue;
    if (/[./-]\d{2,4}/.test(compactAround) || /\d{1,3}[.]\d{3}/.test(compactAround)) continue;
    if (value.length === 4 && /^20\d{2}$/.test(value)) continue;
    if (value.length === 3 && Number(value) > 99) continue;

    numbers.push(formatNumber2(value));
  }

  return numbers;
}

function selectBestWindow(numbers: string[]): string[] {
  if (numbers.length <= TOTAL_NUMBERS) {
    return numbers;
  }

  // Header/status-bar numbers are usually before the lottery table, so prefer
  // a full 27-number window close to the end but still leaving all prize rows.
  return numbers.slice(0, TOTAL_NUMBERS);
}
