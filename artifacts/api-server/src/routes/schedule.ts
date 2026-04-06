import { Router, type IRouter } from "express";
import { loadJson, saveJson } from "../persistence.js";

interface UploadedImage {
  id: string;
  image: string;
  uploadedAt: string;
  uploadedBy?: string;
}

type ScheduleStore = Record<string, UploadedImage[]>;

const router: IRouter = Router();
const scheduleStore: ScheduleStore = loadJson<ScheduleStore>("schedule.json", {});

router.get("/schedule/:competitionId", (req, res) => {
  const { competitionId } = req.params;
  res.json({ images: scheduleStore[competitionId] ?? [] });
});

router.post("/schedule/:competitionId", (req, res) => {
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
  scheduleStore[competitionId] = [...(scheduleStore[competitionId] ?? []), entry];
  saveJson("schedule.json", scheduleStore);
  res.json({ ok: true, id: entry.id });
});

router.delete("/schedule/:competitionId/:imageId", (req, res) => {
  const { competitionId, imageId } = req.params;
  scheduleStore[competitionId] = (scheduleStore[competitionId] ?? []).filter(
    (e) => e.id !== imageId
  );
  saveJson("schedule.json", scheduleStore);
  res.json({ ok: true });
});

export default router;
