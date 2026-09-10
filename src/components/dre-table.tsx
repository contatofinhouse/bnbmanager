import React from "react";
import { formatCurrency, formatPercent, formatNumber, cn } from "@/lib/utils";
import { ColumnDef, RowDef } from "@/lib/types";
import { Download } from "lucide-react";

interface DreTableProps {
  columns: ColumnDef[];
  rows: RowDef[];
  allColumns?: ColumnDef[];
}

export function DreTable({ columns, rows, allColumns }: DreTableProps) {
  const formatCellValue = (type: string, val: number | string | null) => {
    if (val === null || val === undefined) return "—";
    if (typeof val === "string") return val;
    if (type === "currency") return formatCurrency(val);
    if (type === "percent") return formatPercent(val);
    if (type === "int") return formatNumber(val);
    return String(val);
  };

  // Helper getters
  const getValue = (rowId: string, colKey: string): number | null => {
    const row = rows.find((r) => r.id === rowId);
    const val = row?.values[colKey];
    return typeof val === "number" ? val : null;
  };

  // Helper for Faturamento Bruto of a column
  const getFaturamento = (colKey: string): number => {
    const airbnb = getValue("receita_airbnb", colKey) || 0;
    const booking = getValue("receita_booking", colKey) || 0;
    const offsite = getValue("receita_offsite", colKey) || 0;
    return airbnb + booking + offsite;
  };

  // Chronological regular columns from allColumns or columns
  const regularAllCols = (allColumns || columns).filter((c) => !c.isTotal);

  // KPI 1: ALOS (Estadia Média)
  const getAlos = (colKey: string): string => {
    const diarias = getValue("diarias", colKey);
    const checkins = getValue("checkins", colKey);
    if (!diarias || !checkins || checkins === 0) return "—";
    return (diarias / checkins).toFixed(1) + " noites";
  };

  // KPI 2: Variação MoM Faturamento (%)
  const getMomFaturamento = (col: ColumnDef): { text: string; color: string } => {
    if (col.isTotal) return { text: "—", color: "text-zinc-400" };

    const regIdx = regularAllCols.findIndex((c) => c.key === col.key);
    if (regIdx <= 0) return { text: "—", color: "text-zinc-400" };

    const prevCol = regularAllCols[regIdx - 1];
    const currFat = getFaturamento(col.key);
    const prevFat = getFaturamento(prevCol.key);

    if (prevFat <= 0) return { text: "—", color: "text-zinc-400" };
    const diff = (currFat - prevFat) / prevFat;
    const prefix = diff > 0 ? "+" : "";
    const color = diff > 0 ? "text-emerald-700 font-semibold" : diff < 0 ? "text-rose-600 font-semibold" : "text-zinc-600";
    return { text: `${prefix}${(diff * 100).toFixed(1)}%`, color };
  };

  // KPI 3: Variação MoM Tarifa Média (%)
  const getMomTarifa = (col: ColumnDef): { text: string; color: string } => {
    if (col.isTotal) return { text: "—", color: "text-zinc-400" };

    const regIdx = regularAllCols.findIndex((c) => c.key === col.key);
    if (regIdx <= 0) return { text: "—", color: "text-zinc-400" };

    const prevCol = regularAllCols[regIdx - 1];
    const currAdr = getValue("media_diaria_hospede", col.key);
    const prevAdr = getValue("media_diaria_hospede", prevCol.key);

    if (!currAdr || !prevAdr || prevAdr <= 0) return { text: "—", color: "text-zinc-400" };
    const diff = (currAdr - prevAdr) / prevAdr;
    const prefix = diff > 0 ? "+" : "";
    const color = diff > 0 ? "text-emerald-700 font-semibold" : diff < 0 ? "text-rose-600 font-semibold" : "text-zinc-600";
    return { text: `${prefix}${(diff * 100).toFixed(1)}%`, color };
  };

  // KPI 4: Variação Ano a Ano (YoY %)
  const getYoY = (col: ColumnDef): { text: string; color: string } => {
    if (col.isTotal || col.year !== 2026) return { text: "—", color: "text-zinc-400" };

    // Find the corresponding month in 2025
    const prevYearKey = `2025-${col.key.split("-")[1]}`;
    const currFat = getFaturamento(col.key);
    const prevFat = getFaturamento(prevYearKey);

    if (prevFat <= 0) return { text: "—", color: "text-zinc-400" };
    const diff = (currFat - prevFat) / prevFat;
    const prefix = diff > 0 ? "+" : "";
    const color = diff > 0 ? "text-emerald-700 font-semibold" : diff < 0 ? "text-rose-600 font-semibold" : "text-zinc-600";
    return { text: `${prefix}${(diff * 100).toFixed(1)}%`, color };
  };

  return (
    <div className="space-y-6">
      {/* Main DRE Table */}
      <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        <div className="border-b border-zinc-200 bg-zinc-50/75 px-5 py-3.5 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-zinc-900">
              DRE & Controle Operacional Mensal
            </h2>
            <p className="text-xs text-zinc-500">
              Demonstrativo consolidado de diárias, receitas, custos variáveis e resultado líquido por mês
            </p>
          </div>
          <span className="text-xs text-zinc-400 font-mono">
            {columns.length} colunas exibidas
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 bg-zinc-50/50 text-zinc-600">
                <th className="sticky left-0 z-20 bg-zinc-50 py-3.5 pl-5 pr-4 text-xs font-semibold text-zinc-900 min-w-[240px] border-r border-zinc-200 shadow-[1px_0_0_0_#e4e4e7]">
                  Métrica / Indicador
                </th>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3.5 text-right font-semibold whitespace-nowrap min-w-[105px]",
                      col.isTotal
                        ? "bg-zinc-100/80 text-zinc-950 font-bold border-x border-zinc-300"
                        : "text-zinc-700 hover:bg-zinc-100/40"
                    )}
                  >
                    <div className="text-xs font-semibold">{col.label}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {rows.map((row, idx) => {
                const isHighlight = row.isHighlight || row.id === "receita_liquida_locacao";
                const isOcupacao = row.id === "ocupacao";
                const isDiarista = row.id === "lavanderia_diarista";
                const isAdm = row.id === "administracao";

                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "transition-colors",
                      isHighlight
                        ? "bg-emerald-50/60 font-semibold text-emerald-950 hover:bg-emerald-50"
                        : idx % 2 === 0
                        ? "bg-white hover:bg-zinc-50/80"
                        : "bg-zinc-50/30 hover:bg-zinc-50/80"
                    )}
                  >
                    <td
                      className={cn(
                        "sticky left-0 z-10 py-3 pl-5 pr-4 font-medium border-r border-zinc-200 whitespace-nowrap",
                        isHighlight
                          ? "bg-emerald-50 text-emerald-900 font-bold shadow-[1px_0_0_0_#e4e4e7]"
                          : idx % 2 === 0
                          ? "bg-white text-zinc-800 shadow-[1px_0_0_0_#e4e4e7]"
                          : "bg-[#fafafa] text-zinc-800 shadow-[1px_0_0_0_#e4e4e7]"
                      )}
                    >
                      {row.label}
                    </td>

                    {columns.map((col) => {
                      const val = row.values[col.key];
                      const formatted = formatCellValue(row.type, val);

                      return (
                        <td
                          key={col.key}
                          className={cn(
                            "px-4 py-3 text-right tabular-nums whitespace-nowrap",
                            col.isTotal
                              ? "bg-zinc-100/50 font-semibold text-zinc-950 border-x border-zinc-200"
                              : "",
                            isHighlight
                              ? "text-emerald-700 font-bold"
                              : isOcupacao && typeof val === "number" && val >= 0.8
                              ? "text-zinc-950 font-semibold"
                              : (isDiarista || isAdm) && typeof val === "number" && val < 0
                              ? "text-zinc-600"
                              : "text-zinc-700"
                          )}
                        >
                          {formatted}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* KPI Section Header */}
              <tr className="bg-zinc-100/70 border-t-2 border-zinc-300">
                <td
                  colSpan={columns.length + 1}
                  className="py-2.5 pl-5 pr-4 text-[11px] font-bold uppercase tracking-wider text-zinc-700 sticky left-0 z-10 bg-zinc-100/70"
                >
                  Indicadores de Performance (KPIs)
                </td>
              </tr>

              {/* KPI 1: ALOS (Estadia Média) */}
              <tr className="bg-white hover:bg-zinc-50/80 transition-colors">
                <td className="sticky left-0 z-10 py-3 pl-5 pr-4 font-medium text-zinc-800 border-r border-zinc-200 bg-white shadow-[1px_0_0_0_#e4e4e7] whitespace-nowrap">
                  Estadia Média (ALOS)
                </td>
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-right tabular-nums whitespace-nowrap text-zinc-700">
                    {getAlos(col.key)}
                  </td>
                ))}
              </tr>

              {/* KPI 2: Variação MoM Faturamento */}
              <tr className="bg-zinc-50/30 hover:bg-zinc-50/80 transition-colors">
                <td className="sticky left-0 z-10 py-3 pl-5 pr-4 font-medium text-zinc-800 border-r border-zinc-200 bg-[#fafafa] shadow-[1px_0_0_0_#e4e4e7] whitespace-nowrap">
                  Variação MoM Faturamento
                </td>
                {columns.map((col) => {
                  const { text, color } = getMomFaturamento(col);
                  return (
                    <td key={col.key} className={cn("px-4 py-3 text-right tabular-nums whitespace-nowrap", color)}>
                      {text}
                    </td>
                  );
                })}
              </tr>

              {/* KPI 3: Variação MoM Tarifa Média (ADR) */}
              <tr className="bg-white hover:bg-zinc-50/80 transition-colors">
                <td className="sticky left-0 z-10 py-3 pl-5 pr-4 font-medium text-zinc-800 border-r border-zinc-200 bg-white shadow-[1px_0_0_0_#e4e4e7] whitespace-nowrap">
                  Variação MoM Tarifa Média (ADR)
                </td>
                {columns.map((col) => {
                  const { text, color } = getMomTarifa(col);
                  return (
                    <td key={col.key} className={cn("px-4 py-3 text-right tabular-nums whitespace-nowrap", color)}>
                      {text}
                    </td>
                  );
                })}
              </tr>

              {/* KPI 4: Variação Ano a Ano (YoY) */}
              <tr className="bg-zinc-50/30 hover:bg-zinc-50/80 transition-colors">
                <td className="sticky left-0 z-10 py-3 pl-5 pr-4 font-medium text-zinc-800 border-r border-zinc-200 bg-[#fafafa] shadow-[1px_0_0_0_#e4e4e7] whitespace-nowrap">
                  Variação Ano a Ano (YoY Faturamento)
                </td>
                {columns.map((col) => {
                  const { text, color } = getYoY(col);
                  return (
                    <td key={col.key} className={cn("px-4 py-3 text-right tabular-nums whitespace-nowrap", color)}>
                      {text}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
