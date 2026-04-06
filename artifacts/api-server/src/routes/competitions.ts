import { Router, type IRouter } from "express";
import { loadJson, saveJson } from "../persistence.js";

export interface ApiCompetition {
  id: string;
  name: string;
  venue: string;
  location: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  memberCount: number;
}

const router: IRouter = Router();

const competitionsStore = new Map<string, ApiCompetition>(
  (loadJson<ApiCompetition[]>("competitions.json", [])).map((c) => [c.id, c])
);

function persist() {
  saveJson("competitions.json", Array.from(competitionsStore.values()));
}

// GET /api/competitions — returns all user-created competitions
router.get("/competitions", (_req, res) => {
  res.json({ competitions: Array.from(competitionsStore.values()) });
});

// POST /api/competitions — create a new competition
router.post("/competitions", (req, res) => {
  const comp = req.body as ApiCompetition;
  if (!comp.id || !comp.name) {
    res.status(400).json({ error: "id and name are required" });
    return;
  }
  competitionsStore.set(comp.id, comp);
  persist();
  res.json({ ok: true, competition: comp });
});

// PATCH /api/competitions/:id — update dates (or other fields)
router.patch("/competitions/:id", (req, res) => {
  const { id } = req.params;
  const existing = competitionsStore.get(id);
  if (!existing) {
    res.status(404).json({ error: "Competition not found" });
    return;
  }
  const updated = { ...existing, ...req.body } as ApiCompetition;
  competitionsStore.set(id, updated);
  persist();
  res.json({ ok: true, competition: updated });
});

// DELETE /api/competitions/:id
router.delete("/competitions/:id", (req, res) => {
  const { id } = req.params;
  if (!competitionsStore.has(id)) {
    res.status(404).json({ error: "Competition not found" });
    return;
  }
  competitionsStore.delete(id);
  persist();
  res.json({ ok: true });
});

export default router;
