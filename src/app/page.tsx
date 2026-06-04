"use client";

import { toPng } from "html-to-image";
import { useEffect, useMemo, useRef, useState } from "react";
import { ReportTemplate } from "@/components/ReportTemplate";
import { ResultTabs } from "@/components/ResultTabs";
import { RoundEditor } from "@/components/RoundEditor";
import { calculateAll, calculateGrandTotal } from "@/lib/calculator";
import { formatMoney } from "@/lib/format";
import { BetRound, RoundCalculationResult } from "@/types";

const STORAGE_KEY = "lo-de-report-web:rounds";
const buttonBase = "min-h-10 rounded-lg px-3 py-2 text-sm font-semibold shadow-sm active:scale-[0.98] disabled:opacity-50 sm:text-base";
const primaryButton = `${buttonBase} bg-blue-600 text-white hover:bg-blue-700`;
const dangerButton = `${buttonBase} bg-red-600 text-white hover:bg-red-700`;
const neutralButton = `${buttonBase} border border-slate-300 bg-white hover:bg-slate-50`;

const sampleResult = `DB: 36
G1: 66
G2: 30 79
G3: 70 58 13 38 35 69
G4: 23 22 51 98
G5: 76 95 71 98 48 18
G6: 74 13 55
G7: 52 90 77 34`;

const sampleRounds: BetRound[] = [
  {
    id: "sample-1",
    name: "Lần 1",
    date: "2026-06-04",
    hideDate: false,
    betText: `Lô 42 50d.
Lô 67.76 mc 25d.
Lô 46.64 mc 15d, đề 23=90k, 32=30k
Lo 16,61,17,71,24,42,25,52 mc 25d`,
    resultText: sampleResult,
  },
  {
    id: "sample-2",
    name: "Lần 2",
    date: "2026-06-04",
    hideDate: false,
    betText: `Lô 58.85.68.86.08.80.18.81 mc 25d
Lô 18.81.58.85 mc 15d
Lô 00.99.24.42 mc 25d
Đề 68.86.66.88.29.92.32.61 mc 30k
Lô 24.42 mc 25d
Đề 58.85.68.86.40.41.42 mc 36k`,
    resultText: sampleResult,
  },
];

const initialRound: BetRound = {
  id: "round-1",
  name: "Lần 1",
  date: "2026-06-04",
  hideDate: false,
  betText: "",
  resultText: "",
};

export default function Home() {
  const [rounds, setRounds] = useState<BetRound[]>([initialRound]);
  const [activeId, setActiveId] = useState(initialRound.id);
  const [results, setResults] = useState<RoundCalculationResult[]>([]);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (isRoundArray(parsed)) {
            setRounds(parsed);
            setActiveId(parsed[0]?.id ?? initialRound.id);
          }
        } catch {
          setError("Không đọc được dữ liệu localStorage.");
        }
      }
      setHasLoaded(true);
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rounds));
    }
  }, [rounds, hasLoaded]);

  const activeRound = useMemo(() => rounds.find((round) => round.id === activeId) ?? rounds[0], [rounds, activeId]);
  const activeResult = useMemo(() => results.find((result) => result.round.id === activeRound?.id), [results, activeRound?.id]);
  const grandTotal = useMemo(() => calculateGrandTotal(results), [results]);

  function updateRound(next: BetRound) {
    setRounds((current) => current.map((round) => (round.id === next.id ? next : round)));
    setResults([]);
  }

  function addRound() {
    const next = createRound(rounds.length + 1);
    setRounds((current) => [...current, next]);
    setActiveId(next.id);
    setResults([]);
  }

  function removeRound() {
    if (rounds.length === 1) {
      setError("Cần giữ ít nhất một lần đánh.");
      return;
    }
    const index = rounds.findIndex((round) => round.id === activeId);
    const nextRounds = rounds.filter((round) => round.id !== activeId);
    setRounds(nextRounds);
    setActiveId(nextRounds[Math.max(0, index - 1)].id);
    setResults([]);
  }

  function calculate() {
    try {
      const next = calculateAll(rounds);
      setResults(next);
      setError("");
      return next;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tính toán thất bại.");
      return undefined;
    }
  }

  async function exportPng() {
    const calculated = results.length ? results : calculate();
    if (!calculated?.length) return;
    setShowPreview(true);
    await new Promise((resolve) => requestAnimationFrame(resolve));
    if (!reportRef.current) {
      setError("Không tìm thấy template report để xuất ảnh.");
      return;
    }
    const dataUrl = await toPng(reportRef.current, { quality: 1, pixelRatio: 2 });
    downloadDataUrl(dataUrl, "tong-hop-lo-de.png");
  }

  function saveJson() {
    const blob = new Blob([JSON.stringify(rounds, null, 2)], { type: "application/json" });
    downloadDataUrl(URL.createObjectURL(blob), "lo-de-data.json");
  }

  async function openJson(file?: File) {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!isRoundArray(parsed)) {
        throw new Error("File JSON không đúng schema BetRound cơ bản.");
      }
      setRounds(parsed);
      setActiveId(parsed[0].id);
      setResults([]);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không mở được JSON.");
    }
  }

  function clearAll() {
    if (!confirm("Xóa toàn bộ dữ liệu đang lưu?")) return;
    const first = createRound(1);
    localStorage.removeItem(STORAGE_KEY);
    setRounds([first]);
    setActiveId(first.id);
    setResults([]);
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto w-full max-w-[1440px] p-3 sm:p-4 lg:p-6">
        <header className="sticky top-0 z-30 -mx-3 mb-3 bg-white/95 px-3 py-3 shadow-sm backdrop-blur sm:static sm:mx-0 sm:rounded-xl sm:px-4">
          <h1 className="text-lg font-bold text-blue-900 sm:text-2xl lg:text-3xl">Tổng hợp lô đề tự động</h1>
        </header>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[260px_1fr] lg:gap-4">
          <aside className="hidden rounded-xl bg-white p-3 shadow-sm lg:block">
            <h2 className="mb-3 text-sm font-bold uppercase text-slate-500">Lần đánh</h2>
            <div className="space-y-2">
              {rounds.map((round, index) => (
                <button
                  key={round.id}
                  className={`w-full rounded-lg px-3 py-2 text-left text-sm font-semibold ${round.id === activeId ? "bg-blue-600 text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                  onClick={() => setActiveId(round.id)}
                >
                  Lần {index + 1}: {round.name}
                </button>
              ))}
            </div>
          </aside>

          <section className="space-y-3 sm:space-y-4">
            <select className="block w-full rounded-lg border px-3 py-2 text-base lg:hidden" value={activeId} onChange={(event) => setActiveId(event.target.value)}>
              {rounds.map((round, index) => <option key={round.id} value={round.id}>Lần {index + 1}: {round.name}</option>)}
            </select>

            <section className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap">
              <button className={primaryButton} onClick={addRound}>Thêm lần</button>
              <button className={dangerButton} onClick={removeRound}>Xóa lần</button>
              <button className={primaryButton} onClick={calculate}>Tính toán</button>
              <button className="min-h-10 rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm active:scale-[0.98] hover:bg-green-700 disabled:opacity-50 sm:text-base" onClick={() => void exportPng()}>Xuất ảnh</button>
              <button className={neutralButton} onClick={saveJson}>Lưu JSON</button>
              <button className={neutralButton} onClick={() => jsonInputRef.current?.click()}>Mở JSON</button>
              <button className={`${neutralButton} text-blue-700`} onClick={() => { setRounds(sampleRounds); setActiveId(sampleRounds[0].id); setResults([]); }}>Nạp dữ liệu mẫu</button>
              <button className={`${neutralButton} text-red-700`} onClick={clearAll}>Xóa toàn bộ</button>
              <input ref={jsonInputRef} className="hidden" type="file" accept="application/json" onChange={(event) => void openJson(event.target.files?.[0])} />
            </section>

            {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700 sm:p-4">{error}</div> : null}
            {activeRound ? <RoundEditor round={activeRound} result={activeResult} onChange={updateRound} onError={setError} /> : null}
            <ResultTabs result={activeResult} />

            <button className={neutralButton} onClick={() => setShowPreview((value) => !value)}>Ẩn/hiện preview báo cáo</button>
            <div className={showPreview ? "overflow-x-auto rounded-xl bg-slate-200 p-2" : "fixed -left-[9999px] top-0 pointer-events-none"}>
              <ReportTemplate ref={reportRef} results={results.length ? results : []} />
            </div>

            <SummaryBar totalCost={grandTotal.totalCost} totalWinMoney={grandTotal.totalWinMoney} profit={grandTotal.profit} />
          </section>
        </div>
      </div>
    </main>
  );
}

function createRound(index: number): BetRound {
  return {
    id: crypto.randomUUID(),
    name: `Lần ${index}`,
    date: new Date().toISOString().slice(0, 10),
    hideDate: false,
    betText: "",
    resultText: "",
  };
}

function isRoundArray(value: unknown): value is BetRound[] {
  return Array.isArray(value) && value.every((item) => {
    const round = item as Partial<BetRound>;
    return typeof round.id === "string" && typeof round.name === "string" && typeof round.hideDate === "boolean" && typeof round.betText === "string" && typeof round.resultText === "string";
  });
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
  if (dataUrl.startsWith("blob:")) URL.revokeObjectURL(dataUrl);
}

function SummaryBar({ totalCost, totalWinMoney, profit }: { totalCost: number; totalWinMoney: number; profit: number }) {
  return (
    <section className="sticky bottom-0 z-20 -mx-3 mt-3 bg-white/95 px-3 py-2 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] backdrop-blur sm:mx-0 sm:rounded-xl lg:static">
      <h2 className="mb-2 text-sm font-bold">Tổng toàn bộ các lần</h2>
      <div className="grid grid-cols-3 gap-2">
        <TotalLine label="Tổng vốn" value={formatMoney(totalCost)} />
        <TotalLine label="Tổng ăn" value={formatMoney(totalWinMoney)} color="text-green-700" />
        <TotalLine label="Lãi/lỗ cuối cùng" value={formatMoney(profit)} color={profit >= 0 ? "text-green-700" : "text-red-700"} />
      </div>
    </section>
  );
}

function TotalLine({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-2">
      <div className="truncate text-[11px] font-semibold uppercase text-slate-500 sm:text-xs">{label}</div>
      <div className={`mt-1 truncate text-sm font-bold sm:text-base ${color}`}>{value}</div>
    </div>
  );
}
