# lo-de-report-web

Web app Next.js + TypeScript để OCR ảnh cược lô đề, cho người dùng kiểm tra/sửa text trước khi tính toán, tổng hợp nhiều lần đánh và xuất báo cáo PNG. App chạy hoàn toàn client-side, không dùng backend, database hay API route cho OCR.

## Hướng Dẫn Sử Dụng

### 1. Mở màn hình chính

Chạy app rồi mở trình duyệt:

```bash
npm run dev
```

Truy cập `http://localhost:3000`.

Trên điện thoại, giao diện sẽ xếp dọc 1 cột. Trên PC/laptop, màn hình có sidebar bên trái để chọn lần đánh và vùng nhập liệu bên phải.

### 2. Quản lý lần đánh

- Bấm **Thêm lần** để tạo một lần đánh mới.
- Bấm **Xóa lần** để xóa lần đang chọn.
- Trên điện thoại, chọn lần bằng dropdown **Lần 1, Lần 2...**.
- Trên PC, chọn lần bằng danh sách ở sidebar trái.
- Nhập **Tên lần đánh** để đặt tên dễ nhớ.
- Chọn **Ngày** nếu muốn hiển thị ngày trên báo cáo.
- Tick **Không ghi ngày** nếu không muốn ngày xuất hiện trong report.

Mỗi lần đánh có dữ liệu cược, kết quả xổ số và ảnh riêng.

### 3. Nhập ảnh cược và OCR

Có 3 cách đưa ảnh vào app:

- Kéo thả ảnh vào vùng ảnh trên PC.
- Dán ảnh bằng `Ctrl+V` nếu đang dùng PC/laptop.
- Bấm **Chọn/chụp ảnh** trên điện thoại hoặc PC để chọn file ảnh/chụp ảnh.

Sau khi có ảnh:

1. Kiểm tra preview ảnh đã đúng chưa.
2. Bấm **Đọc ảnh OCR**.
3. Đợi tiến trình **Đang đọc ảnh... %** chạy xong.
4. Text OCR sẽ được đưa vào ô **Dữ liệu cược**.
5. Đọc lại và sửa text nếu OCR nhận sai.
6. Sau khi sửa xong mới bấm **Tính toán**.

Lưu ý: app không tính trực tiếp từ ảnh. OCR chỉ chuyển ảnh thành text để bạn kiểm tra trước.

Nếu OCR lỗi hoặc đọc sai nhiều, hãy thử crop ảnh sát vùng tin nhắn, chọn ảnh rõ hơn hoặc nhập tay vào ô **Dữ liệu cược**.

### 4. Nhập dữ liệu cược

Nhập hoặc sửa dữ liệu trong ô **Dữ liệu cược**.

Các dạng app hiểu được:

```text
Lô 42 50d.
Lô 67.76 mc 25d.
Lô 46.64 mc 15d, đề 23=90k, 32=30k
Lo 16,61,17,71,24,42,25,52 mc 25d
Đề 68.86.66.88.29.92.32.61 mc 30k
```

Quy ước:

- `mc` nghĩa là mỗi con.
- `25d`, `25đ`, `25 điểm`, `25 diem` đều được hiểu là 25 điểm.
- `30k`, `30.000`, `30000` được hiểu là 30 điểm đề.
- Số `00`, `08`, `09` được giữ đúng 2 chữ số.
- Có thể phân cách số bằng dấu `.`, `,`, `;` hoặc khoảng trắng.

Nếu có dòng sai định dạng, app sẽ hiện lỗi rõ dòng nào để bạn sửa.

### 5. Nhập kết quả xổ số

Nhập kết quả vào ô **Kết quả xổ số** theo dạng:

```text
DB: 36
G1: 66
G2: 30 79
G3: 70 58 13 38 35 69
G4: 23 22 51 98
G5: 76 95 71 98 48 18
G6: 74 13 55
G7: 52 90 77 34
```

App cũng hiểu dạng dính liền:

```text
DB: 36G1: 66G2: 30 79G3: 70 58 13 38 35 69G4: 23 22 51 98G5: 76 95 71 98 48 18G6: 74 13 55G7: 52 90 77 34
```

Lưu ý:

- Đề chỉ xét giải đặc biệt `DB`.
- Lô xét toàn bộ số 2 chữ số trong tất cả các giải.

Bạn cũng có thể OCR ảnh kết quả xổ số chụp full màn hình điện thoại:

- Bấm **Chọn/chụp KQXS** trong khu vực **Ảnh kết quả xổ số**.
- App tự crop vùng giữa ảnh để bỏ thanh trình duyệt, header web, quảng cáo và thanh điều hướng.
- Kiểm tra **Ảnh gốc** và **Vùng crop OCR** trước khi đọc.
- Nếu vùng crop sai, bấm **Crop lại thủ công**, kéo chọn vùng bảng kết quả từ ĐB đến G7 rồi bấm **Áp dụng crop**.
- Bấm **Đọc KQXS** để OCR vùng crop.
- App chuẩn hóa kết quả về đúng dạng `DB/G1/G2...G7` và đưa vào textarea **Kết quả xổ số**.
- Nếu OCR nhận thừa hoặc thiếu số, app sẽ cảnh báo. Hãy kiểm tra và sửa text trước khi bấm **Tính toán**.

### 6. Tính toán

Bấm **Tính toán** sau khi đã nhập cược và kết quả.

App sẽ hiển thị các tab:

- **Lô đánh**: danh sách số lô và điểm đã gộp trùng.
- **Đề đánh**: danh sách số đề và điểm đã gộp trùng.
- **Lô trúng**: số trúng, điểm, số nháy và tiền ăn.
- **Đề**: từng số đề có trúng DB hay không.
- **Tổng kết**: vốn, tiền ăn và lãi/lỗ của lần đang chọn.

Thanh tổng phía dưới hiển thị tổng toàn bộ các lần:

- **Tổng vốn**
- **Tổng ăn**
- **Lãi/lỗ cuối cùng**

Trên điện thoại, thanh tổng nằm sticky ở cuối màn hình để dễ theo dõi.

### 7. Quy tắc tính tiền

Cấu hình mặc định:

- Lô vốn: `22.000đ / 1 điểm`
- Lô ăn: `80.000đ / 1 điểm / 1 nháy`
- Đề vốn: `1.000đ / 1 điểm`
- Đề ăn: `80.000đ / 1 điểm`

Cách tính:

- Lô trùng trong cùng một lần sẽ được gộp điểm.
- Lô trúng khi số xuất hiện trong toàn bộ kết quả.
- Nháy là số lần số đó xuất hiện.
- Đề chỉ trúng khi số bằng `DB`.
- Lãi/lỗ = tổng ăn - tổng vốn.

### 8. Xuất ảnh PNG

Bấm **Xuất ảnh** để tải báo cáo về máy với tên:

```text
tong-hop-lo-de.png
```

Nếu chưa bấm **Tính toán**, app sẽ tự tính trước rồi xuất ảnh.

Bấm **Ẩn/hiện preview báo cáo** để xem mẫu ảnh trước khi xuất. Trên điện thoại, preview có thể kéo ngang vì report giữ khổ cố định để ảnh xuất ra rõ nét.

### 9. Lưu và mở JSON

Bấm **Lưu JSON** để tải file:

```text
lo-de-data.json
```

File này chứa toàn bộ danh sách lần đánh, text cược, kết quả xổ số và ảnh đang lưu.

Bấm **Mở JSON** để chọn file JSON đã lưu trước đó và nạp lại dữ liệu vào app.

### 10. Tự lưu dữ liệu tạm

App tự lưu dữ liệu vào `localStorage` mỗi khi bạn thay đổi nội dung. Khi mở lại app trên cùng trình duyệt, dữ liệu sẽ được nạp lại.

Bấm **Xóa toàn bộ** để xóa dữ liệu đang lưu. App sẽ hỏi xác nhận trước khi xóa.

### 11. Nạp dữ liệu mẫu

Bấm **Nạp dữ liệu mẫu** để load 2 lần đánh mẫu. Sau đó bấm **Tính toán** để kiểm tra nhanh app hoạt động.

Kết quả mẫu kỳ vọng:

- Lần 1: tổng vốn `7.380.000đ`, tổng ăn `6.000.000đ`, lãi/lỗ `-1.380.000đ`.
- Lần 2: tổng vốn `9.512.000đ`, tổng ăn `6.400.000đ`, lãi/lỗ `-3.112.000đ`.
- Tổng cộng: tổng vốn `16.892.000đ`, tổng ăn `12.400.000đ`, lãi/lỗ `-4.492.000đ`.

### 12. Sử dụng trên điện thoại

Trên smartphone:

- Dùng dropdown để chọn lần đánh.
- Bấm **Chọn/chụp ảnh** để lấy ảnh từ thư viện hoặc camera.
- Có thể kéo ngang các bảng kết quả nếu bảng rộng.
- Có thể kéo ngang preview report.
- Nên dùng ảnh rõ chữ, crop sát vùng tin nhắn để OCR nhanh và chính xác hơn.

## Cài Đặt

```bash
npm install
```

## Chạy Dev

```bash
npm run dev
```

Mở `http://localhost:3000`.

## Kiểm Tra

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

## Ghi Chú Kỹ Thuật

- OCR dùng `tesseract.js` chạy trong browser.
- Xuất PNG dùng `html-to-image` với `toPng`.
- Dữ liệu tạm tự lưu trong `localStorage`.
- JSON import/export lưu danh sách các lần đánh.
- Không dùng backend/database/API route cho OCR.
