'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { setAuthToken } from '@/lib/worker-api';

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL || 'https://misty-mode-b68b.baharista1.workers.dev';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${WORKER_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || 'فشل تسجيل الدخول');
      }

      // Check if user is admin
      if (!['admin', 'owner', 'support', 'moderator'].includes(data.user?.role)) {
        throw new Error('ليس لديك صلاحية الوصول للوحة التحكم');
      }

      // Save token
      setAuthToken(data.token);
      
      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  // Dev mode: quick login
  const handleDevLogin = () => {
    // Set a dev token for testing
    setAuthToken('dev-admin-token');
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card variant="bordered" className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mb-4">
            <LogIn className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">لوحة تحكم MBUY</CardTitle>
          <p className="text-zinc-400 mt-2">سجل دخولك للمتابعة</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-400">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Input
              label="البريد الإلكتروني"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mbuy.app"
              icon={<Mail className="h-4 w-4" />}
              required
            />

            <Input
              label="كلمة المرور"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              icon={<Lock className="h-4 w-4" />}
              required
            />

            <Button type="submit" className="w-full" isLoading={loading}>
              <LogIn className="h-4 w-4" />
              تسجيل الدخول
            </Button>
          </form>

          {/* Dev mode button */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <p className="text-xs text-zinc-500 text-center mb-3">وضع التطوير</p>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleDevLogin}
              >
                دخول سريع (للتطوير فقط)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
