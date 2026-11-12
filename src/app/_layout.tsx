import {
  DarkTheme,
  DefaultTheme,
  Slot,
  SplashScreen,
  ThemeProvider,
  usePathname,
  useRouter,
} from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AuthProvider, useAuth } from '@/hooks/use-auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}

/**
 * Auth gate:
 * - Chờ trạng thái đăng nhập xác định trước khi hiển thị route (splash che lúc loading).
 * - Chưa đăng nhập mà vào khu vực admin (/dashboard, /form) -> đá về trang đăng nhập "/".
 * - Đã đăng nhập mà đứng ngoài khu vực admin -> đưa về "/dashboard".
 */
function RootNavigator() {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (loading) {
      return;
    }
    SplashScreen.hideAsync().catch(() => {});

    const inAdminArea = pathname.startsWith('/dashboard') || pathname.startsWith('/form');
    if (!user && inAdminArea) {
      router.replace('/');
    } else if (user && !inAdminArea) {
      router.replace('/dashboard');
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return null;
  }

  return <Slot />;
}
