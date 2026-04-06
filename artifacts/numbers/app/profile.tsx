import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isSignedIn, userName, userInitials, profileImage, signIn, signOut, setProfileImage } = useApp();
  const router = useRouter();
  const [nameInput, setNameInput] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handlePickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission needed", "Allow access to your photo library to set a profile picture.");
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
        const uri = asset.base64
          ? `data:image/jpeg;base64,${asset.base64}`
          : asset.uri;
        await setProfileImage(uri);
      }
    } catch {
      Alert.alert("Error", "Could not pick photo. Please try again.");
    }
  };

  const handleRemovePhoto = () => {
    Alert.alert("Remove Photo", "Remove your profile picture?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setProfileImage(null);
        },
      },
    ]);
  };

  const handleSignIn = () => {
    if (!nameInput.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    signIn(nameInput.trim());
    setNameInput("");
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          signOut();
          router.back();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: topPad + 12,
            paddingBottom: Platform.OS === "web" ? 34 + 84 : insets.bottom + 100,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.lavender} />
          </Pressable>
          <Text style={[styles.screenTitle, { color: colors.lavender }]}>PROFILE</Text>
          <View style={{ width: 34 }} />
        </View>

        {isSignedIn ? (
          <View style={styles.profileSection}>
            {/* Avatar with photo picker */}
            <View style={styles.avatarWrapper}>
              <Pressable onPress={handlePickImage} style={styles.avatarPressable}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={[styles.avatarLarge, { backgroundColor: colors.violet }]}>
                    <Text style={[styles.avatarLargeText, { color: colors.foreground }]}>
                      {userInitials}
                    </Text>
                  </View>
                )}
                <View style={[styles.cameraOverlay, { backgroundColor: colors.background }]}>
                  <Feather name="camera" size={13} color={colors.lavender} />
                </View>
              </Pressable>

              {profileImage && (
                <Pressable onPress={handleRemovePhoto} style={styles.removePhotoBtn} hitSlop={8}>
                  <Feather name="x" size={12} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>

            <Text style={[styles.changePhotoHint, { color: colors.mutedForeground }]}>
              Tap photo to change
            </Text>

            <Text style={[styles.name, { color: colors.foreground }]}>{userName}</Text>
            <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>
              Reporting as {userName}
            </Text>

            <Pressable
              style={[styles.signOutBtn, { borderColor: colors.red }]}
              onPress={handleSignOut}
            >
              <Feather name="log-out" size={16} color={colors.red} />
              <Text style={[styles.signOutText, { color: colors.red }]}>Sign Out</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.signInSection}>
            {/* Avatar photo picker — available before signing in too */}
            <View style={styles.avatarWrapper}>
              <Pressable onPress={handlePickImage} style={styles.avatarPressable}>
                {profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.avatarImage}
                  />
                ) : (
                  <View style={[styles.avatarLarge, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}>
                    <Feather name="camera" size={28} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={[styles.cameraOverlay, { backgroundColor: colors.background }]}>
                  <Feather name="camera" size={13} color={colors.lavender} />
                </View>
              </Pressable>
            </View>

            <Text style={[styles.addPhotoLabel, { color: colors.mutedForeground }]}>
              Add a photo (optional)
            </Text>

            <Text style={[styles.name, { color: colors.foreground }]}>Set Your Name</Text>
            <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>
              Your name appears on community reports.{"\n"}We suggest first name + last initial.
            </Text>

            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.nameInput,
                  {
                    backgroundColor: colors.card,
                    color: colors.foreground,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g. Sarah M."
                placeholderTextColor={colors.mutedForeground}
                value={nameInput}
                onChangeText={setNameInput}
                returnKeyType="done"
                onSubmitEditing={handleSignIn}
                autoFocus
                autoCapitalize="words"
              />
              <View style={[styles.formatHintRow, { borderColor: colors.border }]}>
                <Feather name="info" size={11} color={colors.violet} />
                <Text style={[styles.formatHint, { color: colors.mutedForeground }]}>
                  First name + last initial (e.g. "Sarah M.") keeps it friendly and private
                </Text>
              </View>
            </View>

            <Pressable
              style={[
                styles.signInBtn,
                { backgroundColor: nameInput.trim() ? colors.violet : colors.surface },
              ]}
              onPress={handleSignIn}
            >
              <Text
                style={[
                  styles.signInBtnText,
                  { color: nameInput.trim() ? colors.foreground : colors.mutedForeground },
                ]}
              >
                Continue
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 22 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 40,
  },
  backBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  screenTitle: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },
  profileSection: {
    alignItems: "center",
    gap: 8,
    paddingTop: 20,
  },
  signInSection: {
    alignItems: "center",
    gap: 10,
    paddingTop: 20,
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 4,
  },
  avatarPressable: {
    position: "relative",
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLargeText: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(210,195,246,0.25)",
  },
  removePhotoBtn: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(14,10,22,0.9)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(210,195,246,0.2)",
  },
  changePhotoHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  addPhotoLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  name: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 4,
  },
  subLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  signOutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  inputWrapper: {
    width: "100%",
    gap: 0,
  },
  nameInput: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  formatHintRow: {
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
  formatHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
    flex: 1,
  },
  signInBtn: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  signInBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
