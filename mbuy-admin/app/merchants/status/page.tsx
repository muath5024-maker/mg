'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { Power, Search, ToggleLeft, ToggleRight, Store, AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { getMerchants, updateMerchant, type Merchant } from '@/lib/worker-api';
import { formatDate } from '@/lib/utils';

export default function StatusPage() {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [actionModal, setActionModal] = useState<'suspend' | 'activate' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadMerchants = async () => {
    setLoading(true);
    setError(null);
    // Get both active and suspended merchants
    const [activeRes, suspendedRes] = await Promise.all([
      getMerchants(1, 100, undefined, 'active'),
      getMerchants(1, 100, undefined, 'suspended'),
    ]);
    
    if (activeRes.ok && suspendedRes.ok) {
      setMerchants([...(activeRes.data || []), ...(suspendedRes.data || [])]);
    } else {
      setError('فشل في تحميل البيانات');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMerchants();
  }, []);

  const handleStatusChange = async (status: 'active' | 'suspended') => {
    if (!selectedMerchant) return;
    setActionLoading(true);
    const result = await updateMerchant(selectedMerchant.id, { status });
    if (result.ok) {
      loadMerchants();
    }
    setActionLoading(false);
    setActionModal(null);
    setSelectedMerchant(null);
  };

  const filteredMerchants = merchants.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600">
          <Power className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">إيقاف/تفعيل التجار</h1>
          <p className="text-zinc-400 mt-1">إدارة حالة حسابات التجار</p>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="البحث عن تاجر..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Merchants List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5" />
            قائمة التجار ({filteredMerchants.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
            </div>
          ) : filteredMerchants.length === 0 ? (
            <div className="text-center py-8 text-zinc-500">
              <Store className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>لا يوجد تجار</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMerchants.map((merchant) => {
                const isActive = merchant.status === 'active';
                return (
                  <div
                    key={merchant.id}
                    className="flex items-center justify-between p-4 bg-zinc-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isActive ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                        <Store className={`h-6 w-6 ${isActive ? 'text-green-400' : 'text-red-400'}`} />
                      </div>
                      <div>
                        <div className="font-medium text-white">{merchant.name}</div>
                        <div className="text-sm text-zinc-400">{merchant.email}</div>
                        {!isActive && (
                          <div className="flex items-center gap-1 text-xs text-red-400 mt-1">
                            <AlertTriangle className="h-3 w-3" />
                            حساب موقوف
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-zinc-400">
                        منذ: {formatDate(merchant.created_at)}
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs ${isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {isActive ? 'نشط' : 'موقوف'}
                      </div>
                      <Button
                        variant={isActive ? 'outline' : 'primary'}
                        size="sm"
                        className={isActive ? 'text-red-400 border-red-400/50 hover:bg-red-400/10' : 'bg-green-600 hover:bg-green-700'}
                        onClick={() => {
                          setSelectedMerchant(merchant);
                          setActionModal(isActive ? 'suspend' : 'activate');
                        }}
                      >
                        {isActive ? (
                          <>
                            <ToggleLeft className="h-4 w-4 ml-1" />
                            إيقاف
                          </>
                        ) : (
                          <>
                            <ToggleRight className="h-4 w-4 ml-1" />
                            تفعيل
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspend Modal */}
      <Modal
        isOpen={actionModal === 'suspend'}
        onClose={() => {
          setActionModal(null);
          setSelectedMerchant(null);
        }}
        title="إيقاف التاجر"
        description={`هل أنت متأكد من إيقاف "${selectedMerchant?.name}"؟`}
      >
        <p className="text-zinc-400">
          سيتم تعليق حساب التاجر ولن يتمكن من إدارة متجره.
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
            onClick={() => handleStatusChange('suspended')}
            isLoading={actionLoading}
          >
            إيقاف
          </Button>
        </ModalFooter>
      </Modal>

      {/* Activate Modal */}
      <Modal
        isOpen={actionModal === 'activate'}
        onClose={() => {
          setActionModal(null);
          setSelectedMerchant(null);
        }}
        title="تفعيل التاجر"
        description={`هل أنت متأكد من تفعيل "${selectedMerchant?.name}"؟`}
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
            onClick={() => handleStatusChange('active')}
            isLoading={actionLoading}
          >
            تفعيل
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
