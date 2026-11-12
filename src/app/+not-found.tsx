import { Link, Stack } from 'expo-router';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Không tìm thấy trang' }} />
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="subtitle">404</ThemedText>
          <ThemedText type="small" style={styles.message}>
            Trang bạn tìm không tồn tại.
          </ThemedText>
          <Link href="/" style={styles.link}>
            <ThemedText type="linkPrimary">Về trang đăng nhập</ThemedText>
          </Link>
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
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  message: {
    opacity: 0.7,
  },
  link: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.two,
  },
});
