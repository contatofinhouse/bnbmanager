import { NextRequest, NextResponse } from "next/server";
import { getPropertyData, PROPERTIES } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const propertyId = request.nextUrl.searchParams.get("id") || "copan";
  const data = await getPropertyData(propertyId);

  return NextResponse.json({
    data,
    properties: PROPERTIES,
  });
}
