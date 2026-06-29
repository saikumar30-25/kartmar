import { supabase } from "@/integrations/supabase/client";

const YEAR_SECONDS = 60 * 60 * 24 * 365;

export async function uploadAndSign(
  bucket: "avatars" | "product-images" | "partner-docs",
  userId: string,
  file: File,
  prefix?: string,
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/${prefix ? prefix + "-" : ""}${Date.now()}.${ext}`;
  const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "3600",
    upsert: true,
    contentType: file.type,
  });
  if (upErr) throw upErr;
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, YEAR_SECONDS);
  if (error) throw error;
  return data.signedUrl;
}
