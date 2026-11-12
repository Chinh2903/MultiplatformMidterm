import type { GiangVien } from '@/types/giangvien';

export type SortKey = 'idgv' | 'fullname' | 'sumclass';
export type SortOrder = 'asc' | 'desc';
export type ImageFilter = 'all' | 'with_image' | 'without_image';

export type LecturerStats = {
  count: number;
  totalClass: number;
  avgClass: number;
  maxLecturer: GiangVien | null;
  minLecturer: GiangVien | null;
  withImageCount: number;
  withoutImageCount: number;
};

export type FilterAndSortOptions = {
  search: string;
  imageFilter: ImageFilter;
  sortKey: SortKey;
  sortOrder: SortOrder;
};

/**
 * Tính toán các chỉ số thống kê trực tiếp
 * từ 4 trường chuẩn (IDGV, Fullname, Image, SumClass).
 */
export function computeLecturerStats(lecturers: GiangVien[]): LecturerStats {
  const count = lecturers.length;
  if (count === 0) {
    return {
      count: 0,
      totalClass: 0,
      avgClass: 0,
      maxLecturer: null,
      minLecturer: null,
      withImageCount: 0,
      withoutImageCount: 0,
    };
  }

  let totalClass = 0;
  let withImageCount = 0;
  let maxLecturer: GiangVien = lecturers[0];
  let minLecturer: GiangVien = lecturers[0];

  for (const gv of lecturers) {
    totalClass += gv.SumClass;
    if (gv.Image.trim() !== '') {
      withImageCount += 1;
    }
    if (gv.SumClass > maxLecturer.SumClass) {
      maxLecturer = gv;
    }
    if (gv.SumClass < minLecturer.SumClass) {
      minLecturer = gv;
    }
  }

  return {
    count,
    totalClass,
    avgClass: totalClass / count,
    maxLecturer,
    minLecturer,
    withImageCount,
    withoutImageCount: count - withImageCount,
  };
}

function matchesImageFilter(image: string, filter: ImageFilter): boolean {
  const hasImage = image.trim() !== '';
  switch (filter) {
    case 'with_image':
      return hasImage;
    case 'without_image':
      return !hasImage;
    case 'all':
    default:
      return true;
  }
}

/**
 * Lọc và sắp xếp 2 chiều (ASC / DESC) danh sách giảng viên.
 */
export function filterAndSortLecturers(
  lecturers: GiangVien[],
  options: FilterAndSortOptions,
): GiangVien[] {
  const query = options.search.trim().toLowerCase();

  const filtered = lecturers.filter((gv) => {
    if (query !== '') {
      const matchedName = gv.Fullname.toLowerCase().includes(query);
      const matchedId = gv.IDGV.toLowerCase().includes(query);
      if (!matchedName && !matchedId) {
        return false;
      }
    }
    if (!matchesImageFilter(gv.Image, options.imageFilter)) {
      return false;
    }
    return true;
  });

  const direction = options.sortOrder === 'asc' ? 1 : -1;

  return [...filtered].sort((a, b) => {
    let cmp = 0;
    if (options.sortKey === 'idgv') {
      cmp = a.IDGV.localeCompare(b.IDGV, 'vi', { numeric: true });
    } else if (options.sortKey === 'fullname') {
      cmp = a.Fullname.localeCompare(b.Fullname, 'vi');
    } else {
      cmp = a.SumClass - b.SumClass;
    }
    if (cmp === 0) {
      cmp = a.IDGV.localeCompare(b.IDGV, 'vi', { numeric: true });
    }
    return cmp * direction;
  });
}

/** Mặc định chiều sắp xếp hợp lý khi người dùng chọn sang một tiêu chí mới. */
export function defaultOrderForSortKey(key: SortKey): SortOrder {
  return key === 'sumclass' ? 'desc' : 'asc';
}
