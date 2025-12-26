import React, { useState, useEffect } from 'react';
import { User, UserRole, AccountStatus } from './types';
import { StorageService } from './services/storage';
import { BookingCalendar } from './components/BookingCalendar';
import { AdminPanel } from './components/AdminPanel';
import { Button } from './components/Button';

// Simple Router implementation based on state
type View = 'LOGIN' | 'REGISTER' | 'DASHBOARD' | 'ADMIN';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<View>('LOGIN');
  
  // Auto-logout warning state
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form State
  const [regFirstName, setRegFirstName] = useState('');
  const [regLastName, setRegLastName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regPassConfirm, setRegPassConfirm] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState('');

  useEffect(() => {
    const storedUser = StorageService.getCurrentUser();
    if (storedUser) {
      setCurrentUser(storedUser);
      setCurrentView('DASHBOARD');
    }
  }, []);

  // Auto-Logout nach 10 Minuten Inaktivität
  useEffect(() => {
    if (!currentUser) {
      setShowLogoutWarning(false);
      return;
    }

    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 Minuten in Millisekunden
    const WARNING_TIME = 1 * 60 * 1000; // 1 Minute vor Logout warnen
    let inactivityTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;
    let mousemoveTimeout: NodeJS.Timeout;

    const resetTimer = () => {
      // Alle Timer zurücksetzen
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      clearTimeout(mousemoveTimeout);
      
      // Warnung ausblenden, wenn Aktivität erkannt wird
      setShowLogoutWarning(false);

      // Warnung 1 Minute vor Logout anzeigen (nicht-blockierend)
      warningTimer = setTimeout(() => {
        setShowLogoutWarning(true);
      }, INACTIVITY_TIMEOUT - WARNING_TIME);

      // Logout nach vollständiger Inaktivität
      inactivityTimer = setTimeout(() => {
        // User nach 10 Minuten Inaktivität ausloggen
        StorageService.logout();
        setCurrentUser(null);
        setCurrentView('LOGIN');
        setLoginEmail('');
        setLoginPass('');
        setShowLogoutWarning(false);
      }, INACTIVITY_TIMEOUT);
    };

    // Debounced Funktion für mousemove (Performance-Optimierung)
    const debouncedMousemove = () => {
      clearTimeout(mousemoveTimeout);
      mousemoveTimeout = setTimeout(() => {
        resetTimer();
      }, 1000); // Nur alle 1 Sekunde auslösen, auch wenn Maus bewegt wird
    };

    // Timer beim Login starten
    resetTimer();

    // Event-Listener für User-Aktivität
    // mousemove separat behandeln mit Debouncing
    window.addEventListener('mousemove', debouncedMousemove, true);
    
    // Andere Events normal behandeln
    const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer, true);
    });

    // Cleanup
    return () => {
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      clearTimeout(mousemoveTimeout);
      window.removeEventListener('mousemove', debouncedMousemove, true);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetTimer, true);
      });
    };
  }, [currentUser]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const user = StorageService.login(loginEmail, loginPass);
    if (user) {
      if (user.status !== AccountStatus.APPROVED) {
        setLoginError('Ihr Konto wurde noch nicht vom Administrator freigeschaltet.');
        StorageService.logout();
        return;
      }
      setCurrentUser(user);
      setCurrentView('DASHBOARD');
    } else {
      setLoginError('Ungültige E-Mail oder Passwort.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess('');

    // Validierung: Alle Felder müssen ausgefüllt sein
    if (!regFirstName.trim()) {
      setRegError('Bitte geben Sie Ihren Vornamen ein.');
      return;
    }

    if (!regLastName.trim()) {
      setRegError('Bitte geben Sie Ihren Nachnamen ein.');
      return;
    }

    if (!regEmail.trim()) {
      setRegError('Bitte geben Sie Ihre E-Mail-Adresse ein.');
      return;
    }

    if (!regPass) {
      setRegError('Bitte geben Sie ein Passwort ein.');
      return;
    }

    if (!regPassConfirm) {
      setRegError('Bitte bestätigen Sie Ihr Passwort.');
      return;
    }

    // Validierung: Passwörter müssen übereinstimmen
    if (regPass !== regPassConfirm) {
      setRegError('Die Passwörter stimmen nicht überein. Bitte versuchen Sie es erneut.');
      return;
    }

    // Validierung: Passwort sollte mindestens 6 Zeichen lang sein
    if (regPass.length < 6) {
      setRegError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    const existingUser = StorageService.findUserByEmail(regEmail);
    if (existingUser) {
      setRegError('Diese E-Mail wird bereits verwendet.');
      return;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email: regEmail.trim(),
      fullName: `${regFirstName.trim()} ${regLastName.trim()}`,
      password: regPass,
      role: UserRole.MEMBER,
      status: AccountStatus.PENDING
    };

    StorageService.saveUser(newUser);
    setRegSuccess('Registrierung erfolgreich! Bitte warten Sie auf die Freischaltung durch den Admin.');
    setRegFirstName('');
    setRegLastName('');
    setRegEmail('');
    setRegPass('');
    setRegPassConfirm('');
  };

  const handleLogout = () => {
    StorageService.logout();
    setCurrentUser(null);
    setCurrentView('LOGIN');
    setLoginEmail('');
    setLoginPass('');
  };

  // --- Views ---

  const renderLogin = () => (
    <div className="min-h-screen flex bg-white">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full lg:w-1/2 bg-gray-50">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="text-center lg:text-left mb-6">
             <h2 className="text-2xl sm:text-3xl font-extrabold text-tennis-900 tracking-tight">STV Ringelheim</h2>
             <p className="mt-2 text-sm sm:text-base text-tennis-600 font-medium">Online Platzbuchung</p>
          </div>

          <div className="mt-8">
            <h2 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold text-gray-900">Anmelden</h2>
            <form className="space-y-6" onSubmit={handleLogin}>
              <div>
                <label className="block text-sm font-medium text-gray-700">E-Mail Adresse</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    className="bg-white appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-tennis-500 focus:border-tennis-500 sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Passwort</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={loginPass}
                    onChange={(e) => setLoginPass(e.target.value)}
                    className="bg-white appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-tennis-500 focus:border-tennis-500 sm:text-sm"
                  />
                </div>
              </div>

              {loginError && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{loginError}</div>
              )}

              <div>
                <Button type="submit" className="w-full">Einloggen</Button>
              </div>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-50 text-gray-500">Noch kein Mitglied?</span>
                </div>
              </div>

              <div className="mt-6">
                <Button variant="secondary" onClick={() => setCurrentView('REGISTER')} className="w-full bg-white">
                  Jetzt registrieren
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block relative w-0 flex-1">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.unsplash.com/photo-1558365849-6ebd8b0454b2?q=80&w=2070&auto=format&fit=crop"
          alt="Clay Tennis Court"
        />
        <div className="absolute inset-0 bg-orange-900 mix-blend-multiply opacity-10"></div>
      </div>
    </div>
  );

  const renderRegister = () => (
    <div className="min-h-screen bg-tennis-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-tennis-900 px-4">Mitglied werden</h2>
        <p className="mt-2 text-center text-sm text-gray-600 px-4">
          Registrieren Sie sich, um Plätze zu buchen.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleRegister}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vorname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regFirstName}
                  onChange={(e) => setRegFirstName(e.target.value)}
                  className="bg-white mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-tennis-500 focus:border-tennis-500 sm:text-sm"
                  placeholder="Max"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Nachname <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={regLastName}
                  onChange={(e) => setRegLastName(e.target.value)}
                  className="bg-white mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-tennis-500 focus:border-tennis-500 sm:text-sm"
                  placeholder="Mustermann"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                E-Mail Adresse <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="bg-white mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-tennis-500 focus:border-tennis-500 sm:text-sm"
                placeholder="max.mustermann@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Passwort <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                className="bg-white mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-tennis-500 focus:border-tennis-500 sm:text-sm"
                placeholder="Mindestens 6 Zeichen"
                minLength={6}
              />
              <p className="mt-1 text-xs text-gray-500">Mindestens 6 Zeichen</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Passwort bestätigen <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                required
                value={regPassConfirm}
                onChange={(e) => setRegPassConfirm(e.target.value)}
                className={`bg-white mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-tennis-500 focus:border-tennis-500 sm:text-sm ${
                  regPassConfirm && regPass !== regPassConfirm ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Passwort wiederholen"
              />
              {regPassConfirm && regPass !== regPassConfirm && (
                <p className="mt-1 text-xs text-red-600">Die Passwörter stimmen nicht überein.</p>
              )}
              {regPassConfirm && regPass === regPassConfirm && regPass.length >= 6 && (
                <p className="mt-1 text-xs text-green-600">✓ Passwörter stimmen überein.</p>
              )}
            </div>

            {regError && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
                {regError}
              </div>
            )}
            {regSuccess && (
              <div className="text-green-600 text-sm bg-green-50 p-3 rounded border border-green-200">
                {regSuccess}
              </div>
            )}

            <div className="flex flex-col space-y-3">
              <Button type="submit" className="w-full">Registrieren</Button>
              <Button type="button" variant="ghost" onClick={() => setCurrentView('LOGIN')} className="w-full">
                Zurück zum Login
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Auto-Logout Warnung */}
      {showLogoutWarning && (
        <div className="bg-yellow-500 border-b-4 border-yellow-600 text-white px-3 sm:px-4 py-2 sm:py-3 shadow-lg relative z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center flex-1 min-w-0">
              <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-xs sm:text-sm font-semibold leading-tight">Sie werden in 1 Minute automatisch ausgeloggt, wenn keine Aktivität erkannt wird.</span>
            </div>
            <button
              onClick={() => setShowLogoutWarning(false)}
              className="ml-2 sm:ml-4 text-white hover:text-yellow-200 transition-colors flex-shrink-0 p-1 touch-manipulation"
              aria-label="Warnung schließen"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <nav className="bg-tennis-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          {/* Mobile Layout: 2 Zeilen */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center min-h-[8rem] sm:min-h-0 sm:h-16 gap-2 sm:gap-0 py-2 sm:py-0">
            {/* Zeile 1 Mobile: Name zentriert oben */}
            <div className="flex justify-center sm:justify-start sm:items-center sm:flex-1 sm:min-w-0 order-1 sm:order-none">
              <span className="text-white text-base sm:text-xl font-bold tracking-wider">STV Ringelheim</span>
            </div>
            
            {/* Zeile 2 Mobile: Links - Navigation, Rechts - Abmelden */}
            <div className="flex justify-between items-center order-2 sm:order-none sm:flex sm:items-center sm:space-x-4">
              {/* Links: Navigation Buttons */}
              <div className="flex items-baseline space-x-1 sm:space-x-4 sm:ml-4 lg:ml-10">
                <button
                  onClick={() => setCurrentView('DASHBOARD')}
                  className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap ${
                    currentView === 'DASHBOARD' ? 'bg-tennis-800 text-white' : 'text-tennis-100 hover:bg-tennis-600'
                  }`}
                >
                  Platzbuchung
                </button>
                {currentUser?.role === 'ADMIN' && (
                  <button
                    onClick={() => setCurrentView('ADMIN')}
                    className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap ${
                      currentView === 'ADMIN' ? 'bg-tennis-800 text-white' : 'text-tennis-100 hover:bg-tennis-600'
                    }`}
                  >
                    Verwaltung
                  </button>
                )}
              </div>
              
              {/* Rechts: Abmelden Button */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <span className="text-tennis-100 text-xs sm:text-sm hidden sm:inline truncate max-w-[150px] lg:max-w-none">Hallo, {currentUser?.fullName}</span>
                <Button variant="secondary" onClick={handleLogout} className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 bg-white whitespace-nowrap">Abmelden</Button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'ADMIN' ? (
          <AdminPanel currentUser={currentUser} />
        ) : (
          <div className="h-full">
             <div className="md:flex md:items-center md:justify-between mb-4 sm:mb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold leading-tight sm:leading-7 text-gray-900 truncate">
                    Platzbelegung
                  </h2>
                </div>
              </div>
             {currentUser && <BookingCalendar currentUser={currentUser} />}
          </div>
        )}
      </main>
    </div>
  );

  if (!currentUser) {
    return currentView === 'REGISTER' ? renderRegister() : renderLogin();
  }

  return renderDashboard();
};

export default App;