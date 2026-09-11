import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { getPropertyData, savePropertyData } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("bnb_admin_session")?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Não autorizado. Faça login novamente." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { propertyId = "copan", parsedResult } = body;

    if (!parsedResult || !parsedResult.monthKey) {
      return NextResponse.json({ error: "Dados do relatório mensal inválidos." }, { status: 400 });
    }

    const currentData = await getPropertyData(propertyId);
    const cloned = JSON.parse(JSON.stringify(currentData));

    // Ensure column exists
    const existingColIndex = cloned.columns.findIndex((c: any) => c.key === parsedResult.monthKey);

    if (existingColIndex === -1) {
      const nextCol = cloned.columns.length > 0 ? Math.max(...cloned.columns.map((c: any) => c.col)) + 1 : 1;
      cloned.columns.push({
        key: parsedResult.monthKey,
        year: parsedResult.year,
        month: parsedResult.month,
        label: parsedResult.label,
        col: nextCol,
        isTotal: false,
      });
    }

    // Helper to set row values
    const setVal = (rowId: string, val: number | string | null) => {
      let row = cloned.rows.find((r: any) => r.id === rowId);
      if (!row) {
        row = { id: rowId, label: rowId, type: typeof val === "number" ? "currency" : "int", values: {} };
        cloned.rows.push(row);
      }
      row.values[parsedResult.monthKey] = val;
    };

    if (parsedResult.metrics) {
      const m = parsedResult.metrics;
      if (m.dias_no_mes !== undefined) setVal("dias_no_mes", m.dias_no_mes);
      if (m.ocupacao !== undefined) setVal("ocupacao", Math.round(m.ocupacao * 10000) / 10000);
      if (m.diarias !== undefined) setVal("diarias", m.diarias);
      if (m.checkins !== undefined) setVal("checkins", m.checkins);
      if (m.media_diaria_hospede !== undefined) setVal("media_diaria_hospede", Math.round(m.media_diaria_hospede * 100) / 100);
      if (m.media_diaria_liquido !== undefined) setVal("media_diaria_liquido", Math.round(m.media_diaria_liquido * 100) / 100);
      if (m.receita_airbnb !== undefined) setVal("receita_airbnb", m.receita_airbnb);
      if (m.receita_booking !== undefined) setVal("receita_booking", m.receita_booking);
      if (m.receita_offsite !== undefined) setVal("receita_offsite", m.receita_offsite);
      if (m.diarias_pet !== undefined) setVal("diarias_pet", m.diarias_pet);
      if (m.comissao_booking !== undefined) setVal("comissao_booking", m.comissao_booking);
      if (m.lavanderia_diarista !== undefined) setVal("lavanderia_diarista", m.lavanderia_diarista);
      if (m.administracao !== undefined) setVal("administracao", m.administracao);
      if (m.receita_liquida_locacao !== undefined) setVal("receita_liquida_locacao", m.receita_liquida_locacao);
    } else {
      // Direct consolidated result format
      if (parsedResult.diasNoMes !== undefined) setVal("dias_no_mes", parsedResult.diasNoMes);
      if (parsedResult.ocupacao !== undefined) setVal("ocupacao", parsedResult.ocupacao);
      if (parsedResult.diarias !== undefined) setVal("diarias", parsedResult.diarias);
      if (parsedResult.checkins !== undefined) setVal("checkins", parsedResult.checkins);
      if (parsedResult.mediaDiariaHospede !== undefined) setVal("media_diaria_hospede", parsedResult.mediaDiariaHospede);
      if (parsedResult.mediaDiariaLiquido !== undefined) setVal("media_diaria_liquido", parsedResult.mediaDiariaLiquido);
      if (parsedResult.receitaAirbnb !== undefined) setVal("receita_airbnb", parsedResult.receitaAirbnb);
      if (parsedResult.receitaBooking !== undefined) setVal("receita_booking", parsedResult.receitaBooking);
      if (parsedResult.receitaOffsite !== undefined) setVal("receita_offsite", parsedResult.receitaOffsite);
      if (parsedResult.diariasPet !== undefined) setVal("diarias_pet", parsedResult.diariasPet);
      if (parsedResult.comissaoBooking !== undefined) setVal("comissao_booking", parsedResult.comissaoBooking);
      if (parsedResult.lavanderia !== undefined) setVal("lavanderia_diarista", parsedResult.lavanderia);
      if (parsedResult.administracao !== undefined) setVal("administracao", parsedResult.administracao);
      if (parsedResult.receitaLiquida !== undefined) setVal("receita_liquida_locacao", parsedResult.receitaLiquida);
    }

    // Recalculate Fixed & FC Operacional
    const getRowV = (id: string) => {
      const r = cloned.rows.find((x: any) => x.id === id);
      const v = r?.values[parsedResult.monthKey];
      return typeof v === "number" ? v : 0;
    };

    const liqLoc = getRowV("receita_liquida_locacao");
    const cond = getRowV("condominio");
    const luz = getRowV("energia_eletrica");
    const iptu = getRowV("iptu");
    const fin = getRowV("financiamento");
    const manut = getRowV("manutencao");
    const capex = getRowV("capex");

    const totalFixas = cond + luz + iptu + fin;
    setVal("total_despesas_fixas", Math.round(totalFixas * 100) / 100);

    const fcOperacional = Math.round((liqLoc + cond + luz + iptu + fin + manut + capex) * 100) / 100;
    setVal("fc_operacional", fcOperacional);

    // If Flat 229, update cotas_distribuicao
    if (cloned.property.cotas === 3) {
      setVal("cotas_distribuicao", Math.round((fcOperacional / 3) * 100) / 100);
    }

    const saveResult = await savePropertyData(propertyId, cloned);

    return NextResponse.json({
      success: true,
      message: `Mês ${parsedResult.label} publicado com sucesso!`,
      storageType: saveResult.storageType,
    });
  } catch (err: any) {
    console.error("Error updating month:", err);
    return NextResponse.json({ error: `Erro ao salvar: ${err.message}` }, { status: 500 });
  }
}
