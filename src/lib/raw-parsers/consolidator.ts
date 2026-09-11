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

  const diariasAirbnb = airbnbData?.diarias || 0;
  const diariasBooking = bookingData?.diarias || 0;
  const totalDiarias = diariasAirbnb + diariasBooking;

  const checkinsAirbnb = airbnbData?.checkins || 0;
  const checkinsBooking = bookingData?.checkins || 0;
  const totalCheckins = checkinsAirbnb + checkinsBooking;

  const ocupacao = diasNoMes > 0 ? Math.round((totalDiarias / diasNoMes) * 10000) / 10000 : 0;

  const receitaAirbnb = airbnbData?.receitaAirbnb || 0;
  const receitaBooking = bookingData?.receitaBooking || 0;
  const comissaoBooking = bookingData?.comissaoBooking || 0;

  // Pull existing offsite / pet values if already entered
  let receitaOffsite = 0;
  let diariasPet = 0;
  if (existingData) {
    const offRow = existingData.rows.find((r) => r.id === "receita_offsite");
    if (offRow && typeof offRow.values[monthKey] === "number") {
      receitaOffsite = offRow.values[monthKey] as number;
    }
    const petRow = existingData.rows.find((r) => r.id === "diarias_pet");
    if (petRow && typeof petRow.values[monthKey] === "number") {
      diariasPet = petRow.values[monthKey] as number;
    }
  }

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
    // Flats standard: approx ~R$ 70 to R$ 90 per checkin or maintain previous month benchmark
    lavanderia = totalCheckins > 0 ? -80 * totalCheckins : 0;
  }

  const receitaLiquida =
    Math.round((faturamentoBruto + comissaoBooking + lavanderia + administracao) * 100) / 100;

  const mediaDiariaHospede =
    totalDiarias > 0 ? Math.round((faturamentoBruto / totalDiarias) * 100) / 100 : 0;
  const mediaDiariaLiquido =
    totalDiarias > 0 ? Math.round((receitaLiquida / totalDiarias) * 100) / 100 : 0;

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
