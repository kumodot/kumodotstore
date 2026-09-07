@echo off
cd /d "%~dp0"
echo.
echo  Publishing store mode...
echo  ------------------------
findstr /C:"cartEnabled" /C:"showPrices" /C:"showBanner" src\data\storeMode.ts
echo.
git add src/data/storeMode.ts
git diff --cached --quiet && (
    echo Nothing to commit - storeMode.ts unchanged.
    pause
    exit /b 0
)
git commit -m "chore: update store mode"
git push origin main
echo.
echo Done! Live in about a minute at https://store.kumodot.art
pause
