import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LiveTrackerCard } from "@/components/LiveTrackerCard";
import { MyNumbersWidget } from "@/components/MyNumbersWidget";
import { ReportsFeed } from "@/components/ReportsFeed";
import { ResourcesWidget } from "@/components/ResourcesWidget";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function NoCompetitionState() {
  const colors = useColors();
  const router = useRouter();

  return (
    <View style={[styles.emptyWrap, { borderColor: colors.border }]}>
      <View style={[styles.emptyIconCircle, { backgroundColor: "rgba(155,111,232,0.12)" }]}>
        <MaterialCommunityIcons name="trophy-outline" size={36} color={colors.violet} />
      </View>
      <Text style={[styles.emptyHeading, { color: colors.foreground }]}>
        No competition yet
      </Text>
      <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
        Search for an existing competition or create one to start tracking stage numbers with your crew.
      </Text>
      <Pressable
        style={({ pressed }) => [
          styles.emptyBtn,
          { backgroundColor: colors.violet, opacity: pressed ? 0.8 : 1 },
        ]}
        onPress={() => router.navigate("/(tabs)/competition")}
      >
        <Feather name="search" size={15} color={colors.foreground} />
        <Text style={[styles.emptyBtnText, { color: colors.foreground }]}>
          Find a Competition
        </Text>
      </Pressable>
    </View>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { competition, userInitials, isSignedIn, profileImage, refreshStage } = useApp();
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshStage();
    setRefreshing(false);
  }, [refreshStage]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPad + 12,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 84,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.violet}
            colors={[colors.violet]}
          />
        }
      >
        <View style={styles.topRow}>
          <View>
            <Text style={[styles.compName, { color: colors.lavender }]}>
              {competition?.name ?? "NUMBERS"}
            </Text>
            {competition?.venue ? (
              <Text style={[styles.compVenue, { color: colors.mutedForeground }]}>
                {competition.venue}
              </Text>
            ) : null}
          </View>

          <Pressable
            onPress={() => router.push("/profile")}
            style={[
              styles.avatar,
              { backgroundColor: profileImage ? "transparent" : colors.violet },
            ]}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : isSignedIn && userInitials ? (
              <Text style={[styles.avatarText, { color: colors.foreground }]}>{userInitials}</Text>
            ) : (
              <Feather name="user" size={16} color={colors.foreground} />
            )}
          </Pressable>
        </View>

        {competition === null ? (
          <NoCompetitionState />
        ) : (
          <>
            <LiveTrackerCard />
            <MyNumbersWidget />
            <ReportsFeed />
            <ResourcesWidget />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 22,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  compName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  compVenue: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  emptyWrap: {
    marginTop: 32,
    borderWidth: 1,
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 12,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  emptyHeading: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 4,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 4,
  },
  emptyBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
