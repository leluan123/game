@echo off
echo Pushing to GitHub...
git add .
git commit -m "fix: restore full HTML file and rename to Pronunciation Test"
git push
echo.
echo Done! Press any key to exit...
pause >nul