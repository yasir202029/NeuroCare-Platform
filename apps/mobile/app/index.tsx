import { StatusBar } from "expo-status-bar";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Tokens = { accessToken: string; refreshToken: string };
type SessionUser = { firstName: string; roles: string[] };
type PortalSummary = { portal: string; summary: Record<string, number> };
type LoginResult = {
  user?: SessionUser;
  tokens?: Tokens;
  mfaRequired?: boolean;
  methods?: string[];
  message?: string;
  error?: { message?: string };
};

const metroHost = Constants.expoConfig?.hostUri?.split(":")[0];
const defaultApiHost =
  Platform.OS === "web" ? "localhost" : (metroHost ?? "localhost");
const apiBase =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? `http://${defaultApiHost}:4000`;
const accessKey = "neurocare.access";
const refreshKey = "neurocare.refresh";
const userKey = "neurocare.user";

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaMethod, setMfaMethod] = useState("EMAIL");
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [summary, setSummary] = useState<PortalSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    void Promise.all([
      SecureStore.getItemAsync(accessKey),
      SecureStore.getItemAsync(refreshKey),
      SecureStore.getItemAsync(userKey),
    ]).then(([accessToken, refreshToken, savedUser]) => {
      if (accessToken && refreshToken && savedUser) {
        setUser(JSON.parse(savedUser) as SessionUser);
        setTokens({ accessToken, refreshToken });
      }
    });
  }, []);

  useEffect(() => {
    if (!tokens || summary) return;
    setBusy(true);
    void loadSummary(tokens)
      .then(({ nextTokens, data }) => {
        setTokens(nextTokens);
        setSummary(data);
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Unable to load your authorised workspace.",
        );
      })
      .finally(() => setBusy(false));
  }, [tokens, summary]);

  async function signIn() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`${apiBase}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Device-Id": "neurocare-mobile",
        },
        body: JSON.stringify({
          email,
          password,
          ...(mfaRequired ? { mfaCode, mfaMethod } : {}),
        }),
      });
      const result = (await response.json()) as LoginResult;
      if (result.mfaRequired) {
        setMfaRequired(true);
        setMfaMethod(
          result.methods?.includes("EMAIL")
            ? "EMAIL"
            : (result.methods?.[0] ?? "EMAIL"),
        );
        setError(
          result.methods?.includes("EMAIL")
            ? "A security code has been sent to your email."
            : "Enter the current code from your authenticator app.",
        );
        return;
      }
      if (!response.ok || !result.tokens || !result.user)
        throw new Error(
          result.error?.message ??
            result.message ??
            "Sign-in failed. Check your details and try again.",
        );

      await saveTokens(result.tokens);
      if (Platform.OS !== "web")
        await SecureStore.setItemAsync(userKey, JSON.stringify(result.user));
      setUser(result.user);
      const loaded = await loadSummary(result.tokens, result.user.roles);
      setTokens(loaded.nextTokens);
      setSummary(loaded.data);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "The sign-in service is unavailable.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function loadSummary(
    currentTokens: Tokens,
    roles = user?.roles ?? [],
  ): Promise<{ nextTokens: Tokens; data: PortalSummary }> {
    const portal = portalForRoles(roles);
    const requestSummary = (accessToken: string) =>
      fetch(`${apiBase}/api/v1/portals/${portal}/summary`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    let response = await requestSummary(currentTokens.accessToken);
    let nextTokens = currentTokens;
    if (response.status === 401) {
      const refreshed = await fetch(`${apiBase}/api/v1/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: currentTokens.refreshToken }),
      });
      const refreshResult = (await refreshed.json()) as { tokens?: Tokens };
      if (!refreshed.ok || !refreshResult.tokens)
        throw new Error("Your session expired. Sign in again.");
      nextTokens = refreshResult.tokens;
      await saveTokens(nextTokens);
      response = await requestSummary(nextTokens.accessToken);
    }
    if (!response.ok)
      throw new Error(
        response.status === 403
          ? "Your account is not authorised for this workspace."
          : "Live care data is unavailable.",
      );
    return { nextTokens, data: (await response.json()) as PortalSummary };
  }

  async function signOut() {
    if (tokens) {
      await fetch(`${apiBase}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      }).catch(() => undefined);
    }
    if (Platform.OS !== "web")
      await Promise.all([
        SecureStore.deleteItemAsync(accessKey),
        SecureStore.deleteItemAsync(refreshKey),
        SecureStore.deleteItemAsync(userKey),
      ]);
    setTokens(null);
    setUser(null);
    setSummary(null);
    setPassword("");
    setMfaCode("");
    setMfaRequired(false);
    setError(null);
  }

  async function saveTokens(value: Tokens) {
    if (Platform.OS !== "web") {
      await Promise.all([
        SecureStore.setItemAsync(accessKey, value.accessToken),
        SecureStore.setItemAsync(refreshKey, value.refreshToken),
      ]);
    }
  }

  const portal = summary?.portal ?? portalForRoles(user?.roles ?? []);
  const metrics = summary ? Object.entries(summary.summary) : [];

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.page}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.top}>
            <View>
              <Text style={styles.brand}>NEUROCARE</Text>
              <Text style={styles.title}>
                {summary ? "Your care,\nin focus." : "Care,\nconnected."}
              </Text>
            </View>
            {summary && (
              <Pressable
                accessibilityRole="button"
                onPress={signOut}
                style={styles.signOut}
              >
                <Text style={styles.signOutText}>Sign out</Text>
              </Pressable>
            )}
          </View>

          {!summary ? (
            <View style={styles.form}>
              <Text style={styles.heading}>Secure sign in</Text>
              <Text style={styles.copy}>
                Use your verified NeuroCare account to load your authorised
                workspace.
              </Text>
              <Text style={styles.label}>Email address</Text>
              <TextInput
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
              <Text style={styles.label}>Password</Text>
              <TextInput
                secureTextEntry
                autoComplete="password"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
              />
              {mfaRequired && (
                <>
                  <Text style={styles.label}>Verification code</Text>
                  <TextInput
                    keyboardType="number-pad"
                    maxLength={6}
                    value={mfaCode}
                    onChangeText={setMfaCode}
                    style={styles.input}
                  />
                </>
              )}
              {error && (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              )}
              <Pressable
                disabled={busy || !email || !password}
                onPress={signIn}
                style={[
                  styles.primary,
                  (busy || !email || !password) && styles.disabled,
                ]}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.primaryText}>
                    {mfaRequired ? "Verify and continue" : "Continue securely"}
                  </Text>
                )}
              </Pressable>
              <Text style={styles.footnote}>
                Live API data appears after successful sign-in. Demo figures are
                not shown.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.hero}>
                <Text style={styles.overline}>
                  {portal.toUpperCase()} WORKSPACE
                </Text>
                <Text style={styles.heroTitle}>
                  Welcome{user?.firstName ? `, ${user.firstName}` : " back"}.
                </Text>
                <Text style={styles.heroCopy}>
                  Your information is loaded from the authorised NeuroCare
                  service.
                </Text>
              </View>
              <View style={styles.sectionHead}>
                <Text style={styles.heading}>Live overview</Text>
                <Text style={styles.copy}>Current account data</Text>
              </View>
              {busy && <ActivityIndicator color="#176550" />}
              {error && (
                <Text accessibilityRole="alert" style={styles.error}>
                  {error}
                </Text>
              )}
              <View style={styles.grid}>
                {metrics.map(([key, value]) => (
                  <View key={key} style={styles.card}>
                    <Text style={styles.cardValue}>{value}</Text>
                    <Text style={styles.cardTitle}>{formatLabel(key)}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.footnote}>
                Role-scoped access · Audited session
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function portalForRoles(roles: string[]) {
  if (roles.includes("ADMIN")) return "admin";
  if (roles.includes("PATIENT")) return "patient";
  if (roles.includes("FINANCE")) return "finance";
  if (roles.includes("PRESCRIBER")) return "prescriber";
  if (roles.includes("NURSE")) return "nurse";
  return "clinician";
}

function formatLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f7f6" },
  page: {
    padding: 24,
    gap: 24,
    flexGrow: 1,
    justifyContent: "center",
    maxWidth: 720,
    width: "100%",
    alignSelf: "center",
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  brand: {
    color: "#176550",
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: "800",
    marginBottom: 12,
  },
  title: { color: "#102820", fontSize: 42, lineHeight: 44, fontWeight: "800" },
  form: {
    gap: 12,
    backgroundColor: "#fff",
    padding: 22,
    borderColor: "#e0e8e4",
    borderWidth: 1,
  },
  heading: { color: "#102820", fontSize: 21, fontWeight: "800" },
  copy: { color: "#678077", fontSize: 14, lineHeight: 21 },
  label: { color: "#244b3d", fontSize: 13, fontWeight: "700", marginTop: 4 },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#cbd9d2",
    paddingHorizontal: 12,
    color: "#102820",
    backgroundColor: "#fff",
  },
  error: { color: "#a13f32", lineHeight: 20 },
  primary: {
    minHeight: 48,
    backgroundColor: "#176550",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  disabled: { opacity: 0.55 },
  primaryText: { color: "#fff", fontWeight: "800" },
  hero: { backgroundColor: "#176550", padding: 24, gap: 10 },
  overline: {
    color: "#c8efdf",
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: "800",
  },
  heroTitle: { color: "#fff", fontSize: 30, lineHeight: 36, fontWeight: "800" },
  heroCopy: { color: "#ddf4e9", fontSize: 14, lineHeight: 21 },
  sectionHead: { gap: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    flexGrow: 1,
    flexBasis: "44%",
    minWidth: 140,
    minHeight: 120,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e8e4",
    padding: 16,
    justifyContent: "space-between",
  },
  cardValue: { color: "#176550", fontSize: 30, fontWeight: "800" },
  cardTitle: { color: "#244b3d", fontSize: 14, fontWeight: "700" },
  signOut: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#b9cdc3",
  },
  signOutText: { color: "#145742", fontWeight: "700" },
  footnote: {
    color: "#678077",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
