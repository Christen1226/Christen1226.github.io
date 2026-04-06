import AsyncStorage from "@react-native-async-storage/async-storage";
import { useUser, useClerk } from "@clerk/expo";
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
  signOut: () => void;
  setProfileImage: (uri: string | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);


const MOCK_COMPETITIONS: Competition[] = [
  {
    id: "c1",
    name: "STARBOUND 2026",
    venue: "Marriott Convention Center",
    location: "Atlanta, GA",
    startDate: "Apr 6, 2026",
    endDate: "Apr 7, 2026",
    createdBy: "Lisa K.",
    memberCount: 47,
  },
  {
    id: "c2",
    name: "SHOWSTOPPER NATIONALS",
    venue: "Gaylord Opryland Resort",
    location: "Nashville, TN",
    startDate: "Apr 12, 2026",
    endDate: "Apr 14, 2026",
    createdBy: "Jen T.",
    memberCount: 83,
  },
  {
    id: "c3",
    name: "DANCE SPECTACULAR",
    venue: "Orange County Convention Center",
    location: "Orlando, FL",
    startDate: "May 2, 2026",
    endDate: "May 4, 2026",
    createdBy: "Mike R.",
    memberCount: 62,
  },
  {
    id: "c4",
    name: "REGIONAL CHAMPIONSHIP",
    venue: "Dallas Convention Center",
    location: "Dallas, TX",
    startDate: "May 17, 2026",
    endDate: "May 18, 2026",
    createdBy: "Amy S.",
    memberCount: 29,
  },
];

function isExpiredComp(comp: Competition): boolean {
  if (!comp.endDate) return false;
  const end = new Date(comp.endDate);
  if (isNaN(end.getTime())) return false;
  // Grace period: 5 days after end date
  return new Date() > new Date(end.getTime() + 5 * 24 * 60 * 60 * 1000);
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

const POLL_INTERVAL_MS = 5000;

function getApiBase(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  // fallback for web where we can use relative URL
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

// ---------- Reports API helpers ----------

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

async function postReport(
  competitionId: string,
  type: CommunityReport["type"],
  message: string,
  reporter: string
): Promise<CommunityReport | null> {
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
    await fetch(`${getApiBase()}/api/reports/${competitionId}/${reportId}/confirm`, {
      method: "POST",
    });
  } catch {}
}

// ---------- Competitions API helpers ----------

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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [lastReportedAt, setLastReportedAt] = useState<Date | null>(null);
  const [reporterCount, setReporterCount] = useState(0);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [dancers, setDancers] = useState<Dancer[]>([]);
  const [competition, setCompetitionState] = useState<Competition | null>(MOCK_COMPETITIONS[0]);
  const [allCompetitions, setAllCompetitions] = useState<Competition[]>(MOCK_COMPETITIONS);
  const { user } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const isSignedIn = !!user;
  const userName = user?.fullName
    || (user?.firstName ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`.trim() : "")
    || user?.username
    || user?.primaryEmailAddress?.emailAddress?.split("@")[0]
    || "User";

  const [profileImage, setProfileImageState] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [scheduleImages, setScheduleImages] = useState<UploadedImage[]>([]);
  const [scoringImages, setScoringImages] = useState<UploadedImage[]>([]);
  // Track which competition IDs the user has joined (persisted locally)
  const [joinedCompetitionIds, setJoinedCompetitionIds] = useState<string[]>(["c1"]);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const competitionRef = useRef<Competition | null>(competition);
  competitionRef.current = competition;

  // Load persisted data on startup (not dancers — those load per-competition below)
  useEffect(() => {
    const load = async () => {
      try {
        // Fetch user-created competitions from API and merge with mock seed data
        const apiComps = await fetchApiCompetitions();
        const apiIds = new Set(apiComps.map((c) => c.id));
        const merged = [
          ...MOCK_COMPETITIONS,
          ...apiComps.filter((c) => !MOCK_COMPETITIONS.find((m) => m.id === c.id)),
        ];
        // Also include any locally-cached competitions the API may not have (offline created)
        const compsJson = await AsyncStorage.getItem("competitions");
        if (compsJson) {
          const saved: Competition[] = JSON.parse(compsJson);
          for (const s of saved) {
            if (!MOCK_COMPETITIONS.find((m) => m.id === s.id) && !apiIds.has(s.id)) {
              merged.push(s);
            }
          }
        }
        // Remove competitions expired more than 5 days ago
        const live = merged.filter((c) => !isExpiredComp(c));
        setAllCompetitions(live);

        const activeCompJson = await AsyncStorage.getItem("activeCompetition");
        if (activeCompJson) {
          const active: Competition = JSON.parse(activeCompJson);
          // Don't restore an expired active competition
          if (!isExpiredComp(active)) {
            setCompetitionState(active);
          } else {
            setCompetitionState(live[0] ?? null);
          }
        }

        const profileJson = await AsyncStorage.getItem("profileImage");
        if (profileJson) setProfileImageState(JSON.parse(profileJson));

        const joinedJson = await AsyncStorage.getItem("joinedCompetitions");
        if (joinedJson) {
          const ids: string[] = JSON.parse(joinedJson);
          setJoinedCompetitionIds(ids);
        }
      } catch {}
    };
    load();
  }, []);

  // Load dancers for the active competition whenever it changes
  useEffect(() => {
    if (!competition) {
      setDancers([]);
      return;
    }
    AsyncStorage.getItem(`dancers_${competition.id}`)
      .then((json) => setDancers(json ? JSON.parse(json) : []))
      .catch(() => setDancers([]));
  }, [competition?.id]);

  // Load reports for the active competition from the API whenever the competition changes
  useEffect(() => {
    if (!competition) {
      setReports([]);
      return;
    }
    const compId = competition.id;
    fetchReports(compId).then((fetched) => {
      if (fetched !== null) setReports(fetched);
    });
  }, [competition?.id]);

  // Load schedule images for active competition (local cache first, then API)
  useEffect(() => {
    setScheduleImages([]);
    if (!competition) return;
    const compId = competition.id;
    const localKey = `schedule_${compId}`;
    AsyncStorage.getItem(localKey).then((cached) => {
      if (cached) {
        try { setScheduleImages(JSON.parse(cached)); } catch {}
      }
    }).catch(() => {});
    fetch(`${getApiBase()}/api/schedule/${compId}`)
      .then((r) => r.json())
      .then((data: { images: UploadedImage[] }) => {
        if (Array.isArray(data.images) && data.images.length > 0) {
          setScheduleImages(data.images);
          AsyncStorage.setItem(localKey, JSON.stringify(data.images)).catch(() => {});
        }
      })
      .catch(() => {});
  }, [competition?.id]);

  // Load scoring images for active competition (local cache first, then API)
  useEffect(() => {
    setScoringImages([]);
    if (!competition) return;
    const compId = competition.id;
    const localKey = `scoring_${compId}`;
    AsyncStorage.getItem(localKey).then((cached) => {
      if (cached) {
        try { setScoringImages(JSON.parse(cached)); } catch {}
      }
    }).catch(() => {});
    fetch(`${getApiBase()}/api/scoring/${compId}`)
      .then((r) => r.json())
      .then((data: { images: UploadedImage[] }) => {
        if (Array.isArray(data.images) && data.images.length > 0) {
          setScoringImages(data.images);
          AsyncStorage.setItem(localKey, JSON.stringify(data.images)).catch(() => {});
        }
      })
      .catch(() => {});
  }, [competition?.id]);

  // Polling: start/stop when competition changes
  useEffect(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

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

    // Fetch immediately on mount/competition switch
    poll();

    pollingRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [competition?.id]);

  const userInitials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

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
    // Optimistic update with a temp local entry; API response replaces it
    const tempId = "local_" + generateId();
    const optimistic: CommunityReport = {
      id: tempId,
      type,
      message,
      confirmations: 1,
      timestamp: new Date(),
      reporter: userName || "Anonymous",
    };
    setReports((prev) => [optimistic, ...prev]);
    postReport(compId, type, message, userName || "Anonymous").then((saved) => {
      if (saved) {
        setReports((prev) => prev.map((r) => (r.id === tempId ? saved : r)));
      }
    });
  }, [userName]);

  const confirmReport = useCallback((id: string) => {
    const compId = competitionRef.current?.id;
    // Optimistic local increment; server is updated in the background
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, confirmations: r.confirmations + 1 } : r))
    );
    if (compId) confirmReportApi(compId, id);
  }, []);

  const uploadSchedule = useCallback(async (base64Uri: string) => {
    const compId = competitionRef.current?.id;
    if (!compId) return;
    // Optimistically append a local entry so UI updates immediately
    const localEntry: UploadedImage = {
      id: "local_" + Date.now().toString(36),
      image: base64Uri,
      uploadedAt: new Date().toISOString(),
    };
    setScheduleImages((prev) => {
      const updated = [...prev, localEntry];
      AsyncStorage.setItem(`schedule_${compId}`, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    try {
      const res = await fetch(`${getApiBase()}/api/schedule/${compId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Uri }),
      });
      if (res.ok) {
        const data = await res.json() as { ok: boolean; id: string };
        // Replace the local entry with the server-assigned ID
        setScheduleImages((prev) => {
          const updated = prev.map((e) =>
            e.id === localEntry.id ? { ...e, id: data.id } : e
          );
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
    try {
      await fetch(`${getApiBase()}/api/schedule/${compId}/${id}`, { method: "DELETE" });
    } catch {}
  }, []);

  const uploadScoring = useCallback(async (base64Uri: string) => {
    const compId = competitionRef.current?.id;
    if (!compId) return;
    const localEntry: UploadedImage = {
      id: "local_" + Date.now().toString(36),
      image: base64Uri,
      uploadedAt: new Date().toISOString(),
    };
    setScoringImages((prev) => {
      const updated = [...prev, localEntry];
      AsyncStorage.setItem(`scoring_${compId}`, JSON.stringify(updated)).catch(() => {});
      return updated;
    });
    try {
      const res = await fetch(`${getApiBase()}/api/scoring/${compId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Uri }),
      });
      if (res.ok) {
        const data = await res.json() as { ok: boolean; id: string };
        setScoringImages((prev) => {
          const updated = prev.map((e) =>
            e.id === localEntry.id ? { ...e, id: data.id } : e
          );
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
    try {
      await fetch(`${getApiBase()}/api/scoring/${compId}/${id}`, { method: "DELETE" });
    } catch {}
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
      const merged = [
        ...MOCK_COMPETITIONS,
        ...apiComps.filter((c) => !MOCK_COMPETITIONS.find((m) => m.id === c.id)),
      ];
      // Also keep any offline-created competitions not yet on server
      const compsJson = await AsyncStorage.getItem("competitions");
      if (compsJson) {
        const saved: Competition[] = JSON.parse(compsJson);
        for (const s of saved) {
          if (!MOCK_COMPETITIONS.find((m) => m.id === s.id) && !apiIds.has(s.id)) {
            merged.push(s);
          }
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
    setDancers((prev) => {
      const updated = [...prev, dancer];
      saveDancersForComp(updated);
      return updated;
    });
  }, [saveDancersForComp]);

  const removeDancer = useCallback((id: string) => {
    setDancers((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      saveDancersForComp(updated);
      return updated;
    });
  }, [saveDancersForComp]);

  const updateDancerNumbers = useCallback((id: string, numbers: number[]) => {
    setDancers((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, numbers } : d));
      saveDancersForComp(updated);
      return updated;
    });
  }, [saveDancersForComp]);

  const updateDancer = useCallback((id: string, name: string, numbers: number[]) => {
    setDancers((prev) => {
      const updated = prev.map((d) => (d.id === id ? { ...d, name, numbers } : d));
      saveDancersForComp(updated);
      return updated;
    });
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
      const updated = prev.map((c) =>
        c.id === id ? { ...c, memberCount: c.memberCount + 1 } : c
      );
      const joined = updated.find((c) => c.id === id)!;
      setCompetitionState(joined);
      AsyncStorage.setItem("activeCompetition", JSON.stringify(joined)).catch(() => {});
      AsyncStorage.setItem(
        "competitions",
        JSON.stringify(updated.filter((c) => !MOCK_COMPETITIONS.find((m) => m.id === c.id)))
      ).catch(() => {});
      return updated;
    });
    addToJoined(id);
    // Fetch current live state for this competition immediately
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
    // Immediately fetch live state for this competition
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
      // If leaving the active competition, switch to the next joined one
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
    // Remove from all competitions list
    setAllCompetitions((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      const userCreated = updated.filter((c) => !MOCK_COMPETITIONS.find((m) => m.id === c.id));
      AsyncStorage.setItem("competitions", JSON.stringify(userCreated)).catch(() => {});
      return updated;
    });
    // Remove from joined list
    setJoinedCompetitionIds((prev) => {
      const updated = prev.filter((jid) => jid !== id);
      AsyncStorage.setItem("joinedCompetitions", JSON.stringify(updated)).catch(() => {});
      // If deleting the active competition, switch to the next available joined one
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
    // Delete from shared API so it disappears for all users
    deleteApiCompetition(id);
  }, []);

  const createCompetition = useCallback(
    (name: string, venue: string, location: string, startDate: string, endDate: string) => {
      const newComp: Competition = {
        id: generateId(),
        name: name.toUpperCase(),
        venue,
        location,
        startDate,
        endDate,
        createdBy: userName || "You",
        memberCount: 1,
      };
      // Reset stage to 0 on the server for a fresh competition
      resetStage(newComp.id);
      setCurrentNumber(0);
      setLastReportedAt(null);
      setReporterCount(0);

      setAllCompetitions((prev) => {
        const updated = [newComp, ...prev];
        const userCreated = updated.filter((c) => !MOCK_COMPETITIONS.find((m) => m.id === c.id));
        AsyncStorage.setItem("competitions", JSON.stringify(userCreated)).catch(() => {});
        return updated;
      });
      addToJoined(newComp.id);
      setCompetitionState(newComp);
      AsyncStorage.setItem("activeCompetition", JSON.stringify(newComp)).catch(() => {});
      // Persist to shared API so all users can discover this competition
      postApiCompetition(newComp);
    },
    [userName, addToJoined]
  );

  const updateCompetitionDates = useCallback(
    (id: string, startDate: string, endDate: string) => {
      setAllCompetitions((prev) => {
        const updated = prev.map((c) =>
          c.id === id ? { ...c, startDate, endDate } : c
        );
        const userCreated = updated.filter((c) => !MOCK_COMPETITIONS.find((m) => m.id === c.id));
        AsyncStorage.setItem("competitions", JSON.stringify(userCreated)).catch(() => {});
        const target = updated.find((c) => c.id === id);
        if (target && competitionRef.current?.id === id) {
          setCompetitionState(target);
          AsyncStorage.setItem("activeCompetition", JSON.stringify(target)).catch(() => {});
        }
        return updated;
      });
      // Sync date change to API for all users
      patchApiCompetition(id, startDate, endDate);
    },
    []
  );

  const signOut = useCallback(async () => {
    setProfileImageState(null);
    await AsyncStorage.removeItem("profileImage");
    await clerkSignOut();
  }, [clerkSignOut]);

  const setProfileImage = useCallback(async (uri: string | null) => {
    setProfileImageState(uri);
    await AsyncStorage.setItem("profileImage", JSON.stringify(uri));
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentNumber,
        lastReportedAt,
        reporterCount,
        reports,
        dancers,
        competition,
        allCompetitions,
        isSignedIn,
        userName,
        userInitials,
        profileImage,
        isLive,
        scheduleImages,
        uploadSchedule,
        deleteScheduleImage,
        scoringImages,
        uploadScoring,
        deleteScoringImage,
        refreshStage,
        refreshCompetitions,
        submitCurrentNumber,
        submitReport,
        confirmReport,
        addDancer,
        removeDancer,
        updateDancerNumbers,
        updateDancer,
        joinedCompetitionIds,
        setCompetition,
        createCompetition,
        updateCompetitionDates,
        joinCompetition,
        switchCompetition,
        leaveCompetition,
        deleteCompetition,
        signOut,
        setProfileImage,
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
