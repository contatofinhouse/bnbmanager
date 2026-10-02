"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  Building2,
  Calendar,
  DollarSign,
  Tag,
  Loader2,
  Sparkles,
  Info,
} from "lucide-react";
import { PROPERTIES } from "@/lib/properties";
import { formatCurrency } from "@/lib/utils";

interface ManualEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePropertyId?: string;
  onEntryApplied?: () => void;
}

const CATEGORY_OPTIONS = [
  { id: "receita_offsite", label: "Receita Off Booking (Locação Direta)", type: "receita", desc: "Entradas diretas fora de plataformas" },
  { id: "diarias_pet", label: "Diárias Pet", type: "receita", desc: "Taxas de animais de estimação" },
  { id: "manutencao", label: "Manutenção / Reposição", type: "despesa", desc: "Reparos, compras, insumos e consertos avulsos" },
  { id: "lavanderia_diarista", label: "Lavanderia / Diarista", type: "despesa", desc: "Lavagens e limpezas avulsas" },
  { id: "condominio", label: "Condomínio", type: "despesa", desc: "Taxa ordinária ou extraordinária" },
  { id: "energia_eletrica", label: "Energia Elétrica", type: "despesa", desc: "Fatura de luz / concessionária" },
  { id: "iptu", label: "IPTU", type: "despesa", desc: "Imposto Predial e Territorial Urbano" },
  { id: "financiamento", label: "Financiamento Imobiliário", type: "despesa", desc: "Parcelas de crédito imobiliário" },
  { id: "capex", label: "CAPEX / Investimentos / Reformas", type: "despesa", desc: "Melhorias duráveis e mobiliário" },
  { id: "administracao", label: "Taxa de Administração", type: "despesa", desc: "Honorários de gestão" },
  { id: "outros", label: "Outras Despesas", type: "despesa", desc: "Lançamentos diversos" },
];

export function ManualEntryModal({
  isOpen,
  onClose,
  activePropertyId = "flatincrivel-229",
  onEntryApplied,
}: ManualEntryModalProps) {
  const [selectedProp, setSelectedProp] = useState(activePropertyId);
  const [selectedMonth, setSelectedMonth] = useState("2026-09");
  const [selectedCategory, setSelectedCategory] = useState("manutencao");
  const [valor, setValor] = useState<string>("");
  const [descricao, setDescricao] = useState("");
  const [diarias, setDiarias] = useState<number>(0);
  const [applyMode, setApplyMode] = useState<"add" | "replace">("add");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (activePropertyId) {
      setSelectedProp(activePropertyId);
    }
  }, [activePropertyId]);

  if (!isOpen) return null;

  const currentCategoryDef = CATEGORY_OPTIONS.find((c) => c.id === selectedCategory) || CATEGORY_OPTIONS[0];
  const isReceita = currentCategoryDef.type === "receita";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const numVal = parseFloat(valor.replace(",", "."));
    if (isNaN(numVal) || numVal <= 0) {
      setError("Por favor, informe um valor monetário positivo válido.");
      return;
    }

    if (!selectedMonth || !/^\d{4}-\d{2}$/.test(selectedMonth.trim())) {
      setError("Mês de competência inválido. Formato esperado: YYYY-MM (ex: 2026-09).");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/expenses/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          propertyId: selectedProp,
          monthKey: selectedMonth.trim(),
          categoria: selectedCategory,
          valor: numVal,
          fornecedor: descricao.trim() || currentCategoryDef.label,
          diarias: isReceita ? diarias : 0,
          tipo: isReceita ? "receita" : "despesa",
          mode: applyMode,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Falha ao gravar lançamento na DRE");
      }

      setSuccessMessage(
        `${isReceita ? "Receita" : "Despesa"} de ${formatCurrency(numVal)} lançada com sucesso em ${selectedMonth} (${currentCategoryDef.label})!`
      );

      if (onEntryApplied) onEntryApplied();

      setTimeout(() => {
        setValor("");
        setDescricao("");
        setDiarias(0);
        setSuccessMessage(null);
        onClose();
      }, 1800);
    } catch (err: any) {
      setError(err.message || "Erro de conexão ao salvar na DRE");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg bg-blue-500/10 p-2 text-blue-700">
              <PlusCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950">
                Lançamento Manual na DRE
              </h3>
              <p className="text-xs text-zinc-500">
                Inclua manutenções, receitas off booking, diárias pet ou despesas avulsas
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Imóvel & Mês */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Imóvel de Destino:
              </label>
              <div className="relative">
                <select
                  value={selectedProp}
                  onChange={(e) => setSelectedProp(e.target.value)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-900 shadow-2xs focus:border-blue-600 focus:outline-hidden"
                >
                  {PROPERTIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.city})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Mês de Competência (YYYY-MM):
              </label>
              <input
                type="text"
                placeholder="2026-09"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-mono font-bold text-zinc-900 shadow-2xs focus:border-blue-600 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Categoria */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
              Classificação / Rubrica da DRE:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                const newCat = e.target.value;
                setSelectedCategory(newCat);
                if (newCat === "receita_offsite" && diarias === 0) {
                  setDiarias(1);
                }
              }}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-900 shadow-2xs focus:border-blue-600 focus:outline-hidden"
            >
              <optgroup label="Entradas / Receitas Operacionais">
                {CATEGORY_OPTIONS.filter((c) => c.type === "receita").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} (+ Receita)
                  </option>
                ))}
              </optgroup>
              <optgroup label="Custos Operacionais & Despesas">
                {CATEGORY_OPTIONS.filter((c) => c.type === "despesa").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} (- Despesa)
                  </option>
                ))}
              </optgroup>
            </select>
            <p className="mt-1 text-[11px] text-zinc-500">
              {currentCategoryDef.desc}
            </p>
          </div>

          {/* Valor & Diárias */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
                Valor (R$):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-zinc-400">
                  R$
                </span>
                <input
                  type="text"
                  placeholder="0,00"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  required
                  className={`w-full rounded-lg border px-3 py-2 pl-9 text-xs font-mono font-bold shadow-2xs focus:outline-hidden ${
                    isReceita
                      ? "border-emerald-300 text-emerald-800 bg-emerald-50/30 focus:border-emerald-600"
                      : "border-zinc-300 text-rose-700 bg-white focus:border-blue-600"
                  }`}
                />
              </div>
            </div>

            {selectedCategory === "receita_offsite" && (
              <div>
                <label className="block text-[11px] font-semibold text-emerald-800 mb-1">
                  Diárias a acrescentar na DRE:
                </label>
                <input
                  type="number"
                  min="0"
                  value={diarias}
                  onChange={(e) => setDiarias(parseInt(e.target.value, 10) || 0)}
                  className="w-full rounded-lg border border-emerald-300 bg-emerald-50/50 px-3 py-2 text-xs font-bold text-emerald-950 shadow-2xs focus:border-emerald-600 focus:outline-hidden"
                />
                <span className="text-[10px] text-zinc-500">
                  Soma ao total de diárias e recalcula taxa de ocupação
                </span>
              </div>
            )}
          </div>

          {/* Descrição / Fornecedor */}
          <div>
            <label className="block text-[11px] font-semibold text-zinc-700 mb-1">
              Descrição / Observação / Fornecedor:
            </label>
            <input
              type="text"
              placeholder="Ex: Hóspede direto 5 noites, Troca resistência chuveiro, Taxa Pet..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 shadow-2xs focus:border-blue-600 focus:outline-hidden"
            />
          </div>

          {/* Modo de Aplicação */}
          <div className="rounded-lg bg-zinc-50 p-3 border border-zinc-200 text-xs">
            <span className="block text-[11px] font-semibold text-zinc-700 mb-1.5">
              Comportamento do Lançamento:
            </span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="applyMode"
                  value="add"
                  checked={applyMode === "add"}
                  onChange={() => setApplyMode("add")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-zinc-800 font-medium">Somar ao valor atual do mês</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="applyMode"
                  value="replace"
                  checked={applyMode === "replace"}
                  onChange={() => setApplyMode("replace")}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <span className="text-zinc-800 font-medium">Substituir valor existente</span>
              </label>
            </div>
          </div>

          {/* Error notification */}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-800 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Success notification */}
          {successMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-900 border border-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 ${
                isReceita
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-zinc-950 hover:bg-zinc-800"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Gravando na DRE...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Gravar na DRE
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
