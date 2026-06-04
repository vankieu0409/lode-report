"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/format";
import { RoundCalculationResult } from "@/types";

type Props = {
  result?: RoundCalculationResult;
};

const tabs = ["Lô đánh", "Đề đánh", "Lô trúng", "Đề", "Tổng kết"] as const;

export function ResultTabs({ result }: Props) {
  const [active, setActive] = useState<(typeof tabs)[number]>("Lô đánh");

  if (!result) {
    return <div className="rounded-xl bg-white p-4 text-sm text-slate-500 shadow-sm">Chưa có kết quả. Bấm Tính toán để xem bảng.</div>;
  }

  return (
    <section className="rounded-xl bg-white p-3 shadow-sm sm:p-4">
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold ${
              active === tab ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
            onClick={() => setActive(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="pt-2">{renderTab(active, result)}</div>
    </section>
  );
}

function renderTab(tab: (typeof tabs)[number], result: RoundCalculationResult) {
  if (tab === "Lô đánh") {
    return <NumberTable rows={result.loBets} color="text-blue-700" />;
  }
  if (tab === "Đề đánh") {
    return <NumberTable rows={result.deBets} color="text-red-700" />;
  }
  if (tab === "Lô trúng") {
    return (
      <Table headers={["Số", "Điểm", "Nháy", "Tiền ăn"]}>
        {result.loWins.map((item) => (
          <tr key={item.number} className="border-t">
            <td className="px-3 py-2 font-semibold text-blue-700">{item.number}</td>
            <td className="px-3 py-2">{item.points}</td>
            <td className="px-3 py-2">{item.hits}</td>
            <td className="px-3 py-2 font-semibold text-green-700">{formatMoney(item.winMoney)}</td>
          </tr>
        ))}
      </Table>
    );
  }
  if (tab === "Đề") {
    return (
      <Table headers={["Số", "Điểm", "Trúng", "Tiền ăn"]}>
        {result.deResults.map((item) => (
          <tr key={item.number} className="border-t">
            <td className="px-3 py-2 font-semibold text-red-700">{item.number}</td>
            <td className="px-3 py-2">{item.points}</td>
            <td className="px-3 py-2">{item.isWin ? "Có" : "Không"}</td>
            <td className="px-3 py-2 font-semibold text-green-700">{formatMoney(item.winMoney)}</td>
          </tr>
        ))}
      </Table>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Summary label="Tổng vốn" value={formatMoney(result.totalCost)} />
      <Summary label="Tổng ăn" value={formatMoney(result.totalWinMoney)} className="text-green-700" />
      <Summary label="Lãi/lỗ" value={formatMoney(result.profit)} className={result.profit >= 0 ? "text-green-700" : "text-red-700"} />
    </div>
  );
}

function NumberTable({ rows, color }: { rows: Array<{ number: string; points: number }>; color: string }) {
  return (
    <Table headers={["Số", "Điểm"]}>
      {rows.map((item) => (
        <tr key={item.number} className="border-t">
          <td className={`px-3 py-2 font-semibold ${color}`}>{item.number}</td>
          <td className="px-3 py-2">{item.points}</td>
        </tr>
      ))}
    </Table>
  );
}

export function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
      <table className="min-w-[640px] w-full border-collapse text-sm">
        <thead className="bg-slate-100 text-left text-slate-700">
          <tr>{headers.map((header) => <th key={header} className="px-3 py-2 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Summary({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className="text-xs font-semibold uppercase text-slate-500">{label}</div>
      <div className={`mt-1 text-lg font-bold ${className}`}>{value}</div>
    </div>
  );
}
