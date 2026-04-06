import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
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
  const { isSignedIn, userName, userInitials, signIn, signOut } = useApp();
  const router = useRouter();
  const [nameInput, setNameInput] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

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
            <View style={[styles.avatarLarge, { backgroundColor: colors.violet }]}>
              <Text style={[styles.avatarLargeText, { color: colors.foreground }]}>{userInitials}</Text>
            </View>
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
            <View style={[styles.avatarLarge, { backgroundColor: colors.surface }]}>
              <Feather name="user" size={32} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.name, { color: colors.foreground }]}>Set Your Name</Text>
            <Text style={[styles.subLabel, { color: colors.mutedForeground }]}>
              Your name appears on community reports you submit.
            </Text>

            <TextInput
              style={[
                styles.nameInput,
                {
                  backgroundColor: colors.card,
                  color: colors.foreground,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Your name"
              placeholderTextColor={colors.mutedForeground}
              value={nameInput}
              onChangeText={setNameInput}
              returnKeyType="done"
              onSubmitEditing={handleSignIn}
              autoFocus
            />

            <Pressable
              style={[styles.signInBtn, { backgroundColor: colors.violet }]}
              onPress={handleSignIn}
            >
              <Text style={[styles.signInBtnText, { color: colors.foreground }]}>Continue</Text>
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
    gap: 10,
    paddingTop: 20,
  },
  signInSection: {
    alignItems: "center",
    gap: 12,
    paddingTop: 20,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarLargeText: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
  },
  name: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
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
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  signOutText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  nameInput: {
    width: "100%",
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
  signInBtn: {
    width: "100%",
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  signInBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
