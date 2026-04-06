import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Dancer, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function DancerCard({ dancer }: { dancer: Dancer }) {
  const colors = useColors();
  const { currentNumber, removeDancer } = useApp();

  const isNow = dancer.numbers.includes(currentNumber);
  const isUpcoming = dancer.numbers.some((n) => n > currentNumber && n - currentNumber <= 10);

  const handleDelete = () => {
    Alert.alert("Remove Dancer", `Remove ${dancer.name}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          removeDancer(dancer.id);
        },
      },
    ]);
  };

  return (
    <View
      style={[
        styles.dancerCard,
        {
          backgroundColor: isNow
            ? "rgba(155,111,232,0.12)"
            : colors.card,
          borderColor: isNow ? colors.violet : isUpcoming ? colors.green : colors.border,
        },
      ]}
    >
      <View style={styles.dancerTop}>
        <View style={styles.dancerLeft}>
          {(isNow || isUpcoming) && (
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isNow ? colors.violet : colors.green },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: isNow ? colors.foreground : "#0E0A16" }]}>
                {isNow ? "ON STAGE" : "COMING UP"}
              </Text>
            </View>
          )}
          <Text style={[styles.dancerName, { color: colors.foreground }]}>{dancer.name}</Text>
        </View>
        <Pressable onPress={handleDelete} hitSlop={8}>
          <Feather name="trash-2" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <View style={styles.numbersRow}>
        {dancer.numbers.map((n) => (
          <View
            key={n}
            style={[
              styles.numPill,
              {
                backgroundColor:
                  n === currentNumber ? colors.violet : "rgba(155,111,232,0.15)",
              },
            ]}
          >
            <Text
              style={[
                styles.numPillText,
                { color: n === currentNumber ? colors.foreground : colors.lavender },
              ]}
            >
              #{n}
            </Text>
          </View>
        ))}
      </View>

      <View style={[styles.stageRow, { borderTopColor: colors.border }]}>
        <Text style={[styles.stageLabel, { color: colors.mutedForeground }]}>Stage now:</Text>
        <Text style={[styles.stageNum, { color: colors.lavender }]}>{currentNumber}</Text>
        {dancer.numbers.length > 0 && (
          <>
            <Text style={[styles.stageLabel, { color: colors.mutedForeground }]}>
              ·  Next: #{Math.min(...dancer.numbers.filter((n) => n > currentNumber)) || "–"}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

export default function MyNumbersScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { dancers, addDancer } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [numbersText, setNumbersText] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleAdd = () => {
    if (!name.trim()) return;
    const nums = numbersText
      .split(/[\s,]+/)
      .map((s) => parseInt(s, 10))
      .filter((n) => !isNaN(n) && n > 0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addDancer(name.trim(), nums);
    setName("");
    setNumbersText("");
    setModalVisible(false);
  };

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
        <View style={styles.titleRow}>
          <Text style={[styles.screenTitle, { color: colors.lavender }]}>MY NUMBERS</Text>
          <Pressable
            style={[styles.addDancerBtn, { backgroundColor: colors.violet }]}
            onPress={() => setModalVisible(true)}
          >
            <Feather name="plus" size={16} color={colors.foreground} />
            <Text style={[styles.addDancerText, { color: colors.foreground }]}>Add Dancer</Text>
          </Pressable>
        </View>

        {dancers.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Feather name="users" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No dancers yet</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Add your dancers and their competition numbers to track them easily.
            </Text>
            <Pressable
              style={[styles.emptyAddBtn, { backgroundColor: colors.violet }]}
              onPress={() => setModalVisible(true)}
            >
              <Text style={[styles.emptyAddText, { color: colors.foreground }]}>Add First Dancer</Text>
            </Pressable>
          </View>
        ) : (
          dancers.map((d) => <DancerCard key={d.id} dancer={d} />)
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalWrapper}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
            <View
              style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Pressable>
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>Add Dancer</Text>

                <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>DANCER NAME</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
                  ]}
                  placeholder="e.g. Emma"
                  placeholderTextColor={colors.mutedForeground}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  returnKeyType="next"
                />

                <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>COMPETITION NUMBER(S)</Text>
                <TextInput
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
                  ]}
                  placeholder="e.g. 42, 87"
                  placeholderTextColor={colors.mutedForeground}
                  value={numbersText}
                  onChangeText={setNumbersText}
                  keyboardType="numbers-and-punctuation"
                  returnKeyType="done"
                  onSubmitEditing={handleAdd}
                />
                <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
                  Separate multiple numbers with commas
                </Text>

                <View style={styles.modalButtons}>
                  <Pressable
                    style={[styles.cancelBtn, { borderColor: colors.border }]}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.submitBtn, { backgroundColor: colors.violet }]}
                    onPress={handleAdd}
                  >
                    <Text style={[styles.submitText, { color: colors.foreground }]}>Add</Text>
                  </Pressable>
                </View>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22 },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  screenTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  addDancerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
  },
  addDancerText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  dancerCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  dancerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  dancerLeft: {
    flex: 1,
    gap: 6,
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  dancerName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  numbersRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  numPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  numPillText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  stageRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  stageLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  stageNum: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: "center",
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    gap: 10,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyAddBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyAddText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  modalWrapper: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 9,
    letterSpacing: 2.5,
    fontFamily: "Inter_500Medium",
    marginBottom: 8,
  },
  textInput: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
  },
  hintText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: -8,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  submitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
