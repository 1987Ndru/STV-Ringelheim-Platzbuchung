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
  
  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register Form State
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
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
    if (!currentUser) return;

    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 Minuten in Millisekunden
    let inactivityTimer: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        // User nach 10 Minuten Inaktivität ausloggen
        StorageService.logout();
        setCurrentUser(null);
        setCurrentView('LOGIN');
        setLoginEmail('');
        setLoginPass('');
      }, INACTIVITY_TIMEOUT);
    };

    // Timer beim Login starten
    resetTimer();

    // Event-Listener für User-Aktivität
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    activityEvents.forEach(event => {
      window.addEventListener(event, resetTimer, true);
    });

    // Cleanup
    return () => {
      clearTimeout(inactivityTimer);
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

    if (StorageService.findUserByEmail(regEmail)) {
      setRegError('Diese E-Mail wird bereits verwendet.');
      return;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      email: regEmail,
      fullName: regName,
      password: regPass,
      role: UserRole.MEMBER,
      status: AccountStatus.PENDING
    };

    StorageService.saveUser(newUser);
    setRegSuccess('Registrierung erfolgreich! Bitte warten Sie auf die Freischaltung durch den Admin.');
    setRegName('');
    setRegEmail('');
    setRegPass('');
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
             <h2 className="text-3xl font-extrabold text-tennis-900 tracking-tight">STV Ringelheim</h2>
             <p className="mt-2 text-tennis-600 font-medium">Online Platzbuchung</p>
          </div>

          <div className="mt-8">
            <h2 className="mb-6 text-2xl font-bold text-gray-900">Anmelden</h2>
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
        <h2 className="text-center text-3xl font-extrabold text-tennis-900">Mitglied werden</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Registrieren Sie sich, um Plätze zu buchen.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleRegister}>
            <div>
              <label className="block text-sm font-medium text-gray-700">Vollständiger Name</label>
              <input
                type="text"
                required
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="bg-white mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-tennis-500 focus:border-tennis-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">E-Mail Adresse</label>
              <input
                type="email"
                required
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="bg-white mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-tennis-500 focus:border-tennis-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Passwort</label>
              <input
                type="password"
                required
                value={regPass}
                onChange={(e) => setRegPass(e.target.value)}
                className="bg-white mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-tennis-500 focus:border-tennis-500 sm:text-sm"
              />
            </div>

            {regError && <div className="text-red-600 text-sm">{regError}</div>}
            {regSuccess && <div className="text-green-600 text-sm bg-green-50 p-2 rounded">{regSuccess}</div>}

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
      {/* Navigation */}
      <nav className="bg-tennis-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-white text-xl font-bold tracking-wider">STV Ringelheim</span>
              <div className="ml-10 flex items-baseline space-x-4">
                <button
                  onClick={() => setCurrentView('DASHBOARD')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'DASHBOARD' ? 'bg-tennis-800 text-white' : 'text-tennis-100 hover:bg-tennis-600'
                  }`}
                >
                  Platzbuchung
                </button>
                {currentUser?.role === 'ADMIN' && (
                  <button
                    onClick={() => setCurrentView('ADMIN')}
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      currentView === 'ADMIN' ? 'bg-tennis-800 text-white' : 'text-tennis-100 hover:bg-tennis-600'
                    }`}
                  >
                    Verwaltung
                    {/* Badge could go here */}
                  </button>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-tennis-100 text-sm hidden sm:inline">Hallo, {currentUser?.fullName}</span>
              <Button variant="secondary" onClick={handleLogout} className="text-xs px-2 py-1 bg-white">Abmelden</Button>
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
             <div className="md:flex md:items-center md:justify-between mb-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
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