# lo-de-report-web

Web app Next.js + TypeScript để OCR ảnh cược lô đề, cho người dùng sửa text, tính kết quả và xuất report PNG. App chạy client-side, không dùng backend, database hay API route cho OCR.

## Cài đặt

```bash
npm install
```

## Chạy dev

```bash
npm run dev
```

Mở `http://localhost:3000`.

## Kiểm tra

```bash
npm run lint
npm run test
npm run build
```

## Deploy Vercel

1. Push repository lên GitHub/GitLab/Bitbucket.
2. Vào Vercel, chọn **New Project** và import repository.
3. Giữ cấu hình mặc định cho Next.js.
4. Build command: `npm run build`.
5. Deploy.

## Ghi chú kỹ thuật

- OCR dùng `tesseract.js` chạy trong browser.
- Xuất PNG dùng `html-to-image` với `toPng`.
- Dữ liệu tạm tự lưu trong `localStorage`.
- JSON import/export chỉ lưu danh sách các lần đánh.
