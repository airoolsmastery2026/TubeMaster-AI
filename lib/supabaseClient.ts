
import { createClient } from '@supabase/supabase-js';

// Sử dụng type chuẩn đã định nghĩa trong vite-env.d.ts
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Kiểm tra xem biến môi trường có tồn tại không
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('CẢNH BÁO: Thiếu cấu hình Supabase! Kiểm tra file .env hoặc Vercel Settings.');
}

// Tạo client để sử dụng trong toàn bộ ứng dụng
// Fallback values giúp app không crash ngay lập tức nếu thiếu key (chỉ lỗi khi gọi API)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co', 
  supabaseAnonKey || 'placeholder'
);
