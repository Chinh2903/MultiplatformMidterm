/**
 * Schema CỨNG của collection `giangvien` trên Firestore.
 * Khớp đề bài: DB QLHocPhan, collection giảng viên, đúng 4 trường, KHÔNG thêm trường nào khác.
 */
export type GiangVien = {
  /** Mã giảng viên, ví dụ "GV001" — đóng vai trò document ID. */
  IDGV: string;
  /** Họ và tên giảng viên. */
  Fullname: string;
  /** Ảnh đại diện dạng data-URI base64 (hoặc chuỗi rỗng nếu chưa có). */
  Image: string;
  /** Tổng số lớp đang dạy (số nguyên >= 0). */
  SumClass: number;
};
