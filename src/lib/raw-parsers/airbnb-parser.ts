import Papa from "papaparse";

export interface AirbnbReservation {
  codigo: string;
  hospede: string;
  inicio: string; // YYYY-MM-DD
  termino: string; // YYYY-MM-DD
  noites: number;
  valor: number;
  anuncio: string;
}

export interface AirbnbMonthlySummary {
  propertyId: string;
  monthKey: string; // "2026-08"
  year: number;
  month: string; // "ago"
  label: string; // "Ago/26"
  diasNoMes: number;
  diarias: number;
  checkins: number;
  receitaAirbnb: number;
  mediaDiariaHospede: number;
  reservas: AirbnbReservation[];
}

function parseDateStr(str: string): { year: number; month: number; day: number; formatted: string } | null {
  if (!str) return null;
  const s = str.trim();

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const [y, m, d] = s.split("-").map((v) => parseInt(v, 10));
    return { year: y, month: m, day: d, formatted: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
  }

  // DD/MM/YYYY or MM/DD/YYYY
  if (s.includes("/")) {
    const parts = s.split("/").map((v) => parseInt(v, 10));
    if (parts.length === 3) {
      // If first part is > 12, it's definitely DD/MM/YYYY
      if (parts[0] > 12) {
        const [d, m, y] = parts;
        return { year: y, month: m, day: d, formatted: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
      } else {
        // Assume MM/DD/YYYY (standard Airbnb CSV export default)
        const [m, d, y] = parts;
        return { year: y, month: m, day: d, formatted: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}` };
      }
    }
  }

  return null;
}

function parseMoney(val: any): number {
  if (typeof val === "number") return val;
  if (!val) return 0;
  const s = String(val)
    .replace(/[R$\s]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const num = parseFloat(s);
  return isNaN(num) ? 0 : num;
}

export function parseAirbnbRaw(
  fileContent: string,
  targetPropertyId: string = "copan",
  targetMonthKey?: string // e.g. "2026-08"
): AirbnbMonthlySummary | null {
  const parsed = Papa.parse(fileContent, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = parsed.data as Record<string, string>[];
  if (!rows || rows.length === 0) return null;

  const validReservations: AirbnbReservation[] = [];

  for (const row of rows) {
    const tipo = (row["Tipo"] || row["\ufeffTipo"] || row["Type"] || "").trim().toLowerCase();
    const anuncio = (row["Anúncio"] || row["Listing"] || "").trim();

    if (tipo === "payout" || tipo === "repasse" || tipo === "transferência") continue;

    // Filter by property keywords if listing name exists
    if (anuncio) {
      const aLower = anuncio.toLowerCase();
      if (targetPropertyId === "copan" && !aLower.includes("copan")) continue;
      if (targetPropertyId === "flatincrivel-320" && !aLower.includes("320") && !aLower.includes("riviera")) continue;
      if (targetPropertyId === "flatincrivel-229" && !aLower.includes("229") && !aLower.includes("riviera")) continue;
    }

    const inicioRaw = row["Data de início"] || row["Start date"] || row["Entrada"] || "";
    const parsedDate = parseDateStr(inicioRaw);
    if (!parsedDate) continue;

    const rowMonthKey = `${parsedDate.year}-${String(parsedDate.month).padStart(2, "0")}`;
    if (targetMonthKey && rowMonthKey !== targetMonthKey) continue;

    const noites = parseInt(row["Noites"] || row["Nights"] || "0", 10) || 1;
    const valor = parseMoney(row["Valor"] || row["Amount"] || row["Pago"] || "0");
    const codigo = row["Código de Confirmação"] || row["Confirmation code"] || row["Código"] || "";
    const hospede = row["Hóspede"] || row["Guest"] || "";

    validReservations.push({
      codigo,
      hospede,
      inicio: parsedDate.formatted,
      termino: row["Data de término"] || row["End date"] || "",
      noites,
      valor: Math.round(valor * 100) / 100,
      anuncio,
    });
  }

  if (validReservations.length === 0) return null;

  // Determine target month key
  const finalMonthKey = targetMonthKey || validReservations[0].inicio.slice(0, 7);
  const [yearStr, monthStr] = finalMonthKey.split("-");
  const year = parseInt(yearStr, 10);
  const monthNum = parseInt(monthStr, 10);

  const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const mIndex = Math.max(0, Math.min(11, monthNum - 1));

  const diasNoMes = new Date(year, monthNum, 0).getDate();
  const diarias = validReservations.reduce((acc, r) => acc + r.noites, 0);
  const checkins = validReservations.length;
  const receitaAirbnb = Math.round(validReservations.reduce((acc, r) => acc + r.valor, 0) * 100) / 100;
  const mediaDiariaHospede = diarias > 0 ? Math.round((receitaAirbnb / diarias) * 100) / 100 : 0;

  return {
    propertyId: targetPropertyId,
    monthKey: finalMonthKey,
    year,
    month: monthNames[mIndex],
    label: `${monthLabels[mIndex]}/${String(year).slice(-2)}`,
    diasNoMes,
    diarias,
    checkins,
    receitaAirbnb,
    mediaDiariaHospede,
    reservas: validReservations,
  };
}
