'use client';

import Image from 'next/image';

interface ComingSoonPageProps {
  storeName?: string;
  logoUrl?: string;
  message?: string;
}

export default function ComingSoonPage({ 
  storeName, 
  logoUrl,
  message = 'قريباً... نعمل على وضع اللمسات الأخيرة لتقديم تجربة تسوق متكاملة'
}: ComingSoonPageProps) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        {logoUrl ? (
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm p-2 shadow-xl">
              <Image
                src={logoUrl}
                alt={storeName || 'المتجر'}
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
            </div>
          </div>
        ) : (
          <div className="mb-8 flex justify-center">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-xl">
              <svg 
                className="w-12 h-12 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" 
                />
              </svg>
            </div>
          </div>
        )}

        {/* Store Name */}
        {storeName && (
          <h1 className="text-3xl font-bold text-white mb-4 drop-shadow-lg">
            {storeName}
          </h1>
        )}

        {/* Coming Soon Badge */}
        <div className="inline-block mb-6">
          <span className="bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full text-sm font-medium">
            🚀 قريباً
          </span>
        </div>

        {/* Message */}
        <p className="text-white/90 text-lg leading-relaxed mb-8 drop-shadow">
          {message}
        </p>

        {/* Decorative Elements */}
        <div className="flex justify-center gap-2 mb-8">
          <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-white/60 animate-pulse delay-100" />
          <div className="w-2 h-2 rounded-full bg-white/40 animate-pulse delay-200" />
        </div>

        {/* Footer */}
        <p className="text-white/60 text-sm">
          نعمل بجد لإطلاق تجربة تسوق مميزة
        </p>
      </div>
    </div>
  );
}
