import { NextRequest, NextResponse } from "next/server";
import { getPropertyData } from "@/lib/data-store";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const hasKv = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
  const hasBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  let kvError: string | null = null;
  let blobError: string | null = null;
  let kvKeys: any = null;
  let blobFiles: any = null;

  if (hasKv) {
    try {
      const { kv } = await import("@vercel/kv");
      kvKeys = await kv.keys("*");
    } catch (e: any) {
      kvError = e.message;
    }
  }

  if (hasBlob) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list();
      blobFiles = blobs.map((b) => ({ pathname: b.pathname, url: b.url }));
    } catch (e: any) {
      blobError = e.message;
    }
  }

  const copanData = await getPropertyData("copan");
  const columnKeys = copanData.columns.map((c) => c.key);

  return NextResponse.json({
    env: {
      hasKv,
      hasBlob,
      nodeEnv: process.env.NODE_ENV,
    },
    kv: {
      error: kvError,
      keys: kvKeys,
    },
    blob: {
      error: blobError,
      files: blobFiles,
    },
    copan: {
      columnKeys,
      columnsCount: copanData.columns.length,
    },
  });
}
