import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";
import { getPropertyData, savePropertyData, PROPERTIES } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const token = request.cookies.get("bnb_admin_session")?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Não autorizado. Faça login novamente." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { propertyId, monthKey } = body;

    if (!monthKey || !/^\d{4}-\d{2}$/.test(monthKey)) {
      return NextResponse.json({ error: "monthKey inválido. Use formato YYYY-MM." }, { status: 400 });
    }

    // If propertyId is specified, clean only that property. Otherwise clean all.
    const propertyIds = propertyId ? [propertyId] : PROPERTIES.map((p) => p.id);
    const results: Record<string, string> = {};

    for (const pid of propertyIds) {
      const data = await getPropertyData(pid);
      const cloned = JSON.parse(JSON.stringify(data));

      // Check if monthKey column exists
      const colIdx = cloned.columns.findIndex((c: any) => c.key === monthKey);
      if (colIdx === -1) {
        results[pid] = "Mês não encontrado na DRE, nada a limpar.";
        continue;
      }

      // Remove column definition
      cloned.columns.splice(colIdx, 1);

      // Remove values from all rows
      let removedValues = 0;
      for (const row of cloned.rows) {
        if (row.values && monthKey in row.values) {
          delete row.values[monthKey];
          removedValues++;
        }
      }

      // Save cleaned data
      const saveResult = await savePropertyData(pid, cloned);
      results[pid] = `Coluna e ${removedValues} valores removidos. Storage: ${saveResult.storageType}`;
    }

    return NextResponse.json({
      success: true,
      message: `Mês ${monthKey} limpo com sucesso.`,
      details: results,
    });
  } catch (err: any) {
    console.error("Error clearing month:", err);
    return NextResponse.json({ error: `Erro ao limpar: ${err.message}` }, { status: 500 });
  }
}
