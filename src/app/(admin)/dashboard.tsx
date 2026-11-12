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
import { LecturerAnalyticsPanel } from '@/components/lecturer-analytics-panel';
import { LecturerAvatar } from '@/components/lecturer-avatar';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { deleteLecturer, useLecturers } from '@/hooks/use-lecturers';
import { useTheme } from '@/hooks/use-theme';
import {
  computeLecturerStats,
  defaultOrderForSortKey,
  filterAndSortLecturers,
  type ImageFilter,
  type SortKey,
  type SortOrder,
} from '@/lib/giangvien-analytics';
import type { GiangVien } from '@/types/giangvien';

function ErrorText({ message }: { message: string }) {
  return (
    <ThemedText type="small" style={styles.errorText}>
      {message}
    </ThemedText>
  );
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'idgv', label: 'Mã GV' },
  { key: 'fullname', label: 'Họ tên' },
  { key: 'sumclass', label: 'Số lớp' },
];

const IMAGE_FILTER_OPTIONS: { key: ImageFilter; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'with_image', label: 'Có ảnh' },
  { key: 'without_image', label: 'Chưa có ảnh' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { lecturers, loading, error } = useLecturers();
  const { width } = useWindowDimensions();
  const isWide = width >= 768;

  const [search, setSearch] = useState('');
  const [imageFilter, setImageFilter] = useState<ImageFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('fullname');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const [detail, setDetail] = useState<GiangVien | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GiangVien | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const stats = useMemo(() => computeLecturerStats(lecturers), [lecturers]);

  const filtered = useMemo(
    () =>
      filterAndSortLecturers(lecturers, {
        search,
        imageFilter,
        sortKey,
        sortOrder,
      }),
    [lecturers, search, imageFilter, sortKey, sortOrder],
  );

  const hasActiveFilter = search.trim() !== '' || imageFilter !== 'all';

  function handleSelectSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(nextKey);
      setSortOrder(defaultOrderForSortKey(nextKey));
    }
  }

  function toggleSortOrder() {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  }

  function resetFilters() {
    setSearch('');
    setImageFilter('all');
  }

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
            {/* Bảng thống kê nâng cao & Biểu đồ số lớp */}
            <LecturerAnalyticsPanel
              lecturers={lecturers}
              stats={stats}
              isWide={isWide}
              onSelectLecturer={setDetail}
            />

            {/* Thanh công cụ: Tìm kiếm + Thêm mới + Bộ lọc + Sắp xếp 2 chiều */}
            <View
              style={[
                styles.filterPanel,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.backgroundSelected,
                },
              ]}>
              <View style={[styles.topBarRow, isWide ? styles.topBarRowWide : undefined]}>
                <TextInput
                  style={[
                    styles.searchInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.text,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Tìm theo họ tên hoặc mã GV…"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
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

              {/* Hàng lọc ảnh + sắp xếp 2 chiều + bộ đếm kết quả */}
              <View style={styles.sortAndResultRow}>
                <View style={styles.chipGroupRow}>
                  <ThemedText
                    type="small"
                    style={[styles.groupLabel, { color: theme.textSecondary }]}>
                    Lọc ảnh:
                  </ThemedText>
                  {IMAGE_FILTER_OPTIONS.map((option) => {
                    const active = imageFilter === option.key;
                    return (
                      <Pressable
                        key={option.key}
                        accessibilityRole="button"
                        onPress={() => setImageFilter(option.key)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? '#208AEF' : theme.background,
                            borderColor: active ? '#208AEF' : theme.backgroundSelected,
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

                  <View style={styles.dividerDot} />

                  <ThemedText
                    type="small"
                    style={[styles.groupLabel, { color: theme.textSecondary }]}>
                    Sắp xếp:
                  </ThemedText>
                  {SORT_OPTIONS.map((option) => {
                    const active = sortKey === option.key;
                    const arrow = active ? (sortOrder === 'asc' ? ' ↑' : ' ↓') : '';
                    return (
                      <Pressable
                        key={option.key}
                        accessibilityRole="button"
                        onPress={() => handleSelectSort(option.key)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? '#208AEF' : theme.background,
                            borderColor: active ? '#208AEF' : theme.backgroundSelected,
                          },
                        ]}>
                        <ThemedText
                          type="small"
                          style={{ color: active ? '#ffffff' : theme.text }}>
                          {option.label}
                          {arrow}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                  <Pressable
                    accessibilityRole="button"
                    onPress={toggleSortOrder}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: theme.background,
                        borderColor: theme.backgroundSelected,
                      },
                    ]}>
                    <ThemedText type="smallBold" style={{ color: '#208AEF' }}>
                      {sortOrder === 'asc' ? '↑ Tăng dần' : '↓ Giảm dần'}
                    </ThemedText>
                  </Pressable>
                </View>

                <View style={styles.resultMetaRow}>
                  <ThemedText type="small" style={{ color: theme.textSecondary }}>
                    Hiển thị {filtered.length}/{lecturers.length} GV
                  </ThemedText>
                  {hasActiveFilter && (
                    <Pressable
                      accessibilityRole="button"
                      onPress={resetFilters}
                      style={({ pressed }) => [
                        styles.resetButton,
                        { opacity: pressed ? 0.7 : 1 },
                      ]}>
                      <ThemedText type="smallBold" style={{ color: '#D64545' }}>
                        Xoá bộ lọc
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            {/* Trạng thái & Danh sách */}
            {error !== null && <ErrorText message={`Không tải được dữ liệu: ${error}`} />}
            {actionError !== null && <ErrorText message={actionError} />}
            {loading ? (
              <ActivityIndicator style={styles.loading} />
            ) : filtered.length === 0 ? (
              <ThemedView type="backgroundElement" style={styles.empty}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {lecturers.length === 0
                    ? 'Chưa có giảng viên nào. Nhấn “Thêm giảng viên” để bắt đầu.'
                    : 'Không tìm thấy giảng viên phù hợp với bộ lọc hiện tại.'}
                </ThemedText>
              </ThemedView>
            ) : isWide ? (
              <LecturerTable
                lecturers={filtered}
                theme={theme}
                sortKey={sortKey}
                sortOrder={sortOrder}
                onSort={handleSelectSort}
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
  sortKey,
  sortOrder,
  onSort,
  onOpen,
  onEdit,
  onDelete,
}: {
  lecturers: GiangVien[];
  theme: ReturnType<typeof useTheme>;
  sortKey: SortKey;
  sortOrder: SortOrder;
  onSort: (key: SortKey) => void;
  onOpen: (gv: GiangVien) => void;
  onEdit: (gv: GiangVien) => void;
  onDelete: (gv: GiangVien) => void;
}) {
  function sortIndicator(column: SortKey): string {
    if (sortKey !== column) {
      return ' ↕';
    }
    return sortOrder === 'asc' ? ' ↑' : ' ↓';
  }

  return (
    <View style={[styles.tableCard, { borderColor: theme.backgroundElement }]}>
      <View style={[styles.tableRow, styles.tableHeaderRow]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSort('idgv')}
          style={styles.cellId}>
          <ThemedText
            type="smallBold"
            style={sortKey === 'idgv' ? styles.activeSortHeader : undefined}>
            Mã GV{sortIndicator('idgv')}
          </ThemedText>
        </Pressable>
        <ThemedText type="smallBold" style={styles.cellAvatar}>
          Ảnh
        </ThemedText>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSort('fullname')}
          style={styles.cellName}>
          <ThemedText
            type="smallBold"
            style={sortKey === 'fullname' ? styles.activeSortHeader : undefined}>
            Họ tên{sortIndicator('fullname')}
          </ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => onSort('sumclass')}
          style={styles.cellSum}>
          <ThemedText
            type="smallBold"
            style={sortKey === 'sumclass' ? styles.activeSortHeader : undefined}>
            Tổng số lớp{sortIndicator('sumclass')}
          </ThemedText>
        </Pressable>
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
  filterPanel: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  topBarRow: {
    gap: Spacing.two,
  },
  topBarRowWide: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flexGrow: 1,
    minWidth: 220,
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
    fontSize: 15,
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
  chipGroupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.one + 2,
  },
  groupLabel: {
    marginRight: Spacing.half,
  },
  chip: {
    borderWidth: 1,
    borderRadius: Spacing.six,
    paddingHorizontal: Spacing.two + 4,
    paddingVertical: Spacing.one,
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128, 128, 128, 0.45)',
    marginHorizontal: Spacing.one,
  },
  sortAndResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  resultMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  resetButton: {
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.one,
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
  activeSortHeader: {
    color: '#208AEF',
  },
  tableRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  cellId: {
    width: 96,
  },
  cellAvatar: {
    width: 48,
  },
  cellName: {
    flex: 1,
  },
  cellSum: {
    width: 112,
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
