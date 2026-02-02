# 💻 التطوير من Terminal - Development from Terminal Only

<div dir="rtl">

## نعم! يمكنك التطوير بالكامل من Terminal بدون VS Code

---

## 🎯 الأدوات المتاحة في Terminal

### 1. إدارة Docker

```powershell
# تشغيل كل الخدمات
cd C:\mg\docker
docker-compose -f docker-compose.dev.yml up -d

# إيقاف كل شيء
docker-compose -f docker-compose.dev.yml down

# حالة الخدمات
docker-compose -f docker-compose.dev.yml ps

# سجلات Worker
docker logs mbuy-worker -f

# سجلات Database
docker logs mbuy-postgres -f

# إعادة تشغيل خدمة معينة
docker-compose -f docker-compose.dev.yml restart worker
```

---

### 2. قاعدة البيانات (PostgreSQL)

```powershell
# دخول قاعدة البيانات
docker exec -it mbuy-postgres psql -U postgres -d mbuy_dev

# أو تنفيذ استعلام مباشر
docker exec mbuy-postgres psql -U postgres -d mbuy_dev -c "SELECT * FROM users;"

# عرض جداول
docker exec mbuy-postgres psql -U postgres -d mbuy_dev -c "\dt"

# عدد المستخدمين
docker exec mbuy-postgres psql -U postgres -d mbuy_dev -c "SELECT COUNT(*) FROM users;"

# إضافة بيانات
docker exec mbuy-postgres psql -U postgres -d mbuy_dev -c "INSERT INTO users (...) VALUES (...);"

# تحديث بيانات
docker exec mbuy-postgres psql -U postgres -d mbuy_dev -c "UPDATE users SET name='Ahmed' WHERE id=1;"

# حذف بيانات
docker exec mbuy-postgres psql -U postgres -d mbuy_dev -c "DELETE FROM users WHERE id=2;"
```

---

### 3. Flutter Development

```powershell
# فحص البيئة
flutter doctor

# تنظيف المشروع
cd C:\mg\mbuy
flutter clean

# تثبيت dependencies
flutter pub get

# قائمة الأجهزة المتاحة
flutter devices

# تشغيل على Windows
flutter run -d windows

# تشغيل على Android
flutter run -d android

# تشغيل على Chrome
flutter run -d chrome

# بناء APK
flutter build apk

# بناء Windows
flutter build windows
```

---

### 4. تعديل الملفات بـ Terminal

```powershell
# فتح ملف في Notepad
notepad C:\mg\mbuy\lib\main.dart

# عرض محتوى ملف
cat C:\mg\mbuy\lib\main.dart

# البحث في ملف
Select-String -Path C:\mg\mbuy\lib\main.dart -Pattern "apiBaseUrl"

# البحث في كل الملفات
Get-ChildItem C:\mg\mbuy\lib -Recurse -Filter *.dart | Select-String "apiBaseUrl"

# استبدال نص في ملف
(Get-Content C:\mg\mbuy\lib\core\app_config.dart) -replace 'localhost:8787', 'your-worker.workers.dev' | Set-Content C:\mg\mbuy\lib\core\app_config.dart
```

---

### 5. Worker API Development

```powershell
# تشغيل Worker مع Wrangler
cd C:\mg\mbuy-worker
npx wrangler dev --port 8787

# اختبار API
curl http://localhost:8787/
Invoke-RestMethod http://localhost:8787/

# اختبار endpoint معين
Invoke-RestMethod http://localhost:8787/auth/register -Method POST -Body (@{email='test@example.com'; password='123456'} | ConvertTo-Json) -ContentType 'application/json'

# فحص package.json
cat package.json

# تثبيت مكتبة جديدة
npm install package-name

# تشغيل tests
npm test

# بناء production
npm run build
```

---

### 6. Git من Terminal

```powershell
# حالة المشروع
git status

# عرض التغييرات
git diff

# إضافة كل الملفات
git add .

# إضافة ملف معين
git add C:\mg\mbuy\lib\main.dart

# حفظ commit
git commit -m "feat: add new feature"

# رفع للسحابة
git push

# سحب آخر التحديثات
git pull

# عرض السجل
git log --oneline

# إنشاء branch جديد
git checkout -b feature/new-feature

# التبديل بين branches
git checkout main
```

---

## 🔧 محررات نصوص Terminal-based

إذا كنت لا تريد استخدام VS Code نهائياً:

### Windows PowerShell ISE
```powershell
# فتح ملف في PowerShell ISE
powershell_ise C:\mg\mbuy\lib\main.dart
```

### Vim (إذا مثبت)
```powershell
vim C:\mg\mbuy\lib\main.dart
```

### Nano (إذا مثبت)
```powershell
nano C:\mg\mbuy\lib\main.dart
```

### Notepad++
```powershell
notepad++ C:\mg\mbuy\lib\main.dart
```

---

## 📊 مراقبة النظام

```powershell
# استهلاك Docker
docker stats

# حجم الحاويات
docker system df

# تنظيف Docker
docker system prune -a

# Port المستخدمة
netstat -ano | findstr :8787
netstat -ano | findstr :5432

# قائمة العمليات
Get-Process | Where-Object {$_.ProcessName -like "*docker*"}
```

---

## 🎨 سير عمل Terminal فقط

### السيناريو الكامل:

```powershell
# 1. الصباح - بدء العمل
cd C:\mg\docker
docker-compose -f docker-compose.dev.yml up -d

# 2. فحص الحالة
docker-compose ps

# 3. تشغيل Worker
cd C:\mg\mbuy-worker
Start-Process powershell -ArgumentList "npx wrangler dev --port 8787"

# 4. تشغيل Flutter
cd C:\mg\mbuy
Start-Process powershell -ArgumentList "flutter run"

# 5. تعديل كود (في نافذة جديدة)
notepad C:\mg\mbuy\lib\features\home\home_screen.dart
# عدّل -> احفظ -> Flutter سيعمل Hot Reload تلقائياً

# 6. اختبار API
Invoke-RestMethod http://localhost:8787/auth/login -Method POST -Body (@{email='merchant@mbuy.dev'; password='test123456'} | ConvertTo-Json) -ContentType 'application/json'

# 7. فحص Database
docker exec mbuy-postgres psql -U postgres -d mbuy_dev -c "SELECT * FROM users;"

# 8. حفظ التغييرات
git add .
git commit -m "feat: update home screen"
git push

# 9. نهاية اليوم
cd C:\mg\docker
docker-compose -f docker-compose.dev.yml down
```

---

## 🚀 مثال عملي: إضافة feature جديدة

```powershell
# 1. إنشاء branch جديد
git checkout -b feature/add-cart

# 2. إنشاء ملف جديد
New-Item C:\mg\mbuy\lib\features\cart\cart_screen.dart -ItemType File

# 3. تعديل الملف
notepad C:\mg\mbuy\lib\features\cart\cart_screen.dart

# 4. حفظ الكود، Flutter سيعمل Hot Reload

# 5. اختبار
flutter test

# 6. حفظ
git add .
git commit -m "feat: add cart screen"
git push origin feature/add-cart
```

---

## ✅ الخلاصة

**نعم! يمكنك التطوير بالكامل من Terminal:**
- ✅ إدارة Docker
- ✅ قاعدة البيانات (SQL مباشر)
- ✅ تشغيل Flutter
- ✅ تعديل الملفات (Notepad, Vim, etc.)
- ✅ Git operations
- ✅ اختبار API
- ✅ مراقبة النظام

**الأدوات الوحيدة المطلوبة:**
1. PowerShell (موجود في Windows)
2. Docker Desktop
3. Flutter SDK
4. Git
5. محرر نصوص (Notepad, Notepad++, Vim, etc.)

**VS Code اختياري - ليس إجبارياً!**

</div>
