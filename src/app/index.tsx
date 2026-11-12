import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from '@/hooks/use-theme';
import { isFirebaseConfigured } from '@/lib/firebase';

const FIREBASE_ERRORS: Record<string, string> = {
  'auth/invalid-email': 'Email không hợp lệ.',
  'auth/user-disabled': 'Tài khoản đã bị vô hiệu hoá.',
  'auth/user-not-found': 'Email hoặc mật khẩu không đúng.',
  'auth/wrong-password': 'Email hoặc mật khẩu không đúng.',
  'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
  'auth/too-many-requests': 'Thử quá nhiều lần. Vui lòng thử lại sau.',
  'auth/network-request-failed': 'Lỗi kết nối mạng, kiểm tra Internet và thử lại.',
  'auth/invalid-api-key': 'API key Firebase không hợp lệ — kiểm tra file .env.',
  'auth/operation-not-allowed':
    'Chưa bật phương thức đăng nhập Email/Password trong Firebase Authentication.',
  'auth/configuration-not-found':
    'Chưa bật Email/Password trong Firebase Authentication (Build > Authentication > Sign-in method).',
};

function firebaseErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    return FIREBASE_ERRORS[code] ?? `Không thể đăng nhập (${code}).`;
  }
  return 'Không thể đăng nhập. Vui lòng thử lại.';
}

export default function LoginScreen() {
  const { loading, signIn } = useAuth();
  const router = useRouter();
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim() !== '' && password !== '' && !submitting;

  async function handleLogin() {
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace('/dashboard');
    } catch (e) {
      setError(firebaseErrorMessage(e));
      setSubmitting(false);
    }
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.avoiding}>
            <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
              <View style={styles.header}>
                <ThemedText type="subtitle">Đăng nhập</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Hệ phân hệ admin — Quản lý Giảng viên (QLHocPhan)
                </ThemedText>
              </View>

              <View style={[styles.card, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="smallBold" style={styles.label}>
                  Email
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  autoCorrect={false}
                  inputMode="email"
                  placeholder="admin@example.com"
                  placeholderTextColor={theme.textSecondary}
                />

                <ThemedText type="smallBold" style={styles.label}>
                  Mật khẩu
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoComplete="current-password"
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  onSubmitEditing={() => void handleLogin()}
                />

                {error !== null && (
                  <ThemedText type="small" style={styles.error}>
                    {error}
                  </ThemedText>
                )}

                {!isFirebaseConfigured() && (
                  <ThemedText type="small" style={styles.error}>
                    Chưa cấu hình Firebase: điền các biến EXPO_PUBLIC_FIREBASE_* vào file .env rồi
                    khởi động lại server.
                  </ThemedText>
                )}

                <Pressable
                  accessibilityRole="button"
                  disabled={!canSubmit}
                  onPress={() => void handleLogin()}
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: '#208AEF', opacity: !canSubmit || pressed ? 0.6 : 1 },
                  ]}>
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <ThemedText type="smallBold" style={styles.buttonText}>
                      Đăng nhập
                    </ThemedText>
                  )}
                </Pressable>

                {loading && (
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Đang kiểm tra phiên đăng nhập…
                  </ThemedText>
                )}
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ThemedView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  avoiding: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.one,
    marginBottom: Spacing.three,
  },
  card: {
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.one,
  },
  label: {
    marginTop: Spacing.two,
    marginBottom: Spacing.half,
  },
  input: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'web' ? Spacing.two : Spacing.two + 2,
    fontSize: 16,
  },
  error: {
    color: '#D64545',
    marginTop: Spacing.two,
  },
  button: {
    marginTop: Spacing.three,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: {
    color: '#ffffff',
  },
});
