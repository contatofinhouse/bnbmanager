"use client";

import React, { useState } from "react";
import { formatCurrency, formatPercent } from "@/lib/utils";
import {
  TrendingUp,
  Landmark,
  ShieldCheck,
  PieChart,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowUpRight,
  Info,
  Calendar,
  Building,
} from "lucide-react";

interface InstitutionalValuationSectionProps {
  property: {
    id: string;
    name: string;
    listing: string;
    city: string;
    cotas?: number;
    valorMercado?: number;
    valorFinanciado?: number;
    capexInicial?: number;
    capexObras?: number;
    capexTotal?: number;
    taxaDesconto?: number;
  };
  columns: any[];
  rows: any[];
  allColumns?: any[];
}

export function InstitutionalValuationSection({
  property,
}: InstitutionalValuationSectionProps) {
  const [viewMode, setViewMode] = useState<"100" | "50">("100");
  const [showCapexModal, setShowCapexModal] = useState(false);
  const [showMethodologyInfo, setShowMethodologyInfo] = useState(true);
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState<number | null>(null);

  const multiplier = viewMode === "50" ? 0.5 : 1.0;

  // Exact data from ape_320
  const valorImovel = 535000 * multiplier;
  const valorFinanciado = 428000 * multiplier;
  const capexInicial = 129900.73 * multiplier;
  const capexObras = 8208.00 * multiplier;
  const capexTotal = 138108.73 * multiplier;

  // Realized operational numbers (12 months: Fev/25 to Jan/26)
  const receitaLiquida12m = 98167.45 * multiplier;
  const despesasOperacionais12m = 28631.38 * multiplier;
  const noi12m = 69536.07 * multiplier; // NOI = Rec. Liq - Desp. Operacionais
  const financiamentoPago12m = 59548.10 * multiplier;
  const fco12m = 9987.97 * multiplier; // Caixa livre

  // SAC Amortization with REAL observed bank balance: R$ 426.000,00
  const saldoDevedorAtual = 426000 * multiplier; // Saldo real verificado no extrato bancário
  const amortizacaoLiquidaReal12m = (428000 - 426000) * multiplier; // R$ 2.000,00 de redução líquida real no Ano 1
  const reajusteTR12m = (12228.57 - 2000.00) * multiplier; // R$ 10.228,57 absorvidos pela TR no ano de Selic alta
  const saldoDevedorAno10 = 352000.00 * multiplier; // Projeção Ano 10 a partir de R$ 426k com TR média de 1,0% a.a.
  const equityAtual = (535000 - 426000) * multiplier; // R$ 109.000,00
  const ganhoPatrimonial12m = fco12m + amortizacaoLiquidaReal12m; // R$ 9.988 + R$ 2.000 = R$ 11.988

  // Metrics
  const capRateRealizado = (69536.07 / 535000) * 100; // 13.00%
  const dscr = 69536.07 / 59548.10; // 1.17x
  const roeEquityAno1 = (ganhoPatrimonial12m / capexInicial) * 100; // 9.23% líquido da TR
  const tirOperacional = 10.58; // % a.a. (Independe de TR e de saldo devedor)
  const tirTotalComExit = 21.73; // % a.a. com saldo real de R$ 426k e TR média
  const vpl10AnosTma10 = 148500.00 * multiplier;
  const paybackCaixaAnos = 6.3; // Payback de Caixa Livre (100% de volta no bolso)
  const paybackPatrimonialAnos = 5.2; // Payback Patrimonial com TR real recente

  // Monthly data array for chart and table
  const monthlyTimeline = [
    { mes: "Fev/25", bruto: 6762, rliq: 5266.91, financ: -8077.7, desp: -2213.72, fco: -5024.51, margem: -95.4, capexExtra: 0, vplAcum: -134925.24 },
    { mes: "Mar/25", bruto: 12332, rliq: 10138.21, financ: -4729.18, desp: -2042.41, fco: 3366.62, margem: 33.2, capexExtra: 0, vplAcum: -131558.62 },
    { mes: "Abr/25", bruto: 8390, rliq: 6694.35, financ: -4727.18, desp: -1943.19, fco: 23.98, margem: 0.4, capexExtra: 0, vplAcum: -131534.64 },
    { mes: "Mai/25", bruto: 5750, rliq: 4663.35, financ: -4566.28, desp: -1843.93, fco: -1746.86, margem: -37.5, capexExtra: 0, vplAcum: -133281.50 },
    { mes: "Jun/25", bruto: 2963.98, rliq: 2440.57, financ: -4557.78, desp: -1755.89, fco: -3873.1, margem: -158.7, capexExtra: 0, vplAcum: -137154.60 },
    { mes: "Jul/25", bruto: 6780.19, rliq: 5609.9, financ: -4549.27, desp: -1708.47, fco: -647.84, margem: -11.5, capexExtra: -2860, vplAcum: -140662.44 },
    { mes: "Ago/25", bruto: 5040, rliq: 3991.02, financ: -4725.28, desp: -4549.51, fco: -5283.77, margem: -132.4, capexExtra: -3200, vplAcum: -149146.21 },
    { mes: "Set/25", bruto: 9074.14, rliq: 7703.94, financ: -4725.28, desp: -2032.67, fco: 945.99, margem: 12.3, capexExtra: -2148, vplAcum: -150348.22 },
    { mes: "Out/25", bruto: 9007.11, rliq: 7229.01, financ: -4725.28, desp: -2442.01, fco: 61.72, margem: 0.9, capexExtra: 0, vplAcum: -150286.50 },
    { mes: "Nov/25", bruto: 10221.55, rliq: 8238.17, financ: -4722.14, desp: -2213.36, fco: 1302.67, margem: 15.8, capexExtra: 0, vplAcum: -148983.83 },
    { mes: "Dez/25", bruto: 16426, rliq: 13657.99, financ: -4721.39, desp: -2245.26, fco: 6691.34, margem: 49.0, capexExtra: 0, vplAcum: -142292.49 },
    { mes: "Jan/26", bruto: 26768, rliq: 22534.03, financ: -4721.34, desp: -3640.96, fco: 14171.73, margem: 62.9, capexExtra: 0, vplAcum: -128120.76 },
  ];

  // Capex breakdown items
  const capexItems = [
    { item: "Adiantamento / Entrada (20%)", valor: 107000.00, desc: "Sinal e entrada na aquisição" },
    { item: "ITBI (Imposto de Transmissão)", valor: 10700.00, desc: "Prefeitura de Bertioga" },
    { item: "Cartório de Notas e Escritura", valor: 5196.73, desc: "Lavratura da escritura" },
    { item: "Registro de Imóveis (Certidões)", valor: 214.56, desc: "Prenotação e matrícula atualizada" },
    { item: "Seguro Financiamento / Tarifa Bancária", valor: 1278.81, desc: "Taxa de avaliação e seguros Caixa" },
    { item: "Correspondente Bancário", valor: 2000.00, desc: "Despachante e assessoria de crédito" },
    { item: "Smart TV e Suporte Articulado", valor: 2306.00, desc: "Equipamentos para locação" },
    { item: "Chuveiro Elétrico Blindado", valor: 699.90, desc: "Instalação no banheiro" },
    { item: "Chaleira Elétrica e Microondas", valor: 515.16, desc: "Eletrodomésticos essenciais" },
    { item: "Garrafa Térmica e Utensílios", valor: 59.99, desc: "Cozinha do flat" },
  ];

  return (
    <section className="mt-12 pt-8 border-t-2 border-zinc-200/80 space-y-8 animate-in fade-in duration-500">
      {/* Top Header of the Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-zinc-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs">
              <Landmark className="h-4 w-4" />
            </span>
            <h2 className="text-lg font-bold tracking-tight text-zinc-950">
              Valuation & Retorno de Investimento
            </h2>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200/80">
              <ShieldCheck className="h-3.5 w-3.5" /> Metodologia Brookfield
            </span>
          </div>
          <p className="mt-1 text-xs text-zinc-500 max-w-2xl">
            Análise institucional de Real Estate Private Equity: desempenho operacional (NOI, Cap Rate), alavancagem de dívida (DSCR) e retorno sobre capital próprio (Equity / VPL).
          </p>
        </div>

        {/* View mode toggle (100% vs 50%) */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-zinc-100 p-1 rounded-xl border border-zinc-200/80 text-xs font-medium">
          <button
            onClick={() => setViewMode("100")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "100"
                ? "bg-white text-zinc-950 font-bold shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Consolidado (100%)
          </button>
          <button
            onClick={() => setViewMode("50")}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              viewMode === "50"
                ? "bg-white text-zinc-950 font-bold shadow-xs"
                : "text-zinc-600 hover:text-zinc-900"
            }`}
          >
            Por Cotista (50% Rafael / Paulo)
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: NOI & Cap Rate */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold uppercase tracking-wider text-zinc-600">
                1. Performance Operacional
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 font-bold text-emerald-700 text-[11px]">
                <ArrowUpRight className="h-3 w-3" /> +6,5% vs Mercado
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-950">
                {capRateRealizado.toFixed(2)}%
              </span>
              <span className="ml-1.5 text-xs text-zinc-500 font-medium">Cap Rate a.a.</span>
            </div>
            <div className="mt-2 text-xs text-zinc-600 space-y-1">
              <div className="flex justify-between">
                <span>NOI (Lucro Operacional):</span>
                <span className="font-bold text-zinc-900">{formatCurrency(noi12m)}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Benchmark Litoral SP:</span>
                <span>6,0% a 7,0% a.a.</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500 leading-snug">
            Lucro gerado pelo imóvel antes do financiamento. Demonstra a alta produtividade do ativo.
          </div>
        </div>

        {/* Card 2: DSCR & Financiamento */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold uppercase tracking-wider text-zinc-600">
                2. Serviço da Dívida (DSCR)
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-50 px-1.5 py-0.5 font-bold text-blue-700 text-[11px]">
                SAC + TR 1,0% a.a.
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-950">
                {dscr.toFixed(2)}x
              </span>
              <span className="ml-1.5 text-xs text-zinc-500 font-medium">Cobertura (DSCR)</span>
            </div>
            <div className="mt-2 text-xs text-zinc-600 space-y-1">
              <div className="flex justify-between">
                <span>Dívida Paga (12m):</span>
                <span className="font-bold text-zinc-900">{formatCurrency(financiamentoPago12m)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Amortização Líq. Real:</span>
                <span className="font-semibold text-emerald-700">+{formatCurrency(amortizacaoLiquidaReal12m)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Saldo Real no Extrato:</span>
                <span className="font-bold text-zinc-900">{formatCurrency(saldoDevedorAtual)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500 leading-snug">
            Saldo verificado no app do banco: R$ 426k. No ano 1 de Selic alta, a TR absorveu ~R$ 10k da amortização SAC de R$ 12,2k.
          </div>
        </div>

        {/* Card 3: Retorno Total do Equity (ROE) */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold uppercase tracking-wider text-zinc-600">
                3. Retorno do Equity (ROE)
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 font-bold text-amber-800 text-[11px]">
                Ano 1
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-950">
                {roeEquityAno1.toFixed(1)}%
              </span>
              <span className="ml-1.5 text-xs text-zinc-500 font-medium">a.a. no Capital Próprio</span>
            </div>
            <div className="mt-2 text-xs text-zinc-600 space-y-1">
              <div className="flex justify-between">
                <span>Ganho Patrimonial:</span>
                <span className="font-bold text-zinc-900">{formatCurrency(ganhoPatrimonial12m)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Caixa Livre + Amort. Líq.:</span>
                <span>{formatCurrency(fco12m)} + {formatCurrency(amortizacaoLiquidaReal12m)}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-500 leading-snug">
            Soma do caixa líquido livre gerado com o aumento patrimonial líquido da TR no imóvel.
          </div>
        </div>

        {/* Card 4: VPL e TIR Verdadeiros de Longo Prazo */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div>
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <span className="font-semibold uppercase tracking-wider text-zinc-600">
                4. VPL & TIR Verdadeiros
              </span>
              <span className="inline-flex items-center gap-0.5 rounded-md bg-purple-50 px-1.5 py-0.5 font-bold text-purple-800 text-[11px]">
                TMA 10% a.a.
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl font-extrabold tracking-tight text-zinc-950">
                {tirTotalComExit.toFixed(1)}%
              </span>
              <span className="ml-1.5 text-xs text-zinc-500 font-medium">TIR Total (TR 1,0%)</span>
            </div>
            <div className="mt-2 text-xs text-zinc-600 space-y-1">
              <div className="flex justify-between">
                <span>VPL 10a (TMA 10%):</span>
                <span className="font-bold text-emerald-700">+{formatCurrency(vpl10AnosTma10)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Payback Caixa Livre:</span>
                <span className="font-semibold text-zinc-900">{paybackCaixaAnos} anos (~6a 4m)</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Payback Patrimonial:</span>
                <span className="font-semibold text-emerald-700">{paybackPatrimonialAnos} anos</span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500 leading-snug">
            <span>TIR pura: {tirOperacional}% | TR 1%: {tirTotalComExit.toFixed(1)}%</span>
            <a
              href="#vpl-tir-verdadeiros"
              className="font-bold text-purple-700 hover:text-purple-900 inline-flex items-center gap-0.5"
            >
              Ver 4 Pilares ↓
            </a>
          </div>
        </div>
      </div>

      {/* Main Interactive Evolution Chart */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-zinc-950 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-zinc-800" />
              Evolução Temporal: Margem Líquida (%) vs. Fluxo de Caixa (FCO) vs. Posição de Capital
            </h3>
            <p className="text-xs text-zinc-500 mt-1">
              Observe a Curva J: o vale de caixa no inverno (Set/25) sendo revertido pelo salto exponencial de margem e caixa na alta temporada (Dez/25 e Jan/26).
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-600 inline-block" />
              <span className="text-zinc-700">Margem Líquida %</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-blue-500 inline-block" />
              <span className="text-zinc-700">Caixa Livre (FCO)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-0.5 w-4 bg-zinc-800 inline-block border-t border-dashed border-zinc-400" />
              <span className="text-zinc-700">Posição Acumulada</span>
            </div>
          </div>
        </div>

        {/* Responsive Visual Timeline / Chart */}
        <div className="relative pt-4">
          {/* Timeline grid */}
          <div className="grid grid-cols-12 gap-1.5 sm:gap-2">
            {monthlyTimeline.map((item, idx) => {
              const isHovered = hoveredMonthIndex === idx;
              const fcoVal = item.fco * multiplier;
              const isPos = fcoVal >= 0;
              // Normalize bar height based on max positive (14171) or max negative (-5283)
              const maxFco = 15000 * multiplier;
              const barHeightPercent = Math.min(Math.max((Math.abs(fcoVal) / maxFco) * 100, 8), 100);

              return (
                <div
                  key={item.mes}
                  onMouseEnter={() => setHoveredMonthIndex(idx)}
                  onMouseLeave={() => setHoveredMonthIndex(null)}
                  className={`flex flex-col items-center justify-end rounded-xl p-2 transition-all cursor-pointer ${
                    isHovered
                      ? "bg-zinc-100/90 ring-1 ring-zinc-300 shadow-xs"
                      : "hover:bg-zinc-50"
                  }`}
                >
                  {/* Margem % badge on top */}
                  <span
                    className={`text-[10px] font-bold px-1 py-0.5 rounded ${
                      item.margem >= 30
                        ? "bg-emerald-100 text-emerald-800"
                        : item.margem >= 0
                        ? "bg-zinc-100 text-zinc-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {item.margem > 0 ? `+${item.margem.toFixed(0)}%` : `${item.margem.toFixed(0)}%`}
                  </span>

                  {/* Bar container */}
                  <div className="h-32 w-full flex items-center justify-center relative my-2">
                    {/* Zero baseline */}
                    <div className="absolute inset-x-0 top-1/2 h-[1px] bg-zinc-200" />

                    {/* Bar representing FCO */}
                    <div
                      style={{ height: `${barHeightPercent / 2}%` }}
                      className={`w-3.5 sm:w-5 rounded-xs transition-all ${
                        isPos
                          ? "bg-emerald-500 self-end mb-[63px]"
                          : "bg-rose-400 self-start mt-[65px]"
                      } ${isHovered ? "opacity-100 ring-2 ring-zinc-950" : "opacity-85"}`}
                    />
                  </div>

                  {/* Month Label */}
                  <span className="text-[11px] font-semibold text-zinc-600 mt-1">
                    {item.mes}
                  </span>

                  {/* FCO formatted */}
                  <span
                    className={`text-[10px] tabular-nums font-bold mt-0.5 ${
                      isPos ? "text-emerald-700" : "text-rose-600"
                    }`}
                  >
                    {fcoVal > 0 ? `+${(fcoVal / 1000).toFixed(1)}k` : `${(fcoVal / 1000).toFixed(1)}k`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Hover Detail Card */}
          {hoveredMonthIndex !== null && (
            <div className="mt-4 p-4 rounded-xl bg-zinc-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-in fade-in duration-200 text-xs">
              <div>
                <span className="font-bold text-amber-400 text-sm">
                  {monthlyTimeline[hoveredMonthIndex].mes}
                </span>{" "}
                — Detalhamento do Período:
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <span className="text-zinc-400">Fat. Bruto:</span>{" "}
                  <span className="font-semibold text-white">
                    {formatCurrency(monthlyTimeline[hoveredMonthIndex].bruto * multiplier)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400">Financiamento:</span>{" "}
                  <span className="font-semibold text-rose-300">
                    {formatCurrency(monthlyTimeline[hoveredMonthIndex].financ * multiplier)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400">Caixa Livre (FCO):</span>{" "}
                  <span
                    className={`font-bold ${
                      monthlyTimeline[hoveredMonthIndex].fco >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {formatCurrency(monthlyTimeline[hoveredMonthIndex].fco * multiplier)}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400">Margem Líquida:</span>{" "}
                  <span className="font-bold text-white">
                    {monthlyTimeline[hoveredMonthIndex].margem.toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400">Posição Acumulada:</span>{" "}
                  <span className="font-bold text-amber-300">
                    {formatCurrency(monthlyTimeline[hoveredMonthIndex].vplAcum * multiplier)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer info inside chart container */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-zinc-100 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-700">CAPEX Inicial Desembolsado:</span>
            <span>{formatCurrency(capexInicial)}</span>
            <button
              onClick={() => setShowCapexModal(!showCapexModal)}
              className="text-xs text-zinc-900 font-semibold underline hover:text-zinc-600 transition-colors cursor-pointer ml-1"
            >
              {showCapexModal ? "Ocultar Composição" : "Ver Composição Detalhada"}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-700">Posição Líquida ao fim de Jan/26:</span>
            <span className="font-bold text-zinc-900">{formatCurrency(-128120.76 * multiplier)}</span>
          </div>
        </div>

        {/* Capex Breakdown Drawer/Table */}
        {showCapexModal && (
          <div className="mt-4 p-5 rounded-2xl bg-zinc-50 border border-zinc-200/80 animate-in fade-in duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-800 flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-zinc-700" />
                Composição do Desembolso Inicial de Aquisição & Implantação (R$ 129.900,73)
              </h4>
              <span className="text-xs text-zinc-500">
                Visão: {viewMode === "100" ? "Consolidada (100%)" : "Cota 50%"}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 text-left font-semibold">
                    <th className="py-2">Item / Destinação</th>
                    <th className="py-2">Finalidade</th>
                    <th className="py-2 text-right">Valor 100%</th>
                    <th className="py-2 text-right">Valor 50%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60">
                  {capexItems.map((c, i) => (
                    <tr key={i} className="hover:bg-zinc-100/60">
                      <td className="py-2 font-medium text-zinc-900">{c.item}</td>
                      <td className="py-2 text-zinc-500">{c.desc}</td>
                      <td className="py-2 text-right font-semibold text-zinc-800">
                        {formatCurrency(c.valor)}
                      </td>
                      <td className="py-2 text-right font-bold text-zinc-950">
                        {formatCurrency(c.valor / 2)}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-200/60 font-bold text-zinc-950">
                    <td colSpan={2} className="py-2.5 pl-2">Total CAPEX Inicial</td>
                    <td className="py-2.5 text-right font-extrabold">{formatCurrency(129900.73)}</td>
                    <td className="py-2.5 text-right font-extrabold">{formatCurrency(64950.36)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-zinc-500 italic">
              * Além do CAPEX inicial, foram realizados R$ 8.208,00 de obras adicionais em jul-set/25, totalizando R$ 138.108,73 investidos no ativo.
            </p>
          </div>
        )}
      </div>

      {/* Explanatory Methodology Card (Brookfield / Real Estate Private Equity Standards) */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
        <button
          onClick={() => setShowMethodologyInfo(!showMethodologyInfo)}
          className="w-full flex items-center justify-between text-left group cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-zinc-700" />
            <div>
              <h3 className="text-sm font-bold text-zinc-950 group-hover:text-zinc-700 transition-colors">
                Fundamentos & Critérios Matemáticos da Metodologia Brookfield
              </h3>
              <p className="text-xs text-zinc-500">
                Entenda como as grandes gestoras institucionais conectam NOI, serviço da dívida, amortização com TR e valor residual.
              </p>
            </div>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 group-hover:bg-zinc-200 transition-colors">
            {showMethodologyInfo ? (
              <ChevronUp className="h-4 w-4 text-zinc-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-zinc-600" />
            )}
          </span>
        </button>

        {showMethodologyInfo && (
          <div className="pt-4 border-t border-zinc-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-600 leading-relaxed animate-in fade-in duration-300">
            {/* Concept 1: J-Curve */}
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/70 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-600" />
                1. Curva J & Saldo Acumulado
              </div>
              <p className="text-[11px] text-zinc-600 leading-snug">
                Capital próprio alocado: <strong>-R$ 129,9k</strong>. Desceu a -R$ 150,3k no inverno e recuperou para <strong>-R$ 128,1k</strong> após gerar +R$ 20,8k líquidos em dez/jan.
              </p>
            </div>

            {/* Concept 2: TR & Debt */}
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/70 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900 text-xs">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                2. Financiamento SAC & TR (1,0% a.a.)
              </div>
              <p className="text-[11px] text-zinc-600 leading-snug">
                Saldo no extrato: <strong>{formatCurrency(saldoDevedorAtual)}</strong>. A valorização patrimonial do flat (+3% a.a. = +R$ 16k/ano) supera com folga a correção da TR.
              </p>
            </div>

            {/* Concept 3: Cap Rate vs Debt */}
            <div className="bg-zinc-50 p-3.5 rounded-xl border border-zinc-200/70 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-zinc-900 text-xs">
                <span className="h-2 w-2 rounded-full bg-purple-600" />
                3. Eficiência Operacional & DSCR
              </div>
              <p className="text-[11px] text-zinc-600 leading-snug">
                NOI de <strong>{formatCurrency(noi12m)}</strong> (Cap Rate 13,0%) cobriu 100% dos R$ 59,5k de parcelas da Caixa, mantendo índice DSCR em <strong>1,17x</strong>.
              </p>
            </div>

            {/* CARD: VPL E TIR VERDADEIROS DE LONGO PRAZO */}
            <div id="vpl-tir-verdadeiros" className="space-y-3 bg-zinc-50 p-5 rounded-2xl border border-zinc-200 md:col-span-3 scroll-mt-20">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-zinc-200 pb-2.5">
                <h4 className="font-bold text-zinc-950 flex items-center gap-2 text-sm sm:text-base">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-zinc-900 text-white text-[11px] font-bold">4</span>
                  VPL e TIR Verdadeiros de Longo Prazo (Fórmulas & Métricas)
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-200 text-zinc-800 self-start sm:self-auto">
                  Ciclo de 10 Anos
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {/* 1. TIR Operacional */}
                <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-900">TIR Operacional</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        10,58% a.a.
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">Exclusiva de aluguéis, sem ganho de capital.</div>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200/80 font-mono text-[10px] text-zinc-800">
                    <div className="font-bold text-zinc-900">0 = -I₀ + Σ [ FCO_t / (1+TIR)^t ]</div>
                    <div className="text-zinc-500 font-sans mt-1">I₀: {formatCurrency(capexInicial)}</div>
                  </div>
                </div>

                {/* 2. TIR Total com Exit */}
                <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-900">TIR com Desinvestimento</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-800 border border-purple-200">
                        21,73% a.a.
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">Fluxos anuais + liquidação do Equity residual.</div>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200/80 font-mono text-[10px] text-zinc-800">
                    <div className="font-bold text-zinc-900">0 = -I₀ + Σ FCO + Equity₁₀ / (1+TIR)¹⁰</div>
                    <div className="text-zinc-500 font-sans mt-1">Equity₁₀: {formatCurrency(367000 * multiplier)} líq.</div>
                  </div>
                </div>

                {/* 3. VPL Descontado */}
                <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-900">VPL (TMA 10% a.a.)</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        +{formatCurrency(vpl10AnosTma10)}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">Ganho econômico acima da renda fixa.</div>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200/80 font-mono text-[10px] text-zinc-800">
                    <div className="font-bold text-zinc-900">VPL = Σ [ CF_t / (1+r)^t ] - I₀</div>
                    <div className="text-zinc-500 font-sans mt-1">Taxa de desconto r: 10,0% a.a.</div>
                  </div>
                </div>

                {/* 4. Payback */}
                <div className="bg-white p-3.5 rounded-xl border border-zinc-200 shadow-2xs space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-zinc-900">Payback Alvo</span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        6,3 anos
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-1">Reembolso integral do desembolso inicial.</div>
                  </div>
                  <div className="bg-zinc-50 p-2 rounded-lg border border-zinc-200/80 text-[10px] text-zinc-700 space-y-0.5">
                    <div>• <strong>Caixa Livre:</strong> 6,3 anos (~6a 4m)</div>
                    <div>• <strong>Patrimonial:</strong> 5,2 anos</div>
                  </div>
                </div>
              </div>
            </div>

            {/* OS 4 PILARES DE AVALIAÇÃO INSTITUCIONAL (DIRETAMENTE ABAIXO DO CARD VPL E TIR) */}
            <div className="bg-zinc-900 text-white p-5 rounded-2xl border border-zinc-800 md:col-span-3 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500 text-zinc-950 text-xs font-black">
                    ★
                  </span>
                  <h4 className="font-bold text-white text-base">
                    Os 4 Pilares de Avaliação Institucional (Framework Brookfield & Blackstone)
                  </h4>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-zinc-800 text-amber-300 border border-zinc-700/80">
                  Real Estate Private Equity
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {/* Pilar 1 */}
                <div className="bg-zinc-800/90 p-4 rounded-xl border border-zinc-700/70 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider">
                      <span>1. Ativo Físico</span>
                      <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800 text-[10px]">13,0%</span>
                    </div>
                    <div className="text-sm font-bold text-white mt-1">Unleveraged Cap Rate</div>
                  </div>
                  <div className="space-y-1.5 text-xs text-zinc-300 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-700/50">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">NOI Realizado:</span>
                      <span className="font-bold text-white">{formatCurrency(noi12m)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Cap Rate:</span>
                      <span className="font-bold text-emerald-400">13,00% a.a.</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Média SP/Litoral:</span>
                      <span>6,0% a 7,5%</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-emerald-300 font-medium leading-tight">
                    Dobro da rentabilidade do mercado sem alavancagem.
                  </div>
                </div>

                {/* Pilar 2 */}
                <div className="bg-zinc-800/90 p-4 rounded-xl border border-zinc-700/70 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider">
                      <span>2. Alavancagem</span>
                      <span className="bg-blue-950 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800 text-[10px]">1,17x</span>
                    </div>
                    <div className="text-sm font-bold text-white mt-1">Spread & Cobertura</div>
                  </div>
                  <div className="space-y-1.5 text-xs text-zinc-300 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-700/50">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Spread Líquido:</span>
                      <span className="font-bold text-emerald-400">+2,5% a.a.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Cobertura DSCR:</span>
                      <span className="font-bold text-white">1,17x (Folga 17%)</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Saldo Atual:</span>
                      <span className="text-zinc-200">{formatCurrency(saldoDevedorAtual)}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-blue-300 font-medium leading-tight">
                    Spread positivo: hóspedes pagam 100% da dívida bancária.
                  </div>
                </div>

                {/* Pilar 3 */}
                <div className="bg-zinc-800/90 p-4 rounded-xl border border-zinc-700/70 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider">
                      <span>3. Retorno Equity</span>
                      <span className="bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800 text-[10px]">4,55x</span>
                    </div>
                    <div className="text-sm font-bold text-white mt-1">TIR & Múltiplo (MOIC)</div>
                  </div>
                  <div className="space-y-1.5 text-xs text-zinc-300 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-700/50">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">TIR Total (TR 1%):</span>
                      <span className="font-bold text-purple-300">21,73% a.a.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Múltiplo (MOIC):</span>
                      <span className="font-bold text-white">4,55x em 10a</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>VPL (TMA 10%):</span>
                      <span className="text-emerald-400">+{formatCurrency(vpl10AnosTma10)}</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-purple-300 font-medium leading-tight">
                    Cada R$ 1,00 colocado retorna R$ 4,55 no ciclo de 10 anos.
                  </div>
                </div>

                {/* Pilar 4 */}
                <div className="bg-zinc-800/90 p-4 rounded-xl border border-zinc-700/70 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-amber-400 font-bold uppercase tracking-wider">
                      <span>4. Desinvestimento</span>
                      <span className="bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800 text-[10px]">Exit</span>
                    </div>
                    <div className="text-sm font-bold text-white mt-1">Liquidação vs. Hold</div>
                  </div>
                  <div className="space-y-1.5 text-xs text-zinc-300 bg-zinc-900/80 p-2.5 rounded-lg border border-zinc-700/50">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Venda no Ano 10:</span>
                      <span className="font-bold text-emerald-400">{formatCurrency(367000 * multiplier)} líq.</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Dívida residual:</span>
                      <span className="text-zinc-300">{formatCurrency(352000 * multiplier)} quitada</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-zinc-400">
                      <span>Opção Hold:</span>
                      <span className="text-amber-300">Renda perpétua</span>
                    </div>
                  </div>
                  <div className="text-[11px] text-amber-300 font-medium leading-tight">
                    Flexibilidade de liquidez: venda com lucro ou retenção de dividendos.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
