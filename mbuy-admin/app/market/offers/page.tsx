'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Tag, Plus, Calendar, Percent, Eye, Edit, Trash2 } from 'lucide-react';

interface Offer {
  id: string;
  title: string;
  discount: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'scheduled' | 'ended';
  views: number;
  uses: number;
}

const mockOffers: Offer[] = [
  { id: '1', title: 'خصم الصيف', discount: 30, startDate: '2025-06-01', endDate: '2025-08-31', status: 'active', views: 15420, uses: 892 },
  { id: '2', title: 'عروض رمضان', discount: 25, startDate: '2025-03-01', endDate: '2025-04-01', status: 'scheduled', views: 0, uses: 0 },
  { id: '3', title: 'تخفيضات العيد', discount: 40, startDate: '2025-01-01', endDate: '2025-01-15', status: 'ended', views: 45230, uses: 3421 },
];

export default function OffersPage() {
  const [offers] = useState<Offer[]>(mockOffers);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'scheduled': return 'bg-blue-500/20 text-blue-400';
      case 'ended': return 'bg-zinc-500/20 text-zinc-400';
      default: return 'bg-zinc-500/20 text-zinc-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'scheduled': return 'مجدول';
      case 'ended': return 'منتهي';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
            <Tag className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">التحكم في العروض</h1>
            <p className="text-zinc-400 mt-1">إدارة العروض والتخفيضات</p>
          </div>
        </div>
        <Button>
          <Plus className="h-4 w-4 ml-2" />
          إنشاء عرض جديد
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{offers.length}</div>
            <div className="text-sm text-zinc-400">إجمالي العروض</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{offers.filter(o => o.status === 'active').length}</div>
            <div className="text-sm text-zinc-400">عروض نشطة</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">{offers.reduce((acc, o) => acc + o.views, 0).toLocaleString()}</div>
            <div className="text-sm text-zinc-400">إجمالي المشاهدات</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-400">{offers.reduce((acc, o) => acc + o.uses, 0).toLocaleString()}</div>
            <div className="text-sm text-zinc-400">إجمالي الاستخدامات</div>
          </CardContent>
        </Card>
      </div>

      {/* Offers List */}
      <Card>
        <CardHeader>
          <CardTitle>قائمة العروض</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {offers.map((offer) => (
              <div
                key={offer.id}
                className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-orange-500/20">
                    <Percent className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <div className="font-medium text-white">{offer.title}</div>
                    <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {offer.startDate} - {offer.endDate}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {offer.views.toLocaleString()} مشاهدة
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-orange-400">%{offer.discount}</div>
                  <div className={`px-3 py-1 rounded-full text-xs ${getStatusColor(offer.status)}`}>
                    {getStatusText(offer.status)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
