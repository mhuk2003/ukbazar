@echo off
title UK BAZAR - Deploy to Firebase
color 0A
echo.
echo  ====================================
echo   UK BAZAR - Firebase Hosting Deploy
echo  ====================================
echo.
echo  [1/3] Firebase لۆگین چیک دەکرێت...
firebase login --no-localhost 2>nul
if errorlevel 1 (
  echo  لۆگین پێویستە — براوزەر کراوەدەبێت...
  firebase login
)
echo.
echo  [2/3] فایلەکان دەنێردرێن بۆ Firebase...
firebase deploy --only hosting
echo.
if errorlevel 1 (
  color 0C
  echo  ❌ هەڵە ڕوویدا — مۆڵەتی پرۆژە چیک بکە
) else (
  echo  ====================================
  echo   ✅ Deploy تەواو بوو!
  echo.
  echo   🌐 https://ukbazar-15eda.web.app
  echo   کامێرای QR ئێستا کارئەکات
  echo  ====================================
)
echo.
pause
