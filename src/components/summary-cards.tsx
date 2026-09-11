import React from "react";
import { formatCurrency, formatPercent, formatNumber } from "@/lib/utils";
import { TrendingUp, DollarSign, BedDouble, CalendarRange, ArrowUpRight, ArrowDownRight, Compass, Target } from "lucide-react";
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
  const totalDiariasPet = getRowSum("diarias_pet");
  const totalFaturamentoBruto = totalReceitaAirbnb + totalReceitaBooking + totalReceitaOffsite + totalDiariasPet;

  const totalLiquidoLocacao = getRowSum("receita_liquida_locacao");
  const totalDiarias = getRowSum("diarias");
  const avgOcupacao = getRowAvg("ocupacao");

  // Tarifa Bruta Média (ADR) do período selecionado
  const tarifaBrutaMedia = totalDiarias > 0 ? totalFaturamentoBruto / totalDiarias : 0;

  // --- Calculations for YTD (Year-To-Date) Panel ---
  const fullCols = allColumns || columns;
  const regularAllCols = fullCols.filter((c) => !c.isTotal);

  // Determine target year dynamically:
  // If user selected a specific numeric year, use it; otherwise pick the latest year in regular columns
  const allYears = Array.from(new Set(regularAllCols.map((c) => c.year))).sort((a, b) => a - b);
  const latestYear = allYears[allYears.length - 1] || 2026;
  const targetYear = !isNaN(Number(selectedPeriod)) ? Number(selectedPeriod) : latestYear;
  const prevYear = targetYear - 1;

  // Columns for the target year YTD
  const ytdCols = regularAllCols.filter((c) => c.year === targetYear);
  const ytdKeys = ytdCols.map((c) => c.key);

  const ytdLiquido = getRowSum("receita_liquida_locacao", ytdKeys);
  const ytdDiarias = getRowSum("diarias", ytdKeys);
  const ytdFatBruto =
    getRowSum("receita_airbnb", ytdKeys) +
    getRowSum("receita_booking", ytdKeys) +
    getRowSum("receita_offsite", ytdKeys) +
    getRowSum("diarias_pet", ytdKeys);
  const ytdTarifaMedia = ytdDiarias > 0 ? ytdFatBruto / ytdDiarias : 0;

  // Identify homologous months present in BOTH targetYear and prevYear
  const currMonths = ytdCols.map((c) => parseInt(c.key.split("-")[1], 10));
  const prevCols = regularAllCols.filter((c) => c.year === prevYear);
  const prevMonths = prevCols.map((c) => parseInt(c.key.split("-")[1], 10));

  // Common operated months in both years
  const commonMonths = currMonths.filter((m) => prevMonths.includes(m)).sort((a, b) => a - b);

  const currHomKeys = commonMonths.map((m) => `${targetYear}-${String(m).padStart(2, "0")}`);
  const prevHomKeys = commonMonths.map((m) => `${prevYear}-${String(m).padStart(2, "0")}`);

  const monthNamesBr = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const periodLabel = commonMonths.length > 0
    ? commonMonths.length === 1
      ? monthNamesBr[commonMonths[0] - 1]
      : `${monthNamesBr[commonMonths[0] - 1]} a ${monthNamesBr[commonMonths[commonMonths.length - 1] - 1]}`
    : "";

  let ytdFatYoYStr: string | null = null;
  let ytdFatYoYPositive = true;
  let ytdDiaYoYStr: string | null = null;
  let ytdDiaYoYPositive = true;
  let ytdAdrYoYStr: string | null = null;
  let ytdAdrYoYPositive = true;
  let ytdLiqYoYStr: string | null = null;
  let ytdLiqYoYPositive = true;

  let fatCurrHom = 0;
  let fatPrevHom = 0;
  let diaCurrHom = 0;
  let diaPrevHom = 0;
  let adrCurrHom = 0;
  let adrPrevHom = 0;
  let liqCurrHom = 0;
  let liqPrevHom = 0;

  if (commonMonths.length > 0) {
    // Faturamento Homólogo (comparando estritamente os mesmos meses)
    fatCurrHom =
      getRowSum("receita_airbnb", currHomKeys) +
      getRowSum("receita_booking", currHomKeys) +
      getRowSum("receita_offsite", currHomKeys) +
      getRowSum("diarias_pet", currHomKeys);
    fatPrevHom =
      getRowSum("receita_airbnb", prevHomKeys) +
      getRowSum("receita_booking", prevHomKeys) +
      getRowSum("receita_offsite", prevHomKeys) +
      getRowSum("diarias_pet", prevHomKeys);

    if (fatPrevHom > 0) {
      const diff = (fatCurrHom - fatPrevHom) / fatPrevHom;
      ytdFatYoYPositive = diff >= 0;
      ytdFatYoYStr = `${diff > 0 ? "+" : ""}${(diff * 100).toFixed(1)}% A/A`;
    }

    // Diárias Homólogas
    diaCurrHom = getRowSum("diarias", currHomKeys);
    diaPrevHom = getRowSum("diarias", prevHomKeys);
    if (diaPrevHom > 0) {
      const diffDia = (diaCurrHom - diaPrevHom) / diaPrevHom;
      ytdDiaYoYPositive = diffDia >= 0;
      ytdDiaYoYStr = `${diffDia > 0 ? "+" : ""}${(diffDia * 100).toFixed(1)}% A/A`;
    }

    // Tarifa Média Homóloga
    adrCurrHom = diaCurrHom > 0 ? fatCurrHom / diaCurrHom : 0;
    adrPrevHom = diaPrevHom > 0 ? fatPrevHom / diaPrevHom : 0;
    if (adrPrevHom > 0) {
      const diffAdr = (adrCurrHom - adrPrevHom) / adrPrevHom;
      ytdAdrYoYPositive = diffAdr >= 0;
      ytdAdrYoYStr = `${diffAdr > 0 ? "+" : ""}${(diffAdr * 100).toFixed(1)}% A/A`;
    }

    // Líquido Homólogo
    liqCurrHom = getRowSum("receita_liquida_locacao", currHomKeys);
    liqPrevHom = getRowSum("receita_liquida_locacao", prevHomKeys);
    if (liqPrevHom > 0) {
      const diffLiq = (liqCurrHom - liqPrevHom) / liqPrevHom;
      ytdLiqYoYPositive = diffLiq >= 0;
      ytdLiqYoYStr = `${diffLiq > 0 ? "+" : ""}${(diffLiq * 100).toFixed(1)}% A/A`;
    }
  }

  // Totais do ano anterior completo (fechado) para balizador e guidance
  const prevColsAllKeys = prevCols.map((c) => c.key);
  const diaPrevTotal = getRowSum("diarias", prevColsAllKeys);
  const fatPrevTotal =
    getRowSum("receita_airbnb", prevColsAllKeys) +
    getRowSum("receita_booking", prevColsAllKeys) +
    getRowSum("receita_offsite", prevColsAllKeys) +
    getRowSum("diarias_pet", prevColsAllKeys);
  const adrPrevTotal = diaPrevTotal > 0 ? fatPrevTotal / diaPrevTotal : 0;

  // Guidance Operacional para os Próximos Meses (Ano Anterior como Balizador de Preço e Ocupação)
  const latestTargetCol = ytdCols[ytdCols.length - 1] || regularAllCols[regularAllCols.length - 1];

  interface GuidanceMonthCard {
    tag: string;
    targetMonthLabel: string;
    refMonthLabel: string;
    tarifaCliente: number;
    diarias: number;
    ocupacao: number;
  }

  const guidanceMonthCards: GuidanceMonthCard[] = [];

  if (latestTargetCol) {
    const [lastYStr, lastMStr] = latestTargetCol.key.split("-");
    const lastY = parseInt(lastYStr, 10);
    const lastM = parseInt(lastMStr, 10);

    for (let offset = 1; offset <= 4; offset++) {
      const futureMonthIndex = (lastM - 1 + offset) % 12; // 0-based
      const futureYear = lastY + Math.floor((lastM - 1 + offset) / 12);
      const targetMNum = futureMonthIndex + 1;

      const refYear = futureYear - 1;
      const refKey = `${refYear}-${String(targetMNum).padStart(2, "0")}`;

      const colExists = regularAllCols.some((c) => c.key === refKey);
      if (colExists) {
        const adrRow = rows.find((r) => r.id === "media_diaria_hospede");
        const diaRow = rows.find((r) => r.id === "diarias");
        const ocuRow = rows.find((r) => r.id === "ocupacao");

        const tarifaCliente = typeof adrRow?.values[refKey] === "number" ? (adrRow.values[refKey] as number) : 0;
        const diarias = typeof diaRow?.values[refKey] === "number" ? (diaRow.values[refKey] as number) : 0;
        const ocupacao = typeof ocuRow?.values[refKey] === "number" ? (ocuRow.values[refKey] as number) : 0;

        const tag =
          offset === 1
            ? "Mês Seguinte"
            : offset === 2
            ? "Próximo Mês (+2)"
            : offset === 3
            ? "Próximo Mês (+3)"
            : "Próximo Mês (+4)";

        guidanceMonthCards.push({
          tag,
          targetMonthLabel: `${monthNamesBr[futureMonthIndex]}/${String(futureYear).slice(2)}`,
          refMonthLabel: `${monthNamesBr[futureMonthIndex]}/${String(refYear).slice(2)}`,
          tarifaCliente,
          diarias,
          ocupacao,
        });
      }
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

  let momLiqStr: string | null = null;
  let momLiqPositive = true;
  let yoyLiqStr: string | null = null;
  let yoyLiqPositive = true;

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

      const prevLiq = (rows.find((r) => r.id === "receita_liquida_locacao")?.values[prevCol.key] as number) || 0;
      if (prevLiq > 0) {
        const diffLiq = (totalLiquidoLocacao - prevLiq) / prevLiq;
        momLiqPositive = diffLiq >= 0;
        momLiqStr = `${diffLiq > 0 ? "+" : ""}${(diffLiq * 100).toFixed(1)}% M/M`;
      }
    }

    const [cYear, cMonth] = currCol.key.split("-");
    const prevYearNum = parseInt(cYear, 10) - 1;
    const prevYearKey = `${prevYearNum}-${cMonth}`;
    const prevFatYoY =
      ((rows.find((r) => r.id === "receita_airbnb")?.values[prevYearKey] as number) || 0) +
      ((rows.find((r) => r.id === "receita_booking")?.values[prevYearKey] as number) || 0) +
      ((rows.find((r) => r.id === "receita_offsite")?.values[prevYearKey] as number) || 0) +
      ((rows.find((r) => r.id === "diarias_pet")?.values[prevYearKey] as number) || 0);

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

      const prevLiqYoY = (rows.find((r) => r.id === "receita_liquida_locacao")?.values[prevYearKey] as number) || 0;
      if (prevLiqYoY > 0) {
        const diffLiqYoY = (totalLiquidoLocacao - prevLiqYoY) / prevLiqYoY;
        yoyLiqPositive = diffLiqYoY >= 0;
        yoyLiqStr = `${diffLiqYoY > 0 ? "+" : ""}${(diffLiqYoY * 100).toFixed(1)}% A/A`;
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
            <div className="mt-2 flex items-center gap-1.5 flex-wrap min-h-[22px]">
              {momLiqStr ? (
                <>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                      momLiqPositive
                        ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                        : "text-rose-700 bg-rose-50 border border-rose-200/60"
                    }`}
                  >
                    {momLiqStr}
                  </span>
                  {yoyLiqStr && (
                    <span
                      className={`font-semibold px-1.5 py-0.5 rounded text-[11px] ${
                        yoyLiqPositive
                          ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                          : "text-rose-700 bg-rose-50 border border-rose-200/60"
                      }`}
                    >
                      {yoyLiqStr}
                    </span>
                  )}
                  {totalFaturamentoBruto > 0 && (
                    <span className="text-[11px] text-zinc-400 font-medium">
                      ({((totalLiquidoLocacao / totalFaturamentoBruto) * 100).toFixed(0)}% margem)
                    </span>
                  )}
                </>
              ) : (
                <span className="text-xs text-zinc-500">
                  {totalFaturamentoBruto > 0
                    ? `Margem: ${((totalLiquidoLocacao / totalFaturamentoBruto) * 100).toFixed(1)}%`
                    : "Resultado líquido apurado"}
                </span>
              )}
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
                {periodLabel
                  ? `Comparativo do mesmo período homólogo (${periodLabel}) entre ${targetYear} e ${prevYear}`
                  : `Performance acumulada de ${targetYear}`}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-medium text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200">
            {ytdCols.length} meses operados
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 divide-y sm:divide-y-0 sm:divide-x divide-zinc-100">
          {/* Métrica 1 YTD: Faturamento Bruto */}
          <div className="pt-2 sm:pt-0">
            <span className="text-[11px] font-medium text-zinc-500">Faturamento Bruto YTD</span>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
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
            {fatPrevHom > 0 && (
              <span className="text-[11px] text-zinc-400 block mt-1">
                Ref. {prevYear} ({periodLabel}): <span className="text-zinc-600 font-medium">{formatCurrency(fatPrevHom)}</span>
              </span>
            )}
          </div>

          {/* Métrica 2 YTD: Diárias Vendidas */}
          <div className="pt-3 sm:pt-0 sm:pl-6">
            <span className="text-[11px] font-medium text-zinc-500">Diárias Vendidas YTD</span>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
              <span className="text-lg sm:text-xl font-bold text-zinc-950 tabular-nums">
                {formatNumber(ytdDiarias)} diárias
              </span>
              {ytdDiaYoYStr && (
                <span
                  className={`inline-flex items-center font-semibold text-[11px] px-1.5 py-0.5 rounded ${
                    ytdDiaYoYPositive
                      ? "text-emerald-700 bg-emerald-50 border border-emerald-200/60"
                      : "text-rose-700 bg-rose-50 border border-rose-200/60"
                  }`}
                >
                  {ytdDiaYoYPositive ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {ytdDiaYoYStr}
                </span>
              )}
            </div>
            {diaPrevHom > 0 && (
              <span className="text-[11px] text-zinc-400 block mt-1">
                Ref. {prevYear} ({periodLabel}): <span className="text-zinc-600 font-medium">{formatNumber(diaPrevHom)} noites</span>
              </span>
            )}
          </div>

          {/* Métrica 3 YTD: Tarifa Bruta Média */}
          <div className="pt-3 sm:pt-0 sm:pl-6">
            <span className="text-[11px] font-medium text-zinc-500">Tarifa Média Cliente (ADR)</span>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
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
            {adrPrevHom > 0 && (
              <span className="text-[11px] text-zinc-400 block mt-1">
                Ref. {prevYear} ({periodLabel}): <span className="text-zinc-600 font-medium">{formatCurrency(adrPrevHom)}</span>
              </span>
            )}
          </div>

          {/* Métrica 4 YTD: Líquido Locação */}
          <div className="pt-3 sm:pt-0 sm:pl-6">
            <span className="text-[11px] font-medium text-zinc-500">Líquido Locação YTD</span>
            <div className="mt-1 flex items-baseline gap-2 flex-wrap">
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
            {liqPrevHom > 0 && (
              <span className="text-[11px] text-zinc-400 block mt-1">
                Ref. {prevYear} ({periodLabel}): <span className="text-zinc-600 font-medium">{formatCurrency(liqPrevHom)}</span>
              </span>
            )}
          </div>
        </div>

        {/* BLOCO DE GUIDANCE OPERACIONAL: Balizador para os Próximos Meses (Ano Anterior) */}
        {guidanceMonthCards.length > 0 && (
          <div className="mt-5 pt-4 border-t border-zinc-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-3">
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-indigo-50 p-1 text-indigo-700 border border-indigo-100">
                  <Compass className="h-3.5 w-3.5" />
                </div>
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-900">
                    Guidance Operacional — Balizador dos Próximos Meses
                  </h5>
                  <p className="text-[11px] text-zinc-500">
                    Tarifa média cobrada de clientes e volume de diárias realizadas no ano anterior para balizar metas e precificação futura
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-medium text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-200 self-start sm:self-auto">
                Histórico Balizador ({prevYear})
              </span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
              {guidanceMonthCards.map((card, idx) => (
                <div
                  key={card.refMonthLabel}
                  className={`rounded-lg border p-3 flex flex-col justify-between transition-all ${
                    idx === 0
                      ? "border-indigo-200 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500/10"
                      : "border-zinc-200/80 bg-zinc-50/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                        idx === 0
                          ? "bg-indigo-100 text-indigo-800 font-bold"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {card.tag}
                    </span>
                    <span className="text-[11px] font-bold text-zinc-700">
                      Ref. {card.refMonthLabel}
                    </span>
                  </div>

                  <div className="mt-2">
                    <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wide block">
                      Tarifa Média Cliente
                    </span>
                    <div className="text-lg sm:text-xl font-bold text-zinc-950 tabular-nums">
                      {formatCurrency(card.tarifaCliente)}
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-zinc-200/50 flex items-center justify-between text-[11px]">
                    <span className="text-zinc-600 font-medium">
                      {formatNumber(card.diarias)} diárias
                    </span>
                    {card.ocupacao > 0 && (
                      <span className="text-zinc-500 font-medium">
                        {formatPercent(card.ocupacao)} ocupação
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
