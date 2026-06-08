@echo off
title UK BAZAR - HTTPS Server
color 0A
echo.
echo  UK BAZAR بارئەکات...
echo  براوزەر کراوەدەبێت
echo.
python START_SERVER.py
if errorlevel 1 (
  echo.
  echo  Python نەدۆزرایەوە! دابگرە:
  echo  https://python.org/downloads
  pause
)
