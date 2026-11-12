import { Pressable, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/hooks/use-auth';
import { Spacing } from '@/constants/theme';

function SignOutButton() {
  const { signOut } = useAuth();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Đăng xuất"
      onPress={() => void signOut()}
      hitSlop={Spacing.two}
      style={({ pressed }) => [styles.button, { opacity: pressed ? 0.6 : 1 }]}>
      <ThemedText type="smallBold" style={styles.buttonText}>
        Đăng xuất
      </ThemedText>
    </Pressable>
  );
}

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerTitle: 'QLHocPhan — Quản lý Giảng viên',
        headerTitleStyle: { fontSize: 16, fontWeight: '700' },
        headerBackTitle: 'Quay lại',
      }}>
      <Stack.Screen name="dashboard" options={{ headerRight: () => <SignOutButton /> }} />
      <Stack.Screen name="form" options={{ title: 'Thêm giảng viên' }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
  },
  buttonText: {
    color: '#208AEF',
  },
});
