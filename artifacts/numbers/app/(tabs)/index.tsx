import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Image,
  Platform,
  Pressable,
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

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { competition, userInitials, isSignedIn, profileImage } = useApp();
  const router = useRouter();

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

        <LiveTrackerCard />
        <MyNumbersWidget />
        <ReportsFeed />
        <ResourcesWidget />
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
});
