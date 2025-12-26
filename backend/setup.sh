#!/bin/bash

echo "🚀 STV Ringelheim Backend Setup"
echo "================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Erstelle .env Datei..."
    cp .env.example .env
    echo "✅ .env Datei erstellt"
else
    echo "✅ .env Datei existiert bereits"
fi

# Generate JWT Secret
echo ""
echo "🔐 Generiere JWT Secret..."
JWT_SECRET=$(openssl rand -base64 32)
echo "JWT_SECRET=$JWT_SECRET" >> .env
echo "✅ JWT Secret generiert und zu .env hinzugefügt"

# Install dependencies
echo ""
echo "📦 Installiere Abhängigkeiten..."
npm install

echo ""
echo "✅ Setup abgeschlossen!"
echo ""
echo "📋 Nächste Schritte:"
echo "1. Bearbeiten Sie backend/.env und fügen Sie Ihre MongoDB URI ein"
echo "2. Für MongoDB Atlas: Siehe MONGODB_SETUP.md"
echo "3. Starten Sie das Backend mit: npm run dev"
echo ""

