import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export function ResourcesWidget() {
  const colors = useColors();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>RESOURCES</Text>
      </View>

      <View style={styles.row}>
        <Pressable
          style={({ pressed }) => [
            styles.resourceBtn,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => router.push("/schedule")}
        >
          <MaterialCommunityIcons name="calendar-clock" size={20} color={colors.violet} />
          <Text style={[styles.resourceLabel, { color: colors.foreground }]}>Schedule</Text>
          <Text style={[styles.resourceSub, { color: colors.mutedForeground }]}>View / Upload</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.resourceBtn,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => router.push("/scoring")}
        >
          <MaterialCommunityIcons name="clipboard-text-outline" size={20} color={colors.lilac} />
          <Text style={[styles.resourceLabel, { color: colors.foreground }]}>Scoring</Text>
          <Text style={[styles.resourceSub, { color: colors.mutedForeground }]}>Rubrics & Docs</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: "Inter_500Medium",
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  resourceBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
  },
  resourceLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
  },
  resourceSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
