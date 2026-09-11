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

    // Expense in DRE is negative
    const expenseVal = -Math.abs(valor);

    // Find row
    let row = cloned.rows.find((r: any) => r.id === categoria);
    if (!row) {
      row = {
        id: categoria,
        label: categoria,
        type: "currency",
        values: {},
      };
      cloned.rows.push(row);
    }

    // Add to current month value (if already exists, sum it)
    const currVal = typeof row.values[monthKey] === "number" ? row.values[monthKey] : 0;
    row.values[monthKey] = Math.round((currVal + expenseVal) * 100) / 100;

    // Recalculate Fixed Expenses & FC Operacional
    const getVal = (id: string) => {
      const r = cloned.rows.find((x: any) => x.id === id);
      const v = r?.values[monthKey];
      return typeof v === "number" ? v : 0;
    };

    const liqLocacao = getVal("receita_liquida_locacao");
    const cond = getVal("condominio");
    const luz = getVal("energia_eletrica");
    const iptu = getVal("iptu");
    const fin = getVal("financiamento");
    const manut = getVal("manutencao");
    const capex = getVal("capex");

    const totalFixas = cond + luz + iptu + fin;
    let fixasRow = cloned.rows.find((r: any) => r.id === "total_despesas_fixas");
    if (!fixasRow) {
      fixasRow = { id: "total_despesas_fixas", label: "Total Despesas Fixas", type: "currency", values: {} };
      cloned.rows.push(fixasRow);
    }
    fixasRow.values[monthKey] = Math.round(totalFixas * 100) / 100;

    const fcOperacional = Math.round((liqLocacao + cond + luz + iptu + fin + manut + capex) * 100) / 100;
    let fcRow = cloned.rows.find((r: any) => r.id === "fc_operacional");
    if (!fcRow) {
      fcRow = { id: "fc_operacional", label: "Resultado Líquido / Caixa", type: "currency", isHighlight: true, values: {} };
      cloned.rows.push(fcRow);
    }
    fcRow.values[monthKey] = fcOperacional;

    // If Flat 229, update cotas_distribuicao
    if (cloned.property.cotas === 3) {
      let cotasRow = cloned.rows.find((r: any) => r.id === "cotas_distribuicao");
      if (!cotasRow) {
        cotasRow = { id: "cotas_distribuicao", label: "Distribuição por Cota / Família (3 Cotas)", type: "currency", isHighlight: true, values: {} };
        cloned.rows.push(cotasRow);
      }
      cotasRow.values[monthKey] = Math.round((fcOperacional / 3) * 100) / 100;
    }

    const saveResult = await savePropertyData(propertyId, cloned);
    return NextResponse.json({ success: true, saveResult, updatedData: cloned });
  } catch (error: any) {
    console.error("Apply expense error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
