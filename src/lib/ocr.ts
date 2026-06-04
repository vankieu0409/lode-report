import { createWorker } from "tesseract.js";

type ProgressHandler = (progress: number) => void;

export async function recognizeImage(fileOrDataUrl: File | string, onProgress?: ProgressHandler): Promise<string> {
  const worker = await createWorker("vie+eng", 1, {
    logger: (message) => {
      if (message.status === "recognizing text") {
        onProgress?.(Math.round(message.progress * 100));
      }
    },
  });

  try {
    const { data } = await worker.recognize(fileOrDataUrl);
    return normalizeOcrText(data.text);
  } finally {
    await worker.terminate();
  }
}

export function normalizeOcrText(text: string): string {
  return text
    .replace(/\r/g, "")
    .replace(/[^\S\n]+/g, " ")
    .replace(/(?<=\d)[Oo](?=\d)/g, "0")
    .replace(/(?<=\d)[Il|](?=\d)/g, "1")
    .replace(/(?<=\d)B(?=\d)/g, "8")
    .replace(/\bL6\b/giu, "Lô")
    .replace(/\bLo\b/giu, "Lô")
    .replace(/\bLô\b/giu, "Lô")
    .replace(/\bDe\b/giu, "Đề")
    .replace(/\bDề\b/giu, "Đề")
    .replace(/\bĐe\b/giu, "Đề")
    .replace(/[;,]+/g, ".")
    .replace(/[^\p{L}\p{N}\s\n.,:=đĐkK]/gu, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
