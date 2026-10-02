"use client";

import React, { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  DollarSign,
  Calendar,
  Building2,
  Tag,
  Loader2,
  Barcode,
} from "lucide-react";
import { ExpenseExtractedItem } from "@/lib/types";
import { PROPERTIES } from "@/lib/properties";
import { formatCurrency } from "@/lib/utils";

interface ExpenseAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePropertyId?: string;
  onExpenseApplied?: () => void;
}

const CATEGORIES = [
  { id: "condominio", label: "Condomínio" },
  { id: "energia_eletrica", label: "Energia Elétrica" },
  { id: "iptu", label: "IPTU" },
  { id: "financiamento", label: "Financiamento Imobiliário" },
  { id: "manutencao", label: "Manutenção / Reposição" },
  { id: "capex", label: "CAPEX / Investimentos" },
  { id: "lavanderia_diarista", label: "Lavanderia / Diarista" },
  { id: "receita_offsite", label: "Receita Offsite (Direta)" },
  { id: "outros", label: "Outras Despesas" },
];

export function ExpenseAnalyzerModal({
  isOpen,
  onClose,
  activePropertyId = "copan",
  onExpenseApplied,
}: ExpenseAnalyzerModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [extractedItem, setExtractedItem] = useState<ExpenseExtractedItem | null>(null);
  const [statementItems, setStatementItems] = useState<ExpenseExtractedItem[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form fields for single item confirmation
  const [selectedProp, setSelectedProp] = useState(activePropertyId);
  const [selectedMonth, setSelectedMonth] = useState("2026-09");
  const [selectedCategory, setSelectedCategory] = useState("condominio");
  const [itemValor, setItemValor] = useState(0);
  const [itemFornecedor, setItemFornecedor] = useState("");
  const [itemDiarias, setItemDiarias] = useState(1);

  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = async (file: File) => {
    setError(null);
    setSuccessMessage(null);
    setFileName(file.name);
    setIsAnalyzing(true);
    setExtractedItem(null);
    setStatementItems([]);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("propertyId", activePropertyId);

    try {
      const res = await fetch("/api/expenses/analyze", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Falha na análise do documento");
      }

      if (json.type === "statement" && json.items) {
        setStatementItems(json.items);
      } else if (json.item) {
        const item: ExpenseExtractedItem = json.item;
        setExtractedItem(item);
        setSelectedProp(item.imovelSugerido || activePropertyId);
        setSelectedMonth(item.mesCompetencia || "2026-08");
        setSelectedCategory(item.categoria || "condominio");
        setItemValor(item.valor || 0);
        setItemFornecedor(item.fornecedor || file.name);
      }
    } catch (err: any) {
      setError(err.message || "Erro ao analisar o arquivo");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplySingle = async () => {
    setIsApplying(true);
    setError(null);
    try {
      const isReceita = selectedCategory === "receita_offsite";
      const res = await fetch("/api/expenses/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedProp,
          monthKey: selectedMonth,
          categoria: selectedCategory,
          valor: itemValor,
          fornecedor: itemFornecedor,
          diarias: isReceita ? itemDiarias : 0,
          tipo: isReceita ? "receita" : "despesa",
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Falha ao gravar na DRE");
      }

      setSuccessMessage(
        `${isReceita ? "Receita" : "Despesa"} de ${formatCurrency(itemValor)} lançada com sucesso em ${selectedMonth} (${selectedCategory})!`
      );
      if (onExpenseApplied) onExpenseApplied();
      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Erro ao aplicar na DRE");
    } finally {
      setIsApplying(false);
    }
  };

  const handleApplyStatementItem = async (item: ExpenseExtractedItem) => {
    try {
      const isReceita = item.categoria === "receita_offsite" || item.tipo === "receita";
      await fetch("/api/expenses/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: item.imovelSugerido || activePropertyId,
          monthKey: item.mesCompetencia || "2026-09",
          categoria: item.categoria || "outros",
          valor: item.valor,
          fornecedor: item.fornecedor,
          data: item.data,
          diarias: isReceita ? (item.diarias !== undefined ? item.diarias : 1) : 0,
          tipo: isReceita ? "receita" : "despesa",
        }),
      });
      setStatementItems((prev) => prev.filter((i) => i !== item));
      if (onExpenseApplied) onExpenseApplied();
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateStatementItem = (idx: number, updates: Partial<ExpenseExtractedItem>) => {
    setStatementItems((prev) =>
      prev.map((item, i) => {
        if (i === idx) {
          const next = { ...item, ...updates };
          if (updates.categoria) {
            next.categoriaLabel = CATEGORIES.find((c) => c.id === updates.categoria)?.label || updates.categoria;
            if (updates.categoria === "receita_offsite") {
              next.tipo = "receita";
              if (next.diarias === undefined) next.diarias = 1;
            } else {
              next.tipo = "despesa";
            }
          }
          return next;
        }
        return item;
      })
    );
  };

  const handleApplyAllStatementItems = async () => {
    setIsApplying(true);
    try {
      for (const item of [...statementItems]) {
        await handleApplyStatementItem(item);
      }
      setSuccessMessage("Todos os lançamentos foram aplicados na DRE!");
      if (onExpenseApplied) onExpenseApplied();
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erro ao aplicar lançamentos em lote");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-700">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-zinc-950">
                Analisador Inteligente de Despesas
              </h3>
              <p className="text-xs text-zinc-500">
                Envie faturas (foto/imagem), boletos em PDF ou extratos para classificação automática
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Dropzone */}
        <div className="mt-5">
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
            className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center transition-all cursor-pointer ${
              dragActive
                ? "border-emerald-600 bg-emerald-50/50"
                : "border-zinc-300 bg-zinc-50/60 hover:bg-zinc-100/60"
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp,.csv,.ofx"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
            <div className="rounded-full bg-white p-3 shadow-xs border border-zinc-200">
              {isAnalyzing ? (
                <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
              ) : (
                <UploadCloud className="h-6 w-6 text-zinc-700" />
              )}
            </div>
            <p className="mt-3 text-xs font-semibold text-zinc-900">
              {isAnalyzing
                ? "Analisando documento com IA e extração local..."
                : "Arraste boleto (PDF), fatura (imagem) ou extrato (CSV)"}
            </p>
            <p className="mt-1 text-[11px] text-zinc-500">
              Suporta Neoenergia, Enel, Boletos de Condomínio, IPTU, Faturas de Cartão e Recibos
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

        {/* Success notification */}
        {successMessage && (
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900 border border-emerald-200">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Extracted Item Confirmation Form */}
        {extractedItem && !successMessage && (
          <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold text-zinc-900">
                  Documento Identificado: {fileName}
                </span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                Confiança: {(extractedItem.confianca * 100).toFixed(0)}%
              </span>
            </div>

            {extractedItem.codigoBarras && (
              <div className="flex items-center gap-2 text-[11px] text-zinc-600 bg-white p-2 rounded border border-zinc-200">
                <Barcode className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                <span className="font-mono truncate">{extractedItem.codigoBarras}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Fornecedor */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Fornecedor / Descrição:
                </label>
                <input
                  type="text"
                  value={itemFornecedor}
                  onChange={(e) => setItemFornecedor(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Valor da Despesa (R$):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={itemValor}
                  onChange={(e) => setItemValor(parseFloat(e.target.value) || 0)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
                />
              </div>

              {/* Categoria DRE */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Classificação na DRE:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Imóvel de Destino */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Imóvel de Destino:
                </label>
                <select
                  value={selectedProp}
                  onChange={(e) => setSelectedProp(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
                >
                  {PROPERTIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mês de Competência */}
              <div>
                <label className="block text-[11px] font-medium text-zinc-600 mb-1">
                  Mês de Competência:
                </label>
                <input
                  type="text"
                  placeholder="YYYY-MM (ex: 2026-08)"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
                />
              </div>

              {/* Diárias (apenas se for Receita Offsite) */}
              {selectedCategory === "receita_offsite" && (
                <div>
                  <label className="block text-[11px] font-medium text-emerald-700 mb-1">
                    Diárias a acrescentar na DRE:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={itemDiarias}
                    onChange={(e) => setItemDiarias(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-md border border-emerald-300 bg-emerald-50/50 px-3 py-1.5 text-xs font-bold text-emerald-950 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
                  />
                  <span className="text-[10px] text-zinc-500">
                    Soma às diárias do mês e recalcula taxa de ocupação
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                disabled={isApplying}
                onClick={handleApplySingle}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-950 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Gravando na DRE...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Confirmar e Lançar na DRE
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Bank Statement Batch View */}
        {statementItems.length > 0 && (
          <div className="mt-5 rounded-lg border border-zinc-200 bg-zinc-50/50 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-200/80 pb-2.5">
              <div>
                <h4 className="text-xs font-semibold text-zinc-900">
                  {statementItems.length} lançamentos identificados no extrato:
                </h4>
                <p className="text-[11px] text-zinc-500">
                  Sócios e rendimentos já foram desconsiderados. Amarílis &lt; R$ 1.300 classificado em Lavanderia.
                </p>
              </div>
              <button
                disabled={isApplying}
                onClick={handleApplyAllStatementItems}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isApplying ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Lançando todos...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Lançar Todos na DRE
                  </>
                )}
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-zinc-200 border border-zinc-200 rounded-md bg-white">
              {statementItems.map((st, idx) => {
                const isReceita = st.categoria === "receita_offsite" || st.tipo === "receita";
                return (
                  <div
                    key={idx}
                    className="p-3 text-xs hover:bg-zinc-50/70 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            isReceita
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isReceita ? "+ Entrada PIX" : "- Despesa"}
                        </span>
                        <span className="font-semibold text-zinc-900 truncate">
                          {st.descricao}
                        </span>
                      </div>
                      <div className="text-[11px] text-zinc-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>{st.data}</span>
                        <span>&bull;</span>
                        <span>Imóvel: <strong>{st.imovelSugerido}</strong></span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Categoria Select */}
                      <select
                        value={st.categoria}
                        onChange={(e) =>
                          handleUpdateStatementItem(idx, { categoria: e.target.value })
                        }
                        className="rounded border border-zinc-300 bg-white px-2 py-1 text-[11px] text-zinc-900 shadow-2xs focus:border-zinc-950 focus:outline-hidden"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.label}
                          </option>
                        ))}
                      </select>

                      {/* If Receita Offsite, show Diárias input */}
                      {isReceita && (
                        <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 rounded px-2 py-0.5">
                          <span className="text-[10px] font-medium text-emerald-800">Diárias:</span>
                          <input
                            type="number"
                            min="0"
                            value={st.diarias !== undefined ? st.diarias : 1}
                            onChange={(e) =>
                              handleUpdateStatementItem(idx, {
                                diarias: parseInt(e.target.value, 10) || 0,
                              })
                            }
                            className="w-10 rounded border border-emerald-300 bg-white px-1 py-0.5 text-center text-[11px] font-bold text-emerald-950"
                            title="Quantas diárias foram para acrescentar na DRE?"
                          />
                        </div>
                      )}

                      <span
                        className={`font-mono font-bold text-xs ${
                          isReceita ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {isReceita ? "+" : "-"}
                        {formatCurrency(st.valor)}
                      </span>

                      <button
                        onClick={() => handleApplyStatementItem(st)}
                        className="rounded bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-zinc-800 cursor-pointer shadow-2xs"
                      >
                        Lançar
                      </button>

                      <button
                        onClick={() =>
                          setStatementItems((prev) => prev.filter((_, i) => i !== idx))
                        }
                        className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-zinc-700 cursor-pointer"
                        title="Desconsiderar / Ignorar lançamento"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="mt-6 flex items-center justify-end gap-3 border-t border-zinc-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
