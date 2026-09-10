import { NextRequest, NextResponse } from "next/server";
import initialDataRaw from "../../../../data/copan.json";
import { CopanData } from "@/lib/types";
import { getMonthAirbnbCsv, getMonthDreCsv } from "@/lib/csv-exporter";
import { getPropertyData } from "@/lib/data-store";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const monthKey = searchParams.get("month") || "2026-08";
  const format = searchParams.get("format") || "airbnb";
  const propertyId = searchParams.get("property") || "copan";

  const copanData = await getPropertyData(propertyId);

  let filename = "";
  let content = "";

  if (format === "dre") {
    const dreInfo = getMonthDreCsv(monthKey, copanData);
    filename = dreInfo.filename;
    content = dreInfo.content;
  } else {
    const airbnbInfo = getMonthAirbnbCsv(monthKey, copanData);
    filename = airbnbInfo.filename;
    content = airbnbInfo.content;
  }

  // Prepend UTF-8 BOM for Microsoft Excel compatibility
  const bomContent = "\uFEFF" + content;

  // Safe ASCII filename to prevent header parsing errors in Edge/Chrome
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");

  return new NextResponse(bomContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safeFilename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Pragma": "no-cache",
    },
  });
}
