import { PropertyData } from "./types";
import initialCopanRaw from "../../data/copan.json";
import initial320Raw from "../../data/flatincrivel-320.json";
import initial229Raw from "../../data/flatincrivel-229.json";
import { PROPERTIES, PropertyMeta } from "./properties";

export { PROPERTIES };
export type { PropertyMeta };

// In-memory cache for local runtime & serverless instances
let inMemoryCache: Record<string, PropertyData> = {
  copan: initialCopanRaw as unknown as PropertyData,
  "flatincrivel-320": initial320Raw as unknown as PropertyData,
  "flatincrivel-229": initial229Raw as unknown as PropertyData,
};

function normalizePropertyId(id: string): string {
  const clean = id.toLowerCase().trim();
  if (clean === "320" || clean === "apto320" || clean === "ape320") return "flatincrivel-320";
  if (clean === "229" || clean === "apto229" || clean === "ape229") return "flatincrivel-229";
  return clean;
}

/**
 * Retrieves property data from Vercel KV, Vercel Blob, or local JSON.
 */
export async function getPropertyData(rawPropertyId: string = "copan"): Promise<PropertyData> {
  const propertyId = normalizePropertyId(rawPropertyId);

  // 1. Try Vercel KV (if connected on Vercel)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const { kv } = await import("@vercel/kv");
      const remoteData = await kv.get<PropertyData>(`property:${propertyId}`);
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
          return blobData as PropertyData;
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

  // 4. Try reading directly from disk if in node environment
  if (typeof window === "undefined") {
    try {
      const fs = await import("fs");
      const path = await import("path");
      const filePath = path.join(process.cwd(), "data", `${propertyId}.json`);
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf-8");
        const parsed = JSON.parse(raw) as PropertyData;
        inMemoryCache[propertyId] = parsed;
        return parsed;
      }
    } catch (e) {
      console.warn("Error reading local json file:", e);
    }
  }

  // 5. Default static data
  if (propertyId === "flatincrivel-320") return initial320Raw as unknown as PropertyData;
  if (propertyId === "flatincrivel-229") return initial229Raw as unknown as PropertyData;
  return initialCopanRaw as unknown as PropertyData;
}

/**
 * Saves updated property data to Vercel KV, Vercel Blob, or local disk.
 */
export async function savePropertyData(
  rawPropertyId: string,
  updatedData: PropertyData
): Promise<{ success: boolean; storageType: string }> {
  const propertyId = normalizePropertyId(rawPropertyId);

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

  // 3. If running locally on Node server, save to local data/<propertyId>.json file on disk
  if (typeof window === "undefined" && process.env.NODE_ENV !== "production") {
    try {
      const fs = await import("fs");
      const path = await import("path");
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
