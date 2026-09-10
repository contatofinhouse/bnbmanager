import Papa from "papaparse";

export interface ParsedMonthlyResult {
  monthKey: string;
  year: number;
  month: string;
  label: string;
  metrics: {
    dias_no_mes: number;
    ocupacao: number;
    diarias: number;
    checkins: number;
    media_diaria_hospede: number;
    media_diaria_liquido: number;
    receita_airbnb: number;
    lavanderia_diarista: number;
    administracao: number;
    receita_liquida_locacao: number;
  };
  reservas: Array<{
    codigo: string;
    hospede: string;
    inicio: string;
    termino: string;
    noites: number;
    valor: number;
    anuncio: string;
  }>;
}

export function parseAirbnbCsv(csvText: string): ParsedMonthlyResult | null {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = parsed.data as Record<string, string>[];
  if (!rows || rows.length === 0) return null;

  const copanRows: Array<{
    codigo: string;
    hospede: string;
    inicio: string;
    termino: string;
    noites: number;
    valor: number;
    anuncio: string;
  }> = [];

  for (const row of rows) {
    const tipo = (row["Tipo"] || row["\ufeffTipo"] || "").trim();
    const anuncio = (row["Anúncio"] || "").trim();

    if (tipo === "Payout" || !anuncio) continue;

    // Filter only Copan listing
    if (anuncio.toLowerCase().includes("copan")) {
      const valorStr = (row["Valor"] || "0").replace(",", ".");
      const valor = parseFloat(valorStr) || 0;
      const noitesStr = row["Noites"] || "0";
      const noites = parseInt(noitesStr, 10) || 0;

      copanRows.push({
        codigo: row["Código de Confirmação"] || "",
        hospede: row["Hóspede"] || "",
        inicio: row["Data de início"] || "",
        termino: row["Data de término"] || "",
        noites,
        valor,
        anuncio,
      });
    }
  }

  if (copanRows.length === 0) return null;

  // Detect month and year from the first reservation's start date (MM/DD/YYYY)
  const firstDate = copanRows[0].inicio;
  let month = 8;
  let year = 2026;

  if (firstDate && firstDate.includes("/")) {
    const parts = firstDate.split("/");
    if (parts.length === 3) {
      month = parseInt(parts[0], 10) || 8;
      year = parseInt(parts[2], 10) || 2026;
    }
  }

  const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const mIndex = Math.max(0, Math.min(11, month - 1));
  const monthStr = monthNames[mIndex];
  const label = `${monthLabels[mIndex]}/${String(year).slice(-2)}`;
  const monthKey = `${year}-${String(month).padStart(2, "0")}`;

  // Days in month
  const diasNoMes = new Date(year, month, 0).getDate();

  // Metrics
  const checkins = copanRows.length;
  const diarias = copanRows.reduce((acc, r) => acc + r.noites, 0);
  const receitaAirbnb = Math.round(copanRows.reduce((acc, r) => acc + r.valor, 0) * 100) / 100;
  const ocupacao = diarias / diasNoMes;

  // Rules from Excel
  const lavanderiaDiarista = -150 * checkins;
  const administracao = Math.round(-0.1 * receitaAirbnb * 100) / 100;
  const receitaLiquida = Math.round((receitaAirbnb + lavanderiaDiarista + administracao) * 100) / 100;

  // Média diária hóspede = Receita Airbnb / Diárias
  const mediaDiariaHospede = diarias > 0 ? receitaAirbnb / diarias : 0;
  // Média diária líquido = (Receitas + Lavanderia) / Diárias (pré-administração)
  const mediaDiariaLiquido = diarias > 0 ? (receitaAirbnb + lavanderiaDiarista) / diarias : 0;

  return {
    monthKey,
    year,
    month: monthStr,
    label,
    metrics: {
      dias_no_mes: diasNoMes,
      ocupacao,
      diarias,
      checkins,
      media_diaria_hospede: mediaDiariaHospede,
      media_diaria_liquido: mediaDiariaLiquido,
      receita_airbnb: receitaAirbnb,
      lavanderia_diarista: lavanderiaDiarista,
      administracao,
      receita_liquida_locacao: receitaLiquida,
    },
    reservas: copanRows,
  };
}
