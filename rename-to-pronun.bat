@echo off
echo ========================================
echo Renaming pronou to pronun
echo ========================================
echo.

echo [1/5] Renaming folder...
move games\pronou games\pronun
echo.

echo [2/5] Renaming HTML file...
cd games\pronun
ren pronou.html pronunciation.html
cd ..\..
echo.

echo [3/5] Renaming CSS file...
cd games\pronun\css
ren pronou.css pronun.css
cd ..\..
echo.

echo [4/5] Updating references in JS files...
cd games\pronun\js
powershell -Command "(Get-Content game.js) -replace 'pronou', 'pronun' | Set-Content game.js"
powershell -Command "(Get-Content ui.js) -replace 'pronou', 'pronun' | Set-Content ui.js"
powershell -Command "(Get-Content score.js) -replace 'pronou', 'pronun' | Set-Content score.js"
powershell -Command "(Get-Content speech.js) -replace 'pronou', 'pronun' | Set-Content speech.js"
powershell -Command "(Get-Content data.js) -replace 'pronou', 'pronun' | Set-Content data.js"
powershell -Command "(Get-Content utils.js) -replace 'pronou', 'pronun' | Set-Content utils.js"
powershell -Command "(Get-Content audio.js) -replace 'pronou', 'pronun' | Set-Content audio.js"
cd ..\..
echo.

echo [5/5] Updating HTML file...
powershell -Command "(Get-Content games\pronun\pronunciation.html) -replace 'pronou.css', 'pronun.css' | Set-Content games\pronun\pronunciation.html"
echo.

echo ========================================
echo Done! All files renamed successfully.
echo ========================================
pause