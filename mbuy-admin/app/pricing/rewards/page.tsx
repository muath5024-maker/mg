'use client';

import { useEffect, useState } from 'react';
import { Gift, AlertCircle, Plus, Edit2, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Switch from '@/components/ui/Switch';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { PageLoading } from '@/components/ui/Loading';
import { getRewards, updateReward } from '@/lib/api';
import { formatNumber } from '@/lib/utils';
import type { PointReward } from '@/types';

export default function RewardsPage() {
  const [rewards, setRewards] = useState<PointReward[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editModal, setEditModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<PointReward | null>(null);
  const [saving, setSaving] = useState(false);

  const loadRewards = async () => {
    setLoading(true);
    const result = await getRewards();
    if (result.error) {
      setError(result.error);
    } else {
      setRewards(result.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRewards();
  }, []);

  const handleToggleActive = async (reward: PointReward) => {
    const result = await updateReward(reward.id, { is_active: !reward.is_active });
    if (!result.error) {
      setRewards((prev) =>
        prev.map((r) => (r.id === reward.id ? { ...r, is_active: !r.is_active } : r))
      );
    }
  };

  const getRewardTypeLabel = (type: string) => {
    switch (type) {
      case 'discount':
        return 'خصم';
      case 'ai_credits':
        return 'رصيد AI';
      case 'priority_support':
        return 'دعم أولوية';
      case 'free_month':
        return 'شهر مجاني';
      default:
        return type;
    }
  };

  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case 'discount':
        return 'success';
      case 'ai_credits':
        return 'info';
      case 'priority_support':
        return 'purple';
      case 'free_month':
        return 'warning';
      default:
        return 'default';
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
        <Button onClick={loadRewards}>إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">المكافآت</h1>
          <p className="text-zinc-400 mt-1">إدارة نظام النقاط والمكافآت</p>
        </div>
      </div>

      {/* Rewards Grid */}
      {rewards.length === 0 ? (
        <Card variant="bordered">
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Gift className="h-12 w-12 mb-4" />
              <p className="mb-4">لا توجد مكافآت</p>
              <p className="text-sm text-zinc-600">
                سيتم عرض المكافآت هنا عند إضافتها من جدول point_rewards في Supabase
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.map((reward) => (
            <Card
              key={reward.id}
              variant="bordered"
              className={!reward.is_active ? 'opacity-60' : ''}
            >
              <CardContent>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-purple-600/20">
                    <Gift className="h-6 w-6 text-purple-400" />
                  </div>
                  <Switch
                    checked={reward.is_active}
                    onCheckedChange={() => handleToggleActive(reward)}
                  />
                </div>

                <h3 className="text-lg font-semibold text-white mb-1">{reward.title_ar}</h3>
                <p className="text-sm text-zinc-400 mb-4">{reward.title}</p>

                {reward.description_ar && (
                  <p className="text-sm text-zinc-500 mb-4">{reward.description_ar}</p>
                )}

                <div className="flex items-center justify-between mb-4">
                  <Badge variant={getRewardTypeColor(reward.reward_type) as any}>
                    {getRewardTypeLabel(reward.reward_type)}
                  </Badge>
                  <span className="text-lg font-bold text-yellow-400">
                    {formatNumber(reward.points_cost)} نقطة
                  </span>
                </div>

                <div className="space-y-2 text-sm border-t border-zinc-800 pt-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">مرات الاستبدال</span>
                    <span className="text-white">{formatNumber(reward.total_redeemed)}</span>
                  </div>
                  {reward.max_redemptions_per_user && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">الحد لكل مستخدم</span>
                      <span className="text-white">{reward.max_redemptions_per_user}</span>
                    </div>
                  )}
                  {reward.total_available && (
                    <div className="flex justify-between">
                      <span className="text-zinc-400">المتبقي</span>
                      <span className="text-white">
                        {formatNumber(reward.total_available - reward.total_redeemed)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Card */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>نظام النقاط</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-zinc-800/30 rounded-lg">
              <p className="text-sm text-zinc-400 mb-1">كسب النقاط</p>
              <p className="text-white">1 نقطة لكل 1 ر.س مشتريات</p>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg">
              <p className="text-sm text-zinc-400 mb-1">صلاحية النقاط</p>
              <p className="text-white">12 شهر من تاريخ الكسب</p>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg">
              <p className="text-sm text-zinc-400 mb-1">الحد الأدنى للاستبدال</p>
              <p className="text-white">100 نقطة</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
