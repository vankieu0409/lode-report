"use client";

import { useEffect, useRef, useState } from "react";
import { recognizeImage } from "@/lib/ocr";

type Props = {
  imageDataUrl?: string;
  onImageChange: (value?: string) => void;
  onTextRecognized: (text: string) => void;
  onError: (message: string) => void;
};

const MAX_OCR_WIDTH = 1600;
const OCR_IMAGE_QUALITY = 0.92;

export function ImageInputZone({ imageDataUrl, onImageChange, onTextRecognized, onError }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const items = [...(event.clipboardData?.items ?? [])];
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      const file = imageItem?.getAsFile() ?? [...(event.clipboardData?.files ?? [])].find((item) => item.type.startsWith("image/"));
      if (file) {
        event.preventDefault();
        void loadFile(file);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  });

  async function loadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      onError("Chỉ hỗ trợ file ảnh.");
      return;
    }

    try {
      onImageChange(await resizeImageForOcr(file));
    } catch {
      onError("Không đọc được file ảnh. Hãy thử chọn ảnh khác hoặc nhập tay.");
    }
  }

  async function runOcr() {
    if (!imageDataUrl) {
      onError("Chưa có ảnh để OCR.");
      return;
    }

    setIsOcrRunning(true);
    setProgress(0);
    try {
      const text = await recognizeImage(imageDataUrl, setProgress);
      onTextRecognized(text);
      setProgress(100);
    } catch {
      onError("Không đọc được ảnh. Hãy thử crop sát vùng tin nhắn hoặc nhập tay.");
    } finally {
      setIsOcrRunning(false);
    }
  }

  return (
    <section className="space-y-3">
      <div
        className={`flex min-h-[220px] w-full items-center justify-center rounded-xl border-2 border-dashed bg-slate-50 p-3 text-center transition hover:border-blue-400 hover:bg-blue-50 sm:min-h-[280px] ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-slate-300"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = [...event.dataTransfer.files].find((item) => item.type.startsWith("image/"));
          if (file) void loadFile(file);
        }}
      >
        {imageDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageDataUrl} alt="Ảnh cược" className="max-h-[320px] w-full rounded-lg object-contain" />
        ) : (
          <p className="px-3 text-base font-medium text-slate-600">Kéo thả ảnh vào đây hoặc Ctrl+V để dán ảnh</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button className="min-h-10 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm active:scale-[0.98] hover:bg-blue-700 disabled:opacity-50 sm:text-base" onClick={() => fileInputRef.current?.click()} type="button">
          Chọn/chụp ảnh
        </button>
        <button className="min-h-10 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm active:scale-[0.98] hover:bg-blue-700 disabled:opacity-50 sm:text-base" onClick={runOcr} disabled={isOcrRunning} type="button">
          {isOcrRunning ? `Đang đọc ảnh... ${progress}%` : "Đọc ảnh OCR"}
        </button>
        <button className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm active:scale-[0.98] hover:bg-slate-50 sm:text-base" onClick={() => onImageChange(undefined)} type="button">
          Xóa ảnh
        </button>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => void loadFileFromInput(event.currentTarget)} />
      {isOcrRunning ? (
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-600">Đang đọc ảnh... {progress}%</div>
          <div className="h-2 overflow-hidden rounded bg-slate-200">
            <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      ) : null}
    </section>
  );

  async function loadFileFromInput(input: HTMLInputElement) {
    const file = input.files?.[0];
    if (file) await loadFile(file);
    input.value = "";
  }
}

function resizeImageForOcr(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const shouldResize = image.width > MAX_OCR_WIDTH || file.size > 8 * 1024 * 1024;
        if (!shouldResize) {
          resolve(String(reader.result));
          return;
        }

        const scale = Math.min(1, MAX_OCR_WIDTH / image.width);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas không khả dụng."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", OCR_IMAGE_QUALITY));
      };
      image.onerror = () => reject(new Error("Không tải được ảnh."));
      image.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Không đọc được file ảnh."));
    reader.readAsDataURL(file);
  });
}
