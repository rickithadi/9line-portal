#!/bin/bash

# Alternative: Create a fresh git repository without the large files
# This is simpler and cleaner than trying to rewrite history

echo "🔄 Creating fresh git repository..."

# Backup current .git
echo "💾 Backing up current git history..."
mv .git .git-backup

# Initialize fresh repository
echo "🆕 Initializing fresh git repository..."
git init

# Add current files (excluding ignored ones)
echo "📁 Adding current files..."
git add .

# Create initial commit
echo "💾 Creating initial commit..."
git commit -m "Initial commit - Nine-Line Portal

- Complete Next.js application with TypeScript
- Supabase integration and database schema
- Tailwind CSS styling
- Production-ready configuration
- Clean repository without build artifacts

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

# Check repository size
echo "📊 New repository size:"
du -hs .git

echo "✅ Fresh repository created!"
echo "📝 Repository is now clean and ready to push."
echo "⚠️  Note: Git history is reset. Old history is in .git-backup/"

# Show status
git status