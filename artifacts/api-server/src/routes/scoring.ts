import { Router, type IRouter } from "express";

interface UploadedImage {
  id: string;
  image: string;
  uploadedAt: string;
  uploadedBy?: string;
}

const router: IRouter = Router();

const scoringStore = new Map<string, UploadedImage[]>();

router.get("/scoring/:competitionId", (req, res) => {
  const { competitionId } = req.params;
  const images = scoringStore.get(competitionId) ?? [];
  res.json({ images });
});

router.post("/scoring/:competitionId", (req, res) => {
  const { competitionId } = req.params;
  const { image, uploadedBy } = req.body as { image: string; uploadedBy?: string };

  if (typeof image !== "string" || !image.startsWith("data:image")) {
    res.status(400).json({ error: "Invalid image data" });
    return;
  }

  const entry: UploadedImage = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
    image,
    uploadedAt: new Date().toISOString(),
    uploadedBy,
  };
  const existing = scoringStore.get(competitionId) ?? [];
  scoringStore.set(competitionId, [...existing, entry]);
  res.json({ ok: true, id: entry.id });
});

router.delete("/scoring/:competitionId/:imageId", (req, res) => {
  const { competitionId, imageId } = req.params;
  const existing = scoringStore.get(competitionId) ?? [];
  scoringStore.set(competitionId, existing.filter((e) => e.id !== imageId));
  res.json({ ok: true });
});

export default router;
