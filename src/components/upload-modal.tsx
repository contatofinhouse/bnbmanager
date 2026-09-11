"use client";

import React, { useState, useRef } from "react";
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Building2, Layers } from "lucide-react";
import { parseAirbnbRaw, AirbnbMonthlySummary } from "@/lib/raw-parsers/airbnb-parser";
import { parseBookingRaw, BookingMonthlySummary } from "@/lib/raw-parsers/booking-parser";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { PROPERTIES } from "@/lib/properties";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePropertyId?: string;
  onApplyRawImport: (
    propertyId: string,
    airbnb?: AirbnbMonthlySummary | null,
    booking?: BookingMonthlySummary | null
  ) => void;
}

export function UploadModal({
  isOpen,
  onClose,
  activePropertyId = "copan",
  onApplyRawImport,
}: UploadModalProps) {
  const [selectedProp, setSelectedProp] = useState(activePropertyId);
  const [targetMonth, setTargetMonth] = useState("2026-08");
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [parsedAirbnb, setParsedAirbnb] = useState<AirbnbMonthlySummary | null>(null);
  const [parsedBooking, setParsedBooking] = useState<BookingMonthlySummary | null>(null);
  const [detectedPlatform, setDetectedPlatform] = useState<"airbnb" | "booking" | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setError(null);
    setFileName(file.name);
    setParsedAirbnb(null);
    setParsedBooking(null);
    setDetectedPlatform(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setError("Arquivo vazio ou ilegível.");
        return;
      }

      const lower = text.toLowerCase();
      // Heuristic detection: Airbnb vs Booking
      if (lower.includes("confirmação") || lower.includes("confirmation") || lower.includes("anúncio") || lower.includes("listing")) {
        // Airbnb
        const res = parseAirbnbRaw(text, selectedProp, targetMonth || undefined);
        if (res && res.reservas.length > 0) {
          setParsedAirbnb(res);
          setDetectedPlatform("airbnb");
          if (!targetMonth) setTargetMonth(res.monthKey);
        } else {
          setError(`Nenhuma reserva encontrada para o imóvel ${selectedProp} no arquivo do Airbnb.`);
        }
      } else if (lower.includes("reserva") || lower.includes("booking") || lower.includes("check-in") || lower.includes("comissão") || lower.includes("commission")) {
        // Booking
        const res = parseBookingRaw(text, selectedProp, targetMonth || undefined);
        if (res && res.reservas.length > 0) {
          setParsedBooking(res);
          setDetectedPlatform("booking");
          if (!targetMonth) setTargetMonth(res.monthKey);
        } else {
          setError(`Nenhuma reserva válida encontrada no arquivo da Booking.com.`);
        }
      } else {
        // Try airbnb fallback then booking fallback
        const airbnbTry = parseAirbnbRaw(text, selectedProp, targetMonth || undefined);
        if (airbnbTry) {
          setParsedAirbnb(airbnbTry);
          setDetectedPlatform("airbnb");
        } else {
          const bookingTry = parseBookingRaw(text, selectedProp, targetMonth || undefined);
          if (bookingTry) {
            setParsedBooking(bookingTry);
            setDetectedPlatform("booking");
          } else {
            setError("Não foi possível identificar o formato como relatório de reservas do Airbnb ou Booking. Verifique o cabeçalho do arquivo CSV.");
          }
        }
      }
    };
    reader.readAsText(file);
  };

  const handleConfirm = () => {
    if (parsedAirbnb || parsedBooking) {
      onApplyRawImport(selectedProp, parsedAirbnb, parsedBooking);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div>
            <h3 className="text-base font-semibold text-zinc-950">
              Importar Relatório Bruto de Reservas (Airbnb / Booking)
            </h3>
            <p className="text-xs text-zinc-500">
              Suba os arquivos crus exportados das plataformas para alimentar o mês selecionado
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="mt-4 grid grid-cols-2 gap-3 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
          <div>
            <label className="block text-[11px] font-medium text-zinc-600 mb-1">
              Imóvel de Destino:
            </label>
            <select
              value={selectedProp}
              onChange={(e) => setSelectedProp(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
            >
              {PROPERTIES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-zinc-600 mb-1">
              Mês de Competência:
            </label>
            <input
              type="text"
              placeholder="YYYY-MM (ex: 2026-08)"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Dropzone */}
        <div className="mt-4">
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
            }}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer ${
              dragActive ? "border-zinc-950 bg-zinc-50" : "border-zinc-300 bg-zinc-50/50 hover:bg-zinc-50"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="rounded-full bg-white p-3 shadow-xs border border-zinc-200">
              <UploadCloud className="h-6 w-6 text-zinc-700" />
            </div>
            <p className="mt-2.5 text-xs font-semibold text-zinc-900">
              Arraste o arquivo CSV bruto aqui ou clique para selecionar
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Suporta relatórios originais de pagamentos do Airbnb e reservas da Booking.com
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-2.5 text-xs text-red-800 border border-red-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Preview Airbnb */}
        {parsedAirbnb && (
          <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3.5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-950">
                  Relatório Airbnb &bull; {parsedAirbnb.label} ({parsedAirbnb.reservas.length} reservas)
                </span>
              </div>
              <span className="text-[11px] text-emerald-800 font-mono truncate max-w-[200px]">
                {fileName}
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-4 gap-2 text-xs">
              <div className="rounded bg-white p-2 border border-emerald-100">
                <span className="text-[10px] text-zinc-500">Diárias:</span>
                <p className="font-semibold text-zinc-900">{parsedAirbnb.diarias} noites</p>
              </div>
              <div className="rounded bg-white p-2 border border-emerald-100">
                <span className="text-[10px] text-zinc-500">Check-ins:</span>
                <p className="font-semibold text-zinc-900">{parsedAirbnb.checkins}</p>
              </div>
              <div className="rounded bg-white p-2 border border-emerald-100">
                <span className="text-[10px] text-zinc-500">Receita Bruta:</span>
                <p className="font-semibold text-zinc-900">{formatCurrency(parsedAirbnb.receitaAirbnb)}</p>
              </div>
              <div className="rounded bg-white p-2 border border-emerald-100">
                <span className="text-[10px] text-zinc-500">Média Diária:</span>
                <p className="font-semibold text-emerald-700">{formatCurrency(parsedAirbnb.mediaDiariaHospede)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Preview Booking */}
        {parsedBooking && (
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50/40 p-3.5 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-blue-200/60 pb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-600" />
                <span className="text-xs font-semibold text-blue-950">
                  Relatório Booking &bull; {parsedBooking.label} ({parsedBooking.reservas.length} reservas)
                </span>
              </div>
              <span className="text-[11px] text-blue-800 font-mono truncate max-w-[200px]">
                {fileName}
              </span>
            </div>

            <div className="mt-2.5 grid grid-cols-4 gap-2 text-xs">
              <div className="rounded bg-white p-2 border border-blue-100">
                <span className="text-[10px] text-zinc-500">Diárias:</span>
                <p className="font-semibold text-zinc-900">{parsedBooking.diarias} noites</p>
              </div>
              <div className="rounded bg-white p-2 border border-blue-100">
                <span className="text-[10px] text-zinc-500">Check-ins:</span>
                <p className="font-semibold text-zinc-900">{parsedBooking.checkins}</p>
              </div>
              <div className="rounded bg-white p-2 border border-blue-100">
                <span className="text-[10px] text-zinc-500">Receita Bruta:</span>
                <p className="font-semibold text-zinc-900">{formatCurrency(parsedBooking.receitaBooking)}</p>
              </div>
              <div className="rounded bg-white p-2 border border-blue-100">
                <span className="text-[10px] text-zinc-500">Comissão Booking:</span>
                <p className="font-semibold text-rose-600">{formatCurrency(parsedBooking.comissaoBooking)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            disabled={!parsedAirbnb && !parsedBooking}
            onClick={handleConfirm}
            className={`rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors ${
              parsedAirbnb || parsedBooking
                ? "bg-zinc-950 hover:bg-zinc-800 cursor-pointer"
                : "bg-zinc-300 cursor-not-allowed"
            }`}
          >
            Consolidar e Aplicar na DRE
          </button>
        </div>
      </div>
    </div>
  );
}
