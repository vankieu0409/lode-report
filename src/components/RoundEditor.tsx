"use client";

import { formatMoney } from "@/lib/format";
import { BetRound, RoundCalculationResult } from "@/types";
import { ImageInputZone } from "./ImageInputZone";

type Props = {
  round: BetRound;
  result?: RoundCalculationResult;
  onChange: (round: BetRound) => void;
  onError: (message: string) => void;
};

const inputClass = "w-full rounded-lg border border-slate-300 px-3 py-2 text-base outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";
const textareaClass = `${inputClass} min-h-[160px] font-mono text-sm leading-6 sm:min-h-[220px]`;

export function RoundEditor({ round, result, onChange, onError }: Props) {
  const update = (patch: Partial<BetRound>) => onChange({ ...round, ...patch });

  return (
    <div className="space-y-3 sm:space-y-4">
      <section className="rounded-xl bg-white p-3 shadow-sm sm:p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_190px_auto]">
          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">Tên lần đánh</span>
            <input className={inputClass} value={round.name} onChange={(event) => update({ name: event.target.value })} />
          </label>
          <label className="space-y-1">
            <span className="text-sm font-semibold text-slate-700">Ngày</span>
            <input className={inputClass} type="date" value={round.date ?? ""} onChange={(event) => update({ date: event.target.value })} />
          </label>
          <label className="flex min-h-10 items-center gap-2 text-sm font-semibold text-slate-700 md:items-end md:pb-2">
            <input className="h-4 w-4" type="checkbox" checked={round.hideDate} onChange={(event) => update({ hideDate: event.target.checked })} />
            Không ghi ngày
          </label>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className="space-y-3 rounded-xl bg-white p-3 shadow-sm sm:p-4">
          <ImageInputZone
            imageDataUrl={round.imageDataUrl}
            onImageChange={(imageDataUrl) => update({ imageDataUrl })}
            onTextRecognized={(betText) => update({ betText })}
            onError={onError}
          />
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Dữ liệu cược</span>
            <textarea className={textareaClass} value={round.betText} onChange={(event) => update({ betText: event.target.value })} />
          </label>
        </div>

        <div className="space-y-3 rounded-xl bg-white p-3 shadow-sm sm:p-4">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Kết quả xổ số</span>
            <textarea className={textareaClass} value={round.resultText} onChange={(event) => update({ resultText: event.target.value })} />
          </label>
          <QuickSummary result={result} />
        </div>
      </section>
    </div>
  );
}

function QuickSummary({ result }: { result?: RoundCalculationResult }) {
  if (!result) {
    return <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-500">Tổng nhanh sẽ hiển thị sau khi bấm Tính toán.</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <QuickItem label="Vốn" value={formatMoney(result.totalCost)} />
      <QuickItem label="Ăn" value={formatMoney(result.totalWinMoney)} color="text-green-700" />
      <QuickItem label="Lãi/lỗ" value={formatMoney(result.profit)} color={result.profit >= 0 ? "text-green-700" : "text-red-700"} />
    </div>
  );
}

function QuickItem({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      <div className={`mt-1 text-base font-bold ${color}`}>{value}</div>
    </div>
  );
}
