import React from "react";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";
import { TrendingUp, DollarSign, BedDouble, CalendarRange, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ColumnDef, RowDef } from "@/lib/types";

interface SummaryCardsProps {
  columns: ColumnDef[];
  rows: RowDef[];
  allColumns?: ColumnDef[];
  selectedPeriod?: string;
}

export function SummaryCards({ columns, rows, allColumns, selectedPeriod }: SummaryCardsProps) {
  // Filter out the '2025-total' column to avoid double counting in active view
  const regularCols = columns.filter((c) => !c.isTotal);
  const regularKeys = regularCols.map((c) => c.key);

  const getRowSum = (rowId: string, keys: string[] = regularKeys): number => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return 0;
    return keys.reduce((acc, k) => {
      const v = row.values[k];
      return acc + (typeof v === "number" ? v : 0);
    }, 0);
  };

  const getRowAvg = (rowId: string, keys: string[] = regularKeys): number => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return 0;
    const validVals = keys
      .map((k) => row.values[k])
      .filter((v): v is number => typeof v === "number");
    if (validVals.length === 0) return 0;
    return validVals.reduce((a, b) => a + b, 0) / validVals.length;
  };

  const totalReceitaAirbnb = getRowSum("receita_airbnb");
  const totalReceitaBooking = getRowSum("receita_booking");
  const totalReceitaOffsite = getRowSum("receita_offsite");
  const totalFaturamentoBruto = totalReceitaAirbnb + totalReceitaBooking + totalReceitaOffsite;

  const totalLiquidoLocacao = getRowSum("receita_liquida_locacao");
  const totalDiarias = getRowSum("diarias");
  const avgOcupacao = getRowAvg("ocupacao");

  // Tarifa Bruta Média (ADR) do período selecionado
  const tarifaBrutaMedia = totalDiarias > 0 ? totalFaturamentoBruto / totalDiarias : 0;

  // --- Calculations for YTD (Year-To-Date) Panel ---
  const fullCols = allColumns || columns;
  const targetYear = selectedPeriod === "2025" ? 2025 : 2026;
  const ytdCols = fullCols.filter((c) => !c.isTotal && c.year === targetYear);
  const ytdKeys = ytdCols.map((c) => c.key);

  const ytdLiquido = getRowSum("receita_liquida_locacao", ytdKeys);
  const ytdDiarias = getRowSum("diarias", ytdKeys);
  const ytdFatBruto =
    getRowSum("receita_airbnb", ytdKeys) +
    getRowSum("receita_booking", ytdKeys) +
    getRowSum("receita_offsite", ytdKeys);
  const ytdTarifaMedia = ytdDiarias > 0 ? ytdFatBruto / ytdDiarias : 0;

  // YTD A/A (YoY) Comparisons (Homologous period Mar-Ago between 2026 and 2025)
  let ytdFatYoYStr: string | null = null;
  let ytdFatYoYPositive = true;
  let ytdAdrYoYStr: string | null = null;
  let ytdAdrYoYPositive = true;
  let ytdLiqYoYStr: string | null = null;
  let ytdLiqYoYPositive = true;

  if (targetYear === 2026) {
    const hom2026Keys = ["2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08"];
    const hom2025Keys = ["2025-03", "2025-04", "2025-05", "2025-06", "2025-07", "2025-08"];

    // Faturamento Homólogo
    const fat26Hom =
      getRowSum("receita_airbnb", hom2026Keys) +
      getRowSum("receita_booking", hom2026Keys) +
      getRowSum("receita_offsite", hom2026Keys);
    const fat25Hom =
      getRowSum("receita_airbnb", hom2025Keys) +
      getRowSum("receita_booking", hom2025Keys) +
      getRowSum("receita_offsite", hom2025Keys);

    if (fat25Hom > 0) {
      const diff = (fat26Hom - fat25Hom) / fat25Hom;
      ytdFatYoYPositive = diff >= 0;
      ytdFatYoYStr = `${diff > 0 ? "+" : ""}${(diff * 100).toFixed(1)}% A/A`;
    }

    // Tarifa Média Homóloga
    const dia26Hom = getRowSum("diarias", hom2026Keys);
    const dia25Hom = getRowSum("diarias", hom2025Keys);
    const adr26Hom = dia26Hom > 0 ? fat26Hom / dia26Hom : 0;
    const adr25Hom = dia25Hom > 0 ? fat25Hom / dia25Hom : 0;

    if (adr25Hom > 0) {
      const diffAdr = (adr26Hom - adr25Hom) / adr25Hom;
      ytdAdrYoYPositive = diffAdr >= 0;
      ytdAdrYoYStr = `${diffAdr > 0 ? "+" : ""}${(diffAdr * 100).toFixed(1)}% A/A`;
    }

    // Líquido Homólogo
    const liq26Hom = getRowSum("receita_liquida_locacao", hom2026Keys);
    const liq25Hom = getRowSum("receita_liquida_locacao", hom2025Keys);

    if (liq25Hom > 0) {
      const diffLiq = (liq26Hom - liq25Hom) / liq25Hom;
      ytdLiqYoYPositive = diffLiq >= 0;
      ytdLiqYoYStr = `${diffLiq > 0 ? "+" : ""}${(diffLiq * 100).toFixed(1)}% A/A`;
    }
  }

  // Monthly M/M and A/A for selected period (e.g. Mês Atual)
  let momFatStr: string | null = null;
  let momFatPositive = true;
  let yoyFatStr: string | null = null;
  let yoyFatPositive = true;

  let momAdrStr: string | null = null;
  let momAdrPositive = true;
  let yoyAdrStr: string | null = null;
  let yoyAdrPositive = true;

  if (selectedPeriod === "current" && columns.length > 0) {
    const currCol = columns[0];
    const fullRegularCols = fullCols.filter((c) => !c.isTotal);
    const currIdx = fullRegularCols.findIndex((c) => c.key === currCol.key);

    if (currIdx > 0) {
      const prevCol = fullRegularCols[currIdx - 1];
      const prevFat =
        ((rows.find((r) => r.id === "receita_airbnb")?.values[prevCol.key] as number) || 0) +
        ((rows.find((r) => r.id === "receita_booking")?.values[prevCol.key] as number) || 0) +
        ((rows.find((r) => r.id === "receita_offsite")?.values[prevCol.key] as number) || 0);

      if (prevFat > 0) {
        const diff = (totalFaturamentoBruto - prevFat) / prevFat;
        momFatPositive = diff >= 0;
        momFatStr = `${diff > 0 ? "+" : ""}${(diff * 100).toFixed(1)}% M/M`;
      }

      const prevAdr = (rows.find((r) => r.id === "media_diaria_hospede")?.values[prevCol.key] as number) || 0;
      if (prevAdr > 0 && tarifaBrutaMedia > 0) {
        const diffAdr = (tarifaBrutaMedia - prevAdr) / prevAdr;
        momAdrPositive = diffAdr >= 0;
        momAdrStr = `${diffAdr > 0 ? "+" : ""}${(diffAdr * 100).toFixed(1)}% M/M`;
      }
    }

    if (currCol.year === 2026) {
      const prevYearKey = `2025-${currCol.key.split("-")[1]}`;
      const prevFatYoY =
        ((rows.find((r) => r.id === "receita_airbnb")?.values[prevYearKey] as number) || 0) +
        ((rows.find((r) => r.id === "receita_booking")?.values[prevYearKey] as number) || 0) +
        ((rows.find((r) => r.id === "receita_offsite")?.values[prevYearKey] as number) || 0);

      if (prevFatYoY > 0) {
        const diffYoY = (totalFaturamentoBruto - prevFatYoY) / prevFatYoY;
        yoyFatPositive = diffYoY >= 0;
        yoyFatStr = `${diffYoY > 0 ? "+" : ""}${(diffYoY * 100).toFixed(1)}% A/A`;
      }

      const prevAdrYoY = (rows.find((r) => r.id === "media_diaria_hospede")?.values[prevYearKey] as number) || 0;
      if (prevAdrYoY > 0 && tarifaBrutaMedia > 0) {
        const diffAdrYoY = (tarifaBrutaMedia - prevAdrYoY) / prevAdrYoY;
        yoyAdrPositive = diffAdrYoY >= 0;
        yoyAdrStr = `${diffAdrYoY > 0 ? "+" : ""}${(diffAdrYoY * 100).toFixed(1)}% A/A`;
      }
    }
  }

  return (
    <div className="space-y-4">
      {/* BLOCO 1: Métricas do Período / Mês Atual (Grid 2x2 no mobile, 4 colunas no desktop) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Faturamento Bruto */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Faturamento Bruto
            </span>
            <div className="rounded-md bg-zinc-50 p-1.5 text-zinc-700 border border-zinc-100">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
              {formatCurrency(totalFaturamentoBruto)}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 flex-wrap min-h-[22px]">
              {momFatStr ? (
                <>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                      momFatPositive
                        ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                        : "text-rose-700 bg-rose-50 border border-rose-200/60"
                    }`}
                  >
                    {momFatStr}
                  </span>
                  {yoyFatStr && (
                    <span
                      className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                        yoyFatPositive
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                          : "text-rose-700 bg-rose-50 border border-rose-200/60"
                      }`}
                    >
                      {yoyFatStr}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-zinc-500">Receita bruta apurada</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Tarifa Bruta Média (ADR) */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Tarifa Média (ADR)
            </span>
            <div className="rounded-md bg-zinc-50 p-1.5 text-zinc-700 border border-zinc-100">
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
              {formatCurrency(tarifaBrutaMedia)}
            </h3>
            <div className="mt-2 flex items-center gap-1.5 flex-wrap min-h-[22px]">
              {momAdrStr ? (
                <>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                      momAdrPositive
                        ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                        : "text-rose-700 bg-rose-50 border border-rose-200/60"
                    }`}
                  >
                    {momAdrStr}
                  </span>
                  {yoyAdrStr && (
                    <span
                      className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                        yoyAdrPositive
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                          : "text-rose-700 bg-rose-50 border border-rose-200/60"
                      }`}
                    >
                      {yoyAdrStr}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-zinc-500">Média por noite ocupada</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Líquido Locação */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Líquido Locação
            </span>
            <div className="rounded-md bg-emerald-50 p-1.5 text-emerald-700 border border-emerald-100">
              <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-emerald-700 tabular-nums">
              {formatCurrency(totalLiquidoLocacao)}
            </h3>
            <div className="mt-2 flex items-center min-h-[22px]">
              <span className="text-xs text-zinc-500">
                {totalFaturamentoBruto > 0
                  ? `Margem: ${((totalLiquidoLocacao / totalFaturamentoBruto) * 100).toFixed(1)}%`
                  : "Resultado líquido apurado"}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Taxa de Ocupação */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Taxa de Ocupação
            </span>
            <div className="rounded-md bg-zinc-50 p-1.5 text-zinc-700 border border-zinc-100">
              <BedDouble className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </div>
          </div>
          <div className="mt-2.5 sm:mt-3">
            <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 tabular-nums">
              {formatPercent(avgOcupacao)}
            </h3>
            <div className="mt-2 flex items-center min-h-[22px]">
              <span className="text-xs text-zinc-500">
                {formatNumber(totalDiarias)} diárias vendidas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* BLOCO 2: Faixa Executiva de Acumulado do Ano (YTD) com Comparativos A/A */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-zinc-100 p-1.5 text-zinc-700">
              <CalendarRange className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                Acumulado do Ano (YTD {targetYear})
              </h4>
              <p className="text-[11px] text-zinc-500 hidden sm:block">
                Performance acumulada de Janeiro a Agosto com comparativo homólogo Ano a Ano (A/A)
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
            {ytdCols.length} meses operados
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
          {/* Métrica 1 YTD: Faturamento Bruto */}
          <div className="pt-2 sm:pt-0">
            <span className="text-[11px] font-medium text-zinc-500">Faturamento Bruto YTD</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-zinc-950 tabular-nums">
                {formatCurrency(ytdFatBruto)}
              </span>
              {ytdFatYoYStr && (
                <span
                  className={`inline-flex items-center font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                    ytdFatYoYPositive
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                      : "text-rose-700 bg-rose-50 border border-rose-200/60"
                  }`}
                >
                  {ytdFatYoYPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {ytdFatYoYStr}
                </span>
              )}
            </div>
          </div>

          {/* Métrica 2 YTD: Tarifa Bruta Média */}
          <div className="pt-3 sm:pt-0 sm:pl-6">
            <span className="text-[11px] font-medium text-zinc-500">Tarifa Média YTD (ADR)</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-zinc-950 tabular-nums">
                {formatCurrency(ytdTarifaMedia)}
              </span>
              {ytdAdrYoYStr && (
                <span
                  className={`inline-flex items-center font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                    ytdAdrYoYPositive
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                      : "text-rose-700 bg-rose-50 border border-rose-200/60"
                  }`}
                >
                  {ytdAdrYoYPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {ytdAdrYoYStr}
                </span>
              )}
            </div>
          </div>

          {/* Métrica 3 YTD: Líquido Locação */}
          <div className="pt-3 sm:pt-0 sm:pl-6">
            <span className="text-[11px] font-medium text-zinc-500">Líquido Locação YTD</span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-lg sm:text-xl font-bold text-emerald-700 tabular-nums">
                {formatCurrency(ytdLiquido)}
              </span>
              {ytdLiqYoYStr && (
                <span
                  className={`inline-flex items-center font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                    ytdLiqYoYPositive
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                      : "text-rose-700 bg-rose-50 border border-rose-200/60"
                  }`}
                >
                  {ytdLiqYoYPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {ytdLiqYoYStr}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
