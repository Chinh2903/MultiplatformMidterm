# Quản lý Giảng viên — QLHocPhan

Đồ án giữa kỳ: app phân hệ admin quản lý giảng viên trên database QLHocPhan, một codebase chạy cả web và mobile.

## Công nghệ

- Expo (React Native) SDK 58, expo-router, TypeScript
- Firebase Firestore + Authentication (Email/Password)
- expo-image-picker, react-native-web

## Tính năng

- Đăng nhập admin bằng Firebase Authentication, tự chặn vào khu vực admin khi chưa đăng nhập
- Bảng điều khiển thống kê nâng cao (Tổng số GV, Tổng số lớp, Trung bình lớp/GV, Giảng viên dạy nhiều/ít lớp nhất, tỷ lệ cập nhật ảnh)
- Biểu đồ thanh ngang trực quan so sánh số lớp (`SumClass`) của từng giảng viên
- Tìm kiếm theo họ tên / mã GV, lọc theo trạng thái có/chưa có ảnh, sắp xếp 2 chiều (`ASC`/`DESC`) theo Mã GV, Họ tên hoặc Số lớp
- Giao diện responsive: bảng khi màn hình rộng (web, hỗ trợ nhấn tiêu đề cột để sắp xếp), thẻ khi màn hẹp (mobile)
- Thêm / sửa / xoá giảng viên, xoá có dialog xác nhận; IDGV là document ID nên trùng mã bị chặn ngay khi thêm
- Ảnh chọn từ thư viện máy, nén base64 lưu trực tiếp vào trường `Image` (dưới ~900KB/doc)
- Ảnh hiển thị trên cả web và mobile, phiên đăng nhập được giữ giữa các lần mở app

## Dữ liệu

Collection `giangvien` — mỗi document đúng 4 trường:

| Trường     | Kiểu   | Ghi chú                              |
| ---------- | ------ | ------------------------------------ |
| `IDGV`     | string | Mã giảng viên, VD `GV001`            |
| `Fullname` | string | Họ và tên                            |
| `Image`    | string | Data-URI base64 hoặc chuỗi rỗng      |
| `SumClass` | number | Tổng số lớp, số nguyên >= 0          |

Dữ liệu mẫu để nhập nhanh: `data/giangvien_seed.json`.

## Cài đặt & chạy

Tạo file `.env` theo mẫu `.env.example` với config của project Firebase (Firestore + Authentication), rồi:

```bash
npx expo install
npx expo start        # nhấn w để mở web, quét QR để chạy trên Expo Go
```

## Kiểm tra

```bash
npm run lint
npx tsc --noEmit
npx expo-doctor
```

## Cấu trúc mã nguồn

```
src/
  app/
    _layout.tsx          # Root stack + auth gate
    index.tsx            # Đăng nhập
    (admin)/
      _layout.tsx        # Layout khu vực admin + đăng xuất
      dashboard.tsx      # Danh sách giảng viên
      form.tsx           # Thêm / sửa giảng viên
  components/            # ConfirmDialog, LecturerAvatar, ThemedText/ThemedView
  hooks/                 # use-auth, use-lecturers, theme
  lib/
    firebase.ts          # Khởi tạo Firebase từ biến môi trường
    giangvien.ts         # toDoc / fromDoc, kiểm tra trùng mã, kích thước ảnh
  types/
    giangvien.ts         # Kiểu GiangVien (4 trường)
```
