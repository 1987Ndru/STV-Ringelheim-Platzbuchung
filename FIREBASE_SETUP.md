# Firebase Setup Anleitung

Diese Anleitung erklärt, wie Sie Firebase für die STV Ringelheim Platzbuchung einrichten.

## Schritt 1: Firebase-Projekt erstellen

1. Gehen Sie zu [Firebase Console](https://console.firebase.google.com/)
2. Klicken Sie auf "Projekt hinzufügen" oder "Add project"
3. Geben Sie einen Projektnamen ein (z.B. "STV-Ringelheim-Platzbuchung")
4. Folgen Sie den Anweisungen zum Erstellen des Projekts

## Schritt 2: Firestore Database einrichten

1. Im Firebase Console, gehen Sie zu "Firestore Database"
2. Klicken Sie auf "Datenbank erstellen" oder "Create database"
3. Wählen Sie "Testmodus" für den Anfang (später können Sie Sicherheitsregeln hinzufügen)
4. Wählen Sie einen Standort (z.B. "europe-west" für Deutschland)
5. Klicken Sie auf "Aktivieren"

## Schritt 3: Web-App registrieren

1. Im Firebase Console, gehen Sie zu "Project Settings" (Zahnrad-Symbol)
2. Scrollen Sie nach unten zu "Your apps"
3. Klicken Sie auf das Web-Symbol (`</>`)
4. Geben Sie einen App-Namen ein (z.B. "STV Ringelheim Web")
5. **WICHTIG**: Aktivieren Sie NICHT "Firebase Hosting" (wir verwenden GitHub Pages)
6. Klicken Sie auf "App registrieren"
7. Kopieren Sie die Firebase-Konfiguration (sie sieht so aus):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

## Schritt 4: Umgebungsvariablen erstellen

1. Erstellen Sie eine Datei `.env.local` im Projekt-Root (falls nicht vorhanden)
2. Fügen Sie die Firebase-Konfiguration hinzu:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

**WICHTIG**: 
- Die Datei `.env.local` ist bereits in `.gitignore` und wird nicht zu GitHub gepusht
- Für GitHub Pages müssen Sie die Umgebungsvariablen in den GitHub Secrets speichern (siehe Schritt 6)

## Schritt 5: Firestore Sicherheitsregeln (Optional, aber empfohlen)

1. Im Firebase Console, gehen Sie zu "Firestore Database" > "Regeln"
2. Ersetzen Sie die Test-Regeln durch:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if true; // Jeder kann lesen (für Login)
      allow create: if true; // Jeder kann sich registrieren
      allow update, delete: if request.auth != null; // Nur authentifizierte Benutzer können aktualisieren/löschen
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      allow read: if true; // Jeder kann Buchungen lesen
      allow create, update, delete: if request.auth != null; // Nur authentifizierte Benutzer können Buchungen erstellen/ändern/löschen
    }
  }
}
```

**Hinweis**: Diese Regeln sind für den Anfang. Für Produktion sollten Sie strengere Regeln implementieren.

## Schritt 6: GitHub Secrets für GitHub Pages (Optional)

Wenn Sie die App auf GitHub Pages deployen möchten:

1. Gehen Sie zu Ihrem GitHub Repository
2. Settings > Secrets and variables > Actions
3. Fügen Sie die folgenden Secrets hinzu:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`

4. Aktualisieren Sie `.github/workflows/deploy.yml` um die Secrets zu verwenden (falls nötig)

## Schritt 7: Initiale Daten migrieren (Optional)

Wenn Sie bereits Daten in localStorage haben:

1. Öffnen Sie die Browser-Konsole
2. Führen Sie folgendes Skript aus (passen Sie die Daten an):

```javascript
// Users migrieren
const users = JSON.parse(localStorage.getItem('stv_users') || '[]');
users.forEach(async (user) => {
  await fetch('https://your-project-default-rtdb.firebaseio.com/users.json', {
    method: 'POST',
    body: JSON.stringify(user)
  });
});

// Bookings migrieren
const bookings = JSON.parse(localStorage.getItem('stv_bookings') || '[]');
bookings.forEach(async (booking) => {
  await fetch('https://your-project-default-rtdb.firebaseio.com/bookings.json', {
    method: 'POST',
    body: JSON.stringify(booking)
  });
});
```

**Besser**: Verwenden Sie die Firebase Console, um Daten manuell zu importieren.

## Schritt 8: Testen

1. Starten Sie die App lokal: `npm run dev`
2. Registrieren Sie einen neuen Benutzer
3. Erstellen Sie eine Testbuchung
4. Öffnen Sie die Firebase Console und prüfen Sie, ob die Daten in Firestore erscheinen
5. Öffnen Sie die App auf einem anderen Gerät/Browser und prüfen Sie, ob die Daten synchronisiert werden

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Gehen Sie zu Firebase Console > Authentication > Settings > Authorized domains
- Fügen Sie Ihre Domain hinzu (z.B. `1987ndru.github.io`)

### "Firebase: Error (permission-denied)"
- Prüfen Sie die Firestore Sicherheitsregeln
- Stellen Sie sicher, dass die Regeln korrekt sind

### Daten werden nicht synchronisiert
- Prüfen Sie die Browser-Konsole auf Fehler
- Stellen Sie sicher, dass die Firebase-Konfiguration korrekt ist
- Prüfen Sie die Firestore-Regeln

## Nächste Schritte

- [ ] Firebase-Projekt erstellen
- [ ] Firestore Database einrichten
- [ ] Web-App registrieren
- [ ] Umgebungsvariablen konfigurieren
- [ ] Sicherheitsregeln einrichten
- [ ] Testen der Synchronisation

## Support

Bei Problemen:
1. Prüfen Sie die Browser-Konsole auf Fehler
2. Prüfen Sie die Firebase Console auf Fehler
3. Lesen Sie die [Firebase Dokumentation](https://firebase.google.com/docs)

