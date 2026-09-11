import { NextRequest, NextResponse } from "next/server";
import {
  analyzePdfDocument,
  analyzeBankStatementText,
  analyzeImageExpense,
} from "@/lib/expense-analyzer";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const propertyId = (formData.get("propertyId") as string) || "copan";

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 });
    }

    const filename = file.name.toLowerCase();
    const mimeType = file.type || "";
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. PDF Documents (Boletos, Contas de consumo, etc.)
    if (filename.endsWith(".pdf") || mimeType === "application/pdf") {
      const extracted = await analyzePdfDocument(buffer, file.name);
      return NextResponse.json({
        success: true,
        type: "pdf",
        item: extracted,
      });
    }

    // 2. Bank Statements (CSV, OFX, TXT)
    if (filename.endsWith(".csv") || filename.endsWith(".ofx") || filename.endsWith(".txt")) {
      const text = buffer.toString("utf-8");
      const items = analyzeBankStatementText(text, propertyId);
      return NextResponse.json({
        success: true,
        type: "statement",
        items,
        count: items.length,
      });
    }

    // 3. Images (JPG, PNG, WEBP, etc.)
    if (
      filename.endsWith(".png") ||
      filename.endsWith(".jpg") ||
      filename.endsWith(".jpeg") ||
      filename.endsWith(".webp") ||
      mimeType.startsWith("image/")
    ) {
      const base64 = buffer.toString("base64");
      const extracted = await analyzeImageExpense(base64, mimeType || "image/jpeg", file.name, propertyId);
      return NextResponse.json({
        success: true,
        type: "image",
        item: extracted,
      });
    }

    return NextResponse.json(
      { error: "Formato de arquivo não suportado. Envie imagens (JPG/PNG), boletos em PDF ou extratos em CSV." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Expense analyze error:", error);
    return NextResponse.json({ error: `Erro na análise: ${error.message}` }, { status: 500 });
  }
}
