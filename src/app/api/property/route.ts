import { NextRequest, NextResponse } from "next/server";
import { getPropertyData, PROPERTIES } from "@/lib/data-store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const propertyId = request.nextUrl.searchParams.get("id") || "copan";
  const data = await getPropertyData(propertyId);

  return NextResponse.json(
    {
      data,
      properties: PROPERTIES,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    }
  );
}
