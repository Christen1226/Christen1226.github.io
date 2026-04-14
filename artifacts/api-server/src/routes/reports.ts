import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase.js";

export interface ApiReport {
  id: string;
  type: "delay" | "out-of-order" | "technical" | "general";
  message: string;
  confirmations: number;
  timestamp: string;
  reporter: string;
}

const router: IRouter = Router();

router.get("/reports/:competitionId", async (req, res) => {
  const { data, error } = await supabase.from("reports").select("*").eq("competition_id", req.params.competitionId).order("timestamp", { ascending: false });
  if (error) { res.status(500).json({ error: error.message }); return; }
  const reports = (data ?? []).map((r) => ({ id: r.id, type: r.type, message: r.message, confirmations: r.confirmations, timestamp: r.timestamp, reporter: r.reporter }));
  res.json({ reports });
});

router.post("/reports/:competitionId", async (req, res) => {
  const { competitionId } = req.params;
  const { type, message, reporter } = req.body as { type: ApiReport["type"]; message: string; reporter: string };
  if (!type || !message) { res.status(400).json({ error: "type and message are required" }); return; }
  const report = { id: Date.now().toString(36) + Math.random().toString(36).substr(2, 6), competition_id: competitionId, type, message, confirmations: 1, timestamp: new Date().toISOString(), reporter: reporter || "Anonymous" };
  const { error } = await supabase.from("reports").insert(report);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true, report: { id: report.id, type: report.type, message: report.message, confirmations: report.confirmations, timestamp: report.timestamp, reporter: report.reporter } });
});

router.post("/reports/:competitionId/:reportId/confirm", async (req, res) => {
  const { reportId } = req.params;
  const { data, error } = await supabase.from("reports").select("confirmations").eq("id", reportId).single();
  if (error || !data) { res.status(404).json({ error: "Report not found" }); return; }
  const { error: updateError } = await supabase.from("reports").update({ confirmations: data.confirmations + 1 }).eq("id", reportId);
  if (updateError) { res.status(500).json({ error: updateError.message }); return; }
  res.json({ ok: true });
});

router.delete("/reports/:competitionId/:reportId", async (req, res) => {
  const { reportId } = req.params;
  const { error } = await supabase.from("reports").delete().eq("id", reportId);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

export default router;