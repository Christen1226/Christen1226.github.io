import { Router, type IRouter } from "express";

const router: IRouter = Router();

interface StageState {
  currentNumber: number;
  lastReportedAt: string | null;
  reporterCount: number;
}

// In-memory store: competitionId -> stage state
const stageStore = new Map<string, StageState>();

function getOrInit(competitionId: string): StageState {
  if (!stageStore.has(competitionId)) {
    stageStore.set(competitionId, {
      currentNumber: 0,
      lastReportedAt: null,
      reporterCount: 0,
    });
  }
  return stageStore.get(competitionId)!;
}

// GET /api/stage/:competitionId — fetch current stage state
router.get("/stage/:competitionId", (req, res) => {
  const { competitionId } = req.params;
  const state = getOrInit(competitionId);
  res.json(state);
});

// POST /api/stage/:competitionId — report a new stage number
router.post("/stage/:competitionId", (req, res) => {
  const { competitionId } = req.params;
  const { number } = req.body as { number: number };

  if (typeof number !== "number" || isNaN(number) || number < 0) {
    res.status(400).json({ error: "Invalid number" });
    return;
  }

  const prev = getOrInit(competitionId);
  const updated: StageState = {
    currentNumber: number,
    lastReportedAt: new Date().toISOString(),
    reporterCount: prev.reporterCount + 1,
  };
  stageStore.set(competitionId, updated);
  res.json(updated);
});

// POST /api/stage/:competitionId/reset — reset to 0 when comp is created/joined fresh
router.post("/stage/:competitionId/reset", (req, res) => {
  const { competitionId } = req.params;
  const fresh: StageState = {
    currentNumber: 0,
    lastReportedAt: null,
    reporterCount: 0,
  };
  stageStore.set(competitionId, fresh);
  res.json(fresh);
});

export default router;
