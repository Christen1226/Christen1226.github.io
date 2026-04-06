import { Router, type IRouter } from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

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

const DATA_DIR = join(process.cwd(), ".data");
const COMPETITIONS_FILE = join(DATA_DIR, "competitions.json");

function ensureDataDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function loadStore(): Map<string, ApiCompetition> {
  try {
    ensureDataDir();
    if (!existsSync(COMPETITIONS_FILE)) return new Map();
    const raw = readFileSync(COMPETITIONS_FILE, "utf-8");
    const arr: ApiCompetition[] = JSON.parse(raw);
    return new Map(arr.map((c) => [c.id, c]));
  } catch {
    return new Map();
  }
}

function saveStore(store: Map<string, ApiCompetition>) {
  try {
    ensureDataDir();
    writeFileSync(COMPETITIONS_FILE, JSON.stringify(Array.from(store.values()), null, 2));
  } catch {}
}

const competitionsStore = loadStore();

const router: IRouter = Router();

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
  saveStore(competitionsStore);
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
  saveStore(competitionsStore);
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
  saveStore(competitionsStore);
  res.json({ ok: true });
});

export default router;
