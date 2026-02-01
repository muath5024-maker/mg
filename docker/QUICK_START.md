# MBUY Worker - Development Scripts

## تشغيل سريع

```bash
# تشغيل كل شيء
./start-dev.sh

# إيقاف كل شيء
./stop-dev.sh

# إعادة بناء
./rebuild-dev.sh
```

## الأوامر التفصيلية

```bash
# 1. بدء البيئة التطويرية
cd docker
docker-compose -f docker-compose.dev.yml up -d

# 2. متابعة السجلات
docker-compose -f docker-compose.dev.yml logs -f worker

# 3. تشغيل Flutter
cd ../mbuy
flutter run --dart-define=API_URL=http://localhost:8787

# 4. اختبار API
curl http://localhost:8787/health
```
