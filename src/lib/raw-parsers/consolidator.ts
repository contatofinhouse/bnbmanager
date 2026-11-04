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
  checkins: number;
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

  // Sum diarias and checkins preserving the other platform if already imported
  // When importing Airbnb alone, if Booking was already recorded, keep the Booking portion
  // When importing Booking alone, if Airbnb was already recorded, keep the Airbnb portion
  let totalDiarias = 0;
  if (airbnbData && bookingData) {
    totalDiarias = airbnbData.diarias + bookingData.diarias;
  } else if (airbnbData) {
    // If Booking already had revenue in this month, add the existing diarias (which belonged to booking)
    // If Airbnb was never present before, existing diarias belonged entirely to Booking.
    const prevAirbnbRevenue = getExisting("receita_airbnb");
    const prevBookingRevenue = getExisting("receita_booking");
    const existingDiarias = getExisting("diarias");

    if (prevBookingRevenue > 0 && prevAirbnbRevenue <= 0) {
      // First time importing Airbnb after Booking: sum Airbnb + Booking
      totalDiarias = airbnbData.diarias + existingDiarias;
    } else if (prevBookingRevenue > 0 && prevAirbnbRevenue > 0) {
      // Updating an already consolidated month: estimate booking portion by ratio or keep delta
      const estBookingDiarias = Math.max(0, Math.round(existingDiarias * (prevBookingRevenue / (prevBookingRevenue + prevAirbnbRevenue))));
      totalDiarias = airbnbData.diarias + estBookingDiarias;
    } else {
      totalDiarias = airbnbData.diarias;
    }
  } else if (bookingData) {
    const prevAirbnbRevenue = getExisting("receita_airbnb");
    const prevBookingRevenue = getExisting("receita_booking");
    const existingDiarias = getExisting("diarias");

    if (prevAirbnbRevenue > 0 && prevBookingRevenue <= 0) {
      // First time importing Booking after Airbnb: sum Booking + Airbnb
      totalDiarias = bookingData.diarias + existingDiarias;
    } else if (prevAirbnbRevenue > 0 && prevBookingRevenue > 0) {
      const estAirbnbDiarias = Math.max(0, Math.round(existingDiarias * (prevAirbnbRevenue / (prevBookingRevenue + prevAirbnbRevenue))));
      totalDiarias = bookingData.diarias + estAirbnbDiarias;
    } else {
      totalDiarias = bookingData.diarias;
    }
  } else {
    totalDiarias = getExisting("diarias");
  }

  let totalCheckins = 0;
  if (airbnbData && bookingData) {
    totalCheckins = airbnbData.checkins + bookingData.checkins;
  } else if (airbnbData) {
    const prevAirbnbRevenue = getExisting("receita_airbnb");
    const prevBookingRevenue = getExisting("receita_booking");
    const existingCheckins = getExisting("checkins");

    if (prevBookingRevenue > 0 && prevAirbnbRevenue <= 0) {
      totalCheckins = airbnbData.checkins + existingCheckins;
    } else if (prevBookingRevenue > 0 && prevAirbnbRevenue > 0) {
      const estBookingCheckins = Math.max(0, Math.round(existingCheckins * (prevBookingRevenue / (prevBookingRevenue + prevAirbnbRevenue))));
      totalCheckins = airbnbData.checkins + estBookingCheckins;
    } else {
      totalCheckins = airbnbData.checkins;
    }
  } else if (bookingData) {
    const prevAirbnbRevenue = getExisting("receita_airbnb");
    const prevBookingRevenue = getExisting("receita_booking");
    const existingCheckins = getExisting("checkins");

    if (prevAirbnbRevenue > 0 && prevBookingRevenue <= 0) {
      totalCheckins = bookingData.checkins + existingCheckins;
    } else if (prevAirbnbRevenue > 0 && prevBookingRevenue > 0) {
      const estAirbnbCheckins = Math.max(0, Math.round(existingCheckins * (prevAirbnbRevenue / (prevBookingRevenue + prevAirbnbRevenue))));
      totalCheckins = bookingData.checkins + estAirbnbCheckins;
    } else {
      totalCheckins = bookingData.checkins;
    }
  } else {
    totalCheckins = getExisting("checkins");
  }

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
    checkins: totalCheckins,
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

  // 1. Ensure column definition exists
  const existingColIdx = cloned.columns.findIndex((c) => c.key === monthKey);
  if (existingColIdx >= 0) {
    cloned.columns[existingColIdx] = {
      key: monthKey,
      year: result.year,
      month: result.month,
      label: result.label,
      col: cloned.columns[existingColIdx].col,
      isTotal: false,
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
    });
  }

  // 2. Helper to set row value
  const setVal = (rowId: string, val: number | string | null) => {
    let row = cloned.rows.find((r) => r.id === rowId);
    if (!row) {
      row = {
        id: rowId,
        label: rowId,
        type: typeof val === "number" ? "currency" : "int",
        values: {},
      };
      cloned.rows.push(row);
    }
    row.values[monthKey] = val;
  };

  setVal("dias_no_mes", result.diasNoMes);
  setVal("ocupacao", result.ocupacao);
  setVal("diarias", result.diarias);
  setVal("checkins", result.checkins);
  setVal("media_diaria_hospede", result.mediaDiariaHospede);
  setVal("media_diaria_liquido", result.mediaDiariaLiquido);
  setVal("receita_booking", result.receitaBooking);
  setVal("receita_airbnb", result.receitaAirbnb);
  setVal("receita_offsite", result.receitaOffsite);
  setVal("diarias_pet", result.diariasPet);
  setVal("comissao_booking", result.comissaoBooking);
  setVal("lavanderia_diarista", result.lavanderia);
  setVal("administracao", result.administracao);
  setVal("receita_liquida_locacao", result.receitaLiquida);

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
