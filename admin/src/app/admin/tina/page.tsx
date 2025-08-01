'use client';

import { useEffect } from 'react';

export default function TinaCMSPage() {
  useEffect(() => {
    // 重定向到Tina CMS管理界面
    window.location.href = '/admin';
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-apple-blue mx-auto mb-4"></div>
        <p className="text-gray-600">正在跳转到 Tina CMS...</p>
      </div>
    </div>
  );
}
