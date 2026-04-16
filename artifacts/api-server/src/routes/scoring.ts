import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase.js";

interface UploadedImage {
  id: string;
  image: string;
  uploadedAt: string;
  uploadedBy?: string;
}

const router: IRouter = Router();

router.get("/scoring/:competitionId", async (req, res) => {
  const { competitionId } = req.params;
  const { data, error } = await supabase
    .from("scoring_images")
    .select("*")
    .eq("competition_id", competitionId)
    .order("uploaded_at", { ascending: true });
  if (error) { res.status(500).json({ error: error.message }); return; }
  const images: UploadedImage[] = (data ?? []).map((r) => ({
    id: r.id, image: r.image, uploadedAt: r.uploaded_at, uploadedBy: r.uploaded_by
  }));
  res.json({ images });
});

router.post("/scoring/:competitionId", async (req, res) => {
  const { competitionId } = req.params;
  const { image, uploadedBy } = req.body as { image: string; uploadedBy?: string };
  if (typeof image !== "string" || !image.startsWith("data:image")) {
    res.status(400).json({ error: "Invalid image data" }); return;
  }
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
    competition_id: competitionId,
    image,
    uploaded_at: new Date().toISOString(),
    uploaded_by: uploadedBy,
  };
  const { error } = await supabase.from("scoring_images").insert(entry);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true, id: entry.id });
});

router.delete("/scoring/:competitionId/:imageId", async (req, res) => {
  const { imageId } = req.params;
  const { error } = await supabase.from("scoring_images").delete().eq("id", imageId);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

export default router;