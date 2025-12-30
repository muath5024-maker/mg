'use client';

import { useState } from 'react';
import {
  Settings,
  Globe,
  Mail,
  Bell,
  Shield,
  Database,
  Palette,
  Save,
  RefreshCw,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Switch from '@/components/ui/Switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';

export default function SettingsPage() {
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    // General
    platform_name: 'MBUY',
    platform_name_ar: 'امباي',
    support_email: 'support@mbuy.app',
    support_phone: '+966500000000',
    default_currency: 'SAR',
    default_language: 'ar',
    // Features
    maintenance_mode: false,
    registration_enabled: true,
    merchant_registration_enabled: true,
    guest_checkout_enabled: true,
    // Notifications
    email_notifications: true,
    sms_notifications: true,
    push_notifications: true,
    // Security
    two_factor_required: false,
    session_timeout: 30,
    max_login_attempts: 5,
  });

  const handleSave = async () => {
    setSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSaving(false);
  };

  const updateSetting = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">الإعدادات</h1>
          <p className="text-zinc-400 mt-1">إعدادات المنصة العامة</p>
        </div>
        <Button onClick={handleSave} isLoading={saving}>
          <Save className="h-4 w-4" />
          حفظ التغييرات
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">
            <Globe className="h-4 w-4" />
            عام
          </TabsTrigger>
          <TabsTrigger value="features">
            <Settings className="h-4 w-4" />
            المميزات
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4" />
            الإشعارات
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="h-4 w-4" />
            الأمان
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>الإعدادات العامة</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="اسم المنصة (إنجليزي)"
                  value={settings.platform_name}
                  onChange={(e) => updateSetting('platform_name', e.target.value)}
                />
                <Input
                  label="اسم المنصة (عربي)"
                  value={settings.platform_name_ar}
                  onChange={(e) => updateSetting('platform_name_ar', e.target.value)}
                />
                <Input
                  label="البريد الإلكتروني للدعم"
                  type="email"
                  value={settings.support_email}
                  onChange={(e) => updateSetting('support_email', e.target.value)}
                  icon={<Mail className="h-4 w-4" />}
                />
                <Input
                  label="رقم هاتف الدعم"
                  value={settings.support_phone}
                  onChange={(e) => updateSetting('support_phone', e.target.value)}
                />
                <Select
                  label="العملة الافتراضية"
                  value={settings.default_currency}
                  onChange={(e) => updateSetting('default_currency', e.target.value)}
                  options={[
                    { value: 'SAR', label: 'ريال سعودي (SAR)' },
                    { value: 'AED', label: 'درهم إماراتي (AED)' },
                    { value: 'USD', label: 'دولار أمريكي (USD)' },
                    { value: 'EUR', label: 'يورو (EUR)' },
                  ]}
                />
                <Select
                  label="اللغة الافتراضية"
                  value={settings.default_language}
                  onChange={(e) => updateSetting('default_language', e.target.value)}
                  options={[
                    { value: 'ar', label: 'العربية' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features Settings */}
        <TabsContent value="features">
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>إعدادات المميزات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">وضع الصيانة</p>
                    <p className="text-sm text-zinc-400">
                      تعطيل الوصول للمنصة مؤقتاً للصيانة
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenance_mode}
                    onCheckedChange={(checked) =>
                      updateSetting('maintenance_mode', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">تسجيل المستخدمين</p>
                    <p className="text-sm text-zinc-400">
                      السماح بتسجيل مستخدمين جدد
                    </p>
                  </div>
                  <Switch
                    checked={settings.registration_enabled}
                    onCheckedChange={(checked) =>
                      updateSetting('registration_enabled', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">تسجيل التجار</p>
                    <p className="text-sm text-zinc-400">
                      السماح بتسجيل تجار جدد
                    </p>
                  </div>
                  <Switch
                    checked={settings.merchant_registration_enabled}
                    onCheckedChange={(checked) =>
                      updateSetting('merchant_registration_enabled', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">الشراء كضيف</p>
                    <p className="text-sm text-zinc-400">
                      السماح بالشراء بدون تسجيل حساب
                    </p>
                  </div>
                  <Switch
                    checked={settings.guest_checkout_enabled}
                    onCheckedChange={(checked) =>
                      updateSetting('guest_checkout_enabled', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>إعدادات الإشعارات</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">إشعارات البريد الإلكتروني</p>
                    <p className="text-sm text-zinc-400">
                      إرسال إشعارات عبر البريد الإلكتروني
                    </p>
                  </div>
                  <Switch
                    checked={settings.email_notifications}
                    onCheckedChange={(checked) =>
                      updateSetting('email_notifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">إشعارات الرسائل النصية</p>
                    <p className="text-sm text-zinc-400">
                      إرسال إشعارات عبر SMS
                    </p>
                  </div>
                  <Switch
                    checked={settings.sms_notifications}
                    onCheckedChange={(checked) =>
                      updateSetting('sms_notifications', checked)
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">الإشعارات الفورية</p>
                    <p className="text-sm text-zinc-400">
                      إرسال إشعارات Push للتطبيق
                    </p>
                  </div>
                  <Switch
                    checked={settings.push_notifications}
                    onCheckedChange={(checked) =>
                      updateSetting('push_notifications', checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card variant="bordered">
            <CardHeader>
              <CardTitle>إعدادات الأمان</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-lg">
                  <div>
                    <p className="text-white font-medium">المصادقة الثنائية</p>
                    <p className="text-sm text-zinc-400">
                      إلزام المصادقة الثنائية للمديرين
                    </p>
                  </div>
                  <Switch
                    checked={settings.two_factor_required}
                    onCheckedChange={(checked) =>
                      updateSetting('two_factor_required', checked)
                    }
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="مهلة انتهاء الجلسة (دقيقة)"
                    type="number"
                    value={settings.session_timeout}
                    onChange={(e) =>
                      updateSetting('session_timeout', Number(e.target.value))
                    }
                  />
                  <Input
                    label="الحد الأقصى لمحاولات تسجيل الدخول"
                    type="number"
                    value={settings.max_login_attempts}
                    onChange={(e) =>
                      updateSetting('max_login_attempts', Number(e.target.value))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Database Info */}
          <Card variant="bordered" className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                معلومات قاعدة البيانات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-zinc-800/30 rounded-lg">
                  <p className="text-sm text-zinc-400 mb-1">Supabase URL</p>
                  <code className="text-xs text-blue-400">
                    sirqidofuvphqcxqchyc.supabase.co
                  </code>
                </div>
                <div className="p-4 bg-zinc-800/30 rounded-lg">
                  <p className="text-sm text-zinc-400 mb-1">Worker URL</p>
                  <code className="text-xs text-blue-400">
                    misty-mode-b68b.baharista1.workers.dev
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
