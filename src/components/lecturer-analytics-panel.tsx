import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { LecturerStats } from '@/lib/giangvien-analytics';
import type { GiangVien } from '@/types/giangvien';

type Props = {
  lecturers: GiangVien[];
  stats: LecturerStats;
  isWide: boolean;
  onSelectLecturer: (gv: GiangVien) => void;
};

export function LecturerAnalyticsPanel({
  lecturers,
  stats,
  isWide,
  onSelectLecturer,
}: Props) {
  const theme = useTheme();
  const [showChart, setShowChart] = useState(true);

  const sortedForChart = useMemo(
    () =>
      [...lecturers].sort(
        (a, b) =>
          b.SumClass - a.SumClass || a.IDGV.localeCompare(b.IDGV, 'vi', { numeric: true }),
      ),
    [lecturers],
  );

  const maxClass = stats.maxLecturer?.SumClass ?? 0;

  return (
    <View style={styles.wrapper}>
      {/* Lưới 4 thẻ KPI */}
      <View style={[styles.kpiGrid, isWide ? styles.kpiGridWide : styles.kpiGridCompact]}>
        <View style={[styles.kpiCard, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Số giảng viên
          </ThemedText>
          <ThemedText type="subtitle" style={styles.kpiValue}>
            {stats.count}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Có ảnh: {stats.withImageCount}/{stats.count}
          </ThemedText>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Tổng số lớp
          </ThemedText>
          <ThemedText type="subtitle" style={styles.kpiValue}>
            {stats.totalClass}
          </ThemedText>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Trung bình lớp / GV
          </ThemedText>
          <ThemedText type="subtitle" style={styles.kpiValue}>
            {stats.count > 0 ? stats.avgClass.toFixed(1) : '0.0'}
          </ThemedText>
        </View>

        <View style={[styles.kpiCard, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText type="small" style={{ color: theme.textSecondary }}>
            Biên độ số lớp (Cao / Thấp)
          </ThemedText>
          {stats.maxLecturer && stats.minLecturer ? (
            <>
              <ThemedText type="default" style={styles.rangeTitle} numberOfLines={1}>
                Cao nhất: {stats.maxLecturer.SumClass} lớp ({stats.maxLecturer.IDGV})
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }} numberOfLines={1}>
                Thấp nhất: {stats.minLecturer.SumClass} lớp ({stats.minLecturer.IDGV})
              </ThemedText>
            </>
          ) : (
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              Chưa có dữ liệu
            </ThemedText>
          )}
        </View>
      </View>

      {/* Khung Biểu đồ số lớp theo từng giảng viên */}
      {stats.count > 0 && (
        <View
          style={[
            styles.chartCard,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.backgroundSelected,
            },
          ]}>
          <View style={styles.chartHeader}>
            <ThemedText type="smallBold">
              Biểu đồ số lớp theo giảng viên (SumClass)
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowChart((prev) => !prev)}
              style={({ pressed }) => [
                styles.toggleButton,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.backgroundSelected,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}>
              <ThemedText type="smallBold" style={{ color: '#208AEF' }}>
                {showChart ? 'Thu gọn' : 'Mở biểu đồ'}
              </ThemedText>
            </Pressable>
          </View>

          {showChart && (
            <View style={styles.barList}>
              {sortedForChart.map((gv) => {
                const ratio = maxClass > 0 ? (gv.SumClass / maxClass) * 100 : 0;
                const barWidthPercent = gv.SumClass === 0 ? 3 : Math.max(8, Math.round(ratio));

                return (
                  <Pressable
                    key={gv.IDGV}
                    accessibilityRole="button"
                    onPress={() => onSelectLecturer(gv)}
                    style={({ pressed }) => [
                      styles.barRow,
                      pressed ? { opacity: 0.7 } : undefined,
                    ]}>
                    <View style={styles.barLabelCol}>
                      <ThemedText type="smallBold" numberOfLines={1}>
                        {gv.IDGV}
                      </ThemedText>
                      <ThemedText
                        type="small"
                        style={{ color: theme.textSecondary }}
                        numberOfLines={1}>
                        {gv.Fullname}
                      </ThemedText>
                    </View>
                    <View style={[styles.barTrack, { backgroundColor: theme.background }]}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${barWidthPercent}%`,
                            backgroundColor: '#208AEF',
                          },
                        ]}
                      />
                    </View>
                    <ThemedText type="smallBold" style={styles.barValueCol}>
                      {gv.SumClass} lớp
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: Spacing.three,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  kpiGridWide: {
    gap: Spacing.three,
  },
  kpiGridCompact: {
    gap: Spacing.two,
  },
  kpiCard: {
    flexGrow: 1,
    flexBasis: 180,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  kpiValue: {
    fontSize: 26,
    lineHeight: 32,
  },
  rangeTitle: {
    fontWeight: '700',
    marginTop: Spacing.half,
  },
  chartCard: {
    borderRadius: Spacing.three,
    borderWidth: 1,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.two,
    flexWrap: 'wrap',
  },
  toggleButton: {
    borderWidth: 1,
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.two + 2,
    paddingVertical: Spacing.one,
  },
  barList: {
    marginTop: Spacing.one,
    gap: Spacing.two,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  barLabelCol: {
    width: 135,
  },
  barTrack: {
    flex: 1,
    height: 14,
    borderRadius: 7,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 7,
  },
  barValueCol: {
    width: 56,
    textAlign: 'right',
  },
});
