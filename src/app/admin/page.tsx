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
} from "lucide-react";
import { parseAirbnbCsv, ParsedMonthlyResult } from "@/lib/csv-parser";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";
import { CopanData } from "@/lib/types";
import { PropertyMeta } from "@/lib/data-store";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Property & Data State
  const [properties, setProperties] = useState<PropertyMeta[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("copan");
  const [currentData, setCurrentData] = useState<CopanData | null>(null);

  // Upload state
  const [dragActive, setDragActive] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedMonthlyResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
        loadPropertyData("copan");
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
        setProperties(json.properties || []);
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
    setParsedResult(null);
  };

  const handleFile = (file: File) => {
    if (!file.name.endsWith(".csv")) {
      setUploadError("Por favor, selecione um arquivo no formato .CSV do Airbnb.");
      return;
    }
    setUploadError(null);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const result = parseAirbnbCsv(text);
        if (!result) {
          setUploadError("Nenhuma reserva correspondente a este imóvel encontrada no arquivo.");
          setParsedResult(null);
        } else {
          setParsedResult(result);
        }
      } catch (err: any) {
        setUploadError(`Erro ao processar arquivo: ${err.message}`);
        setParsedResult(null);
      }
    };
    reader.readAsText(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handlePublish = async () => {
    if (!parsedResult) return;
    setIsPublishing(true);
    setUploadError(null);

    try {
      const res = await fetch("/api/admin/update-month", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedPropertyId,
          parsedResult,
        }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        setNotification(`Mês ${parsedResult.label} publicado com sucesso no Dashboard! (Armazenamento: ${json.storageType})`);
        setParsedResult(null);
        setFileName(null);
        // Reload data
        loadPropertyData(selectedPropertyId);
      } else {
        setUploadError(json.error || "Erro ao publicar mês.");
      }
    } catch (err: any) {
      setUploadError(`Erro na requisição: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  // Loading initial state
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <div className="text-zinc-500 text-xs font-mono animate-pulse">Carregando painel administrativo...</div>
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
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 pl-10 text-sm text-zinc-900 shadow-xs focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
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
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-zinc-950 py-2.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-zinc-800 disabled:opacity-50"
              >
                {isLoggingIn ? "Verificando..." : "Entrar no Painel"}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
              <Link href="/" className="inline-flex items-center gap-1 hover:text-zinc-900 transition-colors">
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

  // Authenticated Admin Dashboard
  const regularCols = currentData?.columns.filter((c) => !c.isTotal) || [];

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-16">
      {/* Admin Navigation Bar */}
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-white font-bold text-sm">
                BM
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-zinc-950">bnbmanager</h1>
                  <span className="rounded bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-700 border border-zinc-200">
                    Admin
                  </span>
                </div>
                <p className="text-xs text-zinc-500 hidden sm:block">Centro de Controle e Importação de Relatórios</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-xs hover:bg-zinc-50 hover:text-zinc-950 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5 text-zinc-500" />
                Ver Dashboard Público
              </Link>

              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 shadow-xs hover:bg-rose-50 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sair
              </button>
            </div>
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
            <button onClick={() => setNotification(null)} className="text-emerald-700 hover:text-emerald-950 font-medium">
              Fechar
            </button>
          </div>
        )}

        {/* Property Selector Strip (Prepared for Multi-Properties) */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-md bg-zinc-100 p-2 text-zinc-800">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                  Propriedade em Gestão
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <select
                    value={selectedPropertyId}
                    onChange={(e) => {
                      setSelectedPropertyId(e.target.value);
                      loadPropertyData(e.target.value);
                    }}
                    className="text-sm font-bold text-zinc-950 bg-transparent border-0 p-0 pr-6 focus:ring-0 cursor-pointer"
                  >
                    <option value="copan">Edifício Copan — Vem pro Copan (São Paulo, SP)</option>
                    <option value="riviera" disabled>
                      Flat Riviera — Riviera de São Lourenço (Em breve)
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Vercel Storage / Local Conectado
              </span>
            </div>
          </div>
        </div>

        {/* CSV Upload Dropzone Section */}
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xs">
          <div className="border-b border-zinc-100 pb-4 mb-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-950 flex items-center gap-2">
              <UploadCloud className="h-4 w-4" />
              Importar Relatório Mensal do Airbnb (.csv)
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              Faça o upload do relatório de pagamentos mensal para calcular a DRE e atualizar instantaneamente o dashboard dos cotistas.
            </p>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
              dragActive ? "border-zinc-900 bg-zinc-50/80 scale-[1.005]" : "border-zinc-200 hover:border-zinc-300 bg-zinc-50/40"
            }`}
          >
            <div className="rounded-full bg-zinc-100 p-3 text-zinc-600 mb-3 shadow-2xs">
              <UploadCloud className="h-6 w-6" />
            </div>
            <p className="text-xs font-semibold text-zinc-900">Arraste o arquivo CSV do Airbnb aqui</p>
            <p className="mt-1 text-[11px] text-zinc-500">ou clique para selecionar do seu computador</p>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 rounded-lg bg-zinc-900 px-4 py-2 text-xs font-medium text-white shadow-xs hover:bg-zinc-800 transition-colors"
            >
              Selecionar Arquivo CSV
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              className="hidden"
            />
          </div>

          {uploadError && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {/* Parsed Preview Card */}
          {parsedResult && (
            <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50/60 p-5 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-zinc-200/60 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-zinc-900">
                    Prévia Calculada: Mês {parsedResult.label} ({parsedResult.year})
                  </span>
                  <span className="text-[11px] font-mono text-zinc-500 bg-white px-2 py-0.5 rounded border border-zinc-200">
                    {fileName}
                  </span>
                </div>
                <button
                  onClick={() => setParsedResult(null)}
                  className="text-xs text-zinc-400 hover:text-zinc-600"
                >
                  Cancelar
                </button>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-lg bg-white p-3 border border-zinc-200/70 shadow-2xs">
                  <span className="text-[11px] text-zinc-500 block">Faturamento Airbnb</span>
                  <span className="text-base font-bold text-zinc-950 tabular-nums">
                    {formatCurrency(parsedResult.metrics.receita_airbnb)}
                  </span>
                </div>

                <div className="rounded-lg bg-white p-3 border border-zinc-200/70 shadow-2xs">
                  <span className="text-[11px] text-zinc-500 block">Líquido Locação</span>
                  <span className="text-base font-bold text-emerald-700 tabular-nums">
                    {formatCurrency(parsedResult.metrics.receita_liquida_locacao)}
                  </span>
                </div>

                <div className="rounded-lg bg-white p-3 border border-zinc-200/70 shadow-2xs">
                  <span className="text-[11px] text-zinc-500 block">Diárias & Ocupação</span>
                  <span className="text-base font-bold text-zinc-950 tabular-nums">
                    {parsedResult.metrics.diarias} noites ({formatPercent(parsedResult.metrics.ocupacao)})
                  </span>
                </div>

                <div className="rounded-lg bg-white p-3 border border-zinc-200/70 shadow-2xs">
                  <span className="text-[11px] text-zinc-500 block">Tarifa Média (ADR)</span>
                  <span className="text-base font-bold text-zinc-950 tabular-nums">
                    {formatCurrency(parsedResult.metrics.media_diaria_hospede)}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  onClick={() => setParsedResult(null)}
                  className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Descartar
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {isPublishing ? "Publicando no Storage..." : "Confirmar e Publicar Mês"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Existing Months Management Table */}
        <div className="rounded-xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
          <div className="border-b border-zinc-200 bg-zinc-50/75 px-5 py-3.5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Meses Operados — Edifício Copan
              </h3>
              <p className="text-xs text-zinc-500">
                Série histórica de meses cadastrados e arquivos base disponíveis
              </p>
            </div>
            <span className="text-xs font-mono text-zinc-400">
              {regularCols.length} meses apurados
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/40 text-zinc-600">
                  <th className="py-3 px-4 font-semibold">Mês / Ano</th>
                  <th className="py-3 px-4 text-right font-semibold">Diárias</th>
                  <th className="py-3 px-4 text-right font-semibold">Ocupação</th>
                  <th className="py-3 px-4 text-right font-semibold">Tarifa Média</th>
                  <th className="py-3 px-4 text-right font-semibold">Receita Airbnb</th>
                  <th className="py-3 px-4 text-right font-semibold">Líquido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {[...regularCols].reverse().map((col) => {
                  const getRow = (id: string) => {
                    const row = currentData?.rows.find((r) => r.id === id);
                    const val = row?.values[col.key];
                    return typeof val === "number" ? val : 0;
                  };

                  const diarias = getRow("diarias");
                  const ocupacao = getRow("ocupacao");
                  const adr = getRow("media_diaria_hospede");
                  const receita = getRow("receita_airbnb");
                  const liquido = getRow("receita_liquida_locacao");

                  return (
                    <tr key={col.key} className="hover:bg-zinc-50/70 transition-colors">
                      <td className="py-3 px-4 font-medium text-zinc-900">
                        {col.label} ({col.year})
                        {col.key === "2026-08" && (
                          <span className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200/60">
                            Mês Atual
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right tabular-nums text-zinc-700">{diarias}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-zinc-700">{formatPercent(ocupacao)}</td>
                      <td className="py-3 px-4 text-right tabular-nums text-zinc-700">{formatCurrency(adr)}</td>
                      <td className="py-3 px-4 text-right tabular-nums font-medium text-zinc-900">{formatCurrency(receita)}</td>
                      <td className="py-3 px-4 text-right tabular-nums font-bold text-emerald-700">{formatCurrency(liquido)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
