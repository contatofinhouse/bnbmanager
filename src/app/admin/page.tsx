"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Lock,
  Building2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ExternalLink,
  Download,
  Calendar,
  Layers,
  ArrowLeft,
  FileSpreadsheet,
  Sparkles,
  Receipt,
} from "lucide-react";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { PropertyData } from "@/lib/types";
import { PROPERTIES, PropertyMeta } from "@/lib/properties";
import { UploadModal } from "@/components/upload-modal";
import { ExpenseAnalyzerModal } from "@/components/expense-analyzer-modal";
import { AirbnbMonthlySummary } from "@/lib/raw-parsers/airbnb-parser";
import { BookingMonthlySummary } from "@/lib/raw-parsers/booking-parser";
import { consolidateMonthData, applyConsolidatedToPropertyData } from "@/lib/raw-parsers/consolidator";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Property & Data State
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("copan");
  const [currentData, setCurrentData] = useState<PropertyData | null>(null);

  // Modals state
  const [isRawUploadOpen, setIsRawUploadOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  // Check auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/check");
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        loadPropertyData(selectedPropertyId);
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const loadPropertyData = async (propId: string) => {
    try {
      const res = await fetch(`/api/property?id=${propId}`);
      if (res.ok) {
        const json = await res.json();
        setCurrentData(json.data);
      }
    } catch (err) {
      console.error("Failed to load property data:", err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setIsLoggingIn(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsAuthenticated(true);
        loadPropertyData(selectedPropertyId);
      } else {
        setLoginError(data.error || "Senha incorreta.");
      }
    } catch {
      setLoginError("Erro de conexão ao autenticar.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setIsAuthenticated(false);
    setPassword("");
  };

  // Handler for Raw File import
  const handleApplyRawImport = async (
    propId: string,
    airbnb?: AirbnbMonthlySummary | null,
    booking?: BookingMonthlySummary | null
  ) => {
    const monthKey = airbnb?.monthKey || booking?.monthKey || "2026-08";
    const consolidated = consolidateMonthData(propId, monthKey, airbnb, booking, currentData || undefined);

    try {
      const res = await fetch("/api/admin/update-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: propId,
          parsedResult: consolidated,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setNotification(
          `Relatório de ${consolidated.label} publicado com sucesso para ${propId}! Faturamento bruto: ${formatCurrency(
            consolidated.faturamentoBruto
          )}.`
        );
        loadPropertyData(propId);
      } else {
        alert(json.error || "Erro ao publicar mês.");
      }
    } catch (e: any) {
      alert("Erro na requisição: " + e.message);
    }
  };

  // Loading initial state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="text-zinc-500 text-xs font-mono animate-pulse">
          Carregando painel administrativo...
        </div>
      </div>
    );
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 text-white font-bold text-base shadow-sm mb-3">
            BM
          </div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950">
            bnbmanager — Painel de Gestão
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Acesso exclusivo do gestor para importação e atualização de relatórios
          </p>
        </div>

        <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 sm:p-8 shadow-xs">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 uppercase tracking-wider mb-1.5">
                  Senha Mestre de Administrador
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite a senha mestre..."
                    required
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 pl-10 text-sm text-zinc-900 shadow-xs focus:border-zinc-500 focus:outline-hidden"
                  />
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                </div>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-700 border border-rose-200">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-950 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-zinc-800 disabled:opacity-50 cursor-pointer"
              >
                {isLoggingIn ? "Verificando..." : "Entrar no Painel"}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
              <Link href="/copan" className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors">
                <ArrowLeft className="h-3 w-3" />
                Voltar ao Dashboard Público
              </Link>
              <span className="text-[11px] text-zinc-400">Protegido por cookie httpOnly</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const activeMeta = PROPERTIES.find((p) => p.id === selectedPropertyId) || PROPERTIES[0];

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-16">
      {/* Top Admin Navbar */}
      <header className="border-b border-zinc-200 bg-white sticky top-0 z-30 shadow-2xs">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/${selectedPropertyId}`}
              className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-white font-bold text-sm tracking-wider shadow-xs"
            >
              BM
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-zinc-950">bnbmanager Admin</h1>
                <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-700 border border-zinc-200">
                  Gestor
                </span>
              </div>
              <p className="text-[11px] text-zinc-500 hidden sm:block">
                Administração Multi-Propriedade, Reservas e Despesas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href={`/${selectedPropertyId}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5 text-zinc-400" />
              <span>Ver Site Público</span>
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-2xs hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5 text-zinc-400" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Notification Toast */}
        {notification && (
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-emerald-700 hover:text-emerald-950 font-medium cursor-pointer"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Property Selector & Action Toolbar */}
        <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-zinc-900 p-2 text-white">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Propriedade em Gestão Ativa
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      setSelectedPropertyId(newId);
                      loadPropertyData(newId);
                    }}
                    className="text-base font-bold text-zinc-950 bg-zinc-100 hover:bg-zinc-200/80 rounded-md py-1 px-2.5 border border-zinc-300 focus:outline-hidden cursor-pointer"
                  >
                    {PROPERTIES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center flex-wrap gap-2.5">
              <button
                onClick={() => setIsRawUploadOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <UploadCloud className="h-4 w-4" />
                <span>Importar Reservas (Airbnb / Booking)</span>
              </button>

              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-500 transition-colors cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Analisar Despesas (IA / Boleto / Extrato)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live DRE Preview & Summary for Active Property */}
        {currentData && (
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">
                  DRE Consolidada — {currentData.property.name}
                </h3>
                <p className="text-xs text-zinc-500">
                  Base histórica até Jul/26 carregada &bull; {currentData.columns.length} colunas registradas
                </p>
              </div>
              <span className="text-xs font-mono text-zinc-400 bg-zinc-50 px-2.5 py-1 rounded border border-zinc-200">
                {currentData.property.cotas && currentData.property.cotas > 0
                  ? `${currentData.property.cotas} Cotas / Famílias`
                  : "Sem divisão de cotas"}
              </span>
            </div>

            {/* Quick Table View */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-50/75 text-zinc-600">
                    <th className="py-2.5 pl-4 pr-3 font-semibold text-zinc-900 min-w-[200px]">
                      Linha / Métrica
                    </th>
                    {currentData.columns.slice(-8).map((c) => (
                      <th key={c.key} className="px-3 py-2.5 text-right font-semibold whitespace-nowrap min-w-[90px]">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {currentData.rows.slice(0, 15).map((row) => (
                    <tr
                      key={row.id}
                      className={
                        row.isHighlight
                          ? "bg-emerald-50/60 font-bold text-emerald-950"
                          : "hover:bg-zinc-50/50"
                      }
                    >
                      <td className="py-2 pl-4 pr-3 text-zinc-800 whitespace-nowrap font-medium">
                        {row.label}
                      </td>
                      {currentData.columns.slice(-8).map((c) => {
                        const val = row.values[c.key];
                        return (
                          <td key={c.key} className="px-3 py-2 text-right tabular-nums whitespace-nowrap">
                            {val === null || val === undefined
                              ? "—"
                              : row.type === "currency"
                              ? formatCurrency(val as number)
                              : row.type === "percent"
                              ? formatPercent(val as number)
                              : formatNumber(val as number)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      <UploadModal
        isOpen={isRawUploadOpen}
        onClose={() => setIsRawUploadOpen(false)}
        activePropertyId={selectedPropertyId}
        onApplyRawImport={handleApplyRawImport}
      />

      <ExpenseAnalyzerModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        activePropertyId={selectedPropertyId}
        onExpenseApplied={() => loadPropertyData(selectedPropertyId)}
      />
    </div>
  );
}
