# Frontend API Integration

Das Frontend wurde angepasst, um die Backend-API zu verwenden.

## Konfiguration

Erstellen Sie eine `.env.local` Datei im Root-Verzeichnis:

```env
VITE_API_URL=http://localhost:3001/api
```

Für Produktion:
```env
VITE_API_URL=https://your-backend-domain.com/api
```

## Änderungen

### 1. API Service (`src/services/api.ts`)
- Neuer Service für alle API-Calls
- Automatisches Token-Management
- Error Handling

### 2. Storage Service (`src/services/storage.ts`)
- Verwendet jetzt API Service wenn konfiguriert
- Fallback zu localStorage wenn API nicht verfügbar
- Alle Methoden sind async

### 3. Komponenten
- `App.tsx`: Login/Registrierung über API
- `AdminPanel.tsx`: User-Management über API
- `BookingCalendar.tsx`: Buchungen über API

## Features

- ✅ JWT Authentication
- ✅ Automatisches Token-Management
- ✅ Error Handling mit Fallback
- ✅ Polling für Updates (alle 5 Sekunden)

## Nächste Schritte

Für bessere Performance könnten WebSockets implementiert werden für Real-time Updates statt Polling.

