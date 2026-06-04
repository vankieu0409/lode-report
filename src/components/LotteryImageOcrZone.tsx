"use client";

import { useRef, useState } from "react";
import { normalizeLotteryOcrText } from "@/lib/lotteryOcr";
import { recognizeImage } from "@/lib/ocr";
import { CropRect } from "@/types";

type Props = {
  imageDataUrl?: string;
  cropDataUrl?: string;
  cropRect?: CropRect;
  onImageChange: (imageDataUrl?: string, cropDataUrl?: string, cropRect?: CropRect) => void;
  onTextRecognized: (text: string) => void;
  onError: (message: string) => void;
};

const MAX_IMAGE_WIDTH = 1800;
const IMAGE_QUALITY = 0.92;

export function LotteryImageOcrZone({ imageDataUrl, cropDataUrl, cropRect, onImageChange, onTextRecognized, onError }: Props) {
  const [isCropping, setIsCropping] = useState(false);
  const [isOcrRunning, setIsOcrRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [draftRect, setDraftRect] = useState<CropRect | undefined>(cropRect);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | undefined>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  async function loadFile(file: File) {
    if (!file.type.startsWith("image/")) {
      onError("Chỉ hỗ trợ file ảnh kết quả xổ số.");
      return;
    }

    try {
      const original = await resizeImage(file);
      const rect = await createAutoCropRect(original);
      const cropped = await cropImage(original, rect);
      onImageChange(original, cropped, rect);
      setDraftRect(rect);
      setIsCropping(false);
    } catch {
      onError("Không đọc được ảnh kết quả xổ số. Hãy thử chọn ảnh khác hoặc nhập tay.");
    }
  }

  async function runOcr() {
    if (!cropDataUrl) {
      onError("Chưa có vùng crop KQXS để OCR.");
      return;
    }

    setIsOcrRunning(true);
    setProgress(0);
    try {
      const rawText = await recognizeImage(cropDataUrl, setProgress);
      const normalized = normalizeLotteryOcrText(rawText);
      onTextRecognized(normalized.text);
      if (normalized.warning) {
        onError(normalized.warning);
      }
      setProgress(100);
    } catch {
      onError("Không đọc được ảnh KQXS. Hãy thử crop sát vùng bảng kết quả hoặc nhập tay.");
    } finally {
      setIsOcrRunning(false);
    }
  }

  async function applyDraftCrop() {
    if (!imageDataUrl || !draftRect) return;
    try {
      onImageChange(imageDataUrl, await cropImage(imageDataUrl, draftRect), draftRect);
      setIsCropping(false);
    } catch {
      onError("Không crop được ảnh KQXS. Hãy chọn lại ảnh.");
    }
  }

  async function resetAutoCrop() {
    if (!imageDataUrl) return;
    const rect = await createAutoCropRect(imageDataUrl);
    onImageChange(imageDataUrl, await cropImage(imageDataUrl, rect), rect);
    setDraftRect(rect);
    setIsCropping(false);
  }

  return (
    <section className="space-y-3 rounded-lg bg-slate-50 p-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Ảnh kết quả xổ số</h3>
          <p className="text-xs text-slate-500">App crop vùng bảng trước rồi mới OCR để tránh lẫn giờ, pin, quảng cáo.</p>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(event) => void loadFileFromInput(event.currentTarget)} />
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <PreviewCard title="Ảnh gốc">
          {imageDataUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={imageDataUrl}
                alt="Ảnh KQXS gốc"
                className="max-h-[360px] w-full select-none rounded-lg object-contain"
                onPointerDown={isCropping ? startCrop : undefined}
                onPointerMove={isCropping ? moveCrop : undefined}
                onPointerUp={isCropping ? endCrop : undefined}
                onPointerCancel={isCropping ? endCrop : undefined}
                onLoad={(event) => setImageSize({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
              />
              {isCropping && draftRect && imageSize ? <CropOverlay rect={draftRect} imageSize={imageSize} /> : null}
            </div>
          ) : (
            <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-3 text-center text-sm text-slate-500">
              Chọn hoặc chụp ảnh màn hình KQXS.
            </div>
          )}
        </PreviewCard>

        <PreviewCard title="Vùng crop OCR">
          {cropDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cropDataUrl} alt="Vùng crop OCR KQXS" className="max-h-[360px] w-full rounded-lg object-contain" />
          ) : (
            <div className="flex min-h-[180px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-3 text-center text-sm text-slate-500">
              Vùng crop sẽ hiển thị sau khi chọn ảnh.
            </div>
          )}
        </PreviewCard>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <button className="min-h-10 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50" onClick={() => fileInputRef.current?.click()} type="button">
          Chọn/chụp KQXS
        </button>
        <button className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50" onClick={() => setIsCropping(true)} disabled={!imageDataUrl} type="button">
          Crop lại thủ công
        </button>
        <button className="min-h-10 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50" onClick={() => void resetAutoCrop()} disabled={!imageDataUrl} type="button">
          Auto crop lại
        </button>
        <button className="min-h-10 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-700 disabled:opacity-50" onClick={() => void runOcr()} disabled={isOcrRunning || !cropDataUrl} type="button">
          {isOcrRunning ? `Đang đọc KQXS... ${progress}%` : "Đọc KQXS"}
        </button>
        <button className="min-h-10 rounded-lg border border-red-300 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50" onClick={() => onImageChange(undefined, undefined, undefined)} type="button">
          Xóa ảnh KQXS
        </button>
      </div>

      {isCropping ? (
        <div className="flex flex-wrap gap-2 rounded-lg border border-blue-100 bg-blue-50 p-2 text-sm text-blue-900">
          <span className="flex-1">Kéo trên ảnh gốc để chọn vùng bảng kết quả từ ĐB đến G7.</span>
          <button className="rounded bg-blue-600 px-3 py-1 font-semibold text-white" onClick={() => void applyDraftCrop()} type="button">Áp dụng crop</button>
          <button className="rounded bg-white px-3 py-1 font-semibold text-blue-700" onClick={() => setIsCropping(false)} type="button">Hủy</button>
        </div>
      ) : null}

      {isOcrRunning ? (
        <div className="space-y-1">
          <div className="text-sm font-semibold text-slate-600">Đang đọc KQXS... {progress}%</div>
          <div className="h-2 overflow-hidden rounded bg-slate-200">
            <div className="h-full bg-green-600 transition-all" style={{ width: `${progress}%` }} />
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

  function startCrop(event: React.PointerEvent<HTMLImageElement>) {
    const point = getImagePoint(event);
    if (!point) return;
    dragStartRef.current = point;
    setDraftRect({ x: point.x, y: point.y, width: 1, height: 1 });
  }

  function moveCrop(event: React.PointerEvent<HTMLImageElement>) {
    const start = dragStartRef.current;
    const point = getImagePoint(event);
    if (!start || !point) return;
    setDraftRect(normalizeRect(start, point));
  }

  function endCrop() {
    dragStartRef.current = null;
  }

  function getImagePoint(event: React.PointerEvent<HTMLImageElement>): { x: number; y: number } | null {
    const image = imageRef.current;
    if (!image) return null;
    const bounds = image.getBoundingClientRect();
    return {
      x: clamp(((event.clientX - bounds.left) / bounds.width) * image.naturalWidth, 0, image.naturalWidth),
      y: clamp(((event.clientY - bounds.top) / bounds.height) * image.naturalHeight, 0, image.naturalHeight),
    };
  }
}

function PreviewCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-bold uppercase text-slate-500">{title}</div>
      {children}
    </div>
  );
}

function CropOverlay({ rect, imageSize }: { rect: CropRect; imageSize: { width: number; height: number } }) {
  const style = {
    left: `${(rect.x / imageSize.width) * 100}%`,
    top: `${(rect.y / imageSize.height) * 100}%`,
    width: `${(rect.width / imageSize.width) * 100}%`,
    height: `${(rect.height / imageSize.height) * 100}%`,
  };
  return <div className="pointer-events-none absolute border-2 border-blue-500 bg-blue-500/20" style={style} />;
}

function normalizeRect(start: { x: number; y: number }, end: { x: number; y: number }): CropRect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.max(1, Math.abs(end.x - start.x)),
    height: Math.max(1, Math.abs(end.y - start.y)),
  };
}

function resizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const scale = Math.min(1, MAX_IMAGE_WIDTH / image.width);
        if (scale === 1 && file.size <= 8 * 1024 * 1024) {
          resolve(String(reader.result));
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        const context = canvas.getContext("2d");
        if (!context) {
          reject(new Error("Canvas không khả dụng."));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
      };
      image.onerror = () => reject(new Error("Không tải được ảnh."));
      image.src = String(reader.result);
    };
    reader.onerror = () => reject(new Error("Không đọc được file ảnh."));
    reader.readAsDataURL(file);
  });
}

function createAutoCropRect(dataUrl: string): Promise<CropRect> {
  return loadImage(dataUrl).then((image) => ({
    x: Math.round(image.naturalWidth * 0.02),
    y: Math.round(image.naturalHeight * 0.2),
    width: Math.round(image.naturalWidth * 0.96),
    height: Math.round(image.naturalHeight * 0.6),
  }));
}

function cropImage(dataUrl: string, rect: CropRect): Promise<string> {
  return loadImage(dataUrl).then((image) => {
    const safeRect = {
      x: clamp(rect.x, 0, image.naturalWidth - 1),
      y: clamp(rect.y, 0, image.naturalHeight - 1),
      width: clamp(rect.width, 1, image.naturalWidth - rect.x),
      height: clamp(rect.height, 1, image.naturalHeight - rect.y),
    };
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(safeRect.width);
    canvas.height = Math.round(safeRect.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas không khả dụng.");
    context.drawImage(image, safeRect.x, safeRect.y, safeRect.width, safeRect.height, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Không tải được ảnh."));
    image.src = dataUrl;
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
