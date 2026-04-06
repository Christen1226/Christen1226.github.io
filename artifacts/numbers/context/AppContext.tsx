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
  date: string;
}

interface AppContextValue {
  currentNumber: number;
  lastReportedAt: Date | null;
  reporterCount: number;
  reports: CommunityReport[];
  dancers: Dancer[];
  competition: Competition | null;
  isSignedIn: boolean;
  userName: string;
  userInitials: string;
  submitCurrentNumber: (num: number) => void;
  submitReport: (type: CommunityReport["type"], message: string) => void;
  confirmReport: (id: string) => void;
  addDancer: (name: string, numbers: number[]) => void;
  removeDancer: (id: string) => void;
  updateDancerNumbers: (id: string, numbers: number[]) => void;
  setCompetition: (comp: Competition) => void;
  signIn: (name: string) => void;
  signOut: () => void;
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

const DEFAULT_COMPETITION: Competition = {
  id: "c1",
  name: "STARBOUND 2026",
  venue: "Marriott Convention Center",
  date: "April 6, 2026",
};

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentNumber, setCurrentNumber] = useState(52);
  const [lastReportedAt, setLastReportedAt] = useState<Date | null>(new Date(Date.now() - 3 * 60000));
  const [reporterCount, setReporterCount] = useState(12);
  const [reports, setReports] = useState<CommunityReport[]>(MOCK_REPORTS);
  const [dancers, setDancers] = useState<Dancer[]>([]);
  const [competition, setCompetitionState] = useState<Competition | null>(DEFAULT_COMPETITION);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const dancersJson = await AsyncStorage.getItem("dancers");
        if (dancersJson) setDancers(JSON.parse(dancersJson));
        const userJson = await AsyncStorage.getItem("user");
        if (userJson) {
          const user = JSON.parse(userJson);
          setIsSignedIn(true);
          setUserName(user.name);
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

  const setCompetition = useCallback((comp: Competition) => {
    setCompetitionState(comp);
  }, []);

  const signIn = useCallback(async (name: string) => {
    setUserName(name);
    setIsSignedIn(true);
    await AsyncStorage.setItem("user", JSON.stringify({ name }));
  }, []);

  const signOut = useCallback(async () => {
    setIsSignedIn(false);
    setUserName("");
    await AsyncStorage.removeItem("user");
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
        isSignedIn,
        userName,
        userInitials,
        submitCurrentNumber,
        submitReport,
        confirmReport,
        addDancer,
        removeDancer,
        updateDancerNumbers,
        setCompetition,
        signIn,
        signOut,
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
