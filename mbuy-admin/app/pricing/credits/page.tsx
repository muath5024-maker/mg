'use client';

import { useState } from 'react';
import { Coins, Edit2, Save, X, Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Switch from '@/components/ui/Switch';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface CreditPackage {
  id: string;
  name: string;
  name_ar: string;
  credits: number;
  price: number;
  bonus_credits: number;
  is_popular: boolean;
  is_active: boolean;
}

const defaultPackages: CreditPackage[] = [
  { id: '1', name: 'Starter Pack', name_ar: 'حزمة المبتدئ', credits: 100, price: 49, bonus_credits: 0, is_popular: false, is_active: true },
  { id: '2', name: 'Basic Pack', name_ar: 'الحزمة الأساسية', credits: 300, price: 129, bonus_credits: 30, is_popular: false, is_active: true },
  { id: '3', name: 'Pro Pack', name_ar: 'حزمة الاحترافي', credits: 600, price: 229, bonus_credits: 100, is_popular: true, is_active: true },
  { id: '4', name: 'Business Pack', name_ar: 'حزمة الأعمال', credits: 1200, price: 399, bonus_credits: 300, is_popular: false, is_active: true },
  { id: '5', name: 'Enterprise Pack', name_ar: 'حزمة المؤسسات', credits: 3000, price: 899, bonus_credits: 1000, is_popular: false, is_active: true },
];

export default function CreditsPage() {
  const [packages, setPackages] = useState<CreditPackage[]>(defaultPackages);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Partial<CreditPackage>>({});

  const handleEditStart = (pkg: CreditPackage) => {
    setEditingPackage(pkg.id);
    setEditedValues({
      credits: pkg.credits,
      price: pkg.price,
      bonus_credits: pkg.bonus_credits,
    });
  };

  const handleEditSave = (pkgId: string) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === pkgId ? { ...p, ...editedValues } : p))
    );
    setEditingPackage(null);
    setEditedValues({});
  };

  const handleEditCancel = () => {
    setEditingPackage(null);
    setEditedValues({});
  };

  const togglePackageStatus = (pkgId: string) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === pkgId ? { ...p, is_active: !p.is_active } : p))
    );
  };

  const togglePopular = (pkgId: string) => {
    setPackages((prev) =>
      prev.map((p) => (p.id === pkgId ? { ...p, is_popular: !p.is_popular } : p))
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">الرصيد</h1>
          <p className="text-zinc-400 mt-1">إدارة حزم الرصيد والأسعار</p>
        </div>
      </div>

      {/* Packages Table */}
      <Card variant="bordered" padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-800">
              <tr>
                <th className="text-right px-6 py-4 text-xs font-medium text-zinc-400 uppercase">الحزمة</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-zinc-400 uppercase">الرصيد</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-zinc-400 uppercase">السعر</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-zinc-400 uppercase">رصيد إضافي</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-zinc-400 uppercase">شائع</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-zinc-400 uppercase">الحالة</th>
                <th className="text-right px-6 py-4 text-xs font-medium text-zinc-400 uppercase">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {packages.map((pkg) => (
                <tr key={pkg.id} className={`hover:bg-zinc-800/30 ${!pkg.is_active ? 'opacity-60' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-yellow-600/20">
                        <Coins className="h-5 w-5 text-yellow-400" />
                      </div>
                      <div>
                        <p className="font-medium text-white">{pkg.name_ar}</p>
                        <p className="text-sm text-zinc-400">{pkg.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingPackage === pkg.id ? (
                      <Input
                        type="number"
                        value={editedValues.credits}
                        onChange={(e) =>
                          setEditedValues({ ...editedValues, credits: Number(e.target.value) })
                        }
                        className="w-24"
                      />
                    ) : (
                      <span className="text-white font-medium">{formatNumber(pkg.credits)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingPackage === pkg.id ? (
                      <Input
                        type="number"
                        value={editedValues.price}
                        onChange={(e) =>
                          setEditedValues({ ...editedValues, price: Number(e.target.value) })
                        }
                        className="w-24"
                      />
                    ) : (
                      <span className="text-white">{formatCurrency(pkg.price)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingPackage === pkg.id ? (
                      <Input
                        type="number"
                        value={editedValues.bonus_credits}
                        onChange={(e) =>
                          setEditedValues({ ...editedValues, bonus_credits: Number(e.target.value) })
                        }
                        className="w-24"
                      />
                    ) : (
                      <span className={pkg.bonus_credits > 0 ? 'text-green-400' : 'text-zinc-500'}>
                        {pkg.bonus_credits > 0 ? `+${formatNumber(pkg.bonus_credits)}` : '-'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <Switch
                      checked={pkg.is_popular}
                      onCheckedChange={() => togglePopular(pkg.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    <Switch
                      checked={pkg.is_active}
                      onCheckedChange={() => togglePackageStatus(pkg.id)}
                    />
                  </td>
                  <td className="px-6 py-4">
                    {editingPackage === pkg.id ? (
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEditSave(pkg.id)}>
                          <Save className="h-4 w-4 text-green-400" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleEditCancel}>
                          <X className="h-4 w-4 text-red-400" />
                        </Button>
                      </div>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => handleEditStart(pkg)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Value per Credit */}
      <Card variant="bordered">
        <CardHeader>
          <CardTitle>قيمة الرصيد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.filter(p => p.is_active).map((pkg) => {
              const totalCredits = pkg.credits + pkg.bonus_credits;
              const valuePerCredit = pkg.price / totalCredits;
              return (
                <div key={pkg.id} className="p-4 bg-zinc-800/30 rounded-lg">
                  <p className="text-sm text-zinc-400 mb-1">{pkg.name_ar}</p>
                  <p className="text-lg font-semibold text-white">
                    {valuePerCredit.toFixed(2)} ر.س / رصيد
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    إجمالي {formatNumber(totalCredits)} رصيد
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
