# ✅ إعداد AnythingLLM مع VS Code و GitHub - اكتمل

## 🎉 ما تم إنجازه:

### 1. التكامل مع VS Code ✅

- ✅ Extension متاح: **Anything LLM** (`mehrdadalemzadeh.anything-llm`)
- ✅ ملف الإعدادات: [.vscode/settings.json](.vscode/settings.json)
- ✅ الاتصال: `http://localhost:3001`
- ✅ Workspace: `luh`

### 2. التكامل مع GitHub ✅

- ✅ المستودع مربوط: https://github.com/muath5024-maker/mg
- ✅ البرانش: `main`
- ✅ Auto-fetch مفعّل
- ✅ Smart commit مفعّل
- ✅ تم دفع جميع التغييرات

### 3. Docker Configuration ✅

- ✅ AnythingLLM يعمل: http://localhost:3001
- ✅ Volume للمشروع: `/workspace` (للقراءة)
- ✅ GitHub variables جاهزة في `.env.dev`
- ✅ Container صحي وجاهز (Up 3 hours)

### 4. الملفات المُنشأة ✅

- ✅ [VSCODE_ANYTHINGLLM_SETUP.md](VSCODE_ANYTHINGLLM_SETUP.md) - دليل كامل
- ✅ [setup-anythingllm-vscode.ps1](setup-anythingllm-vscode.ps1) - سكريبت Windows
- ✅ [setup-anythingllm-vscode.sh](setup-anythingllm-vscode.sh) - سكريبت Linux/Mac

---

## 🚀 الخطوات التالية (يدوياً):

### ⚠️ خطوة واحدة متبقية فقط:

#### 1️⃣ الحصول على API Key من AnythingLLM:

1. **افتح:** http://localhost:3001 (يفتح تلقائياً)
2. **اذهب إلى:** ⚙️ Settings → 🔑 API Keys
3. **اضغط:** "Create New API Key"
4. **انسخ** المفتاح

#### 2️⃣ إضافة API Key في مكانين:

**المكان الأول - VS Code:**

```json
// ملف: .vscode/settings.json
{
  "anything-llm.apiKey": "الصق_المفتاح_هنا"
}
```

**المكان الثاني - Docker:**

```bash
# ملف: docker/.env.dev
ANYTHINGLLM_API_KEY=الصق_المفتاح_هنا
```

#### 3️⃣ إعادة تشغيل (إذا لزم):

```powershell
cd docker
docker-compose restart anythingllm
```

---

## 🎯 كيفية الاستخدام

### في VS Code:

1. **تثبيت Extension:**
   - اضغط `Ctrl+Shift+X`
   - ابحث عن: `Anything LLM`
   - اضغط Install

2. **الاتصال:**
   - سيتصل تلقائياً بـ `http://localhost:3001`
   - باستخدام API Key من الإعدادات

3. **الاستخدام:**
   - `Ctrl+Shift+P` → "Anything LLM: Ask Question"
   - أو Right Click على الكود → "Explain with Anything LLM"

### الربط مع GitHub (اختياري):

#### إنشاء GitHub Token:

1. https://github.com/settings/tokens
2. Generate new token (classic)
3. اختر: `repo`, `read:org`, `workflow`
4. ضعه في `docker/.env.dev`:
   ```
   GITHUB_TOKEN=ghp_xxxxx
   ```

#### إنشاء Webhook:

1. https://github.com/muath5024-maker/mg/settings/hooks
2. Add webhook
3. Payload URL: `http://your-ip:3001/api/webhook/github`
4. Events: Push, Pull requests

---

## 📊 الحالة الحالية

```
✅ AnythingLLM: يعمل (http://localhost:3001)
✅ GitHub Repo: مربوط ومحدّث
✅ VS Code Settings: جاهز
⏳ API Key: يحتاج إضافة يدوية (خطوة واحدة)
⏳ Extension: يحتاج تثبيت يدوي
```

---

## 🔗 الروابط المهمة

- 🌐 **AnythingLLM:** http://localhost:3001
- 🔧 **n8n:** http://localhost:5678
- 📦 **GitHub Repo:** https://github.com/muath5024-maker/mg
- 📖 **الدليل الكامل:** [VSCODE_ANYTHINGLLM_SETUP.md](VSCODE_ANYTHINGLLM_SETUP.md)

---

## 🆘 إذا واجهت مشكلة

```powershell
# تحقق من الحالة
docker ps | findstr anythingllm

# عرض اللوجات
docker logs anythingllm

# إعادة التشغيل
cd docker
docker-compose restart anythingllm
```

---

**آخر تحديث:** 2026-02-03  
**الحالة:** ✅ جاهز - يحتاج API Key فقط  
**Commit:** [feat: إضافة تكامل AnythingLLM](https://github.com/muath5024-maker/mg/commit/0f04ce9)
