import { Router, type IRouter } from "express";

const router: IRouter = Router();

// In-memory store: competitionId -> base64 image data URI
const scheduleStore = new Map<string, string>();

// GET /api/schedule/:competitionId — fetch schedule image
router.get("/schedule/:competitionId", (req, res) => {
  const { competitionId } = req.params;
  const image = scheduleStore.get(competitionId) ?? null;
  res.json({ image });
});

// POST /api/schedule/:competitionId — upload schedule image
router.post("/schedule/:competitionId", (req, res) => {
  const { competitionId } = req.params;
  const { image } = req.body as { image: string };

  if (typeof image !== "string" || !image.startsWith("data:image")) {
    res.status(400).json({ error: "Invalid image data" });
    return;
  }

  scheduleStore.set(competitionId, image);
  res.json({ ok: true });
});

export default router;
