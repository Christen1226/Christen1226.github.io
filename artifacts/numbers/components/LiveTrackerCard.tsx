import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function formatTimeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  const mins = Math.floor(diff / 60);
  if (mins === 1) return "1 min ago";
  return `${mins} min ago`;
}

export function LiveTrackerCard() {
  const colors = useColors();
  const { currentNumber, lastReportedAt, reporterCount, submitCurrentNumber, isLive } = useApp();
  const [inputValue, setInputValue] = useState("");
  const scale = useSharedValue(1);
  const glow = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: glow.value,
  }));

  const handleSubmit = () => {
    const num = parseInt(inputValue, 10);
    if (isNaN(num) || num < 1) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    scale.value = withSequence(withSpring(1.15), withSpring(1));
    glow.value = withSequence(withTiming(0.6, { duration: 120 }), withTiming(1, { duration: 300 }));
    submitCurrentNumber(num);
    setInputValue("");
  };

  const increment = () => {
    const n = parseInt(inputValue || String(currentNumber), 10);
    setInputValue(String((isNaN(n) ? 0 : n) + 1));
  };

  const decrement = () => {
    const n = parseInt(inputValue || String(currentNumber), 10);
    if (!isNaN(n) && n > 1) setInputValue(String(n - 1));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.liveDot, { backgroundColor: isLive ? colors.green : colors.mutedForeground }]} />
        <Text style={[styles.headerLabel, { color: colors.mutedForeground }]}>ON STAGE NOW</Text>
        <View style={styles.syncBadge}>
          {isLive ? (
            <>
              <View style={[styles.syncDot, { backgroundColor: colors.green }]} />
              <Text style={[styles.syncText, { color: colors.green }]}>LIVE</Text>
            </>
          ) : (
            <>
              <Feather name="wifi-off" size={9} color={colors.mutedForeground} />
              <Text style={[styles.syncText, { color: colors.mutedForeground }]}>LOCAL</Text>
            </>
          )}
        </View>
      </View>

      <Animated.Text style={[styles.bigNumber, { color: colors.lavender }, animStyle]}>
        {currentNumber === 0 ? "—" : currentNumber}
      </Animated.Text>

      {currentNumber === 0 && (
        <Text style={[styles.waitingText, { color: colors.mutedForeground }]}>
          Waiting for first report…
        </Text>
      )}

      {lastReportedAt && currentNumber > 0 && (
        <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
          {formatTimeAgo(lastReportedAt)} · {reporterCount} reporter{reporterCount !== 1 ? "s" : ""}
        </Text>
      )}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>REPORT CURRENT NUMBER</Text>
      <View style={styles.inputRow}>
        <Pressable
          onPress={decrement}
          style={({ pressed }) => [styles.stepBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.stepBtnText, { color: colors.foreground }]}>−</Text>
        </Pressable>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.surface,
              color: '#F0ECF7',
              borderColor: colors.border,
            },
          ]}
          placeholder="Enter #"
          placeholderTextColor={colors.mutedForeground}
          keyboardType="number-pad"
          value={inputValue}
          onChangeText={setInputValue}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
          maxLength={4}
        />
        <Pressable
          onPress={increment}
          style={({ pressed }) => [styles.stepBtn, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.stepBtnText, { color: colors.foreground }]}>+</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: colors.violet, opacity: pressed ? 0.75 : 1 },
          ]}
          onPress={handleSubmit}
        >
          <Feather name="send" size={18} color={colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerLabel: {
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  syncBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  syncDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  syncText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.5,
  },
  bigNumber: {
    fontSize: 80,
    letterSpacing: 4,
    fontFamily: "Inter_700Bold",
    lineHeight: 88,
  },
  waitingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    marginBottom: 16,
  },
  timestamp: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 9,
    letterSpacing: 2.5,
    fontFamily: "Inter_500Medium",
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row",
    gap: 10,
  },
  stepBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepBtnText: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: "Inter_600SemiBold",
  },
  input: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
  submitBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});