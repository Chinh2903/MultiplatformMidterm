import { deleteDoc, doc, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { fromDoc, toDoc } from '@/lib/giangvien';
import { giangvienRef } from '@/lib/firebase';
import type { GiangVien } from '@/types/giangvien';

type LecturersState = {
  lecturers: GiangVien[];
  loading: boolean;
  error: string | null;
};

/** Subscribe realtime collection `giangvien` (cập nhật UI ngay khi dữ liệu đổi). */
export function useLecturers(): LecturersState {
  const [lecturers, setLecturers] = useState<GiangVien[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      giangvienRef,
      (snapshot) => {
        setLecturers(snapshot.docs.map((d) => fromDoc(d.id, d.data())));
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, []);

  return { lecturers, loading, error };
}

/** Thêm mới — document ID chính là IDGV (đã kiểm tra trùng trước khi gọi). */
export async function createLecturer(gv: GiangVien): Promise<void> {
  await setDoc(doc(giangvienRef, gv.IDGV), toDoc(gv));
}

/** Cập nhật — chỉ ghi các trường thực sự thay đổi (IDGV không đổi). */
export async function updateLecturer(
  id: string,
  next: GiangVien,
  current: GiangVien | null,
): Promise<void> {
  const ref = doc(giangvienRef, id);
  if (!current) {
    await setDoc(ref, toDoc(next));
    return;
  }
  const changes: {
    Fullname?: string;
    Image?: string;
    SumClass?: number;
  } = {};
  if (next.Fullname !== current.Fullname) {
    changes.Fullname = next.Fullname;
  }
  if (next.Image !== current.Image) {
    changes.Image = next.Image;
  }
  if (next.SumClass !== current.SumClass) {
    changes.SumClass = next.SumClass;
  }
  if (Object.keys(changes).length === 0) {
    return;
  }
  await updateDoc(ref, changes);
}

export async function deleteLecturer(id: string): Promise<void> {
  await deleteDoc(doc(giangvienRef, id));
}
