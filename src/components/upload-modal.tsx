import React, { useState, useRef } from "react";
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { parseAirbnbCsv, ParsedMonthlyResult } from "@/lib/csv-parser";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyMonth: (result: ParsedMonthlyResult, rawCsvText?: string) => void;
}

export function UploadModal({ isOpen, onClose, onApplyMonth }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedMonthlyResult | null>(null);
  const [rawText, setRawText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setError("Por favor, selecione um arquivo no formato .CSV do Airbnb ou Booking.");
      return;
    }
    setError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setRawText(text);
      try {
        const result = parseAirbnbCsv(text);
        if (!result) {
          setError("Nenhuma reserva do Copan encontrada no arquivo. Verifique se o relatório contém anúncios do Copan.");
          setParsedData(null);
        } else {
          setParsedData(result);
        }
      } catch (err: any) {
        setError(`Erro ao processar arquivo: ${err.message}`);
        setParsedData(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleConfirm = () => {
    if (parsedData) {
      onApplyMonth(parsedData, rawText || undefined);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-950">
              Importar Relatório Mensal (CSV)
            </h3>
            <p className="text-xs text-zinc-500">
              Solte o arquivo de pagamentos do mês para atualizar a tabela do Copan
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dropzone */}
        <div className="mt-5">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-7 text-center transition-colors cursor-pointer ${
              dragActive
                ? "border-zinc-950 bg-zinc-50"
                : "border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="rounded-full bg-white p-3 shadow-xs border border-zinc-200">
              <UploadCloud className="h-6 w-6 text-zinc-700" />
            </div>
            <p className="mt-3 text-xs font-semibold text-zinc-900">
              Arraste o arquivo CSV aqui ou clique para selecionar
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Suporta relatórios brutos de pagamentos do Airbnb
            </p>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Preview of Parsed Data */}
        {parsedData && (
          <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-950">
                  Mês Identificado: {parsedData.label} ({parsedData.reservas.length} reservas Copan)
                </span>
              </div>
              <span className="text-[11px] text-emerald-800 font-mono">
                {fileName}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="rounded bg-white p-2 border border-emerald-100">
                <span className="text-[10px] text-zinc-500">Diárias:</span>
                <p className="font-semibold text-zinc-900">{parsedData.metrics.diarias} noites</p>
              </div>
              <div className="rounded bg-white p-2 border border-emerald-100">
                <span className="text-[10px] text-zinc-500">Ocupação:</span>
                <p className="font-semibold text-zinc-900">{formatPercent(parsedData.metrics.ocupacao)}</p>
              </div>
              <div className="rounded bg-white p-2 border border-emerald-100">
                <span className="text-[10px] text-zinc-500">Receita Airbnb:</span>
                <p className="font-semibold text-zinc-900">{formatCurrency(parsedData.metrics.receita_airbnb)}</p>
              </div>
              <div className="rounded bg-white p-2 border border-emerald-100">
                <span className="text-[10px] text-zinc-500">Líquido Locação:</span>
                <p className="font-semibold text-emerald-700">{formatCurrency(parsedData.metrics.receita_liquida_locacao)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <button
            disabled={!parsedData}
            onClick={handleConfirm}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors ${
              parsedData
                ? "bg-zinc-950 hover:bg-zinc-800 cursor-pointer"
                : "bg-zinc-300 cursor-not-allowed"
            }`}
          >
            Aplicar ao Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
