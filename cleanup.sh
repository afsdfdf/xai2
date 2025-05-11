#!/bin/bash

echo "XAI Finance - Cleaning up redundant files and folders"

# 创建备份目录
if [ ! -d "backup_before_cleanup" ]; then
  mkdir backup_before_cleanup
fi

# 备份将要删除的文件夹和文件
echo "Backing up files before deletion..."
if [ -d "backup_python_backend" ]; then
  cp -r backup_python_backend backup_before_cleanup/
fi

if [ -d "backup_unused" ]; then
  cp -r backup_unused backup_before_cleanup/
fi

if [ -f "api_server.py.bak" ]; then
  cp api_server.py.bak backup_before_cleanup/
fi

# 删除冗余的备份文件夹
echo "Removing redundant backup folders..."
if [ -d "backup_python_backend" ]; then
  rm -rf backup_python_backend
fi

if [ -d "backup_unused" ]; then
  rm -rf backup_unused
fi

# 删除冗余文件
echo "Removing redundant files..."
if [ -f "api_server.py.bak" ]; then
  rm api_server.py.bak
fi

if [ -f "start.bat" ]; then
  rm start.bat
fi

echo "Cleanup completed successfully!"
echo "A backup of all deleted files is saved in the \"backup_before_cleanup\" folder"
echo
echo "Please check CLEANUP_PLAN.md and ENHANCEMENT_PLAN.md for next steps."

# 设置脚本为可执行
chmod +x cleanup.sh 