'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CheckCircle, XCircle, Eye, Clock, User, Store, AlertCircle, Loader2 } from 'lucide-react';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { getMerchants, updateMerchant, type Merchant } from '@/lib/worker-api';
import { formatDate } from '@/lib/utils';

export default function ApprovalsPage() {
  const [pendingMerchants, setPendingMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [actionModal, setActionModal] = useState<'approve' | 'reject' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadPendingMerchants = async () => {
    setLoading(true);
    setError(null);
    const result = await getMerchants(1, 50, undefined, 'pending');
    if (result.ok) {
      setPendingMerchants(result.data || []);
    } else {
      setError(result.message || 'فشل في تحميل البيانات');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPendingMerchants();
  }, []);

  const handleAction = async (status: 'active' | 'suspended') => {
    if (!selectedMerchant) return;
    setActionLoading(true);
    const result = await updateMerchant(selectedMerchant.id, { status });
    if (result.ok) {
      loadPendingMerchants();
    }
    setActionLoading(false);
    setActionModal(null);
    setSelectedMerchant(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600">
          <CheckCircle className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">الموافقات</h1>
          <p className="text-zinc-400 mt-1">مراجعة طلبات التجار الجدد</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            {loading ? (
              <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-400">{pendingMerchants.length}</div>
                <div className="text-sm text-zinc-400">بانتظار المراجعة</div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">-</div>
            <div className="text-sm text-zinc-400">تمت الموافقة هذا الشهر</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">-</div>
            <div className="text-sm text-zinc-400">تم الرفض هذا الشهر</div>
          </CardContent>
        </Card>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Requests List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            طلبات بانتظار الموافقة
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : pendingMerchants.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد طلبات بانتظار الموافقة</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingMerchants.map((merchant) => (
                <div
                  key={merchant.id}
                  className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center">
                      <User className="h-6 w-6 text-zinc-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">{merchant.name}</div>
                      <div className="flex items-center gap-2 text-sm text-zinc-400">
                        <Store className="h-4 w-4" />
                        {merchant.email}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">
                        {merchant.phone || 'بدون هاتف'} • {formatDate(merchant.created_at)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        setSelectedMerchant(merchant);
                        setActionModal('approve');
                      }}
                    >
                      <CheckCircle className="h-4 w-4 ml-1" />
                      موافقة
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-400 border-red-400/50 hover:bg-red-400/10"
                      onClick={() => {
                        setSelectedMerchant(merchant);
                        setActionModal('reject');
                      }}
                    >
                      <XCircle className="h-4 w-4 ml-1" />
                      رفض
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve Modal */}
      <Modal
        isOpen={actionModal === 'approve'}
        onClose={() => {
          setActionModal(null);
          setSelectedMerchant(null);
        }}
        title="الموافقة على التاجر"
        description={`هل أنت متأكد من الموافقة على "${selectedMerchant?.name}"؟`}
      >
        <p className="text-zinc-400">
          سيتمكن التاجر من الوصول لحسابه وإدارة متجره.
        </p>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setActionModal(null);
              setSelectedMerchant(null);
            }}
          >
            إلغاء
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => handleAction('active')}
            isLoading={actionLoading}
          >
            موافقة
          </Button>
        </ModalFooter>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={actionModal === 'reject'}
        onClose={() => {
          setActionModal(null);
          setSelectedMerchant(null);
        }}
        title="رفض التاجر"
        description={`هل أنت متأكد من رفض "${selectedMerchant?.name}"؟`}
      >
        <p className="text-zinc-400">
          سيتم تعليق حساب التاجر ولن يتمكن من الوصول للمنصة.
        </p>
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setActionModal(null);
              setSelectedMerchant(null);
            }}
          >
            إلغاء
          </Button>
          <Button
            variant="danger"
            onClick={() => handleAction('suspended')}
            isLoading={actionLoading}
          >
            رفض
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
