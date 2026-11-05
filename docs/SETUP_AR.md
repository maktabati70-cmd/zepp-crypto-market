# دليل التشغيل بالعربي — Crypto Market

## ما هو؟
تطبيق لساعة Amazfit T-Rex 2 بأربع صفحات (واجهته بالإنكليزية فقط وبدون صور):
1. **PRICES** أسعار عملاتك (حتى 6 عملات) مع نسبة التغير 24 ساعة.
2. **MARKET** حركة السوق: القيمة السوقية الكلية وتغيرها، حجم التداول، هيمنة البيتكوين، مؤشر الخوف والطمع، وكم عملة صاعدة/هابطة من أكبر 100.
3. **MOVERS** أكثر عملتين صعوداً وأكثر عملتين هبوطاً خلال 24 ساعة.
4. **ABOUT** "Developed by KIM" ورمز QR للتبرع USDT شبكة TRC20.

التنقل: اسحب يميناً/يساراً أو زرّي UP/DOWN. زر SELECT = تحديث.

## خطوات التشغيل
1. ثبّت Node.js ثم: `npm i -g @zeppos/zeus-cli`
2. فعّل وضع المطوّر في تطبيق Zepp: الملف الشخصي ← الإعدادات ← حول ← اضغط شعار Zepp سبع مرات.
3. **رقم التطبيق (App ID):**
   - ادخل https://console.zepp.com ← Create ← تطبيق (App / Mini Program).
   - انسخ الرقم الذي يظهر.
   - افتح `app.json` وضع الرقم مكان `1000008` في السطر `"appId": 1000008,`
4. **عنوان التبرع واسم KIM ثابتان** في `utils/credits.js` (مشفّران ويُتحقق منهما عند التشغيل). إذا عدّلهما أحد يظهر "UNOFFICIAL BUILD" ولا يعمل التطبيق. وهما أيضاً شرط في الرخصة LICENSE.
5. داخل مجلد المشروع:
   ```
   zeus login
   zeus preview
   ```
   امسح رمز QR من تطبيق Zepp (الملف الشخصي ← Developer Mode ← Scan).
6. تغيير العملات: تطبيق Zepp ← الساعة ← التطبيقات ← Crypto Market ← الإعدادات.

## النشر على GitHub
```
cd zepp-crypto-market
git init
git add .
git commit -m "Crypto Market for Zepp OS"
git branch -M main
git remote add origin https://github.com/USERNAME/zepp-crypto-market.git
git push -u origin main
```
- أنشئ المستودع أولاً من github.com ← New repository (بدون README لأن الموجود جاهز).
- ملاحظة: إذا لا تريد نشر رقم التطبيق الخاص بك، أرجِع `appId` إلى `1000008` قبل الرفع، فكل شخص يضع رقمه.
- عنوان التبرع العام لا مشكلة في نشره (هو للاستقبال فقط)، لكن **لا تضع أبداً المفتاح الخاص أو كلمات الاسترجاع** في أي ملف.
