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
  let s = String(val).replace(/[BRLR$\s]/g, "").trim();
  if (!s) return 0;

  // Detect format: American (1,234.56) vs Brazilian (1.234,56)
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");

  if (lastDot > lastComma) {
    // American format: dots are decimal, commas are thousands
    s = s.replace(/,/g, "");
  } else if (lastComma > lastDot) {
    // Brazilian format: commas are decimal, dots are thousands
    s = s.replace(/\./g, "").replace(",", ".");
  }

  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

export function parseBookingRaw(
  fileContent: string | Record<string, any>[],
  targetPropertyId: string = "copan",
  targetMonthKey?: string // e.g. "2026-08"
): BookingMonthlySummary | null {
  let rows: Record<string, any>[] = [];

  if (Array.isArray(fileContent)) {
    rows = fileContent;
  } else if (typeof fileContent === "string") {
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
    });
    rows = (parsed.data as Record<string, any>[]) || [];
  }

  if (!rows || rows.length === 0) return null;

  const rawRows: BookingReservation[] = [];

  for (const row of rows) {
    // 1. Filter out cancelled bookings
    const status = (
      row["Estado"] ||
      row["Status"] ||
      row["status"] ||
      row["Situação"] ||
      ""
    ).trim().toLowerCase();

    const dataCancelamento = (
      row["Data de cancelamento"] ||
      row["Cancellation date"] ||
      ""
    ).trim();

    if (
      status.includes("cancel") ||
      status.includes("noshow") ||
      status.includes("no_show") ||
      status.includes("recusad") ||
      status.includes("não comparência") ||
      dataCancelamento !== ""
    ) {
      continue;
    }

    // 2. Filter by property / unit type
    const unidade = (
      row["Tipo de unidade"] ||
      row["Unidade"] ||
      row["Unit type"] ||
      row["Quarto"] ||
      row["Acomodação"] ||
      row["Anúncio"] ||
      ""
    ).trim().toLowerCase();

    if (unidade) {
      if (
        targetPropertyId === "flatincrivel-320" &&
        !(unidade.includes("320") || unidade.includes("estúdio") || unidade.includes("estudio") || unidade.includes("1 quarto"))
      ) {
        continue;
      }
      if (
        targetPropertyId === "flatincrivel-229" &&
        !(unidade.includes("229") || unidade.includes("duplex") || unidade.includes("2 quarto"))
      ) {
        continue;
      }
      if (
        targetPropertyId === "copan" &&
        !unidade.includes("copan")
      ) {
        continue;
      }
    }

    // 3. Dates and month filtering
    const entradaRaw = row["Check-in"] || row["Checkin"] || row["Entrada"] || "";
    const saidaRaw = row["Check-out"] || row["Checkout"] || row["Saída"] || "";

    const parsedEntrada = parseDateStr(entradaRaw);
    const parsedSaida = parseDateStr(saidaRaw);
    if (!parsedEntrada && !parsedSaida) continue;

    if (targetMonthKey) {
      const entradaKey = parsedEntrada ? `${parsedEntrada.year}-${String(parsedEntrada.month).padStart(2, "0")}` : "";
      const saidaKey = parsedSaida ? `${parsedSaida.year}-${String(parsedSaida.month).padStart(2, "0")}` : "";
      if (entradaKey !== targetMonthKey && saidaKey !== targetMonthKey) {
        continue;
      }
    }

    // 4. Calculate nights
    let noites = parseInt(row["Duração (noites)"] || row["Duração"] || row["Noites"] || row["Nights"] || "0", 10);
    if (!noites || noites <= 0) {
      if (parsedEntrada && parsedSaida) {
        const d1 = new Date(parsedEntrada.year, parsedEntrada.month - 1, parsedEntrada.day);
        const d2 = new Date(parsedSaida.year, parsedSaida.month - 1, parsedSaida.day);
        const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        noites = diffDays > 0 ? diffDays : 1;
      } else {
        noites = 1;
      }
    }

    const preco = parseMoney(row["Preço"] || row["Price"] || row["Total"] || "0");
    const comissaoPercent = parseMoney(row["Comissão (%)"] || row["Comissão %"] || row["Commission %"] || "16");
    let comissaoValor = parseMoney(row["Valor da comissão"] || row["Commission Amount"] || "0");

    if (comissaoValor === 0 && preco > 0 && comissaoPercent > 0) {
      comissaoValor = (preco * comissaoPercent) / 100;
    }

    const numero = String(row["Número da reserva"] || row["Book Number"] || row["Reserva"] || "").trim();
    const hospede = String(
      row["Nome do hóspede"] ||
      row["Nome(s) do(s) hóspede(s)"] ||
      row["Guest Name(s)"] ||
      row["Reservado por"] ||
      ""
    ).trim();

    rawRows.push({
      numero,
      hospede,
      entrada: parsedEntrada ? parsedEntrada.formatted : parsedSaida!.formatted,
      saida: parsedSaida ? parsedSaida.formatted : parsedEntrada!.formatted,
      noites,
      status: status || "ok",
      preco: Math.round(preco * 100) / 100,
      comissaoPercent,
      comissaoValor: Math.round(comissaoValor * 100) / 100,
    });
  }

  if (rawRows.length === 0) return null;

  // Deduplicate by reservation number so the same booking is only counted once
  const bookingMap = new Map<string, BookingReservation>();
  let anonIdx = 0;
  for (const item of rawRows) {
    const key = item.numero || `_anon_${anonIdx++}`;
    if (!bookingMap.has(key)) {
      bookingMap.set(key, { ...item });
    } else {
      const existing = bookingMap.get(key)!;
      existing.preco = Math.round((existing.preco + item.preco) * 100) / 100;
      existing.comissaoValor = Math.round((existing.comissaoValor + item.comissaoValor) * 100) / 100;
    }
  }

  const validReservations = Array.from(bookingMap.values());

  const finalMonthKey = targetMonthKey || validReservations[0].saida.slice(0, 7) || validReservations[0].entrada.slice(0, 7);
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
