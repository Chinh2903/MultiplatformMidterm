# Midterm — App Admin Quản lý Giảng viên (QLHocPhan)

App phân hệ admin CRUD giảng viên trên DB **QLHocPhan** (Firebase), collection **giảng viên**, đúng 4 trường `IDGV, Fullname, Image, SumClass`.

- **Nền tảng**: Expo React Native (SDK 58) + expo-router — chạy **web** (phần chính) và **Android/iOS qua Expo Go** (nhập & hiển thị ảnh).
- **DB**: Firebase **Firestore** (project `QLHocPhan`), đồng thời dùng **Firebase Auth** (Email/Password) cho đăng nhập admin.
- **Ảnh**: chọn từ thư viện (`expo-image-picker`, crop vuông, quality 0.3) → nén base64 data-URI lưu trực tiếp trong trường `Image` (nhỏ hơn ~900KB để an toàn giới hạn 1MB/doc của Firestore).

## 1. Chuẩn bị Firebase (làm 1 lần trên console)

1. Vào <https://console.firebase.google.com> → **Add project** → đặt tên `QLHocPhan` (tên tự chọn).
2. Trong project: **Build → Firestore Database → Create database** → chọn vùng gần nhất → chế độ **Start in test mode** (demo; có thể siết lại sau).
3. **Build → Authentication → Get started → Sign-in method → Email/Password → Enable → Save.**
4. Vẫn trong Authentication: tab **Users → Add user** → tạo 1 tài khoản admin (email + mật khẩu) — đây là tài khoản đăng nhập app.
5. **Project settings (⚙️) → General → Your apps → Web app (`</>`)** → đăng ký (tên app tuỳ ý, bỏ qua Firebase Hosting) → copy khối **config** (`apiKey`, `authDomain`, `projectId`, `storageBucket`, `messagingSenderId`, `appId`).
6. **Firestore Database → Rules** — thay rule mặc định bằng rule chỉ cho phép user đã đăng nhập đọc/ghi:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /giangvien/{docId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

## 2. Cấu hình biến môi trường

Tạo file `.env` ở thư mục gốc (đã có mẫu `.env.example`), điền config ở bước 1.5:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

> `.env` đã được gitignore — KHÔNG commit file này. Chỉ `.env.example` (không có giá trị thật) được commit.
> Đổi `.env` xong phải khởi động lại dev server để biến mới có hiệu lực.

## 3. Chạy app

```bash
npx expo install        # cài dependencies theo SDK (lần đầu sau khi clone)
npx expo start          # mở Metro; Nhấn w = web, hoặc quét QR = Expo Go trên máy thật
```

- **Web**: `npx expo start` rồi nhấn `w` (hoặc `npx expo start --web`) — chạy CRUD trọn vòng trên trình duyệt.
- **Mobile (Expo Go)**: cài app *Expo Go* → quét QR từ terminal (cùng mạng Wi-Fi) → đăng nhập → chọn ảnh từ máy → lưu → xem ảnh trong danh sách & màn chi tiết.
- Kiểm tra nhanh được dùng thêm: `npx eslint .`, `npx tsc --noEmit`, `npx expo-doctor`.

## 4. Schema CSDL (ràng buộc cứng)

Collection `giangvien` — mỗi document ĐÚNG 4 trường (không thêm bớt, không sub-collection):

| Trường    | Kiểu    | Ghi chú                                  |
| --------- | ------- | ---------------------------------------- |
| `IDGV`    | string  | Mã GV (VD `GV001`) — là document ID      |
| `Fullname`| string  | Họ và tên                                |
| `Image`   | string  | Data-URI base64 (`data:image/jpeg;base64,…`) hoặc rỗng |
| `SumClass`| number  | Tổng số lớp, số nguyên ≥ 0               |

Mọi ghi đều đi qua một hàm serialize duy nhất `toDoc()` (`src/lib/giangvien.ts`) nên không thể vô tình thêm trường khác. document ID cũng chính là `IDGV` → trùng mã bị chặn ngay từ lúc thêm.

## 5. Dữ liệu mẫu để nhập nhanh

`data/giangvien_seed.json` chứa 5 giảng viên mẫu (đủ 4 trường). Nhập bằng cách thêm qua app (nhanh nhất khi demo) hoặc dùng extension import JSON của Firestore.

## 6. Xuất file CSDL JSON để nộp

- Mở **Firestore Database** trong console → phần danh sách documents của collection `giangvien`.
- Dùng extension như **Export Firestore Data** / *firestore-export* (Chrome) hoặc copy thủ công ra mảng JSON — mỗi object phải đủ 4 trường như schema trên.

## 7. Kịch bản quay video demo (gợi ý ~3–5 phút)

1. Mở web → đăng nhập **sai** mật khẩu → hiện lỗi.
2. Đăng nhập **đúng** → vào danh sách giảng viên.
3. Thêm GV mới (có chọn ảnh từ máy nếu đang trên mobile) → xuất hiện ngay trong danh sách (realtime).
4. Sửa một GV (đổi tên/tổng số lớp) → reload trang → dữ liệu còn nguyên (chứng minh đã lên Firestore).
5. Xoá một GV qua dialog xác nhận.
6. Search theo tên/mã + đổi sort (họ tên ↔ số lớp) + chỉ 2 số liệu tổng quan.
7. Mở **Firebase console → Firestore** → chỉ rõ document có đúng 4 trường `IDGV, Fullname, Image, SumClass`.
8. Trên **Expo Go (mobile)**: đăng nhập → chọn ảnh từ thư viện máy → lưu → mở màn chi tiết xem ảnh → đóng app mở lại vẫn còn đăng nhập + còn dữ liệu.

## 8. Đẩy lên GitHub (tự thực hiện)

Repo local đã sẵn sàng (branch `master`). Sau khi tạo repo trống trên GitHub:

```bash
cd Midterm
git remote add origin https://github.com/<user>/<repo>.git
git add .
git commit -m "App admin quan ly giang vien (Firebase Auth + Firestore)"
git push -u origin master
```

> Kiểm tra `git status` trước khi commit: phải KHÔNG thấy `.env` (đã gitignore), thấy `.env.example`.

## 9. Cấu trúc mã nguồn chính

```
src/
  app/
    _layout.tsx          # Root Stack + AuthProvider + auth gate (chặn route chưa đăng nhập)
    index.tsx            # Màn hình Đăng nhập "/"
    +not-found.tsx       # 404
    (admin)/
      _layout.tsx        # Header admin + nút Đăng xuất
      dashboard.tsx      # Danh sách GV: realtime, tìm kiếm, sắp xếp, thống kê, bảng (web rộng) / thẻ (hẹp), modal chi tiết, xoá
      form.tsx           # Thêm/Sửa (param ?id) + chọn ảnh base64 + xác nhận xoá
  components/            # ConfirmDialog, LecturerAvatar, ThemedText/ThemedView
  hooks/                 # use-auth (Auth gate), use-lecturers (onSnapshot + CRUD), theme
  lib/
    firebase.ts          # Khởi tạo Firebase (config từ .env), auth persistence AsyncStorage (native)
    giangvien.ts         # toDoc/fromDoc (schema 4 trường), kiểm tra trùng IDGV, ước lượng kích thước ảnh
  types/giangvien.ts     # Type GiangVien (4 trường)
data/giangvien_seed.json # Dữ liệu mẫu
```
