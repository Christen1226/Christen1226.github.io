import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { CommunityReport, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function formatTimeAgo(date: Date): string {
  const diff = Math.floor((Date.now() - date.getTime()) / 1000);
  if (diff < 60) return "just now";
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function reportTypeColor(type: CommunityReport["type"], colors: ReturnType<typeof useColors>): string {
  switch (type) {
    case "delay": return colors.red;
    case "out-of-order": return colors.yellow;
    case "technical": return colors.yellow;
    case "general": return colors.violet;
  }
}

function reportTypeBg(type: CommunityReport["type"]): string {
  switch (type) {
    case "delay": return "rgba(232,93,93,0.08)";
    case "out-of-order": return "rgba(232,196,93,0.07)";
    case "technical": return "rgba(232,196,93,0.07)";
    case "general": return "rgba(155,111,232,0.08)";
  }
}

function reportTypeBorder(type: CommunityReport["type"]): string {
  switch (type) {
    case "delay": return "rgba(232,93,93,0.22)";
    case "out-of-order": return "rgba(232,196,93,0.22)";
    case "technical": return "rgba(232,196,93,0.22)";
    case "general": return "rgba(155,111,232,0.22)";
  }
}

function ReportItem({ report }: { report: CommunityReport }) {
  const colors = useColors();
  const { confirmReport } = useApp();
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (confirmed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setConfirmed(true);
    confirmReport(report.id);
  };

  return (
    <View
      style={[
        styles.reportItem,
        {
          backgroundColor: reportTypeBg(report.type),
          borderColor: reportTypeBorder(report.type),
        },
      ]}
    >
      <View style={styles.reportLeft}>
        <Text style={[styles.reportMessage, { color: colors.softWhite }]}>
          {report.message}
        </Text>
        <Text style={[styles.reportMeta, { color: colors.mutedForeground }]}>
          {report.reporter} · {formatTimeAgo(report.timestamp)}
        </Text>
      </View>
      <Pressable onPress={handleConfirm} style={styles.confirmBtn}>
        <Feather
          name="check-circle"
          size={16}
          color={confirmed ? colors.green : colors.mutedForeground}
        />
        <Text
          style={[
            styles.confirmCount,
            { color: confirmed ? colors.green : colors.mutedForeground },
          ]}
        >
          {report.confirmations}
        </Text>
      </Pressable>
    </View>
  );
}

const REPORT_TYPES: { value: CommunityReport["type"]; label: string }[] = [
  { value: "delay", label: "Delay / Break" },
  { value: "out-of-order", label: "Out of Order" },
  { value: "technical", label: "Technical Issue" },
  { value: "general", label: "General Alert" },
];

export function ReportsFeed() {
  const colors = useColors();
  const { reports, submitReport } = useApp();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<CommunityReport["type"]>("delay");
  const [message, setMessage] = useState("");

  const handleSubmitReport = () => {
    if (!message.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    submitReport(selectedType, message.trim());
    setMessage("");
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>COMMUNITY ALERTS</Text>
        <Pressable
          style={({ pressed }) => [
            styles.addBtn,
            { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => setModalVisible(true)}
        >
          <Feather name="alert-triangle" size={12} color={colors.violet} />
          <Text style={[styles.addBtnText, { color: colors.violet }]}>Report</Text>
        </Pressable>
      </View>

      {reports.length === 0 ? (
        <View style={[styles.emptyState, { borderColor: colors.border }]}>
          <MaterialCommunityIcons name="check-circle-outline" size={28} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>All clear</Text>
        </View>
      ) : (
        reports.slice(0, 5).map((r) => <ReportItem key={r.id} report={r} />)
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <View
            style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Pressable>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Report an Alert</Text>

              <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>TYPE</Text>
              <View style={styles.typeRow}>
                {REPORT_TYPES.map((t) => (
                  <Pressable
                    key={t.value}
                    onPress={() => setSelectedType(t.value)}
                    style={[
                      styles.typeChip,
                      {
                        backgroundColor:
                          selectedType === t.value ? colors.violet : colors.surface,
                        borderColor:
                          selectedType === t.value ? colors.violet : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        {
                          color:
                            selectedType === t.value ? colors.foreground : colors.mutedForeground,
                        },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>MESSAGE</Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: colors.surface,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="What's happening?"
                placeholderTextColor={colors.mutedForeground}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />

              <View style={styles.modalButtons}>
                <Pressable
                  style={[styles.modalCancelBtn, { borderColor: colors.border }]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={[styles.modalCancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalSubmitBtn, { backgroundColor: colors.violet }]}
                  onPress={handleSubmitReport}
                >
                  <Text style={[styles.modalSubmitText, { color: colors.foreground }]}>Submit</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: "Inter_500Medium",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  addBtnText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  reportItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 10,
  },
  reportLeft: {
    flex: 1,
  },
  reportMessage: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    lineHeight: 18,
  },
  reportMeta: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
    letterSpacing: 0.3,
  },
  confirmBtn: {
    alignItems: "center",
    gap: 3,
  },
  confirmCount: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  emptyState: {
    alignItems: "center",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
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
    marginBottom: 10,
  },
  typeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 80,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  modalSubmitBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalSubmitText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
