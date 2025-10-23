#!/bin/bash

# Script to clean up git repository history and remove large files
# Run this to fix the git repository size issue

echo "🔄 Cleaning up git repository history..."

# Install git-filter-repo if not available (safer than filter-branch)
if ! command -v git-filter-repo &> /dev/null; then
    echo "📦 Installing git-filter-repo..."
    pip3 install git-filter-repo
fi

# Backup current branch
echo "💾 Creating backup..."
git branch backup-main

# Remove large directories from entire git history
echo "🗑️ Removing .next/ from git history..."
git filter-repo --path .next --invert-paths --force

echo "🗑️ Removing logs/ from git history..."
git filter-repo --path logs --invert-paths --force

echo "🗑️ Removing .claude/ from git history..."
git filter-repo --path .claude --invert-paths --force

# Force garbage collection to reclaim space
echo "🧹 Running garbage collection..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Check new size
echo "📊 New repository size:"
du -hs .git

echo "✅ Git repository cleanup complete!"
echo "📝 You can now push to remote without size issues."
echo "⚠️  Note: This rewrites git history. All collaborators will need to re-clone."

# Show current status
git status