@echo off
setlocal

if not exist zig_exe_path.txt (
    echo Missing file zig_exe_path.txt
    exit /B 1
)
set /p ZIG_EXE=<zig_exe_path.txt

if "%1"=="" call :help
if "%1"=="help" call :help
if "%1"=="build" call :build
if "%1"=="clean" call :clean
if "%1"=="run" call :run
if "%1"=="test" call :test
if "%1"=="setup" call :setup
if "%1"=="release" call :release %2
exit /B %ERRORLEVEL%


:help
echo build.bat takes 1 argument: build/clean/run/test/setup/release
exit /B 0

:build
"%ZIG_EXE%" build
exit /B 0

:clean
rmdir /Q /S build
rmdir /Q /S zig-cache
rmdir /Q /S zig-out
del /Q /F public\wasm\*
exit /B 0

:run
echo Unimplemented
exit /B 1

:test
echo Unimplemented
exit /B 0

:setup
echo Unimplemented
exit /B 1

:release
echo Unimplemented
exit /B 1
