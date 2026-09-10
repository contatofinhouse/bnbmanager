import React, { useState, useEffect } from "react";
import { X, Download, FileSpreadsheet, CheckCircle2, ShieldCheck, FileText } from "lucide-react";
import { CopanData, ColumnDef } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { getMonthAirbnbCsv, getMonthDreCsv, downloadCsvFile } from "@/lib/csv-exporter";

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CopanData;
  initialMonthKey?: string;
  uploadedCsvs?: Record<string, string>;
  onSuccess?: (msg: string) => void;
}

export function DownloadModal({
  isOpen,
  onClose,
  data,
  initialMonthKey,
  uploadedCsvs,
  onSuccess,
}: DownloadModalProps) {
  // Only regular month columns (excluding totals)
  const regularCols = data.columns.filter((c) => !c.isTotal);
  
  // Default to initialMonthKey or the latest month
  const defaultKey = initialMonthKey || regularCols[regularCols.length - 1]?.key || "2026-08";
  const [selectedKey, setSelectedKey] = useState<string>(defaultKey);

  useEffect(() => {
    if (initialMonthKey) {
      setSelectedKey(initialMonthKey);
    }
  }, [initialMonthKey]);

  if (!isOpen) return null;

  const currentCol = data.columns.find((c) => c.key === selectedKey) || regularCols[regularCols.length - 1];

  // Helper getters for month metrics
  const getVal = (id: string): number => {
    const row = data.rows.find((r) => r.id === id);
    const val = row?.values[selectedKey];
    return typeof val === "number" ? val : 0;
  };

  const faturamentoAirbnb = getVal("receita_airbnb");
  const faturamentoTotal =
    faturamentoAirbnb + getVal("receita_booking") + getVal("receita_offsite");
  const diarias = getVal("diarias");
  const checkins = getVal("checkins");
  const liquido = getVal("receita_liquida_locacao");

  const airbnbCsvInfo = getMonthAirbnbCsv(selectedKey, data, uploadedCsvs);

  const handleDownloadAirbnb = () => {
    // Native HTTP download via API route with attachment headers
    const link = document.createElement("a");
    link.href = `/api/export-csv?month=${selectedKey}&format=airbnb`;
    link.setAttribute("download", airbnbCsvInfo.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onSuccess) {
      onSuccess(`Download iniciado: ${airbnbCsvInfo.filename}`);
    }
    setTimeout(() => {
      onClose();
    }, 500);
  };

  const handleDownloadDre = () => {
    const dreInfo = getMonthDreCsv(selectedKey, data);
    const link = document.createElement("a");
    link.href = `/api/export-csv?month=${selectedKey}&format=dre`;
    link.setAttribute("download", dreInfo.filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onSuccess) {
      onSuccess(`Download iniciado: ${dreInfo.filename}`);
    }
    setTimeout(() => {
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-800">
              <Download className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-950">
                Baixar Arquivo Base Fonte (CSV)
              </h3>
              <p className="text-xs text-zinc-500">
                Exporte o relatório analítico do Airbnb ou o demonstrativo DRE do mês
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Month Selector */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
              Selecione o Mês de Referência
            </label>
            <select
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm font-medium text-zinc-900 shadow-xs focus:border-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            >
              {/* Show reverse chronological (newest first) */}
              {[...regularCols].reverse().map((col) => (
                <option key={col.key} value={col.key}>
                  {col.label} ({col.year}) {col.key === "2026-08" ? "— Mês Atual (Arquivo Real Airbnb)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Selected Month Details Card */}
          <div className="rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-900">
                {currentCol?.label} — Vem pro Copan
              </span>
              {airbnbCsvInfo.isOriginal ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
                  <ShieldCheck className="h-3 w-3" />
                  Arquivo Oficial Airbnb
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 border border-zinc-200">
                  <FileText className="h-3 w-3" />
                  Base Estruturada Copan
                </span>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-zinc-200/60 text-xs">
              <div>
                <span className="text-zinc-500 block text-[11px]">Receita Airbnb</span>
                <span className="font-bold text-zinc-900 tabular-nums">
                  {formatCurrency(faturamentoAirbnb)}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Diárias</span>
                <span className="font-bold text-zinc-900 tabular-nums">
                  {formatNumber(diarias)} noites
                </span>
              </div>
              <div>
                <span className="text-zinc-500 block text-[11px]">Líquido</span>
                <span className="font-bold text-emerald-700 tabular-nums">
                  {formatCurrency(liquido)}
                </span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-zinc-500 bg-white px-2.5 py-1.5 rounded border border-zinc-200/80 truncate">
              Arquivo: {airbnbCsvInfo.filename}
            </div>
          </div>

          {/* Action Buttons with Native <a> Links */}
          <div className="pt-2 space-y-2.5">
            <a
              href={`/api/export-csv?month=${selectedKey}&format=airbnb`}
              download={airbnbCsvInfo.filename}
              onClick={() => {
                if (onSuccess) onSuccess(`Download concluído: ${airbnbCsvInfo.filename}`);
                setTimeout(onClose, 600);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Baixar CSV Fonte do Airbnb ({airbnbCsvInfo.filename})
            </a>
            <p className="text-[11px] text-center text-zinc-500">
              Arquivo analítico com hóspedes, códigos de confirmação, diárias e taxas brutas
            </p>

            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-zinc-200" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase">
                <span className="bg-white px-2 text-zinc-400 font-semibold">Ou</span>
              </div>
            </div>

            <a
              href={`/api/export-csv?month=${selectedKey}&format=dre`}
              download={`DRE_Copan_${selectedKey}.csv`}
              onClick={() => {
                if (onSuccess) onSuccess(`Download concluído: DRE_Copan_${selectedKey}.csv`);
                setTimeout(onClose, 600);
              }}
              className="w-full flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 shadow-xs transition-colors hover:bg-zinc-50 hover:text-zinc-900 cursor-pointer"
            >
              <FileSpreadsheet className="h-3.5 w-3.5 text-zinc-600" />
              Baixar DRE Financeira Consolidada do Mês (.csv)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
