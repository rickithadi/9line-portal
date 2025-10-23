#!/bin/bash

# Setup environment variables for the application

echo "🔧 Setting up environment variables..."

# Copy sample to local environment file
if [ ! -f .env.local ]; then
    echo "📋 Creating .env.local from .env.sample..."
    cp .env.sample .env.local
    echo "✅ Created .env.local"
else
    echo "ℹ️  .env.local already exists"
fi

echo "🚀 Environment setup complete!"
echo "📝 You can now run the application with environment variables."