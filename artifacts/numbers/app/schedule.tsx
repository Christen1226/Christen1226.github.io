import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ScheduleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { competition, scheduleImage, uploadSchedule, joinedCompetitionIds } = useApp();
  const isJoined = !!competition && joinedCompetitionIds.includes(competition.id);

  // pendingImage = picked but not yet published
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.8,
      allowsEditing: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    const mime = asset.mimeType ?? "image/jpeg";
    setPendingImage(`data:${mime};base64,${asset.base64}`);
  };

  const handlePublish = async () => {
    if (!pendingImage) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setPublishing(true);
    await uploadSchedule(pendingImage);
    setPublishing(false);
    setPendingImage(null);
  };

  const handleRetake = async () => {
    setPendingImage(null);
    await pickImage();
  };

  const handleCancel = () => {
    setPendingImage(null);
  };

  // ── PREVIEW STATE ──────────────────────────────────────────────────────────
  if (pendingImage) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Preview header */}
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable
            onPress={handleCancel}
            style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="x" size={20} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>PREVIEW</Text>
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
              Review before publishing
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 32 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Preview image */}
          <Image
            source={{ uri: pendingImage }}
            style={styles.previewImage}
            resizeMode="contain"
          />

          {/* Action banner */}
          <View style={[styles.previewBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="info" size={14} color={colors.mutedForeground} />
            <Text style={[styles.previewBannerText, { color: colors.mutedForeground }]}>
              Once published, this schedule is visible to everyone in{" "}
              <Text style={{ color: colors.lavender }}>
                {competition?.name ?? "your competition"}
              </Text>
              .
            </Text>
          </View>

          {/* Buttons */}
          <View style={styles.previewActions}>
            <Pressable
              onPress={handleRetake}
              style={({ pressed }) => [
                styles.retakeBtn,
                { borderColor: colors.border, backgroundColor: colors.surface, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Feather name="refresh-cw" size={15} color={colors.foreground} />
              <Text style={[styles.retakeBtnText, { color: colors.foreground }]}>Choose different</Text>
            </Pressable>

            <Pressable
              onPress={handlePublish}
              style={({ pressed }) => [
                styles.publishBtn,
                { backgroundColor: colors.violet, opacity: pressed ? 0.8 : 1 },
              ]}
              disabled={publishing}
            >
              {publishing ? (
                <ActivityIndicator size="small" color={colors.foreground} />
              ) : (
                <Feather name="upload-cloud" size={16} color={colors.foreground} />
              )}
              <Text style={[styles.publishBtnText, { color: colors.foreground }]}>
                {publishing ? "Publishing…" : "Publish to Competition"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── NORMAL STATE ───────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>SCHEDULE</Text>
          {competition && (
            <Text style={[styles.headerSub, { color: colors.mutedForeground }]} numberOfLines={1}>
              {competition.name}
            </Text>
          )}
        </View>
        {isJoined && (
          <Pressable
            onPress={pickImage}
            style={({ pressed }) => [
              styles.uploadBtn,
              { backgroundColor: colors.violet, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <Feather name="upload" size={16} color={colors.foreground} />
          </Pressable>
        )}
        {!isJoined && <View style={styles.uploadBtn} />}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {scheduleImage ? (
          <View style={styles.imageWrapper}>
            <Image
              source={{ uri: scheduleImage }}
              style={styles.scheduleImage}
              resizeMode="contain"
            />
            {isJoined && (
              <Pressable
                onPress={pickImage}
                style={({ pressed }) => [
                  styles.replaceBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
                <Text style={[styles.replaceBtnText, { color: colors.mutedForeground }]}>
                  Replace schedule
                </Text>
              </Pressable>
            )}
          </View>
        ) : isJoined ? (
          <Pressable
            onPress={pickImage}
            style={({ pressed }) => [
              styles.emptyState,
              { borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <MaterialCommunityIcons name="calendar-clock" size={48} color={colors.violet} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No schedule yet</Text>
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
              Tap to upload a photo of the competition schedule
            </Text>
            <View style={[styles.uploadPill, { backgroundColor: colors.violet }]}>
              <Feather name="upload" size={14} color={colors.foreground} />
              <Text style={[styles.uploadPillText, { color: colors.foreground }]}>Upload Schedule</Text>
            </View>
          </Pressable>
        ) : (
          <View
            style={[
              styles.emptyState,
              styles.emptyStateReadOnly,
              { borderColor: colors.border },
            ]}
          >
            <MaterialCommunityIcons name="calendar-clock" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No schedule yet</Text>
            <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
              Join this competition to upload or view the schedule
            </Text>
          </View>
        )}

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            {isJoined
              ? "Uploaded schedules are shared with everyone in this competition. You can also upload from the Competition tab."
              : "Schedule uploads are available to members of this competition only."}
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
    letterSpacing: 0.3,
  },
  uploadBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  // Preview state
  previewImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 0.75,
    borderRadius: 14,
  },
  previewBanner: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "flex-start",
  },
  previewBannerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    flex: 1,
  },
  previewActions: {
    gap: 10,
  },
  retakeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
  },
  retakeBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  publishBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  // Normal state
  imageWrapper: { gap: 12 },
  scheduleImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 0.75,
    borderRadius: 14,
  },
  replaceBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
  },
  replaceBtnText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  emptyState: {
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dashed",
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  emptyStateReadOnly: {
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  emptyHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
    maxWidth: 260,
  },
  uploadPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    marginTop: 8,
  },
  uploadPillText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "flex-start",
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
    flex: 1,
  },
});
