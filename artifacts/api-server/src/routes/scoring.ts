import { Router, type IRouter } from "express";

const router: IRouter = Router();

// In-memory store: competitionId -> base64 image data URI
const scoringStore = new Map<string, string>();

// GET /api/scoring/:competitionId — fetch scoring doc image
router.get("/scoring/:competitionId", (req, res) => {
  const { competitionId } = req.params;
  const image = scoringStore.get(competitionId) ?? null;
  res.json({ image });
});

// POST /api/scoring/:competitionId — upload scoring doc image
router.post("/scoring/:competitionId", (req, res) => {
  const { competitionId } = req.params;
  const { image } = req.body as { image: string };

  if (typeof image !== "string" || !image.startsWith("data:image")) {
    res.status(400).json({ error: "Invalid image data" });
    return;
  }

  scoringStore.set(competitionId, image);
  res.json({ ok: true });
});

export default router;
