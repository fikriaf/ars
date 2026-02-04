@echo off
echo ========================================
echo ARS Demo Setup Script
echo ========================================
echo.

echo This script will help you set up the ARS demo.
echo.
echo IMPORTANT: Before running this script, you must:
echo   1. Create database tables in Supabase Dashboard
echo   2. Copy SQL from: supabase/migrations/002_create_all_tables.sql
echo   3. Paste in Supabase SQL Editor and run
echo.
echo Have you completed the database setup? (Y/N)
set /p CONFIRM=

if /i not "%CONFIRM%"=="Y" (
    echo.
    echo Please complete the database setup first:
    echo   1. Go to: https://supabase.com/dashboard/project/nbgyuavahktdbxpgpyvr/sql
    echo   2. Click "New Query"
    echo   3. Copy contents of: supabase/migrations/002_create_all_tables.sql
    echo   4. Paste and click "Run"
    echo   5. Wait for "Success" message
    echo   6. Run this script again
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 1: Seeding Database
echo ========================================
echo.

cd backend
echo Running seed script...
call npx ts-node src/seed-database.ts

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Database seeding failed!
    echo.
    echo Possible reasons:
    echo   - Database tables not created
    echo   - Supabase credentials incorrect
    echo   - Network connection issue
    echo.
    echo Please check the error message above and try again.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 2: Starting API Server
echo ========================================
echo.

echo Starting server on http://localhost:3000...
echo.
echo The server will start in a new window.
echo Keep that window open while using the demo.
echo.

start "ARS API Server" cmd /k "npx ts-node src/simple-server.ts"

timeout /t 3 /nobreak >nul

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo API Server: http://localhost:3000
echo.
echo Test endpoints:
echo   http://localhost:3000/health
echo   http://localhost:3000/ili/current
echo   http://localhost:3000/proposals
echo.
echo Press any key to test the health endpoint...
pause >nul

powershell -Command "(Invoke-WebRequest -UseBasicParsing -Uri http://localhost:3000/health).Content"

echo.
echo.
echo Would you like to start the frontend dashboard? (Y/N)
set /p START_FRONTEND=

if /i "%START_FRONTEND%"=="Y" (
    echo.
    echo Starting frontend...
    cd ..\frontend
    start "ARS Frontend" cmd /k "npm run dev"
    echo.
    echo Frontend will open at: http://localhost:5173
)

echo.
echo ========================================
echo Demo is ready!
echo ========================================
echo.
echo Services running:
echo   - API Server: http://localhost:3000
if /i "%START_FRONTEND%"=="Y" (
    echo   - Frontend: http://localhost:5173
)
echo.
echo To stop services, close the terminal windows.
echo.
pause
