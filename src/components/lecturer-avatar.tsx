import { Image, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/use-theme';
import { ThemedText } from '@/components/themed-text';

type LecturerAvatarProps = {
  image: string;
  name: string;
  size: number;
};

function getInitials(fullname: string): string {
  const parts = fullname.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0]!.charAt(0).toUpperCase();
  }
  return (parts[0]!.charAt(0) + parts[parts.length - 1]!.charAt(0)).toUpperCase();
}

/** Ảnh bo tròn nếu có (base64 data-URI), ngược lại hiển thị chữ cái đầu họ tên. */
export function LecturerAvatar({ image, name, size }: LecturerAvatarProps) {
  const theme = useTheme();
  const radius = size / 2;

  if (image !== '') {
    return (
      <Image
        source={{ uri: image }}
        style={{ width: size, height: size, borderRadius: radius }}
        resizeMode="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.placeholder,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: theme.backgroundElement,
        },
      ]}>
      <ThemedText type="smallBold" style={{ fontSize: size * 0.32 }}>
        {getInitials(name)}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
