import React from "react";
import Link from "next/link";
import { Building2 } from "lucide-react";

interface HeaderProps {
  selectedYear: string;
  onSelectYear: (year: string) => void;
}

export function Header({ selectedYear, onSelectYear }: HeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <Link
                href="/admin"
                title="Acesso Administrativo do Gestor"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-white font-bold text-sm tracking-wider hover:bg-zinc-800 transition-colors"
              >
                BM
              </Link>
              <h1 className="text-xl font-semibold tracking-tight text-zinc-950">
                bnbmanager
              </h1>
              <span className="inline-flex items-center rounded-md bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-800 border border-zinc-200">
                Copan
              </span>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
              <Building2 className="h-3.5 w-3.5" />
              Edifício Copan — Vem pro Copan, vista e design (São Paulo, SP)
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            {/* Period Selector Tabs */}
            <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-xs font-medium text-zinc-600">
              <button
                onClick={() => onSelectYear("2025")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  selectedYear === "2025"
                    ? "bg-white text-zinc-950 shadow-sm font-semibold"
                    : "hover:text-zinc-900"
                }`}
              >
                2025
              </button>
              <button
                onClick={() => onSelectYear("2026")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  selectedYear === "2026"
                    ? "bg-white text-zinc-950 shadow-sm font-semibold"
                    : "hover:text-zinc-900"
                }`}
              >
                2026
              </button>
              <button
                onClick={() => onSelectYear("current")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  selectedYear === "current"
                    ? "bg-white text-zinc-950 shadow-sm font-semibold"
                    : "hover:text-zinc-900"
                }`}
              >
                Mês Atual (Ago/26)
              </button>
              <button
                onClick={() => onSelectYear("all")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  selectedYear === "all"
                    ? "bg-white text-zinc-950 shadow-sm font-semibold"
                    : "hover:text-zinc-900"
                }`}
              >
                Todos
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
