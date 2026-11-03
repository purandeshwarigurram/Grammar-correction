@echo off
title Push AI Grammar Checker to GitHub
echo ========================================================
echo        Pushing AI Grammar Checker to GitHub
echo ========================================================
echo.
cd /d "%~dp0"

echo Current remote:
git remote -v
echo.
echo Pushing branch 'main' to GitHub repository...
echo If prompted, please sign in via browser or enter your GitHub Personal Access Token.
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo  SUCCESS! Project successfully pushed to GitHub:
    echo  https://github.com/purandeshwarigurram/Grammar-correction
    echo ========================================================
) else (
    echo.
    echo [ERROR] Push failed. If authentication failed, create a
    echo GitHub Personal Access Token (PAT) with 'repo' scope at:
    echo https://github.com/settings/tokens
    echo and use it as your password.
)

echo.
pause
