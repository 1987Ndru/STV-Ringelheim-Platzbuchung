#!/bin/bash

echo "🚀 Starte STV Ringelheim Frontend..."
echo ""

# Prüfe ob .env.local existiert
if [ ! -f .env.local ]; then
    echo "📝 Erstelle .env.local..."
    echo "VITE_API_URL=http://localhost:3001/api" > .env.local
    echo "✅ .env.local erstellt"
    echo ""
fi

# Prüfe ob node_modules existiert
if [ ! -d node_modules ]; then
    echo "📦 Installiere Abhängigkeiten..."
    npm install
    echo ""
fi

echo "▶️  Starte Frontend..."
echo ""
npm run dev

