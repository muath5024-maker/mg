'use client';

import { useEffect, useState } from 'react';
import { Share2, Users, Gift, TrendingUp, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Switch from '@/components/ui/Switch';
import { PageLoading } from '@/components/ui/Loading';
import { getReferralSettings } from '@/lib/api';
import { formatNumber, formatCurrency } from '@/lib/utils';
import type { ReferralSettings } from '@/types';

export default function ReferralsPage() {
  const [settings, setSettings] = useState<ReferralSettings[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    setLoading(true);
    const result = await getReferralSettings();
    if (result.error) {
      setError(result.error);
    } else {
      setSettings(result.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const totalReferrals = settings.reduce((sum, s) => sum + (s.total_referrals || 0), 0);
  const successfulReferrals = settings.reduce((sum, s) => sum + (s.successful_referrals || 0), 0);
  const conversionRate = totalReferrals > 0 ? (successfulReferrals / totalReferrals) * 100 : 0;

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'points':
        return 'نقاط';
      case 'discount':
        return 'خصم';
      case 'credit':
        return 'رصيد';
      default:
        return type;
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-400">{error}</p>
        <Button onClick={loadSettings}>إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">الإحالات</h1>
          <p className="text-zinc-400 mt-1">إدارة برنامج الإحالات</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card variant="bordered">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-blue-600/20">
                <Share2 className="h-6 w-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">إجمالي الإحالات</p>
                <p className="text-2xl font-bold text-white">{formatNumber(totalReferrals)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-green-600/20">
                <Users className="h-6 w-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">الإحالات الناجحة</p>
                <p className="text-2xl font-bold text-white">{formatNumber(successfulReferrals)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-purple-600/20">
                <TrendingUp className="h-6 w-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">معدل التحويل</p>
                <p className="text-2xl font-bold text-white">{conversionRate.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="bordered">
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-yellow-600/20">
                <Gift className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-zinc-400">المتاجر المفعلة</p>
                <p className="text-2xl font-bold text-white">
                  {settings.filter((s) => s.is_enabled).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings by Store */}
      {settings.length === 0 ? (
        <Card variant="bordered">
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Share2 className="h-12 w-12 mb-4" />
              <p className="mb-2">لا توجد إعدادات إحالات</p>
              <p className="text-sm text-zinc-600">
                سيتم عرض إعدادات الإحالات هنا عند إضافتها من جدول referral_settings
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {settings.map((setting) => (
            <Card key={setting.id} variant="bordered">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>إعدادات المتجر</CardTitle>
                  <Badge variant={setting.is_enabled ? 'success' : 'default'}>
                    {setting.is_enabled ? 'مفعل' : 'معطل'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Referrer Reward */}
                  <div className="p-4 bg-zinc-800/30 rounded-lg">
                    <p className="text-sm text-zinc-400 mb-2">مكافأة المُحيل</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="info">
                        {getRewardTypeLabel(setting.referrer_reward_type)}
                      </Badge>
                      <span className="text-white font-medium">
                        {setting.referrer_reward_value}
                      </span>
                      {setting.referrer_reward_max && (
                        <span className="text-zinc-500 text-sm">
                          (حد أقصى: {setting.referrer_reward_max})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Referee Reward */}
                  <div className="p-4 bg-zinc-800/30 rounded-lg">
                    <p className="text-sm text-zinc-400 mb-2">مكافأة المُحال</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">
                        {getRewardTypeLabel(setting.referee_reward_type)}
                      </Badge>
                      <span className="text-white font-medium">
                        {setting.referee_reward_value}
                      </span>
                      {setting.referee_min_order && (
                        <span className="text-zinc-500 text-sm">
                          (حد أدنى للطلب: {formatCurrency(setting.referee_min_order)})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                    <div>
                      <p className="text-sm text-zinc-400">إجمالي الإحالات</p>
                      <p className="text-lg font-semibold text-white">
                        {formatNumber(setting.total_referrals)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-zinc-400">الإحالات الناجحة</p>
                      <p className="text-lg font-semibold text-green-400">
                        {formatNumber(setting.successful_referrals)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Default Settings Info */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>الإعدادات الافتراضية للإحالات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-800/30 rounded-lg">
              <p className="text-sm text-zinc-400 mb-1">مكافأة المُحيل الافتراضية</p>
              <p className="text-white">10% خصم على الطلب التالي</p>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg">
              <p className="text-sm text-zinc-400 mb-1">مكافأة المُحال الافتراضية</p>
              <p className="text-white">5% خصم على الطلب الأول</p>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg">
              <p className="text-sm text-zinc-400 mb-1">صلاحية رمز الإحالة</p>
              <p className="text-white">30 يوم</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
