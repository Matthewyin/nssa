import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'),
  title: 'NSSA 后台管理系统',
  description: '现代化的内容管理平台，为NSSA网站提供强大的编辑和发布功能',
  keywords: ['NSSA', 'CMS', '内容管理', '博客管理', 'Tina CMS'],
  authors: [{ name: 'NSSA Team' }],
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'NSSA 后台管理系统',
    description: '现代化的内容管理平台',
    url: 'https://admin.nssa.io',
    siteName: 'NSSA Admin',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NSSA Admin System',
      },
    ],
    locale: 'zh_CN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NSSA 后台管理系统',
    description: '现代化的内容管理平台',
    images: ['/og-image.png'],
  },
  robots: {
    index: false, // 后台系统不需要被搜索引擎索引
    follow: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#007AFF',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='zh-CN' className='h-full'>
      <body className={`${inter.className} h-full bg-gray-50 antialiased`}>
        <ToastProvider>
          <div id='root' className='h-full'>
            {children}
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
