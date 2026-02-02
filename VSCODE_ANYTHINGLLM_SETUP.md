# 🔗 دليل ربط AnythingLLM مع VS Code و GitHub

## ✅ ما تم إعداده

### 1. التكامل مع VS Code

- ✅ Extension: Anything LLM
- ✅ ملف الإعدادات: `.vscode/settings.json`
- ✅ الاتصال بـ: `http://localhost:3001`
- ✅ Workspace: `luh`

### 2. التكامل مع GitHub

- ✅ المستودع: `https://github.com/muath5024-maker/mg`
- ✅ البرانش: `main`
- ✅ Auto-fetch مفعّل
- ✅ Smart commit مفعّل

---

## 📋 خطوات التفعيل

### الخطوة 1️⃣: تشغيل AnythingLLM

```powershell
cd C:\mg\docker
docker-compose up -d anythingllm
```

### الخطوة 2️⃣: الحصول على API Key

1. افتح: http://localhost:3001
2. اذهب إلى: **Settings** → **API Keys**
3. اضغط: **Create New API Key**
4. انسخ الـ API Key

### الخطوة 3️⃣: إضافة API Key في VS Code

**الطريقة الأولى (عبر الإعدادات):**

```
1. Ctrl + Shift + P
2. اكتب: "Preferences: Open Settings (JSON)"
3. أضف:
   "anything-llm.apiKey": "YOUR_API_KEY_HERE"
```

**الطريقة الثانية (عبر Extension):**

```
1. اضغط على أيقونة Anything LLM في الشريط الجانبي
2. اضغط "Configure"
3. الصق API Key
```

### الخطوة 4️⃣: إضافة GitHub Token (اختياري)

لربط GitHub مع AnythingLLM:

1. اذهب إلى: https://github.com/settings/tokens
2. اضغط: **Generate new token (classic)**
3. اختر الصلاحيات:
   - ✅ `repo` (كامل)
   - ✅ `read:org`
   - ✅ `workflow`
4. انسخ الـ Token
5. ضعه في ملف `.env`:
   ```
   GITHUB_TOKEN=ghp_your_token_here
   ```

---

## 🎯 كيفية الاستخدام

### في VS Code:

#### 1. سؤال عن الكود

```
Ctrl + Shift + P → "Anything LLM: Ask Question"
```

مثال: "كيف أربط Flutter app بـ API؟"

#### 2. شرح الكود المحدد

```
1. حدد الكود
2. Right Click → "Explain with Anything LLM"
```

#### 3. تحسين الكود

```
1. حدد الكود
2. Right Click → "Improve with Anything LLM"
```

#### 4. إنشاء وثائق

```
1. حدد الكود
2. Right Click → "Generate Docs with Anything LLM"
```

---

## 🔄 ربط AnythingLLM مع GitHub Repo

### إنشاء Webhook في GitHub:

1. **اذهب إلى:** https://github.com/muath5024-maker/mg/settings/hooks
2. **اضغط:** "Add webhook"
3. **Payload URL:** `http://your-server-ip:3001/api/webhook/github`
4. **Content type:** `application/json`
5. **Events:** اختر `Push events` و `Pull request`
6. **Active:** ✅
7. **اضغط:** "Add webhook"

### إعداد AnythingLLM لاستقبال Updates من GitHub:

في AnythingLLM:

1. اذهب إلى: **Settings** → **Integrations**
2. فعّل: **GitHub Integration**
3. أضف: Repository URL
   ```
   https://github.com/muath5024-maker/mg
   ```
4. أضف: GitHub Token (من الخطوة 4 أعلاه)
5. اختر: **Auto-sync on push**

---

## 🧪 اختبار التكامل

### اختبار VS Code ↔️ AnythingLLM:

```powershell
# افتح أي ملف في المشروع
# اضغط Ctrl + Shift + P
# اكتب: "Anything LLM: Ask Question"
# اسأل: "ما هي ملفات Flutter الرئيسية في المشروع؟"
```

### اختبار GitHub ↔️ AnythingLLM:

```powershell
# عمل تغيير بسيط
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: AnythingLLM webhook"
git push

# بعدها تحقق في AnythingLLM Logs:
# http://localhost:3001/settings/logs
```

---

## 🚀 ميزات إضافية

### 1. Auto-completion من AnythingLLM

```json
// في .vscode/settings.json
{
  "anything-llm.autocomplete.enabled": true,
  "anything-llm.autocomplete.delay": 500
}
```

### 2. Chat في الشريط الجانبي

```
اضغط على أيقونة Anything LLM في الشريط الجانبي
ابدأ المحادثة مباشرة
```

### 3. تحليل الكود التلقائي

```json
{
  "anything-llm.codeAnalysis.onSave": true,
  "anything-llm.codeAnalysis.showInline": true
}
```

---

## 📊 لوحة التحكم

بعد التفعيل، يمكنك:

1. **متابعة الأسئلة:** http://localhost:3001/workspace/luh/history
2. **إحصائيات الاستخدام:** http://localhost:3001/analytics
3. **إدارة Documents:** http://localhost:3001/workspace/luh/documents

---

## ⚙️ إعدادات متقدمة

### ربط n8n مع AnythingLLM:

```yaml
# في docker-compose.yml
# أضف environment variables:
environment:
  - ANYTHINGLLM_URL=http://anythingllm:3001
  - ANYTHINGLLM_API_KEY=${ANYTHINGLLM_API_KEY}
```

### إنشاء Workflow في n8n:

1. افتح: http://localhost:5678
2. اذهب إلى: **Workflows** → **New**
3. أضف Nodes:
   - **Trigger:** GitHub Push
   - **Action:** HTTP Request إلى AnythingLLM
   - **Target:** Update Documents

---

## 🐛 حل المشاكل

### المشكلة: Extension لا يتصل بـ AnythingLLM

**الحل:**

```
1. تأكد أن AnythingLLM يعمل: docker ps
2. تحقق من URL: http://localhost:3001
3. تحقق من API Key في Settings
```

### المشكلة: GitHub Webhook لا يعمل

**الحل:**

```
1. تحقق من Webhook settings في GitHub
2. تحقق من AnythingLLM logs: docker logs anythingllm
3. تأكد من Firewall settings
```

### المشكلة: بطء في الاستجابة

**الحل:**

```
1. زيادة WORKER_THREADS في .env
2. تحسين الموارد في docker-compose.yml:
   deploy:
     resources:
       limits:
         memory: 4G
       reservations:
         memory: 2G
```

---

## 📝 ملاحظات

- ✅ AnythingLLM يعمل محلياً (offline)
- ✅ البيانات آمنة ولا تُرسل خارج الجهاز
- ✅ يمكن استخدام Ollama للنماذج المحلية
- ✅ التكامل يعمل مع أي مستودع Git

---

## 🎓 موارد إضافية

- [AnythingLLM Docs](https://docs.useanything.com/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [GitHub Webhooks Guide](https://docs.github.com/en/webhooks)
- [n8n Workflows](https://docs.n8n.io/)

---

**تم الإعداد بواسطة:** GitHub Copilot  
**التاريخ:** 2026-02-03  
**المستودع:** https://github.com/muath5024-maker/mg
