import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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
  submitCurrentNumber: (num: number) => void;
  submitReport: (type: CommunityReport["type"], message: string) => void;
  confirmReport: (id: string) => void;
  addDancer: (name: string, numbers: number[]) => void;
  removeDancer: (id: string) => void;
  updateDancerNumbers: (id: string, numbers: number[]) => void;
  updateDancer: (id: string, name: string, numbers: number[]) => void;
  setCompetition: (comp: Competition) => void;
  createCompetition: (name: string, venue: string, location: string, startDate: string, endDate: string) => void;
  joinCompetition: (id: string) => void;
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

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentNumber, setCurrentNumber] = useState(52);
  const [lastReportedAt, setLastReportedAt] = useState<Date | null>(new Date(Date.now() - 3 * 60000));
  const [reporterCount, setReporterCount] = useState(12);
  const [reports, setReports] = useState<CommunityReport[]>(MOCK_REPORTS);
  const [dancers, setDancers] = useState<Dancer[]>([]);
  const [competition, setCompetitionState] = useState<Competition | null>(MOCK_COMPETITIONS[0]);
  const [allCompetitions, setAllCompetitions] = useState<Competition[]>(MOCK_COMPETITIONS);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userName, setUserName] = useState("");
  const [profileImage, setProfileImageState] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const dancersJson = await AsyncStorage.getItem("dancers");
        if (dancersJson) setDancers(JSON.parse(dancersJson));

        const compsJson = await AsyncStorage.getItem("competitions");
        if (compsJson) {
          const saved: Competition[] = JSON.parse(compsJson);
          // Merge mock competitions with any user-created ones
          const userCreated = saved.filter((s) => !MOCK_COMPETITIONS.find((m) => m.id === s.id));
          setAllCompetitions([...MOCK_COMPETITIONS, ...userCreated]);
        }

        const activeCompJson = await AsyncStorage.getItem("activeCompetition");
        if (activeCompJson) setCompetitionState(JSON.parse(activeCompJson));

        const userJson = await AsyncStorage.getItem("user");
        if (userJson) {
          const user = JSON.parse(userJson);
          setIsSignedIn(true);
          setUserName(user.name);
          if (user.profileImage) setProfileImageState(user.profileImage);
        }
      } catch {}
    };
    load();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("dancers", JSON.stringify(dancers)).catch(() => {});
  }, [dancers]);

  const userInitials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const submitCurrentNumber = useCallback((num: number) => {
    setCurrentNumber(num);
    setLastReportedAt(new Date());
    setReporterCount((c) => c + 1);
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
    setReports((prev) => [newReport, ...prev]);
  }, [userName]);

  const confirmReport = useCallback((id: string) => {
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, confirmations: r.confirmations + 1 } : r))
    );
  }, []);

  const addDancer = useCallback((name: string, numbers: number[]) => {
    const dancer: Dancer = { id: generateId(), name, numbers };
    setDancers((prev) => [...prev, dancer]);
  }, []);

  const removeDancer = useCallback((id: string) => {
    setDancers((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const updateDancerNumbers = useCallback((id: string, numbers: number[]) => {
    setDancers((prev) => prev.map((d) => (d.id === id ? { ...d, numbers } : d)));
  }, []);

  const updateDancer = useCallback((id: string, name: string, numbers: number[]) => {
    setDancers((prev) => prev.map((d) => (d.id === id ? { ...d, name, numbers } : d)));
  }, []);

  const setCompetition = useCallback((comp: Competition) => {
    setCompetitionState(comp);
    AsyncStorage.setItem("activeCompetition", JSON.stringify(comp)).catch(() => {});
  }, []);

  const joinCompetition = useCallback((id: string) => {
    setAllCompetitions((prev) => {
      const found = prev.find((c) => c.id === id);
      if (!found) return prev;
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
      setAllCompetitions((prev) => {
        const updated = [newComp, ...prev];
        const userCreated = updated.filter((c) => !MOCK_COMPETITIONS.find((m) => m.id === c.id));
        AsyncStorage.setItem("competitions", JSON.stringify(userCreated)).catch(() => {});
        return updated;
      });
      setCompetitionState(newComp);
      AsyncStorage.setItem("activeCompetition", JSON.stringify(newComp)).catch(() => {});
    },
    [userName]
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
        submitCurrentNumber,
        submitReport,
        confirmReport,
        addDancer,
        removeDancer,
        updateDancerNumbers,
        updateDancer,
        setCompetition,
        createCompetition,
        joinCompetition,
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
