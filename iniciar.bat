@echo off
title CETECOM Presentation Server
echo.
echo ========================================
echo   INSTALANDO DEPENDENCIAS...
echo ========================================
echo.
npm install ws
echo.
echo ========================================
echo   INICIANDO SERVIDOR...
echo ========================================
echo.
node server.js
pause
