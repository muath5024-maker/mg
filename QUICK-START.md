# 🚀 Quick Start - GitHub Authentication

## ✅ الوضع الحالي
- ✓ Git config محدث (muath5024-maker / muath5024@gmail.com)
- ✓ Remote URL صحيح (https://github.com/muath5024-maker/saleh.git)
- ✓ بيانات الاعتماد القديمة تم مسحها من Git
- ⚠️ بيانات الاعتماد القديمة لا تزال في Credential Manager (تحتاج حذف يدوي)

---

## 📋 الخطوات المطلوبة الآن:

### 1️⃣ حذف البيانات القديمة (1 دقيقة)
**Credential Manager مفتوح الآن:**
1. ابحث عن: `GitHub - https://api.github.com/mbuy1`
2. اضغط عليه → اضغط **Remove**
3. أغلق النافذة

**أو يدوياً:**
- اضغط `Win+R`
- اكتب: `control /name Microsoft.CredentialManager`
- Windows Credentials → ابحث عن GitHub → احذف

---

### 2️⃣ إنشاء Personal Access Token (2 دقيقة)

**رابط مباشر:**
```
https://github.com/settings/tokens/new
```

**الإعدادات:**
- **Note:** `saleh-project-2025`
- **Expiration:** اختر المدة (90 days مناسب)
- **Scopes:** اختر ✓ **repo** فقط

**اضغط Generate token → انسخ التوكن فوراً!**

---

### 3️⃣ اختبار الاتصال (30 ثانية)

**افتح PowerShell في مجلد المشروع:**
```powershell
cd c:\muath\saleh
git fetch origin
```

**عند المطالبة:**
```
Username: muath5024-maker
Password: [الصق التوكن هنا]
```

**✅ إذا نجح:** سيحفظ Windows التوكن تلقائياً
**❌ إذا فشل:** تحقق من الخطوات أدناه

---

## 🔧 إذا ظهرت مشاكل:

### "Repository not found"
```powershell
# تأكد من أن المستودع موجود على GitHub
# اذهب إلى: https://github.com/muath5024-maker/saleh
# إذا لم يكن موجوداً، أنشئه
```

### "Authentication failed"
```powershell
# تأكد من:
# 1. Username صحيح: muath5024-maker
# 2. استخدمت التوكن وليس كلمة المرور
# 3. التوكن له صلاحية repo
```

### امسح الكاش وأعد المحاولة:
```powershell
git credential reject
# أدخل:
# protocol=https
# host=github.com
# [Enter مرتين]

# ثم أعد المحاولة
git fetch origin
```

---

## 🎯 بعد النجاح

### Push التغييرات:
```powershell
cd c:\muath\saleh

# راجع التغييرات
git status

# أضف التغييرات
git add .

# أنشئ commit
git commit -m "Update: sync with new GitHub account"

# ارفع للـ repository
git push -u origin main
```

---

## 📚 ملفات مساعدة

- **دليل كامل:** `c:\muath\github-setup-guide.md`
- **سكريبت اختبار:** `c:\muath\test-github-auth.ps1`

**تشغيل السكريبت:**
```powershell
cd c:\muath
.\test-github-auth.ps1
```

---

## 💡 نصائح

1. **حفظ التوكن بأمان:**
   - استخدم مدير كلمات مرور
   - أو احفظه في ملف نصي محمي

2. **لا تشارك التوكن:**
   - لا ترفعه على Git
   - لا ترسله لأحد

3. **انتهاء صلاحية التوكن:**
   - عند انتهاء الصلاحية، أنشئ توكن جديد
   - احذف القديم من Credential Manager

---

## ✨ ملخص الأوامر

```powershell
# التحقق من الإعدادات
git config --global user.name
git config --global user.email
git remote -v

# اختبار الاتصال
git fetch origin

# رفع التغييرات
git add .
git commit -m "message"
git push -u origin main
```

---

**🎉 بالتوفيق!**
