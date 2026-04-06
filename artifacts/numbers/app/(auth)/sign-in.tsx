import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { useSSO, useSignIn } from "@clerk/expo";
import { Link, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
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

WebBrowser.maybeCompleteAuthSession();

const BG = "#0E0A16";
const VIOLET = "#9B6FE8";
const LAVENDER = "#D2C3F6";
const SURFACE = "#1A1428";
const BORDER = "rgba(210,195,246,0.14)";
const MUTED = "#7A6A9A";
const RED = "#E87070";
const WHITE = "#F5F0FF";

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => { void WebBrowser.coolDownAsync(); };
  }, []);
}

export default function SignInScreen() {
  useWarmUpBrowser();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { signIn, errors: emailErrors, fetchStatus: emailStatus } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [ssoLoading, setSsoLoading] = useState<"google" | "apple" | null>(null);

  const handleEmailSignIn = async () => {
    setLocalError(null);
    const { error } = await signIn.password({ emailAddress: email, password });
    if (error) { setLocalError(error.message ?? "Sign in failed"); return; }

    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => {
          const url = decorateUrl("/");
          router.replace(url as any);
        },
      });
    } else if (signIn.status === "needs_client_trust") {
      const emailFactor = signIn.supportedSecondFactors?.find(
        (f) => f.strategy === "email_code"
      );
      if (emailFactor) await signIn.mfa.sendEmailCode();
    }
  };

  const handleMfaVerify = async () => {
    setLocalError(null);
    await signIn.mfa.verifyEmailCode({ code: mfaCode });
    if (signIn.status === "complete") {
      await signIn.finalize({
        navigate: ({ decorateUrl }) => router.replace(decorateUrl("/") as any),
      });
    }
  };

  const handleSSOSignIn = useCallback(async (strategy: "oauth_google" | "oauth_apple") => {
    setSsoLoading(strategy === "oauth_google" ? "google" : "apple");
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy,
        redirectUrl: AuthSession.makeRedirectUri(),
      });
      if (createdSessionId) {
        await setActive!({
          session: createdSessionId,
          navigate: async ({ decorateUrl }) => {
            router.replace(decorateUrl("/") as any);
          },
        });
      }
    } catch (err: any) {
      setLocalError(err?.message ?? "Social sign-in failed");
    } finally {
      setSsoLoading(null);
    }
  }, [startSSOFlow]);

  if (signIn.status === "needs_client_trust") {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <Text style={styles.title}>Check Your Email</Text>
        <Text style={styles.subtitle}>Enter the verification code we sent you.</Text>
        <TextInput
          style={styles.input}
          value={mfaCode}
          onChangeText={setMfaCode}
          placeholder="Verification code"
          placeholderTextColor={MUTED}
          keyboardType="numeric"
          autoFocus
        />
        {localError && <Text style={styles.errorText}>{localError}</Text>}
        <Pressable
          style={[styles.primaryBtn, emailStatus === "fetching" && styles.btnDisabled]}
          onPress={handleMfaVerify}
          disabled={emailStatus === "fetching"}
        >
          {emailStatus === "fetching"
            ? <ActivityIndicator color={WHITE} />
            : <Text style={styles.primaryBtnText}>Verify</Text>}
        </Pressable>
        <Pressable onPress={() => signIn.mfa.sendEmailCode()} style={styles.linkRow}>
          <Text style={styles.linkText}>Resend code</Text>
        </Pressable>
        <Pressable onPress={() => signIn.reset()} style={styles.linkRow}>
          <Text style={styles.linkText}>Start over</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.appName}>NUMBER</Text>
        <Text style={styles.title}>Welcome back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {/* Social buttons */}
        <View style={styles.socialGroup}>
          <Pressable
            style={styles.socialBtn}
            onPress={() => handleSSOSignIn("oauth_google")}
            disabled={ssoLoading !== null}
          >
            {ssoLoading === "google"
              ? <ActivityIndicator color={LAVENDER} size="small" />
              : (
                <>
                  <GoogleIcon />
                  <Text style={styles.socialBtnText}>Continue with Google</Text>
                </>
              )}
          </Pressable>

          <Pressable
            style={styles.socialBtn}
            onPress={() => handleSSOSignIn("oauth_apple")}
            disabled={ssoLoading !== null}
          >
            {ssoLoading === "apple"
              ? <ActivityIndicator color={LAVENDER} size="small" />
              : (
                <>
                  <AppleIcon />
                  <Text style={styles.socialBtnText}>Continue with Apple</Text>
                </>
              )}
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email / Password */}
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          placeholderTextColor={MUTED}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {emailErrors?.fields?.identifier && (
          <Text style={styles.errorText}>{emailErrors.fields.identifier.message}</Text>
        )}
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          placeholderTextColor={MUTED}
          secureTextEntry
        />
        {emailErrors?.fields?.password && (
          <Text style={styles.errorText}>{emailErrors.fields.password.message}</Text>
        )}
        {localError && <Text style={styles.errorText}>{localError}</Text>}

        <Pressable
          style={[
            styles.primaryBtn,
            (!email || !password || emailStatus === "fetching") && styles.btnDisabled,
          ]}
          onPress={handleEmailSignIn}
          disabled={!email || !password || emailStatus === "fetching"}
        >
          {emailStatus === "fetching"
            ? <ActivityIndicator color={WHITE} />
            : <Text style={styles.primaryBtnText}>Sign In</Text>}
        </Pressable>

        <View style={styles.switchRow}>
          <Text style={styles.switchText}>Don't have an account? </Text>
          <Link href="/(auth)/sign-up" asChild>
            <Pressable><Text style={styles.switchLink}>Sign up</Text></Pressable>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function GoogleIcon() {
  return (
    <View style={styles.iconWrapper}>
      <Text style={styles.googleG}>G</Text>
    </View>
  );
}

function AppleIcon() {
  return (
    <View style={styles.iconWrapper}>
      <Text style={styles.appleA}></Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: "stretch",
  },
  appName: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: VIOLET,
    letterSpacing: 4,
    textAlign: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: WHITE,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: MUTED,
    marginBottom: 32,
  },
  socialGroup: {
    gap: 12,
    marginBottom: 20,
  },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    height: 52,
  },
  socialBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: LAVENDER,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  googleG: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#4285F4",
  },
  appleA: {
    fontSize: 18,
    color: WHITE,
    lineHeight: 22,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: BORDER,
  },
  dividerText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: MUTED,
  },
  input: {
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    height: 52,
    paddingHorizontal: 16,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: WHITE,
    marginBottom: 12,
  },
  primaryBtn: {
    backgroundColor: VIOLET,
    borderRadius: 14,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  primaryBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: WHITE,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: RED,
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  switchText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: MUTED,
  },
  switchLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: LAVENDER,
  },
  linkRow: {
    alignItems: "center",
    marginTop: 16,
  },
  linkText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: LAVENDER,
  },
});
