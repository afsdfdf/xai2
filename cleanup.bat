@echo off
echo XAI Finance - Cleaning up redundant files and folders

REM 创建备份目录
if not exist "backup_before_cleanup" mkdir backup_before_cleanup

REM 备份将要删除的文件夹和文件
echo Backing up files before deletion...
if exist "backup_python_backend" xcopy /E /I /Y "backup_python_backend" "backup_before_cleanup\backup_python_backend"
if exist "backup_unused" xcopy /E /I /Y "backup_unused" "backup_before_cleanup\backup_unused"
if exist "api_server.py.bak" copy "api_server.py.bak" "backup_before_cleanup\"

REM 删除冗余的备份文件夹
echo Removing redundant backup folders...
if exist "backup_python_backend" rmdir /S /Q "backup_python_backend"
if exist "backup_unused" rmdir /S /Q "backup_unused"

REM 删除冗余文件
echo Removing redundant files...
if exist "api_server.py.bak" del "api_server.py.bak"
if exist "start.bat" del "start.bat"

echo Cleanup completed successfully!
echo A backup of all deleted files is saved in the "backup_before_cleanup" folder
echo.
echo Please check CLEANUP_PLAN.md and ENHANCEMENT_PLAN.md for next steps.
pause 