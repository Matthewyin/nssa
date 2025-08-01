import { redirect } from 'next/navigation';

// 根路径重定向到管理后台
export default function HomePage() {
  redirect('/admin');
}
