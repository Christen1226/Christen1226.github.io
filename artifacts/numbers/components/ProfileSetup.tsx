import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
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

export function ProfileSetup() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, setProfileImage } = useApp();

  const [name, setName] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePickPhoto = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Allow access to your photo library to add a profile picture.");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (!result.canceled && result.assets[0]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const asset = result.assets[0];
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setPhoto(uri);
      }
    } catch {
      Alert.alert("Error", "Could not pick photo.");
    }
  };

  const handleContinue = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (photo) await setProfileImage(photo);
    await signIn(name.trim());
  };

  const topPad = Platform.OS === "web" ? 48 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 48 : insets.bottom + 24;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad, paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Wordmark */}
        <Text style={[styles.wordmark, { color: colors.violet }]}>NUMBER</Text>

        {/* Header */}
        <Text style={[styles.heading, { color: colors.foreground }]}>Create your profile</Text>
        <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
          Your name appears on community stage reports.{"\n"}Use first name + last initial to stay friendly and private.
        </Text>

        {/* Photo picker */}
        <Pressable style={styles.avatarBtn} onPress={handlePickPhoto}>
          {photo ? (
            <Image source={{ uri: photo }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="camera" size={26} color={colors.mutedForeground} />
            </View>
          )}
          <View style={[styles.cameraChip, { backgroundColor: colors.violet }]}>
            <Feather name="camera" size={11} color="#fff" />
            <Text style={styles.cameraChipText}>{photo ? "Change" : "Add photo"}</Text>
          </View>
        </Pressable>
        <Text style={[styles.photoHint, { color: colors.mutedForeground }]}>Optional</Text>

        {/* Name input */}
        <View style={styles.inputBlock}>
          <Text style={[styles.label, { color: colors.lavender }]}>Your name</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.foreground,
                borderColor: name.trim() ? colors.violet : colors.border,
              },
            ]}
            placeholder="e.g. Sarah M."
            placeholderTextColor={colors.mutedForeground}
            value={name}
            onChangeText={setName}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            autoCapitalize="words"
            autoCorrect={false}
          />
          <View style={[styles.hintRow, { borderColor: colors.border }]}>
            <Feather name="info" size={11} color={colors.violet} />
            <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
              First name + last initial (e.g. "Sarah M.") keeps it friendly and private
            </Text>
          </View>
        </View>

        {/* Continue button */}
        <Pressable
          style={[
            styles.continueBtn,
            { backgroundColor: name.trim() ? colors.violet : colors.surface },
          ]}
          onPress={handleContinue}
          disabled={!name.trim() || saving}
        >
          <Text
            style={[
              styles.continueBtnText,
              { color: name.trim() ? colors.foreground : colors.mutedForeground },
            ]}
          >
            {saving ? "Saving…" : "Get Started"}
          </Text>
          {name.trim() && !saving && (
            <Feather name="arrow-right" size={18} color={colors.foreground} />
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
  },
  content: {
    paddingHorizontal: 28,
    alignItems: "center",
  },
  wordmark: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 4,
    marginBottom: 48,
  },
  heading: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 10,
    textAlign: "center",
  },
  subheading: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 36,
  },
  avatarBtn: {
    alignItems: "center",
    marginBottom: 6,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    marginBottom: 8,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    marginBottom: 8,
  },
  cameraChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  cameraChipText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
  photoHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginBottom: 32,
  },
  inputBlock: {
    width: "100%",
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  input: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: "rgba(155,111,232,0.06)",
  },
  hintText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
    flex: 1,
  },
  continueBtn: {
    width: "100%",
    height: 54,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  continueBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
