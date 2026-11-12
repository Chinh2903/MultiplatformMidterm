import { Stack, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { LecturerAvatar } from '@/components/lecturer-avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { deleteLecturer, useLecturers } from '@/hooks/use-lecturers';
import { useTheme } from '@/hooks/use-theme';
import type { GiangVien } from '@/types/giangvien';

type SortKey = 'fullname' | 'sumclass';

function ErrorText({ message }: { message: string }) {
  return <ThemedText type="small" style={styles.errorText}>{message}</ThemedText>;
}

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { lecturers, loading, error } = useLecturers();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('fullname');
  const [detail, setDetail] = useState<GiangVien | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GiangVien | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matched =
      query === ''
        ? lecturers
        : lecturers.filter(
            (gv) =>
              gv.Fullname.toLowerCase().includes(query) || gv.IDGV.toLowerCase().includes(query),
          );
    return [...matched].sort((a, b) =>
      sortKey === 'fullname'
        ? a.Fullname.localeCompare(b.Fullname, 'vi')
        : b.SumClass - a.SumClass,
    );
  }, [lecturers, search, sortKey]);

  const stats = useMemo(
    () => ({
      count: lecturers.length,
      totalClass: lecturers.reduce((sum, gv) => sum + gv.SumClass, 0),
    }),
    [lecturers],
  );

  async function handleConfirmDelete() {
    if (!pendingDelete) {
      return;
    }
    setDeleting(true);
    setActionError(null);
    try {
      await deleteLecturer(pendingDelete.IDGV);
      setDetail(null);
    } catch {
      setActionError('Không xoá được giảng viên. Thử lại sau.');
    } finally {
      setDeleting(false);
      setPendingDelete(null);
    }
  }

  function openEdit(gv: GiangVien) {
    setDetail(null);
    router.push(`/form?id=${encodeURIComponent(gv.IDGV)}`);
  }

  const sortOptions: { key: SortKey; label: string }[] = [
    { key: 'fullname', label: 'Theo họ tên' },
    { key: 'sumclass', label: 'Theo số lớp' },
  ];

  return (
    <>
      <Stack.Screen options={{ title: 'Danh sách giảng viên' }} />
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['bottom', 'left', 'right']}>
          <ScrollView
            style={styles.body}
            contentContainerStyle={[
              styles.content,
              isWide ? styles.contentWide : undefined,
            ]}>
            {/* Số liệu tổng quan */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Số giảng viên
                </ThemedText>
                <ThemedText type="subtitle" style={styles.statValue}>
                  {stats.count}
                </ThemedText>
              </View>
              <View style={[styles.statCard, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Tổng số lớp
                </ThemedText>
                <ThemedText type="subtitle" style={styles.statValue}>
                  {stats.totalClass}
                </ThemedText>
              </View>
            </View>

            {/* Thanh công cụ: tìm kiếm + sắp xếp + thêm */}
            <View style={[styles.toolbar, isWide ? styles.toolbarWide : undefined]}>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    backgroundColor: theme.backgroundElement,
                    color: theme.text,
                  },
                ]}
                value={search}
                onChangeText={setSearch}
                placeholder="Tìm theo họ tên hoặc mã GV…"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.sortRow}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  Sắp xếp:
                </ThemedText>
                {sortOptions.map((option) => {
                  const active = sortKey === option.key;
                  return (
                    <Pressable
                      key={option.key}
                      accessibilityRole="button"
                      onPress={() => setSortKey(option.key)}
                      style={[
                        styles.sortChip,
                        {
                          backgroundColor: active ? '#208AEF' : theme.backgroundElement,
                        },
                      ]}>
                      <ThemedText
                        type="small"
                        style={{ color: active ? '#ffffff' : theme.text }}>
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/form')}
                style={({ pressed }) => [
                  styles.addButton,
                  { backgroundColor: '#208AEF', opacity: pressed ? 0.85 : 1 },
                ]}>
                <ThemedText type="smallBold" style={styles.addButtonText}>
                  + Thêm giảng viên
                </ThemedText>
              </Pressable>
            </View>

            {/* Trạng thái */}
            {error !== null && <ErrorText message={`Không tải được dữ liệu: ${error}`} />}
            {actionError !== null && <ErrorText message={actionError} />}
            {loading ? (
              <ActivityIndicator style={styles.loading} />
            ) : filtered.length === 0 ? (
              <ThemedView type="backgroundElement" style={styles.empty}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {search === ''
                    ? 'Chưa có giảng viên nào. Nhấn “Thêm giảng viên” để bắt đầu.'
                    : 'Không tìm thấy giảng viên phù hợp.'}
                </ThemedText>
              </ThemedView>
            ) : isWide ? (
              <LecturerTable
                lecturers={filtered}
                theme={theme}
                onOpen={setDetail}
                onEdit={openEdit}
                onDelete={setPendingDelete}
              />
            ) : (
              <LecturerCards lecturers={filtered} onOpen={setDetail} />
            )}
          </ScrollView>

          {/* Modal chi tiết */}
          <Modal
            visible={detail !== null}
            animationType="fade"
            transparent
            onRequestClose={() => setDetail(null)}>
            <Pressable style={styles.modalBackdrop} onPress={() => setDetail(null)}>
              <Pressable
                style={[
                  styles.detailCard,
                  { backgroundColor: theme.background, borderColor: theme.backgroundElement },
                ]}
                onPress={(event) => event.stopPropagation()}>
                {detail !== null && (
                  <>
                    <LecturerAvatar image={detail.Image} name={detail.Fullname} size={140} />
                    <View style={styles.detailInfo}>
                      <DetailRow label="Mã GV" value={detail.IDGV} />
                      <DetailRow label="Họ tên" value={detail.Fullname} />
                      <DetailRow label="Tổng số lớp" value={String(detail.SumClass)} />
                    </View>
                    <View style={styles.detailActions}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => openEdit(detail)}
                        style={[styles.actionButton, { borderColor: theme.backgroundSelected }]}>
                        <ThemedText type="smallBold">Sửa</ThemedText>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setPendingDelete(detail)}
                        style={[styles.actionButton, styles.deleteButton]}>
                        <ThemedText type="smallBold" style={styles.actionButtonText}>
                          Xoá
                        </ThemedText>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setDetail(null)}
                        style={[styles.actionButton, styles.closeButton]}>
                        <ThemedText type="smallBold" style={styles.actionButtonText}>
                          Đóng
                        </ThemedText>
                      </Pressable>
                    </View>
                  </>
                )}
              </Pressable>
            </Pressable>
          </Modal>

          {/* Xác nhận xoá */}
          <ConfirmDialog
            visible={pendingDelete !== null}
            title="Xoá giảng viên"
            message={
              pendingDelete !== null
                ? `Xoá giảng viên ${pendingDelete.Fullname} (${pendingDelete.IDGV}) khỏi DB QLHocPhan?`
                : ''
            }
            confirmLabel={deleting ? 'Đang xoá…' : 'Xoá'}
            destructive
            onConfirm={() => void handleConfirmDelete()}
            onCancel={() => setPendingDelete(null)}
          />
        </SafeAreaView>
      </ThemedView>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <ThemedText type="small" style={styles.detailLabel}>
        {label}:
      </ThemedText>
      <ThemedText type="default">{value}</ThemedText>
    </View>
  );
}

/* ---------- Bảng (màn hình rộng, web lớn) ---------- */

function LecturerTable({
  lecturers,
  theme,
  onOpen,
  onEdit,
  onDelete,
}: {
  lecturers: GiangVien[];
  theme: ReturnType<typeof useTheme>;
  onOpen: (gv: GiangVien) => void;
  onEdit: (gv: GiangVien) => void;
  onDelete: (gv: GiangVien) => void;
}) {
  return (
    <View style={[styles.tableCard, { borderColor: theme.backgroundElement }]}>
      <View style={[styles.tableRow, styles.tableHeaderRow]}>
        <ThemedText type="smallBold" style={styles.cellId}>
          Mã GV
        </ThemedText>
        <ThemedText type="smallBold" style={styles.cellAvatar}>
          Ảnh
        </ThemedText>
        <ThemedText type="smallBold" style={styles.cellName}>
          Họ tên
        </ThemedText>
        <ThemedText type="smallBold" style={styles.cellSum}>
          Tổng số lớp
        </ThemedText>
        <ThemedText type="smallBold" style={styles.cellActions}>
          Hành động
        </ThemedText>
      </View>
      {lecturers.map((gv) => (
        <View
          key={gv.IDGV}
          style={[styles.tableRow, { borderTopColor: theme.backgroundElement }]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onOpen(gv)}
            style={({ pressed }) => [
              styles.tableRowMain,
              pressed ? { backgroundColor: theme.backgroundElement } : undefined,
            ]}>
            <ThemedText type="small" style={styles.cellId}>
              {gv.IDGV}
            </ThemedText>
            <View style={styles.cellAvatar}>
              <LecturerAvatar image={gv.Image} name={gv.Fullname} size={40} />
            </View>
            <ThemedText type="small" style={styles.cellName} numberOfLines={1}>
              {gv.Fullname}
            </ThemedText>
            <ThemedText type="small" style={styles.cellSum}>
              {gv.SumClass}
            </ThemedText>
          </Pressable>
          <View style={styles.cellActions}>
            <Pressable
              accessibilityRole="button"
              onPress={() => onEdit(gv)}
              style={[styles.rowActionButton, { borderColor: theme.backgroundSelected }]}>
              <ThemedText type="small">Sửa</ThemedText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => onDelete(gv)}
              style={[styles.rowActionButton, styles.deleteButton]}>
              <ThemedText type="small" style={styles.actionButtonText}>
                Xoá
              </ThemedText>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}

/* ---------- Danh sách thẻ (màn hình hẹp / di động) ---------- */

function LecturerCards({
  lecturers,
  onOpen,
}: {
  lecturers: GiangVien[];
  onOpen: (gv: GiangVien) => void;
}) {
  return (
    <FlatList
      data={lecturers}
      keyExtractor={(item) => item.IDGV}
      scrollEnabled={false}
      ItemSeparatorComponent={() => <View style={{ height: Spacing.two }} />}
      renderItem={({ item }) => (
        <Pressable
          accessibilityRole="button"
          onPress={() => onOpen(item)}
          style={({ pressed }) => [
            styles.cardRow,
            pressed ? { opacity: 0.7 } : undefined,
          ]}>
          <LecturerAvatar image={item.Image} name={item.Fullname} size={52} />
          <View style={styles.cardInfo}>
            <ThemedText type="default" numberOfLines={1}>
              {item.Fullname}
            </ThemedText>
            <ThemedText type="small" style={styles.cardMeta}>
              {item.IDGV} · {item.SumClass} lớp
            </ThemedText>
          </View>
          <ThemedText type="smallBold" style={styles.cardChevron}>
            ›
          </ThemedText>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  content: {
    padding: Spacing.three,
    gap: Spacing.three,
    paddingBottom: Spacing.five,
  },
  contentWide: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 960,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  statCard: {
    flex: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  statValue: {
    fontSize: 28,
    lineHeight: 34,
  },
  toolbar: {
    gap: Spacing.two,
  },
  toolbarWide: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  searchInput: {
    flexGrow: 1,
    minWidth: 220,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 15,
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  sortChip: {
    borderRadius: Spacing.six,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two - 2,
  },
  addButton: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  addButtonText: {
    color: '#ffffff',
  },
  loading: {
    marginTop: Spacing.four,
  },
  empty: {
    borderRadius: Spacing.three,
    padding: Spacing.four,
    alignItems: 'center',
  },
  errorText: {
    color: '#D64545',
  },
  tableCard: {
    borderWidth: 1,
    borderRadius: Spacing.three,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    gap: Spacing.three,
    borderTopWidth: 1,
  },
  tableHeaderRow: {
    borderTopWidth: 0,
  },
  tableRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  cellId: {
    width: 90,
  },
  cellAvatar: {
    width: 48,
  },
  cellName: {
    flex: 1,
  },
  cellSum: {
    width: 90,
  },
  cellActions: {
    width: 130,
    flexDirection: 'row',
    gap: Spacing.two,
    justifyContent: 'flex-end',
  },
  rowActionButton: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one + 2,
  },
  deleteButton: {
    backgroundColor: '#D64545',
    borderColor: '#D64545',
  },
  actionButtonText: {
    color: '#ffffff',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    backgroundColor: 'rgba(128, 128, 128, 0.12)',
    padding: Spacing.three,
  },
  cardInfo: {
    flex: 1,
    gap: Spacing.half,
  },
  cardMeta: {
    opacity: 0.7,
  },
  cardChevron: {
    fontSize: 20,
    opacity: 0.5,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  detailCard: {
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: 'center',
  },
  detailInfo: {
    alignSelf: 'stretch',
    gap: Spacing.two,
  },
  detailRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  detailLabel: {
    width: 92,
    opacity: 0.6,
    lineHeight: 24,
  },
  detailActions: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  actionButton: {
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    minWidth: 96,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#208AEF',
    borderColor: '#208AEF',
  },
});
