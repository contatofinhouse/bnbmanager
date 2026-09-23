"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import initialCopanRaw from "../../../data/copan.json";
import initial320Raw from "../../../data/flatincrivel-320.json";
import initial229Raw from "../../../data/flatincrivel-229.json";
import { PropertyData, ColumnDef } from "@/lib/types";
import { Header } from "@/components/header";
import { SummaryCards } from "@/components/summary-cards";
import { DreTable } from "@/components/dre-table";
import { InstitutionalValuationSection } from "@/components/institutional-valuation-section";
import { CheckCircle2 } from "lucide-react";

export default function PropertyDashboard() {
  const params = useParams();
  const slug = (params?.propertySlug as string) || "copan";

  const getInitialData = (s: string): PropertyData => {
    if (s === "flatincrivel-320" || s === "320") return initial320Raw as unknown as PropertyData;
    if (s === "flatincrivel-229" || s === "229") return initial229Raw as unknown as PropertyData;
    return initialCopanRaw as unknown as PropertyData;
  };

  const [data, setData] = useState<PropertyData>(getInitialData(slug));
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [notification, setNotification] = useState<string | null>(null);

  // Update data if slug changes
  useEffect(() => {
    const init = getInitialData(slug);
    setData(init);
    if (init?.property?.name) {
      document.title = `${init.property.name} — ${init.property.listing} | bnbmanager`;
    }

    fetch(`/api/property?id=${slug}`)
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error("Failed to fetch property data");
      })
      .then((json) => {
        if (json.data && json.data.columns && json.data.rows) {
          setData(json.data);
          if (json.data?.property?.name) {
            document.title = `${json.data.property.name} — ${json.data.property.listing} | bnbmanager`;
          }
        }
      })
      .catch((err) => {
        console.warn("Using local fallback data:", err);
      });
  }, [slug]);

  // Extract all distinct years from regular columns
  const availableYears = Array.from(
    new Set(data.columns.filter((c) => !c.isTotal).map((c) => c.year))
  ).sort((a, b) => a - b);

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
      {/* Top Header with Property Switcher & Filters */}
      <Header
        currentPropertyId={slug}
        selectedYear={selectedYear}
        onSelectYear={setSelectedYear}
        availableYears={availableYears}
        propertyInfo={data.property}
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
              className="text-emerald-700 hover:text-emerald-950 font-medium cursor-pointer"
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

        {/* Institutional Valuation & Return on Investment Section (Metodologia Brookfield / Institutional Real Estate) */}
        {(slug === "flatincrivel-320" || slug === "320") && (
          <InstitutionalValuationSection
            property={data.property}
            columns={filteredColumns}
            rows={data.rows}
            allColumns={data.columns}
          />
        )}
      </main>
    </div>
  );
}
