import { Router, type IRouter } from "express";
import { supabase } from "../lib/supabase.js";

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

router.get("/competitions", async (_req, res) => {
  const { data, error } = await supabase.from("competitions").select("*");
  if (error) { res.status(500).json({ error: error.message }); return; }
  const competitions = (data ?? []).map((c) => ({ id: c.id, name: c.name, venue: c.venue, location: c.location, startDate: c.start_date, endDate: c.end_date, createdBy: c.created_by, memberCount: c.member_count }));
  res.json({ competitions });
});

router.post("/competitions", async (req, res) => {
  const comp = req.body as ApiCompetition;
  if (!comp.id || !comp.name) { res.status(400).json({ error: "id and name are required" }); return; }
  const { error } = await supabase.from("competitions").upsert({ id: comp.id, name: comp.name, venue: comp.venue, location: comp.location, start_date: comp.startDate, end_date: comp.endDate, created_by: comp.createdBy, member_count: comp.memberCount ?? 0 });
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true, competition: comp });
});

router.patch("/competitions/:id", async (req, res) => {
  const { id } = req.params;
  const body = req.body as Partial<ApiCompetition>;
  const update: Record<string, unknown> = {};
  if (body.name) update.name = body.name;
  if (body.venue) update.venue = body.venue;
  if (body.location) update.location = body.location;
  if (body.startDate) update.start_date = body.startDate;
  if (body.endDate) update.end_date = body.endDate;
  if (body.memberCount !== undefined) update.member_count = body.memberCount;
  const { data, error } = await supabase.from("competitions").update(update).eq("id", id).select().single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true, competition: data });
});


// POST /api/competitions/:id/join — increment member count
router.post("/competitions/:id/join", async (req, res) => {
  const { id } = req.params;
  const { data: existing, error: fetchError } = await supabase
    .from("competitions")
    .select("member_count")
    .eq("id", id)
    .single();
  if (fetchError || !existing) { res.status(404).json({ error: "Competition not found" }); return; }
  const { data, error } = await supabase
    .from("competitions")
    .update({ member_count: existing.member_count + 1 })
    .eq("id", id)
    .select()
    .single();
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true, memberCount: data.member_count });
});

router.delete("/competitions/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from("competitions").delete().eq("id", id);
  if (error) { res.status(500).json({ error: error.message }); return; }
  res.json({ ok: true });
});

export default router;