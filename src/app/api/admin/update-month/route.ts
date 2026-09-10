import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { getPropertyData, savePropertyData } from "@/lib/data-store";
import { ParsedMonthlyResult } from "@/lib/csv-parser";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("bnb_admin_session")?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Não autorizado. Faça login novamente." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { propertyId = "copan", parsedResult } = body as {
      propertyId?: string;
      parsedResult: ParsedMonthlyResult;
    };

    if (!parsedResult || !parsedResult.monthKey || !parsedResult.metrics) {
      return NextResponse.json({ error: "Dados do relatório mensal inválidos." }, { status: 400 });
    }

    const currentData = await getPropertyData(propertyId);

    // Clone columns and rows
    const newColumns = [...currentData.columns];
    const newRows = currentData.rows.map((r) => ({ ...r, values: { ...r.values } }));

    // Check if column already exists
    const existingColIndex = newColumns.findIndex((c) => c.key === parsedResult.monthKey);

    if (existingColIndex === -1) {
      newColumns.push({
        key: parsedResult.monthKey,
        year: parsedResult.year,
        month: parsedResult.month,
        label: parsedResult.label,
        col: newColumns.length + 1,
        isTotal: false,
      });
    }

    // Row updates
    const rowUpdates: Record<string, number> = {
      dias_no_mes: parsedResult.metrics.dias_no_mes,
      ocupacao: Math.round(parsedResult.metrics.ocupacao * 10000) / 10000,
      diarias: parsedResult.metrics.diarias,
      checkins: parsedResult.metrics.checkins,
      media_diaria_hospede: Math.round(parsedResult.metrics.media_diaria_hospede * 100) / 100,
      media_diaria_liquido: Math.round(parsedResult.metrics.media_diaria_liquido * 100) / 100,
      receita_airbnb: parsedResult.metrics.receita_airbnb,
      lavanderia_diarista: parsedResult.metrics.lavanderia_diarista,
      administracao: parsedResult.metrics.administracao,
      receita_liquida_locacao: parsedResult.metrics.receita_liquida_locacao,
    };

    for (const row of newRows) {
      if (rowUpdates[row.id] !== undefined) {
        row.values[parsedResult.monthKey] = rowUpdates[row.id];
      }
    }

    const updatedData = {
      ...currentData,
      columns: newColumns,
      rows: newRows,
    };

    const saveResult = await savePropertyData(propertyId, updatedData);

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
