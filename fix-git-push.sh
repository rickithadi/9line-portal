#!/bin/bash

# Fix git repository for successful push
# This removes the problematic .git-backup and creates a clean repository

echo "🔄 Fixing git repository for push..."

# Remove the large backup directory
echo "🗑️ Removing .git-backup directory..."
rm -rf .git-backup

# Remove git repository
echo "🗑️ Removing current git repository..."
rm -rf .git

# Initialize fresh repository
echo "🆕 Initializing fresh git repository..."
git init

# Add remote
echo "🔗 Adding GitHub remote..."
git remote add origin git@github.com:rickithadi/9line-portal.git

# Add all files (respecting .gitignore)
echo "📁 Adding files..."
git add .

# Create clean commit
echo "💾 Creating clean commit..."
git commit -m "Initial commit - Nine-Line Portal

Complete Next.js application with:
- TypeScript and Tailwind CSS
- Supabase integration and database schema
- Production-ready configuration
- Clean repository without build artifacts

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Check repository size
echo "📊 Repository size:"
du -hs .git

# Show what will be pushed
echo "📋 Files to be pushed:"
git ls-files | wc -l
echo "files"

echo "✅ Repository is ready for push!"
echo "🚀 Run: git push -u origin main"

# Show status
git status