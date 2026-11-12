import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  type Auth,
  type Persistence,
  type ReactNativeAsyncStorage,
} from 'firebase/auth';
import { collection, getFirestore, type CollectionReference, type Firestore } from 'firebase/firestore';
import { Platform } from 'react-native';

/**
 * Config Firebase đọc từ biến môi trường EXPO_PUBLIC_* (file .env).
 * Giá trị lấy từ Firebase Console > Project settings > Your apps > Web app.
 */
export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

export function isFirebaseConfigured(): boolean {
  return (
    firebaseConfig.apiKey !== '' && firebaseConfig.projectId !== '' && firebaseConfig.appId !== ''
  );
}

function createAuth(firebaseApp: FirebaseApp): Auth {
  // Web: getAuth dùng persistence của trình duyệt (IndexedDB) mặc định.
  if (Platform.OS === 'web') {
    return getAuth(firebaseApp);
  }
  // Native (Expo Go): initializeAuth + AsyncStorage để giữ đăng nhập giữa các lần mở app.
  // getReactNativePersistence chỉ tồn tại trong build react-native của firebase/auth.
  type AuthRnModule = {
    getReactNativePersistence: (storage: ReactNativeAsyncStorage) => Persistence;
  };
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { getReactNativePersistence } = require('firebase/auth') as AuthRnModule;
  try {
    return initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Fast Refresh có thể chạy lại module -> auth đã khởi tạo, dùng lại instance sẵn có.
    return getAuth(firebaseApp);
  }
}

const app: FirebaseApp = initializeApp(firebaseConfig);

export const auth: Auth = createAuth(app);
export const db: Firestore = getFirestore(app);

/** Collection "giangvien" của DB QLHocPhan (project Firebase). */
export const giangvienRef: CollectionReference = collection(db, 'giangvien');
