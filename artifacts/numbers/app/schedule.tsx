import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { UploadedImage, useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export default function ScheduleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { competition, scheduleImages, uploadSchedule, deleteScheduleImage, joinedCompetitionIds } = useApp();
  const isJoined = !!competition && joinedCompetitionIds.includes(competition.id);

  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showToast = () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(2400),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    toastTimer.current = setTimeout(() => { toastOpacity.setValue(0); }, 3000);
  };
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

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
    showToast();
  };

  const handleDelete = async (img: UploadedImage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDeletingId(img.id);
    await deleteScheduleImage(img.id);
    setDeletingId(null);
  };

  // ── PREVIEW STATE ─────────────────────────────────────────────────────────
  if (pendingImage) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable
            onPress={() => setPendingImage(null)}
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
          contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          <Image source={{ uri: pendingImage }} style={styles.previewImage} resizeMode="contain" />

          <View style={[styles.previewBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="info" size={14} color={colors.mutedForeground} />
            <Text style={[styles.previewBannerText, { color: colors.mutedForeground }]}>
              This will be added to the schedule gallery for{" "}
              <Text style={{ color: colors.lavender }}>{competition?.name ?? "your competition"}</Text>.
            </Text>
          </View>

          <View style={styles.previewActions}>
            <Pressable
              onPress={async () => { setPendingImage(null); await pickImage(); }}
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
                {publishing ? "Publishing…" : "Add to Gallery"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── GALLERY STATE ──────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
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
        {!isJoined && <View style={styles.uploadBtnPlaceholder} />}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === "web" ? 40 : insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {scheduleImages.length > 0 ? (
          <>
            {/* Count banner */}
            <View style={[styles.countBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="layers" size={13} color={colors.violet} />
              <Text style={[styles.countText, { color: colors.mutedForeground }]}>
                <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>
                  {scheduleImages.length}
                </Text>
                {" "}photo{scheduleImages.length !== 1 ? "s" : ""} uploaded by members
              </Text>
              {isJoined && (
                <Pressable
                  onPress={pickImage}
                  style={({ pressed }) => [styles.addMoreBtn, { backgroundColor: colors.violet + "22", opacity: pressed ? 0.7 : 1 }]}
                >
                  <Feather name="plus" size={12} color={colors.violet} />
                  <Text style={[styles.addMoreText, { color: colors.violet }]}>Add</Text>
                </Pressable>
              )}
            </View>

            {/* Gallery */}
            {scheduleImages.map((img, idx) => (
              <View
                key={img.id}
                style={[styles.imageCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Image
                  source={{ uri: img.image }}
                  style={styles.galleryImage}
                  resizeMode="contain"
                />
                <View style={styles.imageCardFooter}>
                  <View style={styles.imageMeta}>
                    <Feather name="clock" size={11} color={colors.mutedForeground} />
                    <Text style={[styles.imageMetaText, { color: colors.mutedForeground }]}>
                      {timeAgo(img.uploadedAt)}
                    </Text>
                    {img.uploadedBy && (
                      <Text style={[styles.imageMetaText, { color: colors.mutedForeground }]}>
                        · {img.uploadedBy}
                      </Text>
                    )}
                    <Text style={[styles.imageMetaText, { color: colors.mutedForeground }]}>
                      · #{idx + 1}
                    </Text>
                  </View>
                  {isJoined && (
                    <Pressable
                      onPress={() => handleDelete(img)}
                      disabled={deletingId === img.id}
                      style={({ pressed }) => [
                        styles.deleteBtn,
                        { backgroundColor: "#ef444420", opacity: pressed || deletingId === img.id ? 0.5 : 1 },
                      ]}
                    >
                      {deletingId === img.id ? (
                        <ActivityIndicator size="small" color="#ef4444" />
                      ) : (
                        <Feather name="trash-2" size={13} color="#ef4444" />
                      )}
                    </Pressable>
                  )}
                </View>
              </View>
            ))}
          </>
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
              Be the first to upload a photo of the competition schedule
            </Text>
            <View style={[styles.uploadPill, { backgroundColor: colors.violet }]}>
              <Feather name="upload" size={14} color={colors.foreground} />
              <Text style={[styles.uploadPillText, { color: colors.foreground }]}>Upload Schedule</Text>
            </View>
          </Pressable>
        ) : (
          <View style={[styles.emptyState, styles.emptyStateReadOnly, { borderColor: colors.border }]}>
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
              ? "Multiple members can upload schedule photos. All uploads are shared with everyone in this competition."
              : "Schedule uploads are available to members of this competition only."}
          </Text>
        </View>
      </ScrollView>

      {/* Success toast */}
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            bottom: Platform.OS === "web" ? 32 : insets.bottom + 16,
            opacity: toastOpacity,
          },
        ]}
        pointerEvents="none"
      >
        <View style={[styles.toastIcon, { backgroundColor: "#22c55e22" }]}>
          <Feather name="check-circle" size={16} color="#22c55e" />
        </View>
        <View style={styles.toastText}>
          <Text style={[styles.toastTitle, { color: colors.foreground }]}>Published!</Text>
          <Text style={[styles.toastSub, { color: colors.mutedForeground }]}>
            Schedule added to the gallery
          </Text>
        </View>
      </Animated.View>
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
  uploadBtnPlaceholder: {
    width: 36,
    height: 36,
  },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 14,
  },
  // Preview
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
  previewActions: { gap: 10 },
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
  // Gallery
  countBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  countText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addMoreText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  imageCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  galleryImage: {
    width: "100%",
    height: undefined,
    aspectRatio: 0.75,
  },
  imageCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  imageMeta: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    flexWrap: "wrap",
  },
  imageMetaText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  // Empty
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
  emptyStateReadOnly: { opacity: 0.6 },
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
  toast: {
    position: "absolute",
    left: 20,
    right: 20,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  toastIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  toastText: { flex: 1 },
  toastTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  toastSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
