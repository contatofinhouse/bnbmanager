import { ColumnDef, RowDef, CopanData } from "./types";

export const RAW_AIRBNB_AGO26_CSV = `Data,Disponível por data,Tipo,Código de Confirmação,Data da reserva,Data de início,Data de término,Noites,Hóspede,Anúncio,Informações,Código de referência,Moeda,Valor,Pago,Taxa de serviço,Taxa de pagamento rápido,Taxa de limpeza,Ganhos brutos,Imposto repassado pelo Airbnb,Ganhos do ano
08/31/2026,09/07/2026,Payout,,,,,,,,"Transferir para paulo henrique  fernandes marcondes , Ch 0002 (BRL)",0MS3tugwRJsgjKiAi4XSfQSunW7,BRL,,34.90,,,,,,
08/31/2026,,Taxa de Cancelamento,HMMDDKQH2Y,08/27/2026,10/12/2026,10/13/2026,1,Henrique ,Flat na Riviera com Piscina Climatizada,,,BRL,-258.12,,0.00,,0.00,,0.00,2026
08/31/2026,,Reserva,HMQC8ZC9BW,08/24/2026,08/30/2026,08/31/2026,1,Arlete Arlete,Flat na Riviera com Piscina Climatizada,,,BRL,293.02,,"13,98",,58.00,305.30,0.00,2026
08/26/2026,09/02/2026,Payout,,,,,,,,"Transferir para paulo henrique  fernandes marcondes , Ch 4737 (BRL)",0MS3tv01GnWplK7ldqygEdHjaW8,BRL,,1407.84,,,,,,
08/26/2026,,Reserva,HM432ZTZTS,07/03/2026,08/25/2026,08/31/2026,6,José Carlos Costa Garcia Júnior,"Vem pro Copan, vista e design",,,BRL,1407.84,,"67,16",,150.00,1466.84,0.00,2026
08/22/2026,08/28/2026,Payout,,,,,,,,"Transferir para paulo henrique  fernandes marcondes , Ch 4737 (BRL)",0MS3toQ0Qs13cqP8gyqGC8FNC9U,BRL,,1097.64,,,,,,
08/22/2026,,Reserva,HMTAF85BZB,06/23/2026,08/21/2026,08/25/2026,4,João Penoni,"Vem pro Copan, vista e design",,,BRL,1097.64,,"52,36",,150.00,1143.64,0.00,2026
08/20/2026,08/27/2026,Payout,,,,,,,,"Transferir para paulo henrique  fernandes marcondes , Ch 4737 (BRL)",0MS3tzJCdn1D92PMMzvFPxa0Mf4,BRL,,601.32,,,,,,
08/20/2026,,Reserva,HMBT93S83H,05/05/2026,08/19/2026,08/21/2026,2,Chiara Castillero,"Vem pro Copan, vista e design",,,BRL,601.32,,"28,68",,150.00,626.52,0.00,2026
08/18/2026,08/25/2026,Payout,,,,,,,,"Transferir para paulo henrique  fernandes marcondes , Ch 0002 (BRL)",0MS3tqKV9zy4EHATwxAPPGP4Ap5,BRL,,293.02,,,,,,
08/18/2026,,Reserva,HMPH9EPFSJ,08/13/2026,08/17/2026,08/18/2026,1,Juliana Maria Gomes,Flat na Riviera com Piscina Climatizada,,,BRL,293.02,,"13,98",,58.00,305.30,0.00,2026
08/17/2026,08/24/2026,Payout,,,,,,,,"Transferir para paulo henrique  fernandes marcondes , Ch 0002 (BRL)",0MS3txWB889uiKx6lNT4e0aHyjT,BRL,,227.17,,,,,,
08/17/2026,,Reserva,HMZAZY8AE3,08/16/2026,08/16/2026,08/17/2026,1,Vinicius Vicente,Flat na Riviera com Piscina Climatizada,,,BRL,227.17,,"10,83",,58.00,236.69,0.00,2026
08/15/2026,08/21/2026,Payout,,,,,,,,"Transferir para paulo henrique  fernandes marcondes , Ch 4737 (BRL)",0MS3to5IiNWxu4LNjzyjJbVGjBM,BRL,,1236.04,,,,,,
08/15/2026,,Reserva,HMQT5YR48A,07/10/2026,08/14/2026,08/19/2026,5,Laura Naranjo,"Vem pro Copan, vista e design",,,BRL,1236.04,,"58,96",,150.00,1287.84,0.00,2026
08/11/2026,08/18/2026,Payout,,,,,,,,"Transferir para paulo henrique  fernandes marcondes , Ch 4737 (BRL)",0MS3tq8d3t9VeaqakKhDjfFi6E8,BRL,,448.60,,,,,,
08/11/2026,,Reserva,HM2JJA5F9T,08/10/2026,08/10/2026,08/12/2026,2,Carla Almeida,"Vem pro Copan, vista e design",,,BRL,448.60,,"21,40",,150.00,467.40,0.00,2026
08/11/2026,08/18/2026,Payout,,,,,,,,"Transferir para paulo henrique  fernandes marcondes , Ch 0002 (BRL)",0MS3tyyov85Y814sQuEZSyngtNg0,BRL,,293.02,,,,,,
08/11/2026,,Reserva,HMY8YSBFYX,08/06/2026,08/10/2026,08/11/2026,1,Mateus Assunção,Flat na Riviera com Piscina Climatizada,,,BRL,293.02,,"13,98",,58.00,305.30,0.00,2026
08/09/2026,08/14/2026,Payout,,,,,,,,"Transferir para paulo henrique  fernandes marcondes , Ch 0002 (BRL)",0MS3tyA3g6ygLDDzT6tVaXfhuzW1,BRL,,369.38,,,,,,
08/09/2026,,Reserva,HMDDH2DA2P,08/08/2026,08/08/2026,08/09/2026,1,Julia Park,Flat na Riviera com Piscina Climatizada,,,BRL,369.38,,"17,62",,58.00,384.86,0.00,2026
08/04/2026,08/11/2026,Payout,,,,,,,,"Transferir para paulo henrique  fernandes marcondes , Ch 4737 (BRL)",0MS3tqw1aceCd4TVcOOfIdGiYQ8,BRL,,1596.82,,,,,,
08/04/2026,,Reserva,HMCKRXJJ89,07/11/2026,08/03/2026,08/10/2026,7,Ana Bratkowski,"Vem pro Copan, vista e design",,,BRL,1596.82,,"76,18",,150.00,1663.74,0.00,2026
08/01/2026,08/07/2026,Payout,,,,,,,,"Transferir para paulo henrique  fernandes marcondes , Ch 4737 (BRL)",0MS3txD4zYvaqYMtpFsurFB1P2P,BRL,,856.17,,,,,,
08/01/2026,,Reserva,HM4AWZXXJ3,06/28/2026,07/31/2026,08/03/2026,3,Victor Diniz,"Vem pro Copan, vista e design",,,BRL,856.17,,"40,83",,150.00,892.05,0.00,2026
`;

/**
 * Triggers a download of a CSV file in the browser with UTF-8 BOM.
 */
export function downloadCsvFile(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generates or retrieves the Airbnb base CSV for a specified month.
 */
export function getMonthAirbnbCsv(
  colKey: string,
  data: CopanData,
  uploadedCsvs?: Record<string, string>
): { filename: string; content: string; isOriginal: boolean } {
  // 1. Check if an authentic uploaded CSV exists in session
  if (uploadedCsvs && uploadedCsvs[colKey]) {
    const col = data.columns.find((c) => c.key === colKey);
    const label = col?.label || colKey;
    const cleanLabel = label.replace("/", "_").toLowerCase();
    return {
      filename: `airbnb_${cleanLabel}.csv`,
      content: uploadedCsvs[colKey],
      isOriginal: true,
    };
  }

  // 2. August/2026 is our verified authentic base CSV
  if (colKey === "2026-08") {
    return {
      filename: "airbnb_08_2026-08_2026.csv",
      content: RAW_AIRBNB_AGO26_CSV,
      isOriginal: true,
    };
  }

  // 3. For any other month, generate a realistic Airbnb-compliant CSV based on the DRE data
  const col = data.columns.find((c) => c.key === colKey);
  const year = col?.year || 2026;
  const monthNum = colKey.split("-")[1] || "01";
  const label = col?.label || colKey;
  const cleanLabel = label.replace("/", "_").toLowerCase();

  const getVal = (id: string): number => {
    const row = data.rows.find((r) => r.id === id);
    const val = row?.values[colKey];
    return typeof val === "number" ? val : 0;
  };

  const totalDiarias = getVal("diarias");
  const totalCheckins = getVal("checkins") || Math.max(1, Math.round(totalDiarias / 4));
  const receitaAirbnb = getVal("receita_airbnb");
  const lavanderia = Math.abs(getVal("lavanderia_diarista"));
  const taxaLimpezaPorReserva = totalCheckins > 0 ? Math.round(lavanderia / totalCheckins) : 150;

  // Header line
  const header =
    "Data,Disponível por data,Tipo,Código de Confirmação,Data da reserva,Data de início,Data de término,Noites,Hóspede,Anúncio,Informações,Código de referência,Moeda,Valor,Pago,Taxa de serviço,Taxa de pagamento rápido,Taxa de limpeza,Ganhos brutos,Imposto repassado pelo Airbnb,Ganhos do ano\n";

  let lines = header;

  if (receitaAirbnb <= 0 || totalDiarias <= 0) {
    // Empty template with header
    return {
      filename: `airbnb_${cleanLabel}.csv`,
      content: lines,
      isOriginal: false,
    };
  }

  // Distribute nights and revenue evenly across reservations
  const baseNights = Math.floor(totalDiarias / totalCheckins);
  let remainingNights = totalDiarias % totalCheckins;
  const avgGross = receitaAirbnb / totalCheckins;

  const names = [
    "Carlos Eduardo Silva",
    "Mariana Ferreira",
    "Roberto Albuquerque",
    "Patricia Guimarães",
    "Lucas Mendes",
    "Beatriz Nogueira",
    "Rodrigo Camargo",
    "Fernanda Vasconcelos",
  ];

  let currentDay = 2;
  for (let i = 0; i < totalCheckins; i++) {
    const nights = baseNights + (remainingNights > 0 ? 1 : 0);
    if (remainingNights > 0) remainingNights--;

    const checkinDay = Math.min(28, currentDay);
    const checkoutDay = Math.min(30, checkinDay + nights);
    currentDay = checkoutDay + 1;

    const code = `HM${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const guest = names[i % names.length];
    const listing = '"Vem pro Copan, vista e design"';
    const gross = (i === totalCheckins - 1)
      ? (receitaAirbnb - avgGross * (totalCheckins - 1)).toFixed(2)
      : avgGross.toFixed(2);
    const valorLiquido = (parseFloat(gross) * 0.97).toFixed(2);
    const taxaServico = (parseFloat(gross) * 0.03).toFixed(2).replace(".", ",");
    const dateFormatted = `${monthNum}/${String(checkinDay).padStart(2, "0")}/${year}`;
    const endFormatted = `${monthNum}/${String(checkoutDay).padStart(2, "0")}/${year}`;

    lines += `${dateFormatted},,Reserva,${code},${dateFormatted},${dateFormatted},${endFormatted},${nights},${guest},${listing},,,BRL,${valorLiquido},,"${taxaServico}",,${taxaLimpezaPorReserva.toFixed(2)},${gross},0.00,${year}\n`;
  }

  return {
    filename: `airbnb_${cleanLabel}.csv`,
    content: lines,
    isOriginal: false,
  };
}

/**
 * Generates a DRE financial breakdown CSV for a specified month.
 */
export function getMonthDreCsv(colKey: string, data: CopanData): { filename: string; content: string } {
  const col = data.columns.find((c) => c.key === colKey);
  const label = col?.label || colKey;
  const cleanLabel = label.replace("/", "_").toLowerCase();

  let csv = `Demonstrativo Financeiro e Operacional - Edifício Copan\n`;
  csv += `Mês de Referência:,${label}\n\n`;
  csv += `Métrica / Indicador,Valor\n`;

  for (const row of data.rows) {
    const val = row.values[colKey];
    let formatted = "—";
    if (typeof val === "number") {
      if (row.type === "currency") formatted = `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
      else if (row.type === "percent") formatted = `${(val * 100).toFixed(1)}%`;
      else formatted = String(val);
    } else if (val !== null && val !== undefined) {
      formatted = String(val);
    }
    csv += `"${row.label}","${formatted}"\n`;
  }

  return {
    filename: `DRE_Copan_${cleanLabel}.csv`,
    content: csv,
  };
}
