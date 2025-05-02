@echo off
title XAI Finance

echo 启动XAI Finance生产环境...
echo.

REM 设置环境变量
set AVE_API_KEY=NMUuJmYHJB6d91bIpgLqpuLLKYVws82lj0PeDP3UEb19FoyWFJUVGLsgE95XTEmA
set NEXT_PUBLIC_API_BASE_URL=
set NEXT_PUBLIC_APP_URL=http://localhost:3000

REM 激活Python虚拟环境
if exist "venv" (
    call venv\Scripts\activate
) else (
    echo 正在创建虚拟环境...
    python -m venv venv
    call venv\Scripts\activate
    pip install -r requirements.txt
)

echo.
echo 启动API服务器...
start cmd /k "title XAI API Server && call venv\Scripts\activate && set AVE_API_KEY=%AVE_API_KEY% && python api_server.py"

echo.
echo 等待API服务器启动...
timeout /t 3 /nobreak > nul

echo.
echo 启动Next.js应用...
set NEXT_PUBLIC_API_BASE_URL=%NEXT_PUBLIC_API_BASE_URL%
set NEXT_PUBLIC_APP_URL=%NEXT_PUBLIC_APP_URL%
npm run start

echo.
echo 服务器已停止
exit 