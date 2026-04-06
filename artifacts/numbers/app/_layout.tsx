import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ProfileSetup } from "@/components/ProfileSetup";
import { SplashOverlay } from "@/components/SplashOverlay";
import { AppProvider } from "@/context/AppContext";
import { useApp } from "@/context/AppContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ presentation: "modal", headerShown: false }} />
    </Stack>
  );
}

// Sits inside AppProvider so it can read auth state
function AppShell() {
  const { userLoaded, isSignedIn } = useApp();
  const [splashDone, setSplashDone] = useState(false);

  const needsProfile = splashDone && userLoaded && !isSignedIn;

  return (
    <View style={styles.root}>
      <RootLayoutNav />
      {/* Splash plays first, always */}
      {!splashDone && <SplashOverlay onDone={() => setSplashDone(true)} />}
      {/* Profile setup blocks the app for new users, appears after splash */}
      {needsProfile && <ProfileSetup />}
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const appReady = !!(fontsLoaded || fontError);

  useEffect(() => {
    if (appReady) SplashScreen.hideAsync();
  }, [appReady]);

  if (!appReady) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AppProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <KeyboardProvider>
                <AppShell />
              </KeyboardProvider>
            </GestureHandlerRootView>
          </AppProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
