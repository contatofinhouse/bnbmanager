import { PropertyData, ColumnDef, RowDef } from "../types";
import { AirbnbMonthlySummary } from "./airbnb-parser";
import { BookingMonthlySummary } from "./booking-parser";

export interface ConsolidatedMonthResult {
  monthKey: string;
  year: number;
  month: string;
  label: string;
  diasNoMes: number;
  diarias: number;
  diariasAirbnb?: number;
  diariasBooking?: number;
  checkins: number;
  checkinsAirbnb?: number;
  checkinsBooking?: number;
  ocupacao: number;
  receitaAirbnb: number;
  receitaBooking: number;
  receitaOffsite: number;
  diariasPet: number;
  comissaoBooking: number;
  faturamentoBruto: number;
  lavanderia: number;
  administracao: number;
  receitaLiquida: number;
  mediaDiariaHospede: number;
  mediaDiariaLiquido: number;
}

export function consolidateMonthData(
  propertyId: string,
  monthKey: string,
  airbnbData?: AirbnbMonthlySummary | null,
  bookingData?: BookingMonthlySummary | null,
  existingData?: PropertyData
): ConsolidatedMonthResult {
  const [yStr, mStr] = monthKey.split("-");
  const year = parseInt(yStr, 10);
  const monthNum = parseInt(mStr, 10);
  const diasNoMes = new Date(year, monthNum, 0).getDate();

  const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
  const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const mIndex = Math.max(0, Math.min(11, monthNum - 1));

  // Helper to read existing values for this month
  const getExisting = (id: string): number => {
    if (!existingData) return 0;
    const r = existingData.rows.find((x) => x.id === id);
    const v = r?.values[monthKey];
    return typeof v === "number" ? v : 0;
  };

  const receitaAirbnb = airbnbData ? airbnbData.receitaAirbnb : getExisting("receita_airbnb");
  const receitaBooking = bookingData ? bookingData.receitaBooking : getExisting("receita_booking");
  const comissaoBooking = bookingData ? bookingData.comissaoBooking : getExisting("comissao_booking");

  // Breakdown storage: read from column metadata if available, otherwise estimate
  const existingCol = existingData?.columns.find((c) => c.key === monthKey);
  const prevDiariasAirbnb = existingCol?.metadata?.diariasAirbnb ?? getExisting("diarias_airbnb");
  const prevDiariasBooking = existingCol?.metadata?.diariasBooking ?? getExisting("diarias_booking");
  const prevCheckinsAirbnb = existingCol?.metadata?.checkinsAirbnb ?? getExisting("checkins_airbnb");
  const prevCheckinsBooking = existingCol?.metadata?.checkinsBooking ?? getExisting("checkins_booking");

  let finalDiariasAirbnb = 0;
  let finalDiariasBooking = 0;
  let finalCheckinsAirbnb = 0;
  let finalCheckinsBooking = 0;

  if (airbnbData && bookingData) {
    // Both uploaded simultaneously
    finalDiariasAirbnb = airbnbData.diarias;
    finalDiariasBooking = bookingData.diarias;
    finalCheckinsAirbnb = airbnbData.checkins;
    finalCheckinsBooking = bookingData.checkins;
  } else if (airbnbData) {
    // Replacing Airbnb data: discard previous airbnb portion, keep booking portion
    finalDiariasAirbnb = airbnbData.diarias;
    finalCheckinsAirbnb = airbnbData.checkins;

    if (prevDiariasBooking > 0) {
      finalDiariasBooking = prevDiariasBooking;
      finalCheckinsBooking = prevCheckinsBooking;
    } else if (getExisting("receita_booking") > 0) {
      // Fallback if imported before explicit breakdown was stored
      finalDiariasBooking = Math.max(0, getExisting("diarias") - prevDiariasAirbnb);
      finalCheckinsBooking = Math.max(0, getExisting("checkins") - prevCheckinsAirbnb);
    }
  } else if (bookingData) {
    // Replacing Booking data: discard previous booking portion, keep airbnb portion
    finalDiariasBooking = bookingData.diarias;
    finalCheckinsBooking = bookingData.checkins;

    if (prevDiariasAirbnb > 0) {
      finalDiariasAirbnb = prevDiariasAirbnb;
      finalCheckinsAirbnb = prevCheckinsAirbnb;
    } else if (getExisting("receita_airbnb") > 0) {
      // Fallback if imported before explicit breakdown was stored
      finalDiariasAirbnb = Math.max(0, getExisting("diarias") - prevDiariasBooking);
      finalCheckinsAirbnb = Math.max(0, getExisting("checkins") - prevCheckinsBooking);
    }
  } else {
    finalDiariasAirbnb = prevDiariasAirbnb;
    finalDiariasBooking = prevDiariasBooking;
    finalCheckinsAirbnb = prevCheckinsAirbnb;
    finalCheckinsBooking = prevCheckinsBooking;
  }

  const totalDiarias = finalDiariasAirbnb + finalDiariasBooking || getExisting("diarias");
  const totalCheckins = finalCheckinsAirbnb + finalCheckinsBooking || getExisting("checkins");

  const ocupacao = diasNoMes > 0 ? Math.round((totalDiarias / diasNoMes) * 10000) / 10000 : 0;

  const receitaOffsite = getExisting("receita_offsite");
  const diariasPet = getExisting("diarias_pet");

  const faturamentoBruto = Math.round((receitaAirbnb + receitaBooking + receitaOffsite + diariasPet) * 100) / 100;

  // Operating costs rules
  let lavanderia = 0;
  let administracao = 0;

  if (propertyId === "copan") {
    // Copan standard: R$ 150 per checkin
    lavanderia = -150 * totalCheckins;
    // Administration: 10% on Airbnb/direct
    administracao = Math.round(-0.1 * receitaAirbnb * 100) / 100;
  } else {
    // Flats standard: lavanderia comes from external expense sheets / provided separately,
    // NOT from Airbnb/Booking revenue reports. Preserve existing if entered via despesas, else 0.
    lavanderia = getExisting("lavanderia_diarista") || 0;
  }

  const receitaLiquida =
    Math.round((faturamentoBruto + comissaoBooking + lavanderia + administracao) * 100) / 100;

  const mediaDiariaHospede =
    totalDiarias > 0 ? Math.round((faturamentoBruto / totalDiarias) * 100) / 100 : 0;

  // For Copan, the historical standard is (Faturamento Bruto + Lavanderia) / Diarias (pré-administração)
  // For other properties, it matches Receita Líquida / Diárias
  const mediaDiariaLiquido =
    totalDiarias > 0
      ? propertyId === "copan"
        ? Math.round(((faturamentoBruto + lavanderia) / totalDiarias) * 100) / 100
        : Math.round((receitaLiquida / totalDiarias) * 100) / 100
      : 0;

  return {
    monthKey,
    year,
    month: monthNames[mIndex],
    label: `${monthLabels[mIndex]}/${String(year).slice(-2)}`,
    diasNoMes,
    diarias: totalDiarias,
    diariasAirbnb: finalDiariasAirbnb,
    diariasBooking: finalDiariasBooking,
    checkins: totalCheckins,
    checkinsAirbnb: finalCheckinsAirbnb,
    checkinsBooking: finalCheckinsBooking,
    ocupacao,
    receitaAirbnb,
    receitaBooking,
    receitaOffsite,
    diariasPet,
    comissaoBooking,
    faturamentoBruto,
    lavanderia,
    administracao,
    receitaLiquida,
    mediaDiariaHospede,
    mediaDiariaLiquido,
  };
}

export function applyConsolidatedToPropertyData(
  propertyData: PropertyData,
  result: ConsolidatedMonthResult
): PropertyData {
  const cloned: PropertyData = JSON.parse(JSON.stringify(propertyData));
  const { monthKey } = result;

  // 1. Ensure column definition exists and save metadata
  const metadata = {
    diariasAirbnb: result.diariasAirbnb,
    diariasBooking: result.diariasBooking,
    checkinsAirbnb: result.checkinsAirbnb,
    checkinsBooking: result.checkinsBooking,
  };

  const existingColIdx = cloned.columns.findIndex((c) => c.key === monthKey);
  if (existingColIdx >= 0) {
    cloned.columns[existingColIdx] = {
      key: monthKey,
      year: result.year,
      month: result.month,
      label: result.label,
      col: cloned.columns[existingColIdx].col,
      isTotal: false,
      metadata,
    };
  } else {
    // Append or insert before totals
    const nextColNum = cloned.columns.length > 0 ? Math.max(...cloned.columns.map((c) => c.col)) + 1 : 1;
    cloned.columns.push({
      key: monthKey,
      year: result.year,
      month: result.month,
      label: result.label,
      col: nextColNum,
      isTotal: false,
      metadata,
    });
  }

  // Remove unwanted internal breakdown rows if they were previously created
  cloned.rows = cloned.rows.filter(
    (r) => !["diarias_airbnb", "diarias_booking", "checkins_airbnb", "checkins_booking"].includes(r.id)
  );

  // 2. Helper to set row value
  const setVal = (rowId: string, val: number | string | null, rowType: "currency" | "int" | "percent" = "currency") => {
    let row = cloned.rows.find((r) => r.id === rowId);
    if (!row) {
      row = {
        id: rowId,
        label: rowId,
        type: rowType,
        values: {},
      };
      cloned.rows.push(row);
    }
    row.values[monthKey] = val;
  };

  setVal("dias_no_mes", result.diasNoMes, "int");
  setVal("ocupacao", result.ocupacao, "percent");
  setVal("diarias", result.diarias, "int");
  setVal("checkins", result.checkins, "int");
  setVal("media_diaria_hospede", result.mediaDiariaHospede, "currency");
  setVal("media_diaria_liquido", result.mediaDiariaLiquido, "currency");
  setVal("receita_booking", result.receitaBooking, "currency");
  setVal("receita_airbnb", result.receitaAirbnb, "currency");
  setVal("receita_offsite", result.receitaOffsite, "currency");
  setVal("diarias_pet", result.diariasPet, "currency");
  setVal("comissao_booking", result.comissaoBooking, "currency");
  setVal("lavanderia_diarista", result.lavanderia, "currency");
  setVal("administracao", result.administracao, "currency");
  setVal("receita_liquida_locacao", result.receitaLiquida, "currency");

  // Recalculate Fixed Expenses & FC Operacional for that month if fixed expenses exist
  const getRowVal = (id: string) => {
    const r = cloned.rows.find((x) => x.id === id);
    const v = r?.values[monthKey];
    return typeof v === "number" ? v : 0;
  };

  const cond = getRowVal("condominio");
  const luz = getRowVal("energia_eletrica");
  const iptu = getRowVal("iptu");
  const fin = getRowVal("financiamento");
  const manut = getRowVal("manutencao");
  const capex = getRowVal("capex");

  const totalFixas = cond + luz + iptu + fin;
  setVal("total_despesas_fixas", Math.round(totalFixas * 100) / 100);

  const fcOperacional = Math.round((result.receitaLiquida + cond + luz + iptu + fin + manut + capex) * 100) / 100;
  setVal("fc_operacional", fcOperacional);

  // If Flat 229 (cotas === 3), update cotas_distribuicao
  if (cloned.property.cotas === 3) {
    const valPorFamilia = Math.round((fcOperacional / 3) * 100) / 100;
    setVal("cotas_distribuicao", valPorFamilia);
  }

  return cloned;
}
