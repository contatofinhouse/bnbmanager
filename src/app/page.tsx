"use client";

import React, { useState, useEffect } from "react";
import initialDataRaw from "../../data/copan.json";
import { CopanData, ColumnDef } from "@/lib/types";
import { Header } from "@/components/header";
import { SummaryCards } from "@/components/summary-cards";
import { DreTable } from "@/components/dre-table";
import { CheckCircle2 } from "lucide-react";

export default function Home() {
  const [data, setData] = useState<CopanData>(initialDataRaw as unknown as CopanData);
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [notification, setNotification] = useState<string | null>(null);

  // Dynamically load latest property data from Vercel Storage / local API
  useEffect(() => {
    fetch("/api/property?id=copan")
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch property data");
      })
      .then((json) => {
        if (json.data && json.data.columns && json.data.rows) {
          setData(json.data);
        }
      })
      .catch((err) => {
        console.warn("Using local fallback data:", err);
      });
  }, []);

  // Filter columns according to selected year / period
  const filteredColumns: ColumnDef[] = data.columns.filter((col) => {
    if (selectedYear === "all") return true;
    if (selectedYear === "current") {
      const regularCols = data.columns.filter((c) => !c.isTotal);
      const latest = regularCols[regularCols.length - 1];
      return col.key === latest?.key;
    }
    return String(col.year) === selectedYear;
  });

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-16">
      {/* Top Header - 100% Clean & Public for Cotistas */}
      <Header
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Notification banner */}
        {notification && (
          <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-900 shadow-xs animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-emerald-700 hover:text-emerald-950 font-medium"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Summary Metric Cards */}
        <SummaryCards
          columns={filteredColumns}
          rows={data.rows}
          allColumns={data.columns}
          selectedPeriod={selectedYear}
        />

        {/* Main DRE Table */}
        <DreTable
          columns={filteredColumns}
          rows={data.rows}
          allColumns={data.columns}
        />
      </main>
    </div>
  );
}
