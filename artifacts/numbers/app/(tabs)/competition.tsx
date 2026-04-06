import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
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

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

interface Document {
  id: string;
  name: string;
  type: "schedule" | "scoring";
  uploadedBy: string;
  uploadedAt: Date;
}

const MOCK_DOCS: Document[] = [
  {
    id: "d1",
    name: "Schedule_STARBOUND_2026.pdf",
    type: "schedule",
    uploadedBy: "Lisa K.",
    uploadedAt: new Date(Date.now() - 2 * 3600000),
  },
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function DocCard({ doc }: { doc: Document }) {
  const colors = useColors();
  return (
    <View style={[styles.docCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <MaterialCommunityIcons
        name={doc.type === "schedule" ? "calendar-clock" : "clipboard-text-outline"}
        size={22}
        color={doc.type === "schedule" ? colors.violet : colors.lilac}
      />
      <View style={styles.docInfo}>
        <Text style={[styles.docName, { color: colors.foreground }]} numberOfLines={1}>
          {doc.name}
        </Text>
        <Text style={[styles.docMeta, { color: colors.mutedForeground }]}>
          Uploaded by {doc.uploadedBy} · {formatTime(doc.uploadedAt)}
        </Text>
      </View>
      <Pressable
        style={({ pressed }) => [
          styles.openBtn,
          { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <Feather name="external-link" size={14} color={colors.violet} />
      </Pressable>
    </View>
  );
}

function UploadPlaceholder({ label }: { label: string }) {
  const colors = useColors();
  return (
    <Pressable
      style={({ pressed }) => [
        styles.uploadPlaceholder,
        { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }}
    >
      <Feather name="upload" size={20} color={colors.violet} />
      <Text style={[styles.uploadText, { color: colors.violet }]}>Upload {label}</Text>
      <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>
        Share with everyone at the competition
      </Text>
    </Pressable>
  );
}

export default function CompetitionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentNumber, submitCurrentNumber } = useApp();
  const [docs] = useState<Document[]>(MOCK_DOCS);
  const [showQuickReport, setShowQuickReport] = useState(false);
  const [reportNumInput, setReportNumInput] = useState("");

  const scheduleDocs = docs.filter((d) => d.type === "schedule");
  const scoringDocs = docs.filter((d) => d.type === "scoring");
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleQuickReport = () => {
    const n = parseInt(reportNumInput, 10);
    if (!isNaN(n) && n > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      submitCurrentNumber(n);
    }
    setReportNumInput("");
    setShowQuickReport(false);
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
        <Text style={[styles.screenTitle, { color: colors.lavender }]}>COMPETITION</Text>

        <View style={[styles.trackerStrip, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.stripLeft}>
            <View style={[styles.liveDot, { backgroundColor: colors.green }]} />
            <Text style={[styles.stripLabel, { color: colors.mutedForeground }]}>ON STAGE</Text>
            <Text style={[styles.stripNumber, { color: colors.lavender }]}>{currentNumber}</Text>
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.quickReportBtn,
              { backgroundColor: colors.violet, opacity: pressed ? 0.75 : 1 },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setShowQuickReport(true);
            }}
          >
            <Feather name="send" size={14} color={colors.foreground} />
            <Text style={[styles.quickReportText, { color: colors.foreground }]}>Report</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SCHEDULE</Text>
        {scheduleDocs.map((d) => <DocCard key={d.id} doc={d} />)}
        <UploadPlaceholder label="Schedule" />

        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>SCORING RUBRICS</Text>
        {scoringDocs.map((d) => <DocCard key={d.id} doc={d} />)}
        <UploadPlaceholder label="Scoring Rubric" />
      </ScrollView>

      <Modal
        visible={showQuickReport}
        animationType="slide"
        transparent
        onRequestClose={() => setShowQuickReport(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowQuickReport(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable>
              <Text style={[styles.modalTitle, { color: colors.foreground }]}>Report Stage Number</Text>
              <TextInput
                style={[
                  styles.bigInput,
                  { backgroundColor: colors.surface, color: colors.foreground, borderColor: colors.border },
                ]}
                placeholder="Enter #"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                value={reportNumInput}
                onChangeText={setReportNumInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleQuickReport}
                maxLength={4}
              />
              <View style={styles.modalBtns}>
                <Pressable
                  style={[styles.cancelBtn, { borderColor: colors.border }]}
                  onPress={() => setShowQuickReport(false)}
                >
                  <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.submitBtn, { backgroundColor: colors.violet }]}
                  onPress={handleQuickReport}
                >
                  <Text style={[styles.submitText, { color: colors.foreground }]}>Submit</Text>
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
  container: { flex: 1 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 22 },
  screenTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
    marginBottom: 16,
  },
  trackerStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 24,
  },
  stripLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stripLabel: {
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: "Inter_500Medium",
  },
  stripNumber: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  quickReportBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  quickReportText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  sectionTitle: {
    fontSize: 10,
    letterSpacing: 3,
    fontFamily: "Inter_500Medium",
    marginBottom: 12,
    marginTop: 8,
  },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  docInfo: { flex: 1 },
  docName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  docMeta: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
  },
  openBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadPlaceholder: {
    alignItems: "center",
    paddingVertical: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    marginBottom: 20,
    gap: 6,
  },
  uploadText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  uploadSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
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
    marginBottom: 16,
  },
  bigInput: {
    height: 64,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
    marginBottom: 16,
    textAlign: "center",
  },
  modalBtns: {
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
