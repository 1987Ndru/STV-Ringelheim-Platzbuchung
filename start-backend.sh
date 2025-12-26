#!/bin/bash

echo "🚀 Starte STV Ringelheim Backend..."
echo ""

cd backend

# Prüfe ob .env existiert
if [ ! -f .env ]; then
    echo "❌ .env Datei nicht gefunden!"
    echo "📝 Erstelle .env aus .env.example..."
    cp .env.example .env 2>/dev/null || echo "⚠️  .env.example nicht gefunden"
    echo ""
    echo "⚠️  WICHTIG: Bearbeiten Sie backend/.env und fügen Sie Ihre MongoDB URI ein!"
    echo "   Siehe SETUP_COMPLETE.md für Anleitung"
    echo ""
    exit 1
fi

# Prüfe ob node_modules existiert
if [ ! -d node_modules ]; then
    echo "📦 Installiere Abhängigkeiten..."
    npm install
    echo ""
fi

# Prüfe ob MongoDB URI gesetzt ist
if grep -q "mongodb://localhost:27017" .env && ! grep -q "mongodb+srv://" .env; then
    echo "⚠️  WARNUNG: MongoDB URI scheint nicht konfiguriert zu sein"
    echo "   Bitte bearbeiten Sie backend/.env und fügen Sie Ihre MongoDB URI ein"
    echo ""
fi

echo "▶️  Starte Backend..."
echo ""
npm run dev

