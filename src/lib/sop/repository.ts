import { supabase } from "@/integrations/supabase/client";
import { splitSections, extractTags } from "./indexer";
import { SEED_SOPS } from "./seed";

export interface SopDocumentRow {
  id: string;
  title: string;
  owner: string | null;
  source: string;
  source_url: string | null;
  updated_at: string;
  created_at: string;
}

export interface SopSectionRow {
  id: string;
  sop_id: string;
  section: string;
  body: string;
  tags: string[];
  position: number;
  updated_at: string;
}

export async function fetchAllSops(): Promise<{
  documents: SopDocumentRow[];
  sections: SopSectionRow[];
}> {
  const [docsRes, secsRes] = await Promise.all([
    supabase.from("sop_documents").select("*").order("updated_at", { ascending: false }),
    supabase.from("sop_sections").select("*").order("position", { ascending: true }),
  ]);
  if (docsRes.error) throw docsRes.error;
  if (secsRes.error) throw secsRes.error;
  return {
    documents: (docsRes.data ?? []) as SopDocumentRow[],
    sections: (secsRes.data ?? []) as SopSectionRow[],
  };
}

/** Create or replace a SOP doc + its sections by re-parsing raw text. */
export async function upsertSopFromText(input: {
  id?: string;
  title: string;
  owner?: string;
  source?: "paste" | "upload" | "url";
  source_url?: string;
  body: string;
}): Promise<string> {
  const { data: userData } = await supabase.auth.getUser();
  const user_id = userData.user?.id;
  if (!user_id) throw new Error("Not authenticated");

  let sopId = input.id;
  if (sopId) {
    const { error } = await supabase
      .from("sop_documents")
      .update({
        title: input.title,
        owner: input.owner ?? null,
        source: input.source ?? "paste",
        source_url: input.source_url ?? null,
      })
      .eq("id", sopId);
    if (error) throw error;
    await supabase.from("sop_sections").delete().eq("sop_id", sopId);
  } else {
    const { data, error } = await supabase
      .from("sop_documents")
      .insert({
        user_id,
        title: input.title,
        owner: input.owner ?? null,
        source: input.source ?? "paste",
        source_url: input.source_url ?? null,
      })
      .select("id")
      .single();
    if (error) throw error;
    sopId = data.id;
  }

  const parsed = splitSections(input.body, input.title);
  if (parsed.length === 0) {
    parsed.push({
      section: "Overview",
      body: input.body.trim(),
      tags: extractTags(input.body),
      position: 0,
    });
  }
  const rows = parsed.map(p => ({
    sop_id: sopId!,
    user_id,
    section: p.section,
    body: p.body,
    tags: p.tags,
    position: p.position,
    char_length: p.body.length,
  }));
  const { error: insErr } = await supabase.from("sop_sections").insert(rows);
  if (insErr) throw insErr;
  return sopId!;
}

export async function deleteSop(sopId: string) {
  const { error } = await supabase.from("sop_documents").delete().eq("id", sopId);
  if (error) throw error;
}

/** First-run seed so the library isn't empty. Returns true if it seeded. */
export async function seedStarterSopsIfEmpty(): Promise<boolean> {
  const { data: existing, error } = await supabase
    .from("sop_documents")
    .select("id")
    .limit(1);
  if (error) throw error;
  if (existing && existing.length > 0) return false;

  for (const seed of SEED_SOPS) {
    await upsertSopFromText({
      title: seed.title,
      owner: seed.owner,
      source: "paste",
      body: seed.body,
    });
  }
  return true;
}