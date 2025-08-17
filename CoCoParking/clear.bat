@echo off
setlocal enabledelayedexpansion

:: 定义目标路径
set "build_dir=build\wechatgame"
set "temp_dir=temp"

:: 删除 build/wechatgame 目录及其所有内容
if exist "%build_dir%" (
    echo Deleting directory: %build_dir%
    rd /s /q "%build_dir%"
    echo Directory %build_dir% has been deleted.
) else (
    echo Directory %build_dir% does not exist.
)

:: 删除 temp/* 下的所有文件和子目录
if exist "%temp_dir%" (
    echo Cleaning directory: %temp_dir%
    :: 先删除temp下的所有文件
    del /f /q "%temp_dir%\*" >nul 2>&1
    :: 再递归删除temp下的所有子目录
    for /d %%d in ("%temp_dir%\*") do (
        rd /s /q "%%d" >nul 2>&1
    )
    echo Directory %temp_dir% has been cleaned.
) else (
    echo Directory %temp_dir% does not exist.
)

pause