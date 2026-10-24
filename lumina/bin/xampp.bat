@echo off
setlocal
if defined XAMPP_HOME if exist "%XAMPP_HOME%\php\php.exe" (
  "%XAMPP_HOME%\php\php.exe" "%~dp0xampp.php"
  exit /b %ERRORLEVEL%
)
if exist "C:\xampp\php\php.exe" (
  "C:\xampp\php\php.exe" "%~dp0xampp.php"
  exit /b %ERRORLEVEL%
)
where php >nul 2>&1
if %ERRORLEVEL%==0 (
  php "%~dp0xampp.php"
  exit /b %ERRORLEVEL%
)
echo Installa XAMPP 8.5.12 da https://www.apachefriends.org/download.html
exit /b 1
