import Papa from "papaparse";

export interface BookingReservation {
  numero: string;
  hospede: string;
  entrada: string; // YYYY-MM-DD
  saida: string; // YYYY-MM-DD
  noites: number;
  status: string;
  preco: number;
  comissaoPercent: number;
  comissaoValor: number;
}

export interface BookingMonthlySummary {
  propertyId: string;
  monthKey: string; // "2026-08"
  year: number;
  month: string; // "ago"
  label: string; // "Ago/26"
  diasNoMes: number;
  diarias: number;
  checkins: number;
  receitaBooking: number;
  comissaoBooking: number;
  reservas: BookingReservation[];
}

function parseDateStr(str: string): { year: number; month: number; day: number; formatted: string } | null {
  if (!str) return null;
  const s = str.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.split("-").map((v) => parseInt(v, 10));
    return { year: y, month: m, day: d, formatted: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
  }

  // DD/MM/YYYY
  if (s.includes("/")) {
    const parts = s.split("/").map((v) => parseInt(v, 10));
    if (parts.length === 3) {
      const [d, m, y] = parts;
      return { year: y, month: m, day: d, formatted: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
    }
  }

  return null;
}

function parseMoney(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const s = String(val)
    .replace(/[BRLR$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

export function parseBookingRaw(
  fileContent: string,
  targetPropertyId: string = "copan",
  targetMonthKey?: string // e.g. "2026-08"
): BookingMonthlySummary | null {
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = parsed.data as Record<string, string>[];
  if (!rows || rows.length === 0) return null;

  const validReservations: BookingReservation[] = [];

  for (const row of rows) {
    const status = (row["Status"] || row["status"] || "").trim().toLowerCase();
    if (status.includes("cancel") || status.includes("noshow") || status.includes("no_show")) {
      continue;
    }

    const entradaRaw = row["Entrada"] || row["Check-in"] || row["Checkin"] || "";
    const saidaRaw = row["Saída"] || row["Check-out"] || row["Checkout"] || "";

    const parsedEntrada = parseDateStr(entradaRaw);
    const parsedSaida = parseDateStr(saidaRaw);
    if (!parsedEntrada) continue;

    const rowMonthKey = `${parsedEntrada.year}-${String(parsedEntrada.month).padStart(2, "0")}`;
    if (targetMonthKey && rowMonthKey !== targetMonthKey) continue;

    // Calculate nights
    let noites = 1;
    if (parsedSaida) {
      const d1 = new Date(parsedEntrada.year, parsedEntrada.month - 1, parsedEntrada.day);
      const d2 = new Date(parsedSaida.year, parsedSaida.month - 1, parsedSaida.day);
      const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) noites = diffDays;
    }

    const preco = parseMoney(row["Preço"] || row["Price"] || row["Total"] || "0");
    const comissaoPercent = parseMoney(row["Comissão %"] || row["Commission %"] || "14");
    let comissaoValor = parseMoney(row["Valor da comissão"] || row["Commission Amount"] || "0");

    if (comissaoValor === 0 && preco > 0 && comissaoPercent > 0) {
      comissaoValor = (preco * comissaoPercent) / 100;
    }

    const numero = row["Número da reserva"] || row["Book Number"] || row["Reserva"] || "";
    const hospede = row["Nome(s) do(s) hóspede(s)"] || row["Guest Name(s)"] || row["Reservado por"] || "";

    validReservations.push({
      numero,
      hospede,
      entrada: parsedEntrada.formatted,
      saida: parsedSaida ? parsedSaida.formatted : parsedEntrada.formatted,
      noites,
      status: status || "ok",
      preco: Math.round(preco * 100) / 100,
      comissaoPercent,
      comissaoValor: Math.round(comissaoValor * 100) / 100,
    });
  }

  if (validReservations.length === 0) return null;

  const finalMonthKey = targetMonthKey || validReservations[0].entrada.slice(0, 7);
  const [yearStr, monthStr] = finalMonthKey.split("-");
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const mIndex = Math.max(0, Math.min(11, monthNum - 1));

  const diasNoMes = new Date(year, monthNum, 0).getDate();
  const diarias = validReservations.reduce((acc, r) => acc + r.noites, 0);
  const checkins = validReservations.length;
  const receitaBooking = Math.round(validReservations.reduce((acc, r) => acc + r.preco, 0) * 100) / 100;
  const comissaoBooking = Math.round(validReservations.reduce((acc, r) => acc + r.comissaoValor, 0) * 100) / 100;

  return {
    propertyId: targetPropertyId,
    monthKey: finalMonthKey,
    year,
    month: monthNames[mIndex],
    label: `${monthLabels[mIndex]}/${String(year).slice(-2)}`,
    diasNoMes,
    diarias,
    checkins,
    receitaBooking,
    comissaoBooking: -comissaoBooking, // stored negative as per DRE
    reservas: validReservations,
  };
}
