import { Router, type IRouter } from "express";
import { loadJson, saveJson } from "../persistence.js";

export interface ApiReport {
  id: string;
  type: "delay" | "out-of-order" | "technical" | "general";
  message: string;
  confirmations: number;
  timestamp: string;
  reporter: string;
}

const router: IRouter = Router();

type ReportsStore = Record<string, ApiReport[]>;

// Seed mock community alerts for c1 so every device sees starting data,
// but only if c1 has no persisted data yet.
const now = Date.now();
const MOCK_C1: ApiReport[] = [
  {
    id: "r1",
    type: "delay",
    message: "Judge break in progress, running about 10 min behind",
    confirmations: 8,
    timestamp: new Date(now - 12 * 60000).toISOString(),
    reporter: "Sarah M.",
  },
  {
    id: "r2",
    type: "out-of-order",
    message: "Numbers 47 and 48 swapped — 48 went before 47",
    confirmations: 3,
    timestamp: new Date(now - 28 * 60000).toISOString(),
    reporter: "Jen T.",
  },
  {
    id: "r3",
    type: "technical",
    message: "Sound issue resolved, back on track now",
    confirmations: 5,
    timestamp: new Date(now - 45 * 60000).toISOString(),
    reporter: "Mike R.",
  },
];

const persisted = loadJson<ReportsStore>("reports.json", {});
if (!persisted["c1"]) persisted["c1"] = MOCK_C1;
const reportsStore: ReportsStore = persisted;

function getReports(compId: string): ApiReport[] {
  return reportsStore[compId] ?? [];
}

// GET /api/reports/:competitionId
router.get("/reports/:competitionId", (req, res) => {
  res.json({ reports: getReports(req.params.competitionId) });
});

// POST /api/reports/:competitionId — submit a new alert
router.post("/reports/:competitionId", (req, res) => {
  const { competitionId } = req.params;
  const { type, message, reporter } = req.body as {
    type: ApiReport["type"];
    message: string;
    reporter: string;
  };

  if (!type || !message) {
    res.status(400).json({ error: "type and message are required" });
    return;
  }

  const report: ApiReport = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6),
    type,
    message,
    confirmations: 1,
    timestamp: new Date().toISOString(),
    reporter: reporter || "Anonymous",
  };

  reportsStore[competitionId] = [report, ...getReports(competitionId)];
  saveJson("reports.json", reportsStore);
  res.json({ ok: true, report });
});

// POST /api/reports/:competitionId/:reportId/confirm — upvote an alert
router.post("/reports/:competitionId/:reportId/confirm", (req, res) => {
  const { competitionId, reportId } = req.params;
  reportsStore[competitionId] = getReports(competitionId).map((r) =>
    r.id === reportId ? { ...r, confirmations: r.confirmations + 1 } : r
  );
  saveJson("reports.json", reportsStore);
  res.json({ ok: true });
});

// DELETE /api/reports/:competitionId/:reportId
router.delete("/reports/:competitionId/:reportId", (req, res) => {
  const { competitionId, reportId } = req.params;
  reportsStore[competitionId] = getReports(competitionId).filter(
    (r) => r.id !== reportId
  );
  saveJson("reports.json", reportsStore);
  res.json({ ok: true });
});

export default router;
