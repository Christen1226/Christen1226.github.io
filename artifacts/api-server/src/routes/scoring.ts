import { Router, type IRouter } from "express";
import { loadJson, saveJson } from "../persistence.js";

interface UploadedImage {
  id: string;
  image: string;
  uploadedAt: string;
  uploadedBy?: string;
}

type ScoringStore = Record<string, UploadedImage[]>;

const router: IRouter = Router();
const scoringStore: ScoringStore = loadJson<ScoringStore>("scoring.json", {});

router.get("/scoring/:competitionId", (req, res) => {
  const { competitionId } = req.params;
  res.json({ images: scoringStore[competitionId] ?? [] });
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
  scoringStore[competitionId] = [...(scoringStore[competitionId] ?? []), entry];
  saveJson("scoring.json", scoringStore);
  res.json({ ok: true, id: entry.id });
});

router.delete("/scoring/:competitionId/:imageId", (req, res) => {
  const { competitionId, imageId } = req.params;
  scoringStore[competitionId] = (scoringStore[competitionId] ?? []).filter(
    (e) => e.id !== imageId
  );
  saveJson("scoring.json", scoringStore);
  res.json({ ok: true });
});

export default router;
