import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

export interface Dancer {
  id: string;
  name: string;
  numbers: numberapiComps;
        // Also include any locally-cached competitions the API may not have (offline created)
        const compsJson = await AsyncStorage.getItem("competitions");
        if (compsJson) {
          const saved: CompetitionapiComps;
      // Also keep any offline-created competitions not yet on server
      const compsJson = await AsyncStorage.getItem("competitions");
      if (compsJson) {
        const saved: Competition[] = JSON.parse(compsJson);
        for (const s of saved) {
          if (!apiIds.has(s.id)) {
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
        JSON.stringify(updated)
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
      const userCreated = updated;
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
        const userCreated = updated;
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
        const userCreated = updated;
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
        userLoaded,
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
