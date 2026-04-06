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
  scheduleImage: string | null;
  uploadSchedule: (base64Uri: string) => Promise<void>;
  scoringImage: string | null;
  uploadScoring: (base64Uri: string) => Promise<void>;
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
  signIn: (name: string) => void;
  signOut: () => void;
  setProfileImage: (uri: string | null) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const MOCK_REPORTS: CommunityReport[] = [
  {
    id: "r1",
    type: "delay",
    message: "Judge break in progress, running about 10 min behind",
    confirmations: 8,
    timestamp: new Date(Date.now() - 12 * 60000),
    reporter: "Sarah M.",
  },
  {
    id: "r2",
    type: "out-of-order",
    message: "Numbers 47 and 48 swapped — 48 went before 47",
    confirmations: 3,
    timestamp: new Date(Date.now() - 28 * 60000),
    reporter: "Jen T.",
  },
  {
    id: "r3",
    type: "technical",
    message: "Sound issue resolved, back on track now",
    confirmations: 5,
    timestamp: new Date(Date.now() - 45 * 60000),
    reporter: "Mike R.",
  },
];

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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentNumber, setCurrentNumber] = useState(0);
  const [lastReportedAt, setLastReportedAt] = useState<Date | null>(null);
  const [reporterCount, setReporterCount] = useState(0);
  const [reports, setReports] = useState<CommunityReport[]>([]);
  const [dancers, setDancers] = useState<Dancer[]>([]);
  const [competition, setCompetitionState] = useState<Competition | null>(MOCK_COMPETITIONS[0]);
  const [allCompetitions, setAllCompetitions] = useState<Competition[]>(MOCK_COMPETITIONS);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [profileImage, setProfileImageState] = useState<string | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [scheduleImage, setScheduleImage] = useState<string | null>(null);
  const [scoringImage, setScoringImage] = useState<string | null>(null);
  // Track which competition IDs the user has joined (persisted locally)
  const [joinedCompetitionIds, setJoinedCompetitionIds] = useState<string[]>(["c1"]);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const competitionRef = useRef<Competition | null>(competition);
  competitionRef.current = competition;

  // Load persisted data on startup (not dancers — those load per-competition below)
  useEffect(() => {
    const load = async () => {
      try {
        const compsJson = await AsyncStorage.getItem("competitions");
        if (compsJson) {
          const saved: Competition[] = JSON.parse(compsJson);
          const userCreated = saved.filter((s) => !MOCK_COMPETITIONS.find((m) => m.id === s.id));
          setAllCompetitions([...MOCK_COMPETITIONS, ...userCreated]);
        }

        const activeCompJson = await AsyncStorage.getItem("activeCompetition");
        if (activeCompJson) {
          const active: Competition = JSON.parse(activeCompJson);
          setCompetitionState(active);
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
          // Always include c1 as default
          setJoinedCompetitionIds(Array.from(new Set(["c1", ...ids])));
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

  // Load reports for the active competition whenever it changes
  // Seed mock reports for c1 on first visit (single device only)
  useEffect(() => {
    if (!competition) {
      setReports([]);
      return;
    }
    const key = `reports_${competition.id}`;
    AsyncStorage.getItem(key).then((json) => {
      if (json) {
        const parsed = JSON.parse(json) as Array<CommunityReport & { timestamp: string }>;
        setReports(parsed.map((r) => ({ ...r, timestamp: new Date(r.timestamp) })));
      } else if (competition.id === "c1") {
        // Seed mock alerts for Starbound 2026 on first open
        setReports(MOCK_REPORTS);
        AsyncStorage.setItem(key, JSON.stringify(MOCK_REPORTS)).catch(() => {});
      } else {
        setReports([]);
      }
    }).catch(() => setReports([]));
  }, [competition?.id]);

  // Load schedule for active competition (local cache first, then API)
  useEffect(() => {
    setScheduleImage(null); // always clear before loading the new competition's schedule
    if (!competition) return;
    const compId = competition.id;
    const localKey = `schedule_${compId}`;
    // Show local cache immediately, then try API in background
    AsyncStorage.getItem(localKey).then((cached) => {
      if (cached) setScheduleImage(cached);
    }).catch(() => {});
    // Fetch from API (may override local cache if newer)
    fetch(`${getApiBase()}/api/schedule/${compId}`)
      .then((r) => r.json())
      .then((data: { image: string | null }) => {
        if (data.image) {
          setScheduleImage(data.image);
          AsyncStorage.setItem(localKey, data.image).catch(() => {});
        }
      })
      .catch(() => {});
  }, [competition?.id]);

  // Load scoring docs for active competition (local cache first, then API)
  useEffect(() => {
    setScoringImage(null);
    if (!competition) return;
    const compId = competition.id;
    const localKey = `scoring_${compId}`;
    AsyncStorage.getItem(localKey).then((cached) => {
      if (cached) setScoringImage(cached);
    }).catch(() => {});
    fetch(`${getApiBase()}/api/scoring/${compId}`)
      .then((r) => r.json())
      .then((data: { image: string | null }) => {
        if (data.image) {
          setScoringImage(data.image);
          AsyncStorage.setItem(localKey, data.image).catch(() => {});
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
      const data = await fetchStage(competition.id);
      if (data) {
        setIsLive(true);
        setCurrentNumber(data.currentNumber);
        setReporterCount(data.reporterCount);
        if (data.lastReportedAt) setLastReportedAt(new Date(data.lastReportedAt));
      } else {
        setIsLive(false);
      }
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

  const saveReportsForComp = useCallback((updated: CommunityReport[]) => {
    const compId = competitionRef.current?.id;
    if (!compId) return;
    AsyncStorage.setItem(`reports_${compId}`, JSON.stringify(updated)).catch(() => {});
  }, []);

  const submitReport = useCallback((type: CommunityReport["type"], message: string) => {
    const newReport: CommunityReport = {
      id: generateId(),
      type,
      message,
      confirmations: 1,
      timestamp: new Date(),
      reporter: userName || "Anonymous",
    };
    setReports((prev) => {
      const updated = [newReport, ...prev];
      saveReportsForComp(updated);
      return updated;
    });
  }, [userName, saveReportsForComp]);

  const confirmReport = useCallback((id: string) => {
    setReports((prev) => {
      const updated = prev.map((r) => (r.id === id ? { ...r, confirmations: r.confirmations + 1 } : r));
      saveReportsForComp(updated);
      return updated;
    });
  }, [saveReportsForComp]);

  const uploadSchedule = useCallback(async (base64Uri: string) => {
    const compId = competitionRef.current?.id;
    if (!compId) return;
    setScheduleImage(base64Uri);
    AsyncStorage.setItem(`schedule_${compId}`, base64Uri).catch(() => {});
    try {
      await fetch(`${getApiBase()}/api/schedule/${compId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Uri }),
      });
    } catch {}
  }, []);

  const uploadScoring = useCallback(async (base64Uri: string) => {
    const compId = competitionRef.current?.id;
    if (!compId) return;
    setScoringImage(base64Uri);
    AsyncStorage.setItem(`scoring_${compId}`, base64Uri).catch(() => {});
    try {
      await fetch(`${getApiBase()}/api/scoring/${compId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64Uri }),
      });
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
      const compsJson = await AsyncStorage.getItem("competitions");
      if (compsJson) {
        const saved: Competition[] = JSON.parse(compsJson);
        const userCreated = saved.filter((s) => !MOCK_COMPETITIONS.find((m) => m.id === s.id));
        setAllCompetitions([...MOCK_COMPETITIONS, ...userCreated]);
      } else {
        setAllCompetitions(MOCK_COMPETITIONS);
      }
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
        scheduleImage,
        uploadSchedule,
        scoringImage,
        uploadScoring,
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
        signIn,
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
