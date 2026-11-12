import { doc, getDoc } from 'firebase/firestore';
import type { DocumentData } from 'firebase/firestore';

import { giangvienRef } from '@/lib/firebase';
import type { GiangVien } from '@/types/giangvien';

/** Giới hạn an toàn cho ảnh base64 (Firestore giới hạn 1MB/document). */
export const MAX_IMAGE_BYTES = 900 * 1024;

const IDGV_PATTERN = /^[A-Za-z0-9_-]+$/;

/**
 * Hàm serialize DUY NHẤT khi ghi Firestore.
 * Chỉ cho phép đúng 4 trường IDGV / Fullname / Image / SumClass —
 * mọi ghi (setDoc/updateDoc khi thêm) phải đi qua đây để không bao giờ thừa field.
 */
export function toDoc(gv: GiangVien): Pick<GiangVien, 'IDGV' | 'Fullname' | 'Image' | 'SumClass'> {
  return {
    IDGV: gv.IDGV,
    Fullname: gv.Fullname,
    Image: gv.Image,
    SumClass: gv.SumClass,
  };
}

/** Chuẩn hoá dữ liệu đọc từ Firestore về đúng kiểu GiangVien. */
export function fromDoc(id: string, data: DocumentData | undefined): GiangVien {
  const rawSum = Number(data?.SumClass);
  const idgv = typeof data?.IDGV === 'string' && data.IDGV !== '' ? data.IDGV : id;
  return {
    IDGV: idgv,
    Fullname: typeof data?.Fullname === 'string' ? data.Fullname : '',
    Image: typeof data?.Image === 'string' ? data.Image : '',
    SumClass: Number.isFinite(rawSum) && rawSum >= 0 ? Math.floor(rawSum) : 0,
  };
}

export function isValidIDGV(idgv: string): boolean {
  return idgv.length > 0 && idgv.length <= 64 && IDGV_PATTERN.test(idgv);
}

/** Kiểm tra IDGV đã tồn tại trong collection (trùng mã khi thêm mới). */
export async function idgvExists(idgv: string): Promise<boolean> {
  const snapshot = await getDoc(doc(giangvienRef, idgv));
  return snapshot.exists();
}

/** Ước lượng số byte của ảnh khi lưu base64 (khoảng 3/4 độ dài chuỗi). */
export function estimateImageBytes(dataUriOrBase64: string): number {
  const separatorIndex = dataUriOrBase64.indexOf(',');
  const base64 =
    separatorIndex >= 0 ? dataUriOrBase64.slice(separatorIndex + 1) : dataUriOrBase64;
  return Math.floor((base64.length * 3) / 4);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(0)} KB`;
}
