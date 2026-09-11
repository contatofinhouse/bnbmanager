"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Building2, ChevronDown, Check, Sparkles } from "lucide-react";
import { PROPERTIES, PropertyMeta } from "@/lib/properties";

interface HeaderProps {
  currentPropertyId?: string;
  selectedYear: string;
  onSelectYear: (year: string) => void;
  availableYears?: number[];
  propertyInfo?: {
    name: string;
    listing: string;
    city: string;
    cotas?: number;
  };
}

export function Header({
  currentPropertyId = "copan",
  selectedYear,
  onSelectYear,
  availableYears = [2024, 2025, 2026],
  propertyInfo,
}: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const activeProperty =
    PROPERTIES.find((p) => p.slug === currentPropertyId || p.id === currentPropertyId) || PROPERTIES[0];

  const displayName = propertyInfo?.name || activeProperty.name;
  const displayListing = propertyInfo?.listing || activeProperty.listing;
  const displayCity = propertyInfo?.city || activeProperty.city;
  const displayCotas = propertyInfo?.cotas ?? activeProperty.cotas;

  return (
    <header className="border-b border-zinc-200 bg-white sticky top-0 z-30 shadow-2xs">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Property Title */}
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin"
                title="Acesso Administrativo do Gestor"
                className="flex h-8 w-8 items-center justify-center rounded-md bg-zinc-900 text-white font-bold text-sm tracking-wider hover:bg-zinc-800 transition-colors shadow-xs"
              >
                BM
              </Link>
              <h1 className="text-xl font-bold tracking-tight text-zinc-950">
                bnbmanager
              </h1>

              {displayCotas && displayCotas > 0 ? (
                <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200/80">
                  {displayCotas} Cotistas
                </span>
              ) : null}
            </div>

            <p className="mt-1 flex items-center gap-1.5 text-xs sm:text-sm text-zinc-500">
              <Building2 className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
              <span>
                <strong className="text-zinc-700 font-semibold">{displayName}</strong> — {displayListing} ({displayCity})
              </span>
            </p>
          </div>

          {/* Controls: Periods Selector */}
          <div className="flex items-center flex-wrap gap-2.5">
            <div className="flex items-center rounded-lg border border-zinc-200 bg-zinc-50 p-1 text-xs font-medium text-zinc-600">
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => onSelectYear(String(yr))}
                  className={`rounded-md px-3 py-1.5 transition-colors ${
                    selectedYear === String(yr)
                      ? "bg-white text-zinc-950 shadow-xs font-semibold"
                      : "hover:text-zinc-900"
                  }`}
                >
                  {yr}
                </button>
              ))}

              <button
                onClick={() => onSelectYear("current")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  selectedYear === "current"
                    ? "bg-white text-zinc-950 shadow-xs font-semibold"
                    : "hover:text-zinc-900"
                }`}
              >
                Mês Atual
              </button>

              <button
                onClick={() => onSelectYear("all")}
                className={`rounded-md px-3 py-1.5 transition-colors ${
                  selectedYear === "all"
                    ? "bg-white text-zinc-950 shadow-xs font-semibold"
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
