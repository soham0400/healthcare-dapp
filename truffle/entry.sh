#!/bin/sh
set -e

echo "⏳ Waiting for Ganache..."
sleep 10

echo "📦 Compiling contracts..."
truffle compile --all

echo "🚀 Migrating contracts..."
truffle migrate --reset --network development

echo "📋 Copying artifacts..."
node /app/copy-artifacts.js

echo "✅ Truffle setup complete!"

# Keep container running if needed
tail -f /dev/null