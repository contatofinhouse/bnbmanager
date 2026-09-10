import { CopanData } from "./types";
import initialCopanRaw from "../../data/copan.json";
import fs from "fs";
import path from "path";

// In-memory cache for local runtime & serverless instances
let inMemoryCache: Record<string, CopanData> = {
  copan: initialCopanRaw as unknown as CopanData,
};

export interface PropertyMeta {
  id: string;
  name: string;
  listing: string;
  city: string;
  active: boolean;
}

export const PROPERTIES: PropertyMeta[] = [
  {
    id: "copan",
    name: "Edifício Copan",
    listing: "Vem pro Copan, vista e design",
    city: "São Paulo, SP",
    active: true,
  },
  {
    id: "riviera",
    name: "Flat Riviera",
    listing: "Flat na Riviera com Piscina Climatizada",
    city: "Bertioga, SP",
    active: false,
  },
];

/**
 * Retrieves property data from Vercel KV, Vercel Blob, or local JSON.
 */
export async function getPropertyData(propertyId: string = "copan"): Promise<CopanData> {
  // 1. Try Vercel KV (if connected on Vercel)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import("@vercel/kv");
      const remoteData = await kv.get<CopanData>(`property:${propertyId}`);
      if (remoteData && remoteData.columns && remoteData.rows) {
        return remoteData;
      }
    } catch (err) {
      console.warn("Vercel KV fetch fallback:", err);
    }
  }

  // 2. Try Vercel Blob (if connected on Vercel)
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { list } = await import("@vercel/blob");
      const { blobs } = await list({ prefix: `data/${propertyId}.json` });
      if (blobs.length > 0) {
        const res = await fetch(blobs[0].url, { cache: "no-store" });
        if (res.ok) {
          const blobData = await res.json();
          return blobData as CopanData;
        }
      }
    } catch (err) {
      console.warn("Vercel Blob fetch fallback:", err);
    }
  }

  // 3. In-memory cache
  if (inMemoryCache[propertyId]) {
    return inMemoryCache[propertyId];
  }

  // 4. Default static data
  return initialCopanRaw as unknown as CopanData;
}

/**
 * Saves updated property data to Vercel KV, Vercel Blob, or local disk.
 */
export async function savePropertyData(propertyId: string, updatedData: CopanData): Promise<{ success: boolean; storageType: string }> {
  // Always update in-memory cache
  inMemoryCache[propertyId] = updatedData;

  let storageType = "local-memory";

  // 1. Save to Vercel KV if available
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import("@vercel/kv");
      await kv.set(`property:${propertyId}`, updatedData);
      return { success: true, storageType: "vercel-kv" };
    } catch (err: any) {
      console.error("Failed to save to Vercel KV:", err);
    }
  }

  // 2. Save to Vercel Blob if available
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = await import("@vercel/blob");
      await put(`data/${propertyId}.json`, JSON.stringify(updatedData, null, 2), {
        access: "public",
        addRandomSuffix: false,
      });
      return { success: true, storageType: "vercel-blob" };
    } catch (err: any) {
      console.error("Failed to save to Vercel Blob:", err);
    }
  }

  // 3. If running locally, save to local data/copan.json file on disk
  if (process.env.NODE_ENV !== "production") {
    try {
      const filePath = path.join(process.cwd(), "data", `${propertyId}.json`);
      if (fs.existsSync(path.dirname(filePath))) {
        await fs.promises.writeFile(filePath, JSON.stringify(updatedData, null, 2), "utf8");
        storageType = "local-disk";
      }
    } catch (err) {
      console.warn("Could not write to local disk:", err);
    }
  }

  return { success: true, storageType };
}
