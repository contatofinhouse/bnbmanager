import { NextRequest, NextResponse } from "next/server";
import { getPropertyData, savePropertyData } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, monthKey, categoria, valor } = body;

    if (!propertyId || !monthKey || !categoria || typeof valor !== "number") {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const currentData = await getPropertyData(propertyId);
    const cloned = JSON.parse(JSON.stringify(currentData));

    // Ensure month column exists
    const colExists = cloned.columns.some((c: any) => c.key === monthKey);
    if (!colExists) {
      const [y, m] = monthKey.split("-");
      const monthNames = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];
      const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      const mIdx = parseInt(m, 10) - 1;
      const nextCol = cloned.columns.length > 0 ? Math.max(...cloned.columns.map((c: any) => c.col)) + 1 : 1;
      cloned.columns.push({
        key: monthKey,
        year: parseInt(y, 10),
        month: monthNames[mIdx],
        label: `${monthLabels[mIdx]}/${y.slice(-2)}`,
        col: nextCol,
        isTotal: false,
      });
    }

    const isReceita = categoria === "receita_offsite" || categoria === "diarias_pet" || body.tipo === "receita";
    const deltaVal = isReceita ? Math.abs(valor) : -Math.abs(valor);
    const isReplace = body.mode === "replace";
    const additionalDiarias = typeof body.diarias === "number" ? Math.max(0, body.diarias) : 0;
    const itemData = body.data || null;

    // Helper to get row value
    const getVal = (id: string): number => {
      const r = cloned.rows.find((x: any) => x.id === id);
      const v = r?.values[monthKey];
      return typeof v === "number" ? v : 0;
    };

    // Helper to set row value
    const setVal = (id: string, val: number | string | null, type: "currency" | "int" | "percent" = "currency", isHighlight = false) => {
      let r = cloned.rows.find((x: any) => x.id === id);
      if (!r) {
        r = { id, label: id, type, isHighlight, values: {} };
        cloned.rows.push(r);
      }
      r.values[monthKey] = val;
    };

    // 1. Update target category
    const currCatVal = getVal(categoria);
    const finalVal = isReplace ? deltaVal : Math.round((currCatVal + deltaVal) * 100) / 100;
    setVal(categoria, finalVal);

    // 2. If it's offsite revenue, handle additional diarias and offsite record array
    if (categoria === "receita_offsite") {
      if (!cloned.offsite) cloned.offsite = [];
      cloned.offsite.push({
        checkin: itemData,
        checkout: null,
        receita_bruta: Math.abs(valor),
        lavanderia: 0,
      });

      if (additionalDiarias > 0) {
        const currDiarias = getVal("diarias");
        const newDiarias = isReplace ? additionalDiarias : currDiarias + additionalDiarias;
        setVal("diarias", newDiarias, "int");

        const diasNoMes = getVal("dias_no_mes") || 30;
        if (diasNoMes > 0) {
          const newOcupacao = Math.round((newDiarias / diasNoMes) * 10000) / 10000;
          setVal("ocupacao", newOcupacao, "percent");
        }
      }
    }

    // Recalculate operational revenue & net metrics if any operational row changed
    const operationalIds = ["receita_airbnb", "receita_booking", "receita_offsite", "diarias_pet", "comissao_booking", "lavanderia_diarista", "administracao", "devolucao_cliente"];
    if (operationalIds.includes(categoria) || isReceita) {
      const rAirbnb = getVal("receita_airbnb");
      const rBooking = getVal("receita_booking");
      const rOffsite = getVal("receita_offsite");
      const rPet = getVal("diarias_pet");
      const devolucao = getVal("devolucao_cliente");
      const cBooking = getVal("comissao_booking");
      const lavanderia = getVal("lavanderia_diarista");
      const adm = getVal("administracao");

      const faturamentoBruto = Math.round((rAirbnb + rBooking + rOffsite + rPet + devolucao) * 100) / 100;
      const rLiquida = Math.round((faturamentoBruto + cBooking + lavanderia + adm) * 100) / 100;
      setVal("receita_liquida_locacao", rLiquida);

      const totalDiarias = getVal("diarias");
      if (totalDiarias > 0) {
        setVal("media_diaria_hospede", Math.round((faturamentoBruto / totalDiarias) * 100) / 100);
        const medLiq = propertyId === "copan"
          ? Math.round(((faturamentoBruto + lavanderia) / totalDiarias) * 100) / 100
          : Math.round((rLiquida / totalDiarias) * 100) / 100;
        setVal("media_diaria_liquido", medLiq);
      }
    }

    // 3. Recalculate Fixed Expenses & FC Operacional
    const liqLocacao = getVal("receita_liquida_locacao");
    const cond = getVal("condominio");
    const luz = getVal("energia_eletrica");
    const iptu = getVal("iptu");
    const fin = getVal("financiamento");
    const manut = getVal("manutencao");
    const capex = getVal("capex");

    const totalFixas = Math.round((cond + luz + iptu + fin) * 100) / 100;
    setVal("total_despesas_fixas", totalFixas);

    const fcOperacional = Math.round((liqLocacao + cond + luz + iptu + fin + manut + capex) * 100) / 100;
    setVal("fc_operacional", fcOperacional, "currency", true);

    // If row saldo_conta exists, keep it in sync
    const saldoRow = cloned.rows.find((r: any) => r.id === "saldo_conta");
    if (saldoRow) {
      const regCols = cloned.columns.filter((c: any) => !c.isTotal);
      const currIdx = regCols.findIndex((c: any) => c.key === monthKey);
      if (currIdx > 0) {
        const prevColKey = regCols[currIdx - 1].key;
        const prevSaldo = typeof saldoRow.values[prevColKey] === "number" ? saldoRow.values[prevColKey] : 0;
        saldoRow.values[monthKey] = Math.round((prevSaldo + fcOperacional) * 100) / 100;
      }
    }

    // If Flat 229, update cotas_distribuicao
    if (cloned.property.cotas === 3) {
      setVal("cotas_distribuicao", Math.round((fcOperacional / 3) * 100) / 100, "currency", true);
    }

    const saveResult = await savePropertyData(propertyId, cloned);
    return NextResponse.json({ success: true, saveResult, updatedData: cloned });
  } catch (error: any) {
    console.error("Apply expense error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
