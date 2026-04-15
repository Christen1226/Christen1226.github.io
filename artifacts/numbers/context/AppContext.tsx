import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export interface Dancer {
  id: string;
  name: string;
  numbers: number[];
}

export interface CommunityReport {
  id: string;
  type: "delay" | "out-of-order" | "technical" | "general";
  message: string;
  confirmations: number;
  timestamp: Date;
  reporter: string;
}

export interface Competition {
  id: string;
  name: string;
  venue: string;
  location: string;
  startDate: string;
  endDate: string;
  createdBy: string;
  memberCount: number;
}

export interface UploadedImage {
  id: string;
  image: string;
  uploadedAt: string;
  uploadedBy?: string;
}

interface AppContextValue {
  userLoaded: boolean;
  currentNumber: number;
  lastReportedAt: Date | null;
  reporterCount: number;
  reports: CommunityReport[];
  dancers: Dancer[];
  competition: Competition | null;
  allCompetitions: Competition[];
  isSignedIn: boolean;
  userName: string;
  userInitials: string;
  profileImage: string | null;
  isLive: boolean;
  scheduleImages: UploadedImage[];
  uploadSchedule: (base64Uri: string) => Promise<void>;
  deleteScheduleImage: (id: string) => Promise<void>;
  scoringImages: UploadedImage[];
  uploadScoring: (base64Uri: string) => Promise<void>;
  deleteScoringImage: (id: string) => Promise<void>;
  refreshStage: () => Promise<void>;
  refreshCompetitions: () => Promise<void>;
  submitCurrentNumber: (num: number) => void;
  submitReport: (type: CommunityReport["type"], message: string) => void;
  confirmReport: (id: string) => void;
  addDancer: (name: string, numbers: number[]) => void;
  removeDancer: (id: string) => void;
  updateDancerNumbers: (id: string, numbers: number[]) => void;
  updateDancer: (id: string, name: string, numbers: number[]) => void;
  joinedCompetitionIds: string[];
  setCompetition: (comp: Competition) => void;
  createCompetition: (name: string, venue: string, location: string, startDate: string, endDate: string) => void;
  updateCompetitionDates: (id: string, startDate: string, endDate: string) => void;
  joinCompetition: (id: string) => void;
  switchCompetition: (id: string) => void;
  leaveCompetition: (id: string) => void;
  deleteCompetition: (id: string) => void;
  signIn: (name: string) => void;
  signOut: () => void;
  setProfileImage: (uri: string | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function isExpiredComp(comp: Competition): boolean {
  if (!comp.endDate) return false;
  const end = new Date(comp.endDate);
  if (isNaN(end.getTime())) return false;
  return new Date() > new Date(end.getTime() + 5 * 24 * 60 * 60 * 1000);
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const POLL_INTERVAL_MS = 5000;
const IMAGE_POLL_INTERVAL_MS = 15000;

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  if (typeof window !== "undefined" && window.location?.hostname) {
    const h = window.location.hostname;
    if (h.includes(".expo.picard.replit.dev")) {
      return `https://${h.replace(".expo.picard.replit.dev", ".picard.replit.dev")}`;
    }
    return `${window.location.protocol}//${window.location.host}`;
  }
  return "";
}

async function fetchStage(competitionId: string): Promise<{ currentNumber: number; lastReportedAt: string | null; reporterCount: number } | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/stage/${competitionId}`);
    if (!res.ok) return null;
    return res.json() as Promise<{ currentNumber: number; lastReportedAt: string | null; reporterCount: number }>;
  } catch {
    return null;
  }
}

async function postStage(competitionId: string, number: number): Promise<void> {
  try {
    await fetch(`${getApiBase()}/api/stage/${competitionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number }),
    });
  } catch {}
}

async function resetStage(competitionId: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/api/stage/${competitionId}/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch {}
}

interface ApiReport {
  id: string;
  type: CommunityReport["type"];
  message: string;
  confirmations: number;
  timestamp: string;
  reporter: string;
}

function apiReportToLocal(r: ApiReport): CommunityReport {
  return { ...r, timestamp: new Date(r.timestamp) };
}

async function fetchReports(competitionId: string): Promise<CommunityReport[] | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/reports/${competitionId}`);
    if (!res.ok) return null;
    const data = await res.json() as { reports: ApiReport[] };
    return data.reports.map(apiReportToLocal);
  } catch {
    return null;
  }
}

async function postReport(competitionId: string, type: CommunityReport["type"], message: string, reporter: string): Promise<CommunityReport | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/reports/${competitionId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, message, reporter }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { ok: boolean; report: ApiReport };
    return apiReportToLocal(data.report);
  } catch {
    return null;
  }
}

async function confirmReportApi(competitionId: string, reportId: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/api/reports/${competitionId}/${reportId}/confirm`, { method: "POST" });
  } catch {}
}

async function fetchApiCompetitions(): Promise<Competition[]> {
  try {
    const res = await fetch(`${getApiBase()}/api/competitions`);
    if (!res.ok) return [];
    const data = await res.json() as { competitions: Competition[] };
    return data.competitions ?? [];
  } catch {
    return [];
  }
}

async function postApiCompetition(comp: Competition): Promise<void> {
  try {
    await fetch(`${getApiBase()}/api/competitions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comp),
    });
  } catch {}
}

async function patchApiCompetition(id: string, startDate: string, endDate: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/api/competitions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate, endDate }),
    });
  } catch {}
}

async function deleteApiCompetition(id: string): Promise<void> {
  try {
    await fetch(`${getApiBase()}/api/competitions/${id}`, { method: "DELETE" });
  } catch {}
}

async function fetchImages(competitionId: string, type: "schedule" | "scoring"): Promise<UploadedImage[] | null> {
  try {
    const res = await fetch(`${getApiBase()}/api/${type}/${competitionId}`);
    if (!res.ok) return null;
    const data = await res.json() as { images: UploadedImage[] };
    return Array.isArray(data.images) ? data.images : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [lastReportedAt, setLastReportedAt] = useState<Date | null>(null);
  const [reporterCount, setReporterCount] = useState(0);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [dancers, setDancers] = useState<Dancer[]>([]);
  const [competition, setCompetitionState] = useState<Competition | null>(null);
  const [allCompetitions, setAllCompetitions] = useState<Competition[]>([]);
  const [userLoaded, setUserLoaded] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [profileImage, setProfileImageState] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [scheduleImages, setScheduleImages] = useState<UploadedImage[]>([]);
  const [scoringImages, setScoringImages] = useState<UploadedImage[]>([]);
  const [joinedCompetitionIds, setJoinedCompetitionIds] = useState<string[]>([]);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const imagePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const competitionRef = useRef<Competition | null>(competition);
  competitionRef.current = competition;

  useEffect(() => {
    const load = async () => {
      try {
        const apiComps = await fetchApiCompetitions();
        const apiIds = new Set(apiComps.map((c) => c.id));
        const merged = [...apiComps];
        const compsJson = await AsyncStorage.getItem("competitions");
        if (compsJson) {
          const saved: Competition[] = JSON.parse(compsJson);
          for (const s of saved) {
            if (!apiIds.has(s.id)) merged.push(s);
          }
        }
        const live = merged.filter((c) => !isExpiredComp(c));
        setAllCompetitions(live);

        const activeCompJson = await AsyncStorage.getItem("activeCompetition");
        if (activeCompJson) {
          const active: Competition = JSON.parse(activeCompJson);
          if (!isExpiredComp(active)) {
            setCompetitionState(active);
          } else {
            setCompetitionState(live[0] ?? null);
          }
        }

        const userJson = await AsyncStorage.getItem("user");
        if (userJson) {
          const user = JSON.parse(userJson);
          setIsSignedIn(true);
          setUserName(user.name);
          if (user.profileImage) setProfileImageState(user.profileImage);
        }

        const joinedJson = await AsyncStorage.getItem("joinedCompetitions");
        if (joinedJson) {
          const ids: string[] = JSON.parse(joinedJson);
          setJoinedCompetitionIds(ids);
        }
      } catch {}
      setUserLoaded(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!competition) { setDancers([]); return; }
    AsyncStorage.getItem(`dancers_${competition.id}`)
      .then((json) => setDancers(json ? JSON.parse(json) : []))
      .catch(() => setDancers([]));
  }, [competition?.id]);

  useEffect(() => {
    if (!competition) { setReports([]); return; }
    fetchReports(competition.id).then((fetched) => {
      if (fetched !== null) setReports(fetched);
    });
  }, [competition?.id]);

  useEffect(() => {
    setScheduleImages([]);
    if (!competition) return;
    const compId = competition.id;
    const localKey = `schedule_${compId}`;
    AsyncStorage.getItem(localKey).then((cached) => {
      if (cached) { try { setScheduleImages(JSON.parse(cached)); } catch {} }
    }).catch(() => {});
    fetchImages(compId, "schedule").then((images) => {
      if (images && images.length > 0) {
        setScheduleImages(images);
        AsyncStorage.setItem(localKey, JSON.stringify(images)).catch(() => {});
      }
    });
  }, [competition?.id]);

  useEffect(() => {
    setScoringImages([]);
    if (!competition) return;
    const compId = competition.id;
    const localKey = `scoring_${compId}`;
    AsyncStorage.getItem(localKey).then((cached) => {
      if (cached) { try { setScoringImages(JSON.parse(cached)); } catch {} }
    }).catch(() => {});
    fetchImages(compId, "scoring").then((images) => {
      if (images && images.length > 0) {
        setScoringImages(images);
        AsyncStorage.setItem(localKey, JSON.stringify(images)).catch(() => {});
      }
    });
  }, [competition?.id]);

  // Polling: stage + reports every 5s, images every 15s
  useEffect(() => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
    if (imagePollingRef.current) { clearInterval(imagePollingRef.current); imagePollingRef.current = null; }
    if (!competition) return;

    const poll = async () => {
      const [stageData, reportData] = await Promise.all([
        fetchStage(competition.id),
        fetchReports(competition.id),
      ]);
      if (stageData) {
        setIsLive(true);
        setCurrentNumber(stageData.currentNumber);
        setReporterCount(stageData.reporterCount);
        if (stageData.lastReportedAt) setLastReportedAt(new Date(stageData.lastReportedAt));
      } else {
        setIsLive(false);
      }
      if (reportData !== null) setReports(reportData);
    };

    const pollImages = async () => {
      const compId = competitionRef.current?.id;
      if (!compId) return;
      const [schedData, scorData] = await Promise.all([
        fetchImages(compId, "schedule"),
        fetchImages(compId, "scoring"),
      ]);
      if (schedData !== null) {
        setScheduleImages(schedData);
        AsyncStorage.setItem(`schedule_${compId}`, JSON.stringify(schedData)).catch(() => {});
      }
      if (scorData !== null) {
        setScoringImages(scorData);
        AsyncStorage.setItem(`scoring_${compId}`, JSON.stringify(scorData)).catch(() => {});
      }
    };

    poll();
    pollImages();

    pollingRef.current = setInterval(poll, POLL_INTERVAL_MS);
    imagePollingRef.current = setInterval(pollImages, IMAGE_POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
      if (imagePollingRef.current) { clearInterval(imagePollingRef.current); imagePollingRef.current = null; }
    };
  }, [competition?.id]);

  const userInitials = userName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

  const submitCurrentNumber = useCallback((num: number) => {
    const comp = competitionRef.current;
    setCurrentNumber(num);
    setLastReportedAt(new Date());
    setReporterCount((c) => c + 1);
    if (comp) postStage(comp.id, num);
  }, []);

  const submitReport = useCallback((type: CommunityReport["type"], message: string) => {
    const compId = competitionRef.current?.id;
    if (!compId) return;
    const tempId = "local_" + generateId();
    const optimistic: CommunityReport = {
      id: tempId, type, message, confirmations: 1,
      timestamp: new Date(), reporter: userName || "Anonymous",
    };
    setReports((prev) => [optimistic, ...prev]);
    postReport(compId, type, message, userName || "Anonymous").then((saved) => {
      if (saved) setReports((prev) => prev.map((r) => (r.id === tempId ? saved : r)));
    });
  }, [userName]);

  const confirmReport = useCallback((id: string) => {
    const compId = competitionRef.current?.id;
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, confirmations: r.confirmations + 1 } : r)));
    if (compId) confirmReportApi(compId, id);
  }, []);

  const uploadSchedule = useCallback(async (base64Uri: string) => {
    const compId = competitionRef.current?.id;
    if (!compId) return;
    const localEntry: UploadedImage = { id: "local_" + Date.now().toString(36), image: base64Uri, uploadedAt: new Date().toISOString() };
    setScheduleImages((prev) => {
      const updated = [...prev, localEntry];
      AsyncStorage.setItem(`schedule_${compId}`, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    try {
      const res = await fetch(`${getApiBase()}/api/schedule/${compId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Uri }),
      });
      if (res.ok) {
        const data = await res.json() as { ok: boolean; id: string };
        setScheduleImages((prev) => {
          const updated = prev.map((e) => e.id === localEntry.id ? { ...e, id: data.id } : e);
          AsyncStorage.setItem(`schedule_${compId}`, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      }
    } catch {}
  }, []);

  const deleteScheduleImage = useCallback(async (id: string) => {
    const compId = competitionRef.current?.id;
    if (!compId) return;
    setScheduleImages((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      AsyncStorage.setItem(`schedule_${compId}`, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    try { await fetch(`${getApiBase()}/api/schedule/${compId}/${id}`, { method: "DELETE" }); } catch {}
  }, []);

  const uploadScoring = useCallback(async (base64Uri: string) => {
    const compId = competitionRef.current?.id;
    if (!compId) return;
    const localEntry: UploadedImage = { id: "local_" + Date.now().toString(36), image: base64Uri, uploadedAt: new Date().toISOString() };
    setScoringImages((prev) => {
      const updated = [...prev, localEntry];
      AsyncStorage.setItem(`scoring_${compId}`, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    try {
      const res = await fetch(`${getApiBase()}/api/scoring/${compId}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Uri }),
      });
      if (res.ok) {
        const data = await res.json() as { ok: boolean; id: string };
        setScoringImages((prev) => {
          const updated = prev.map((e) => e.id === localEntry.id ? { ...e, id: data.id } : e);
          AsyncStorage.setItem(`scoring_${compId}`, JSON.stringify(updated)).catch(() => {});
          return updated;
        });
      }
    } catch {}
  }, []);

  const deleteScoringImage = useCallback(async (id: string) => {
    const compId = competitionRef.current?.id;
    if (!compId) return;
    setScoringImages((prev) => {
      const updated = prev.filter((e) => e.id !== id);
      AsyncStorage.setItem(`scoring_${compId}`, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    try { await fetch(`${getApiBase()}/api/scoring/${compId}/${id}`, { method: "DELETE" }); } catch {}
  }, []);

  const refreshStage = useCallback(async () => {
    const comp = competitionRef.current;
    if (!comp) return;
    const data = await fetchStage(comp.id);
    if (data) {
      setIsLive(true);
      setCurrentNumber(data.currentNumber);
      setReporterCount(data.reporterCount);
      if (data.lastReportedAt) setLastReportedAt(new Date(data.lastReportedAt));
    } else {
      setIsLive(false);
    }
  }, []);

  const refreshCompetitions = useCallback(async () => {
    try {
      const apiComps = await fetchApiCompetitions();
      const apiIds = new Set(apiComps.map((c) => c.id));
      const merged = [...apiComps];
      const compsJson = await AsyncStorage.getItem("competitions");
      if (compsJson) {
        const saved: Competition[] = JSON.parse(compsJson);
        for (const s of saved) {
          if (!apiIds.has(s.id)) merged.push(s);
        }
      }
      const live = merged.filter((c) => !isExpiredComp(c));
      setAllCompetitions(live);
      setCompetitionState((cur) => {
        if (cur && isExpiredComp(cur)) {
          const fallback = live[0] ?? null;
          if (fallback) AsyncStorage.setItem("activeCompetition", JSON.stringify(fallback)).catch(() => {});
          else AsyncStorage.removeItem("activeCompetition").catch(() => {});
          return fallback;
        }
        return cur;
      });
    } catch {}
  }, []);

  const saveDancersForComp = useCallback((updated: Dancer[]) => {
    const compId = competitionRef.current?.id;
    if (!compId) return;
    AsyncStorage.setItem(`dancers_${compId}`, JSON.stringify(updated)).catch(() => {});
  }, []);

  const addDancer = useCallback((name: string, numbers: number[]) => {
    const dancer: Dancer = { id: generateId(), name, numbers };
    setDancers((prev) => { const updated = [...prev, dancer]; saveDancersForComp(updated); return updated; });
  }, [saveDancersForComp]);

  const removeDancer = useCallback((id: string) => {
    setDancers((prev) => { const updated = prev.filter((d) => d.id !== id); saveDancersForComp(updated); return updated; });
  }, [saveDancersForComp]);

  const updateDancerNumbers = useCallback((id: string, numbers: number[]) => {
    setDancers((prev) => { const updated = prev.map((d) => (d.id === id ? { ...d, numbers } : d)); saveDancersForComp(updated); return updated; });
  }, [saveDancersForComp]);

  const updateDancer = useCallback((id: string, name: string, numbers: number[]) => {
    setDancers((prev) => { const updated = prev.map((d) => (d.id === id ? { ...d, name, numbers } : d)); saveDancersForComp(updated); return updated; });
  }, [saveDancersForComp]);

  const setCompetition = useCallback((comp: Competition) => {
    setCompetitionState(comp);
    AsyncStorage.setItem("activeCompetition", JSON.stringify(comp)).catch(() => {});
  }, []);

  const addToJoined = useCallback((id: string) => {
    setJoinedCompetitionIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      AsyncStorage.setItem("joinedCompetitions", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
  }, []);

  const joinCompetition = useCallback((id: string) => {
    setAllCompetitions((prev) => {
      const updated = prev.map((c) => c.id === id ? { ...c, memberCount: c.memberCount + 1 } : c);
      const joined = updated.find((c) => c.id === id)!;
      setCompetitionState(joined);
      AsyncStorage.setItem("activeCompetition", JSON.stringify(joined)).catch(() => {});
      AsyncStorage.setItem("competitions", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    addToJoined(id);
    fetchStage(id).then((data) => {
      if (data) {
        setCurrentNumber(data.currentNumber);
        setReporterCount(data.reporterCount);
        if (data.lastReportedAt) setLastReportedAt(new Date(data.lastReportedAt));
      }
    });
  }, [addToJoined]);

  const switchCompetition = useCallback((id: string) => {
    setAllCompetitions((prev) => {
      const target = prev.find((c) => c.id === id);
      if (!target) return prev;
      setCompetitionState(target);
      AsyncStorage.setItem("activeCompetition", JSON.stringify(target)).catch(() => {});
      return prev;
    });
    fetchStage(id).then((data) => {
      if (data) {
        setIsLive(true);
        setCurrentNumber(data.currentNumber);
        setReporterCount(data.reporterCount);
        if (data.lastReportedAt) setLastReportedAt(new Date(data.lastReportedAt));
      } else {
        setIsLive(false);
        setCurrentNumber(0);
        setReporterCount(0);
        setLastReportedAt(null);
      }
    });
  }, []);

  const leaveCompetition = useCallback((id: string) => {
    setJoinedCompetitionIds((prev) => {
      const updated = prev.filter((jid) => jid !== id);
      AsyncStorage.setItem("joinedCompetitions", JSON.stringify(updated)).catch(() => {});
      if (competitionRef.current?.id === id) {
        setAllCompetitions((all) => {
          const next = all.find((c) => updated.includes(c.id)) ?? null;
          setCompetitionState(next);
          if (next) AsyncStorage.setItem("activeCompetition", JSON.stringify(next)).catch(() => {});
          else AsyncStorage.removeItem("activeCompetition").catch(() => {});
          return all;
        });
      }
      return updated;
    });
  }, []);

  const deleteCompetition = useCallback((id: string) => {
    setAllCompetitions((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      AsyncStorage.setItem("competitions", JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    setJoinedCompetitionIds((prev) => {
      const updated = prev.filter((jid) => jid !== id);
      AsyncStorage.setItem("joinedCompetitions", JSON.stringify(updated)).catch(() => {});
      if (competitionRef.current?.id === id) {
        setAllCompetitions((all) => {
          const remaining = all.filter((c) => c.id !== id);
          const next = remaining.find((c) => updated.includes(c.id)) ?? remaining[0] ?? null;
          setCompetitionState(next);
          if (next) AsyncStorage.setItem("activeCompetition", JSON.stringify(next)).catch(() => {});
          else AsyncStorage.removeItem("activeCompetition").catch(() => {});
          return remaining;
        });
      }
      return updated;
    });
    deleteApiCompetition(id);
  }, []);

  const createCompetition = useCallback(
    (name: string, venue: string, location: string, startDate: string, endDate: string) => {
      const newComp: Competition = {
        id: generateId(), name: name.toUpperCase(), venue, location, startDate, endDate,
        createdBy: userName || "You", memberCount: 1,
      };
      resetStage(newComp.id);
      setCurrentNumber(0);
      setLastReportedAt(null);
      setReporterCount(0);
      setAllCompetitions((prev) => {
        const updated = [newComp, ...prev];
        AsyncStorage.setItem("competitions", JSON.stringify(updated)).catch(() => {});
        return updated;
      });
      addToJoined(newComp.id);
      setCompetitionState(newComp);
      AsyncStorage.setItem("activeCompetition", JSON.stringify(newComp)).catch(() => {});
      postApiCompetition(newComp);
    },
    [userName, addToJoined]
  );

  const updateCompetitionDates = useCallback(
    (id: string, startDate: string, endDate: string) => {
      setAllCompetitions((prev) => {
        const updated = prev.map((c) => c.id === id ? { ...c, startDate, endDate } : c);
        AsyncStorage.setItem("competitions", JSON.stringify(updated)).catch(() => {});
        const target = updated.find((c) => c.id === id);
        if (target && competitionRef.current?.id === id) {
          setCompetitionState(target);
          AsyncStorage.setItem("activeCompetition", JSON.stringify(target)).catch(() => {});
        }
        return updated;
      });
      patchApiCompetition(id, startDate, endDate);
    },
    []
  );

  const signIn = useCallback(async (name: string) => {
    setUserName(name);
    setIsSignedIn(true);
    await AsyncStorage.setItem("user", JSON.stringify({ name, profileImage }));
  }, [profileImage]);

  const signOut = useCallback(async () => {
    setIsSignedIn(false);
    setUserName("");
    setProfileImageState(null);
    await AsyncStorage.removeItem("user");
  }, []);

  const setProfileImage = useCallback(async (uri: string | null) => {
    setProfileImageState(uri);
    const userJson = await AsyncStorage.getItem("user");
    const user = userJson ? JSON.parse(userJson) : { name: userName };
    await AsyncStorage.setItem("user", JSON.stringify({ ...user, profileImage: uri }));
  }, [userName]);

  return (
    <AppContext.Provider
      value={{
        userLoaded, currentNumber, lastReportedAt, reporterCount, reports, dancers,
        competition, allCompetitions, isSignedIn, userName, userInitials, profileImage, isLive,
        scheduleImages, uploadSchedule, deleteScheduleImage,
        scoringImages, uploadScoring, deleteScoringImage,
        refreshStage, refreshCompetitions, submitCurrentNumber, submitReport, confirmReport,
        addDancer, removeDancer, updateDancerNumbers, updateDancer,
        joinedCompetitionIds, setCompetition, createCompetition, updateCompetitionDates,
        joinCompetition, switchCompetition, leaveCompetition, deleteCompetition,
        signIn, signOut, setProfileImage,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}