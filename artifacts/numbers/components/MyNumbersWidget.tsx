import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export function MyNumbersWidget() {
  const colors = useColors();
  const { dancers, currentNumber } = useApp();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>MY NUMBERS</Text>
        <Pressable onPress={() => router.push("/my-numbers")}>
          <Feather name="edit-2" size={14} color={colors.violet} />
        </Pressable>
      </View>

      {dancers.length === 0 ? (
        <Pressable
          style={({ pressed }) => [styles.emptyAdd, { borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
          onPress={() => router.push("/my-numbers")}
        >
          <Feather name="plus" size={16} color={colors.violet} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Add your dancers</Text>
        </Pressable>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
          {dancers.map((dancer) => {
            const isUpcoming = dancer.numbers.some((n) => n > currentNumber && n - currentNumber <= 10);
            const isNow = dancer.numbers.includes(currentNumber);
            return (
              <View
                key={dancer.id}
                style={[
                  styles.dancerCard,
                  {
                    backgroundColor: isNow
                      ? "rgba(155,111,232,0.18)"
                      : isUpcoming
                      ? "rgba(93,232,140,0.08)"
                      : colors.surface,
                    borderColor: isNow
                      ? colors.violet
                      : isUpcoming
                      ? colors.green
                      : colors.border,
                  },
                ]}
              >
                {isNow && (
                  <View style={[styles.nowBadge, { backgroundColor: colors.violet }]}>
                    <Text style={styles.nowBadgeText}>NOW</Text>
                  </View>
                )}
                {isUpcoming && !isNow && (
                  <View style={[styles.nowBadge, { backgroundColor: colors.green }]}>
                    <Text style={[styles.nowBadgeText, { color: "#0E0A16" }]}>SOON</Text>
                  </View>
                )}
                <Text style={[styles.dancerName, { color: colors.foreground }]} numberOfLines={1}>
                  {dancer.name}
                </Text>
                <View style={styles.numRow}>
                  {dancer.numbers.map((n) => (
                    <View
                      key={n}
                      style={[
                        styles.numChip,
                        {
                          backgroundColor:
                            n === currentNumber
                              ? colors.violet
                              : "rgba(155,111,232,0.15)",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.numText,
                          { color: n === currentNumber ? colors.foreground : colors.lavender },
                        ]}
                      >
                        #{n}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: "Inter_500Medium",
  },
  scroll: {
    marginHorizontal: -4,
  },
  dancerCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 4,
    minWidth: 110,
    maxWidth: 140,
  },
  nowBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 8,
  },
  nowBadgeText: {
    fontSize: 8,
    fontFamily: "Inter_700Bold",
    color: "#F0ECF7",
    letterSpacing: 1,
  },
  dancerName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  numRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
  },
  numChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  numText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
  },
  emptyAdd: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
});
