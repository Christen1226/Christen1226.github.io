import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase.js";

const router: IRouter = Router();

router.get("/stage/:competitionId", async (req, res) => {
  const { competitionId } = req.params;
  const { data, error } = await supabase.from("stage").select("*").eq("competition_id", competitionId).single();
  if (error || !data) { res.json({ currentNumber: 0, lastReportedAt: null, reporterCount: 0 }); return; }
  res.json({ currentNumber: data.current_number, lastReportedAt: data.last_reported_at, reporterCount: data.reporter_count });
});

router.post("/stage/:competitionId", async (req, res) => {
  const { competitionId } = req.params;
  const { number } = req.body;
  if (typeof number !== "number" || isNaN(number) || number < 0) { res.status(400).json({ error: "Invalid number" }); return; }
  const { data: existing } = await supabase.from("stage").select("reporter_count").eq("competition_id", competitionId).single();
  const reporterCount = (existing?.reporter_count ?? 0) + 1;
  const { data, error } = await supabase.from("stage").upsert({ competition_id: competitionId, current_number: number, last_reported_at: new Date().toISOString(), reporter_count: reporterCount }).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ currentNumber: data.current_number, lastReportedAt: data.last_reported_at, reporterCount: data.reporter_count });
});

router.post("/stage/:competitionId/reset", async (req, res) => {
  const { competitionId } = req.params;
  const { data, error } = await supabase.from("stage").upsert({ competition_id: competitionId, current_number: 0, last_reported_at: null, reporter_count: 0 }).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ currentNumber: data.current_number, lastReportedAt: data.last_reported_at, reporterCount: data.reporter_count });
});

export default router;