import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
  const { competition, scheduleImage, uploadSchedule } = useApp();
  const [uploading, setUploading] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handlePickImage = async () => {
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
    const uri = `data:${mime};base64,${asset.base64}`;

    setUploading(true);
    await uploadSchedule(uri);
    setUploading(false);
  };

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
        <Pressable
          onPress={handlePickImage}
          style={({ pressed }) => [
            styles.uploadBtn,
            { backgroundColor: colors.violet, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          {uploading ? (
            <ActivityIndicator size="small" color={colors.foreground} />
          ) : (
            <Feather name="upload" size={16} color={colors.foreground} />
          )}
        </Pressable>
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
            <Pressable
              onPress={handlePickImage}
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
          </View>
        ) : (
          <Pressable
            onPress={handlePickImage}
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
        )}

        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="info" size={14} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Uploaded schedules are shared with everyone in this competition. You can also upload from the Competition tab.
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
  headerCenter: {
    flex: 1,
  },
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
  imageWrapper: {
    gap: 12,
  },
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
