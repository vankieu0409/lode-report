import { describe, expect, it } from "vitest";
import { normalizeLotteryOcrText } from "./lotteryOcr";

describe("normalizeLotteryOcrText", () => {
  it("maps labeled lottery OCR text to the expected 27-number result", () => {
    const raw = `08:33 83% 03-06-2026
AZ24.VN
ĐB 36
G1 66
G2 30 79
G3 70 58 13 38 35 69
G4 23 22 51 98
G5 76 95 71 98 48 18
G6 74 13 55
G7 52 90 77 34
18.490.000 10.490.000`;

    const result = normalizeLotteryOcrText(raw);

    expect(result.numbers).toHaveLength(27);
    expect(result.text).toBe(`DB: 36
G1: 66
G2: 30 79
G3: 70 58 13 38 35 69
G4: 23 22 51 98
G5: 76 95 71 98 48 18
G6: 74 13 55
G7: 52 90 77 34`);
  });

  it("formats exactly 27 unlabeled two-digit numbers by prize order", () => {
    const raw = "36 66 30 79 70 58 13 38 35 69 23 22 51 98 76 95 71 98 48 18 74 13 55 52 90 77 34";

    const result = normalizeLotteryOcrText(raw);

    expect(result.warning).toBeUndefined();
    expect(result.text.split("\n")[0]).toBe("DB: 36");
    expect(result.text.split("\n")[7]).toBe("G7: 52 90 77 34");
  });
});
