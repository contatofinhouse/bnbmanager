@echo off
title bnbmanager - Servidor Local
echo ========================================================
echo   Iniciando bnbmanager (Copan 4 Cotistas)
echo ========================================================
echo.
echo Abrindo o navegador em http://localhost:3000 ...
start http://localhost:3000
echo.
echo Executando servidor Next.js...
npm run dev
pause
