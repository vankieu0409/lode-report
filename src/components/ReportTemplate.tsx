import { forwardRef } from "react";
import { calculateGrandTotal } from "@/lib/calculator";
import { formatMoney } from "@/lib/format";
import { parseLotteryResult } from "@/lib/lotteryParser";
import { RoundCalculationResult } from "@/types";

type Props = {
  results: RoundCalculationResult[];
};

export const ReportTemplate = forwardRef<HTMLDivElement, Props>(function ReportTemplate({ results }, ref) {
  const total = calculateGrandTotal(results);

  return (
    <div ref={ref} className="report-canvas w-[1024px] bg-white p-4 font-sans text-slate-900">
      <header className="mb-5 border-b-4 border-blue-900 pb-3">
        <h1 className="text-3xl font-bold text-blue-950">Tổng hợp lô đề tự động</h1>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {results.map((result) => (
          <RoundPanel key={result.round.id} result={result} />
        ))}
      </div>

      <section className="mt-5 border border-slate-300">
        <h2 className="bg-blue-950 px-4 py-3 text-xl font-bold text-white">Tổng kết cả {results.length} lần</h2>
        <div className="grid grid-cols-3 text-base">
          <ReportSummary label="Tổng vốn" value={formatMoney(total.totalCost)} />
          <ReportSummary label="Tổng ăn" value={formatMoney(total.totalWinMoney)} color="text-green-700" />
          <ReportSummary label="Lãi/lỗ cuối cùng" value={formatMoney(total.profit)} color={total.profit >= 0 ? "text-green-700" : "text-red-700"} />
        </div>
      </section>
    </div>
  );
});

function RoundPanel({ result }: { result: RoundCalculationResult }) {
  let prizes: Record<string, string[]> = {};
  try {
    prizes = parseLotteryResult(result.round.resultText).prizes;
  } catch {
    prizes = {};
  }

  return (
    <section className="break-inside-avoid border border-slate-300">
      <div className="bg-slate-100 px-3 py-2">
        <h2 className="text-xl font-bold text-blue-950">{result.round.name}</h2>
        {!result.round.hideDate && result.round.date ? <p className="text-sm text-slate-600">{result.round.date}</p> : null}
      </div>
      <div className="grid grid-cols-2 gap-3 p-3">
        <MiniTable title="Lô đánh" color="text-blue-700" headers={["Số", "Điểm"]} rows={result.loBets.map((item) => [item.number, item.points])} />
        <MiniTable title="Đề đánh" color="text-red-700" headers={["Số", "Điểm"]} rows={result.deBets.map((item) => [item.number, item.points])} />
        <MiniTable title="Kết quả xổ số" headers={["Giải", "Số"]} rows={Object.entries(prizes).map(([key, value]) => [key, value.join(" ")])} span />
        <MiniTable title="Kết quả lần" headers={["Mục", "Giá trị"]} rows={[
          ["Lô trúng", result.loWins.map((item) => `${item.number} (${item.points}đ x ${item.hits})`).join(", ") || "-"],
          ["Tiền ăn lô", formatMoney(result.loWinMoney)],
          ["Tiền ăn đề", formatMoney(result.deWinMoney)],
          ["Tổng vốn", formatMoney(result.totalCost)],
          ["Lãi/lỗ", formatMoney(result.profit)],
        ]} span />
      </div>
    </section>
  );
}

function MiniTable({ title, headers, rows, color = "", span = false }: { title: string; headers: string[]; rows: Array<Array<string | number>>; color?: string; span?: boolean }) {
  return (
    <div className={span ? "col-span-2" : ""}>
      <h3 className={`mb-1 text-sm font-bold ${color}`}>{title}</h3>
      <table className="w-full border-collapse text-xs">
        <thead className="bg-slate-100">
          <tr>{headers.map((header) => <th key={header} className="border border-slate-300 px-2 py-1 text-left">{header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border border-slate-300 px-2 py-1">{cell}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReportSummary({ label, value, color = "" }: { label: string; value: string; color?: string }) {
  return (
    <div className="border-r border-slate-300 p-3">
      <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      <div className={`mt-1 text-xl font-bold ${color}`}>{value}</div>
    </div>
  );
}
