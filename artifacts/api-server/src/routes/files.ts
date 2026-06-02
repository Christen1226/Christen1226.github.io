import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase.js";

interface CompetitionFile {
  id: string;
  competitionId: string;
  name: string;
  data: string;
  uploadedAt: string;
  uploadedBy?: string;
}

const router: IRouter = Router();

router.get("/files/:competitionId", async (req, res) => {
  const { competitionId } = req.params;
  const { data, error } = await supabase
    .from("competition_files")
    .select("*")
    .eq("competition_id", competitionId)
    .order("uploaded_at", { ascending: true });
  if (error) { res.status(500).json({ error: error.message }); return; }
  const files: CompetitionFile[] = (data ?? []).map((r) => ({
    id: r.id, competitionId: r.competition_id, name: r.name,
    data: r.data, uploadedAt: r.uploaded_at, uploadedBy: r.uploaded_by
  }));
  res.json({ files });
});

router.post("/files/:competitionId", async (req, res) => {
  const { competitionId } = req.params;
  const { name, data, uploadedBy } = req.body as { name: string; data: string; uploadedBy?: string };
  if (!name || !data) { res.status(400).json({ error: "name and data are required" }); return; }
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
    competition_id: competitionId,
    name,
    data,
    uploaded_at: new Date().toISOString(),
    uploaded_by: uploadedBy,
  };
  const { error } = await supabase.from("competition_files").insert(entry);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true, id: entry.id });
});

router.delete("/files/:competitionId/:fileId", async (req, res) => {
  const { fileId } = req.params;
  const { error } = await supabase.from("competition_files").delete().eq("id", fileId);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

export default router;