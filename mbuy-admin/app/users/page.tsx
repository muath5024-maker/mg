'use client';

import { useEffect, useState } from 'react';
import { Users as UsersIcon, Search, Mail, Phone, User, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { Modal, ModalFooter } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Loading';
import { getCustomers, updateCustomer, type Customer } from '@/lib/worker-api';
import { formatDate, getStatusColor, translateStatus } from '@/lib/utils';

export default function UsersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [statusModal, setStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState<Customer['status']>('active');
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    const result = await getCustomers(page, 20, search || undefined, statusFilter || undefined);
    if (result.ok) {
      setCustomers(result.data || []);
      setTotalPages(result.pagination?.totalPages || 0);
    } else {
      setError(result.message || 'فشل في تحميل البيانات');
    }
    setLoading(false);
  };

  useEffect(() => {
    loadCustomers();
  }, [page, search, statusFilter]);

  const handleStatusChange = async () => {
    if (!selectedCustomer) return;
    setActionLoading(true);
    const result = await updateCustomer(selectedCustomer.id, { status: newStatus });
    if (result.ok) {
      loadCustomers();
    }
    setActionLoading(false);
    setStatusModal(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">العملاء</h1>
          <p className="text-zinc-400 mt-1">إدارة جميع العملاء في المنصة</p>
        </div>
      </div>

      {/* Filters */}
      <Card variant="bordered">
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="بحث بالاسم أو البريد أو الهاتف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <Select
              options={[
                { value: '', label: 'جميع الحالات' },
                { value: 'active', label: 'نشط' },
                { value: 'suspended', label: 'معلق' },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-48"
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

      {/* Table */}
      <Card variant="bordered" padding="none">
        {loading ? (
          <TableSkeleton rows={10} cols={6} />
        ) : customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
            <UsersIcon className="h-12 w-12 mb-4" />
            <p>لا يوجد عملاء</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>العميل</TableHead>
                <TableHead>البريد الإلكتروني</TableHead>
                <TableHead>رقم الجوال</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ التسجيل</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-sm font-bold text-white">
                          {(customer.name || customer.email || '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-white">
                          {customer.name || 'بدون اسم'}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {customer.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Mail className="h-4 w-4" />
                      {customer.email || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-zinc-400">
                      <Phone className="h-4 w-4" />
                      {customer.phone || '-'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(customer.status)}>
                      {translateStatus(customer.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-zinc-400">{formatDate(customer.created_at)}</span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setNewStatus(customer.status);
                        setStatusModal(true);
                      }}
                    >
                      تغيير الحالة
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              السابق
            </Button>
            <span className="text-sm text-zinc-400">
              صفحة {page} من {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              التالي
            </Button>
          </div>
        )}
      </Card>

      {/* Status Change Modal */}
      <Modal
        isOpen={statusModal}
        onClose={() => {
          setStatusModal(false);
          setSelectedCustomer(null);
        }}
        title="تغيير حالة العميل"
        description={`تغيير حالة "${selectedCustomer?.name || selectedCustomer?.email}"`}
      >
        <Select
          label="الحالة الجديدة"
          options={[
            { value: 'active', label: 'نشط' },
            { value: 'suspended', label: 'معلق' },
          ]}
          value={newStatus}
          onChange={(e) => setNewStatus(e.target.value as Customer['status'])}
        />
        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setStatusModal(false);
              setSelectedCustomer(null);
            }}
          >
            إلغاء
          </Button>
          <Button
            variant="primary"
            onClick={handleStatusChange}
            isLoading={actionLoading}
          >
            حفظ
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
