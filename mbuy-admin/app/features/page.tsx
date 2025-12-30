'use client';

import { useEffect, useState } from 'react';
import { Zap, Search, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Switch from '@/components/ui/Switch';
import Badge from '@/components/ui/Badge';
import { PageLoading } from '@/components/ui/Loading';
import { getFeatureFlags, toggleFeatureFlag } from '@/lib/api';
import type { FeatureAction } from '@/types';

export default function FeaturesPage() {
  const [features, setFeatures] = useState<FeatureAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadFeatures = async () => {
    setLoading(true);
    const result = await getFeatureFlags();
    if (result.error) {
      setError(result.error);
    } else {
      setFeatures(result.data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFeatures();
  }, []);

  const handleToggle = async (feature: FeatureAction) => {
    setUpdating(feature.id);
    const result = await toggleFeatureFlag(feature.id, !feature.is_enabled);
    if (!result.error) {
      setFeatures((prev) =>
        prev.map((f) =>
          f.id === feature.id ? { ...f, is_enabled: !f.is_enabled } : f
        )
      );
    }
    setUpdating(null);
  };

  const filteredFeatures = features.filter(
    (f) =>
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.key.toLowerCase().includes(search.toLowerCase()) ||
      f.description?.toLowerCase().includes(search.toLowerCase())
  );

  // Group features by category
  const groupedFeatures = filteredFeatures.reduce((acc, feature) => {
    const category = feature.category || 'عام';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, FeatureAction[]>);

  if (loading) {
    return <PageLoading />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-red-400">{error}</p>
        <Button onClick={loadFeatures}>إعادة المحاولة</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">المميزات</h1>
          <p className="text-zinc-400 mt-1">تفعيل وتعطيل مميزات المنصة</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">
            {features.filter((f) => f.is_enabled).length} مفعل
          </Badge>
          <Badge variant="default">
            {features.filter((f) => !f.is_enabled).length} معطل
          </Badge>
        </div>
      </div>

      {/* Search */}
      <Card variant="bordered">
        <CardContent>
          <Input
            placeholder="بحث في المميزات..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </CardContent>
      </Card>

      {/* Features by Category */}
      {Object.entries(groupedFeatures).length === 0 ? (
        <Card variant="bordered">
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
              <Zap className="h-12 w-12 mb-4" />
              <p>لا توجد مميزات</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
          <Card key={category} variant="bordered">
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryFeatures.map((feature) => (
                  <div
                    key={feature.id}
                    className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white">{feature.name}</h3>
                        <code className="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">
                          {feature.key}
                        </code>
                      </div>
                      {feature.description && (
                        <p className="text-sm text-zinc-400">{feature.description}</p>
                      )}
                      {feature.default_cost > 0 && (
                        <p className="text-xs text-zinc-500 mt-1">
                          التكلفة الافتراضية: {feature.default_cost} نقطة
                        </p>
                      )}
                    </div>
                    <Switch
                      checked={feature.is_enabled}
                      onCheckedChange={() => handleToggle(feature)}
                      disabled={updating === feature.id}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
