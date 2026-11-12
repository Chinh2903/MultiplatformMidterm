import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { getDoc, doc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { createLecturer, deleteLecturer, updateLecturer } from '@/hooks/use-lecturers';
import { useTheme } from '@/hooks/use-theme';
import {
  estimateImageBytes,
  formatBytes,
  fromDoc,
  idgvExists,
  isValidIDGV,
  MAX_IMAGE_BYTES,
} from '@/lib/giangvien';
import { giangvienRef } from '@/lib/firebase';
import type { GiangVien } from '@/types/giangvien';

function parseSumClass(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  return Number.parseInt(trimmed, 10);
}

export default function LecturerFormScreen() {
  const router = useRouter();
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' && params.id !== '' ? params.id : undefined;
  const isEdit = id !== undefined;

  const [original, setOriginal] = useState<GiangVien | null>(null);
  const [loadingDoc, setLoadingDoc] = useState(isEdit);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [idgv, setIdgv] = useState('');
  const [fullname, setFullname] = useState('');
  const [sumClassText, setSumClassText] = useState('');
  const [image, setImage] = useState('');

  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (id === undefined) {
      return;
    }
    let cancelled = false;
    getDoc(doc(giangvienRef, id))
      .then((snapshot) => {
        if (cancelled) {
          return;
        }
        if (!snapshot.exists()) {
          setLoadError(`Không tìm thấy giảng viên ${id}.`);
          return;
        }
        const gv = fromDoc(snapshot.id, snapshot.data());
        setOriginal(gv);
        setIdgv(gv.IDGV);
        setFullname(gv.Fullname);
        setSumClassText(String(gv.SumClass));
        setImage(gv.Image);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('Không tải được dữ liệu giảng viên.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingDoc(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function pickImage() {
    setPicking(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setFormError('Cần cấp quyền truy cập thư viện ảnh để chọn ảnh.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.3,
        base64: true,
      });
      if (result.canceled) {
        return;
      }
      const asset = result.assets[0];
      const base64 = asset?.base64;
      if (!base64) {
        setFormError('Không đọc được dữ liệu ảnh. Vui lòng thử lại.');
        return;
      }
      const mime = asset.mimeType ?? 'image/jpeg';
      const dataUri = `data:${mime};base64,${base64}`;
      const bytes = estimateImageBytes(dataUri);
      if (bytes > MAX_IMAGE_BYTES) {
        setFormError(
          `Ảnh quá lớn (${formatBytes(bytes)}). Hãy chọn ảnh khác nhỏ hơn (giới hạn ~900KB).`,
        );
        return;
      }
      setImage(dataUri);
      setFormError(null);
    } finally {
      setPicking(false);
    }
  }

  async function handleSave() {
    const finalId = isEdit ? id : idgv.trim().toUpperCase();
    if (!isEdit) {
      if (finalId === '') {
        setFormError('Mã giảng viên (IDGV) không được để trống.');
        return;
      }
      if (!isValidIDGV(finalId)) {
        setFormError('IDGV chỉ gồm chữ cái không dấu, số, dấu gạch dưới hoặc gạch ngang (VD: GV001).');
        return;
      }
    }
    const trimmedFullname = fullname.trim();
    if (trimmedFullname === '') {
      setFormError('Họ tên không được để trống.');
      return;
    }
    const sumClass = parseSumClass(sumClassText);
    if (sumClass === null) {
      setFormError('Tổng số lớp phải là số nguyên không âm (VD: 3).');
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      if (!isEdit && finalId !== undefined) {
        if (await idgvExists(finalId)) {
          setFormError(`Mã ${finalId} đã tồn tại. Dùng mã khác (VD: GV006).`);
          setSaving(false);
          return;
        }
        await createLecturer({
          IDGV: finalId,
          Fullname: trimmedFullname,
          Image: image,
          SumClass: sumClass,
        });
      } else if (isEdit && id !== undefined) {
        await updateLecturer(
          id,
          { IDGV: id, Fullname: trimmedFullname, Image: image, SumClass: sumClass },
          original,
        );
      }
      router.back();
    } catch {
      setFormError('Không lưu được dữ liệu. Vui lòng thử lại.');
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (id === undefined) {
      return;
    }
    setDeleting(true);
    setFormError(null);
    try {
      await deleteLecturer(id);
      router.back();
    } catch {
      setFormError('Không xoá được giảng viên. Vui lòng thử lại.');
      setDeleting(false);
    } finally {
      setPendingDelete(false);
    }
  }

  const imageBytes = image === '' ? 0 : estimateImageBytes(image);

  return (
    <>
      <Stack.Screen options={{ title: isEdit ? 'Sửa giảng viên' : 'Thêm giảng viên' }} />
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.avoiding}>
            <ScrollView
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled">
              {loadingDoc ? (
                <ActivityIndicator style={styles.loading} />
              ) : loadError !== null ? (
                <ThemedText type="small" style={styles.error}>
                  {loadError}
                </ThemedText>
              ) : (
                <>
                  <ThemedText type="smallBold" style={styles.label}>
                    Mã giảng viên (IDGV)
                  </ThemedText>
                  <TextInput
                    style={[
                      styles.input,
                      isEdit && styles.inputDisabled,
                      {
                        backgroundColor: theme.backgroundElement,
                        color: theme.text,
                      },
                    ]}
                    value={isEdit ? id : idgv}
                    onChangeText={(text) => setIdgv(text.toUpperCase())}
                    editable={!isEdit}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    placeholder="GV006"
                    placeholderTextColor={theme.textSecondary}
                  />
                  {isEdit ? (
                    <ThemedText type="small" style={styles.hint}>
                      Mã giảng viên không thể đổi khi sửa.
                    </ThemedText>
                  ) : null}

                  <ThemedText type="smallBold" style={styles.label}>
                    Họ và tên
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                    value={fullname}
                    onChangeText={setFullname}
                    placeholder="Nguyễn Văn A"
                    placeholderTextColor={theme.textSecondary}
                  />

                  <ThemedText type="smallBold" style={styles.label}>
                    Tổng số lớp
                  </ThemedText>
                  <TextInput
                    style={[styles.input, { backgroundColor: theme.backgroundElement, color: theme.text }]}
                    value={sumClassText}
                    onChangeText={setSumClassText}
                    inputMode="numeric"
                    keyboardType="number-pad"
                    placeholder="3"
                    placeholderTextColor={theme.textSecondary}
                  />

                  <ThemedText type="smallBold" style={styles.label}>
                    Ảnh giảng viên
                  </ThemedText>
                  <View style={styles.imageRow}>
                    {image === '' ? (
                      <View
                        style={[
                          styles.imagePlaceholder,
                          { backgroundColor: theme.backgroundElement },
                        ]}>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          Chưa có ảnh
                        </ThemedText>
                      </View>
                    ) : (
                      <Image source={{ uri: image }} style={styles.imagePreview} />
                    )}
                    <View style={styles.imageActions}>
                      <Pressable
                        accessibilityRole="button"
                        disabled={picking}
                        onPress={() => void pickImage()}
                        style={({ pressed }) => [
                          styles.secondaryButton,
                          { borderColor: theme.backgroundSelected, opacity: picking ? 0.6 : pressed ? 0.7 : 1 },
                        ]}>
                        <ThemedText type="smallBold">
                          {picking ? 'Đang mở thư viện…' : 'Chọn ảnh từ máy'}
                        </ThemedText>
                      </Pressable>
                      {image !== '' && (
                        <Pressable
                          accessibilityRole="button"
                          style={({ pressed }) => [
                            styles.secondaryButton,
                            { borderColor: theme.backgroundSelected, opacity: pressed ? 0.7 : 1 },
                          ]}
                          onPress={() => setImage('')}>
                          <ThemedText type="smallBold">Gỡ ảnh</ThemedText>
                        </Pressable>
                      )}
                      {image !== '' && (
                        <ThemedText type="small" style={styles.hint}>
                          Ảnh sẽ lưu dạng base64 trong trường Image (~{formatBytes(imageBytes)}).
                        </ThemedText>
                      )}
                    </View>
                  </View>

                  {formError !== null && (
                    <ThemedText type="small" style={styles.error}>
                      {formError}
                    </ThemedText>
                  )}

                  <Pressable
                    accessibilityRole="button"
                    disabled={saving}
                    onPress={() => void handleSave()}
                    style={({ pressed }) => [
                      styles.primaryButton,
                      { backgroundColor: '#208AEF', opacity: saving || pressed ? 0.7 : 1 },
                    ]}>
                    {saving ? (
                      <ActivityIndicator color="#ffffff" />
                    ) : (
                      <ThemedText type="smallBold" style={styles.primaryButtonText}>
                        {isEdit ? 'Lưu thay đổi' : 'Thêm giảng viên'}
                      </ThemedText>
                    )}
                  </Pressable>

                  {isEdit && (
                    <Pressable
                      accessibilityRole="button"
                      disabled={deleting}
                      onPress={() => setPendingDelete(true)}
                      style={({ pressed }) => [
                        styles.primaryButton,
                        { backgroundColor: '#D64545', opacity: deleting || pressed ? 0.7 : 1 },
                      ]}>
                      <ThemedText type="smallBold" style={styles.primaryButtonText}>
                        Xoá giảng viên
                      </ThemedText>
                    </Pressable>
                  )}
                </>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </ThemedView>

      <ConfirmDialog
        visible={pendingDelete}
        title="Xoá giảng viên"
        message={
          original !== null
            ? `Xoá giảng viên ${original.Fullname} (${original.IDGV}) khỏi DB QLHocPhan?`
            : ''
        }
        confirmLabel={deleting ? 'Đang xoá…' : 'Xoá'}
        destructive
        onConfirm={() => void handleDelete()}
        onCancel={() => setPendingDelete(false)}
      />
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
  content: {
    padding: Spacing.three,
    paddingBottom: Spacing.five,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.two,
  },
  loading: {
    marginTop: Spacing.four,
  },
  label: {
    marginTop: Spacing.two,
  },
  input: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Platform.OS === 'web' ? Spacing.two : Spacing.two + 2,
    fontSize: 16,
  },
  inputDisabled: {
    opacity: 0.55,
  },
  hint: {
    opacity: 0.6,
  },
  imageRow: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imagePreview: {
    width: 120,
    height: 120,
    borderRadius: Spacing.three,
  },
  imageActions: {
    flex: 1,
    gap: Spacing.two,
    alignItems: 'flex-start',
  },
  secondaryButton: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
  },
  error: {
    color: '#D64545',
  },
  primaryButton: {
    marginTop: Spacing.three,
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two + 4,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  primaryButtonText: {
    color: '#ffffff',
  },
});
