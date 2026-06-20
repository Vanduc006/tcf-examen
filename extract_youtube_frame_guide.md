# Hướng dẫn lấy frame ảnh từ YouTube tại một Timestamp Cụ Thể

Vì lý do bảo mật (CORS policy) của trình duyệt, bạn **không thể** dùng JavaScript ở Frontend (ví dụ như thẻ `<canvas>`) để chụp lại màn hình của YouTube Iframe. 

Cách duy nhất và đáng tin cậy nhất là xử lý ở **Backend (Next.js API Route)** bằng cách kết hợp thư viện tải luồng video (như `ytdl-core` hoặc `youtube-dl-exec`) và `FFmpeg` để cắt ảnh.

## Kiến trúc thực hiện

1. Frontend gửi request lên API backend kèm theo `youtube_id` và `timestamp` (ví dụ: `00:01:23`).
2. Backend API dùng thư viện để lấy URL của luồng video gốc (mp4 stream) từ YouTube.
3. Backend gọi `FFmpeg` (thông qua thư viện `fluent-ffmpeg`), nhảy đến đúng `timestamp` đó và xuất ra 1 frame ảnh (JPEG/PNG).
4. Backend trả trực tiếp file ảnh đó về cho Frontend (hoặc lưu lên S3/Cloudinary rồi trả về URL).

## Ví dụ Cách làm bằng Code (Node.js / Next.js API)

### 1. Cài đặt các thư viện cần thiết
Bạn sẽ cần cài đặt `ytdl-core` và `fluent-ffmpeg`. Đồng thời máy chủ của bạn phải được cài sẵn phần mềm `ffmpeg`.

```bash
npm install ytdl-core fluent-ffmpeg
```

### 2. Viết API Route ở Next.js (`src/app/api/youtube/frame/route.ts`)

```typescript
import { NextResponse } from "next/server";
import ytdl from "ytdl-core";
import ffmpeg from "fluent-ffmpeg";
import { PassThrough } from "stream";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");
  const timestamp = searchParams.get("timestamp"); // ví dụ "15" (giây) hoặc "00:00:15"

  if (!videoId || !timestamp) {
    return NextResponse.json({ error: "Missing videoId or timestamp" }, { status: 400 });
  }

  try {
    // 1. Lấy URL của luồng video (stream) chất lượng tốt nhất
    const info = await ytdl.getInfo(videoId);
    const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo' });

    if (!format || !format.url) {
      throw new Error("Không thể tìm thấy luồng video");
    }

    // 2. Tạo một stream trung gian để chứa dữ liệu ảnh
    const passThrough = new PassThrough();

    // 3. Sử dụng FFmpeg để lấy frame ở định dạng stream trực tiếp
    ffmpeg(format.url)
      .setStartTime(Number(timestamp)) // Mốc thời gian cắt
      .frames(1) // Chỉ lấy 1 frame
      .format('image2')
      .videoCodec('mjpeg')
      .on('error', (err) => {
        console.error("Lỗi FFmpeg: ", err);
      })
      .pipe(passThrough); // Đẩy ảnh vào stream

    // 4. Trả ảnh trực tiếp về cho Browser với header tương ứng
    return new NextResponse(passThrough as any, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=86400", // Cache lại để tránh xử lý nhiều lần
      },
    });

  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: "Lỗi lấy nội dung ảnh" }, { status: 500 });
  }
}
```

### 3. Hiển thị ở Frontend

Khi đã có API, ở React/Next.js bạn chỉ cần gọi đường dẫn API vào thẻ `<img />` là ảnh sẽ tự động được fetch và hiển thị!

```tsx
<img 
  src={`/api/youtube/frame?videoId=dQw4w9WgXcQ&timestamp=45`} 
  alt="Video Frame" 
/>
```

## Lưu ý quan trọng
- Cách xử lý trên đòi hỏi server/hosting phải hỗ trợ `ffmpeg` (Vercel mặc định **không** đi kèm thư viện C++ ffmpeg trong môi trường serverless functions của họ). Nếu bạn dùng VPS (DigitalOcean, AWS EC2) thì sẽ chạy cực kì trơn tru.
- Việc get URL stream của YouTube rất hay bị ngắt kết nối hoặc thay đổi thuật toán, `ytdl-core` thỉnh thoảng sẽ bị lỗi, bạn cũng có thể cân nhắc gọi các dịch vụ API bên thứ 3 (như Cloudinary or API có sẵn) chuyên cào dữ liệu video nếu không muốn tự dựng server.
