
import React, { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './components/AppContext';
import ManagerView from './components/ManagerView';
import CSMView from './components/CSMView';
import SettingsView from './components/SettingsView';
import { CogIcon, Button, Modal, Card, CloudIcon, RefreshIcon, CheckCircleIcon } from './components/ui';
import { AuthenticatedUser } from './types';

const ApiKeyModal: React.FC<{ isOpen: boolean; onClose: () => void; }> = ({ isOpen, onClose }) => {
    const { setApiKey } = useAppContext();
    const [key, setKey] = useState('');

    const handleSave = () => {
        if (key.trim()) {
            setApiKey(key.trim());
            onClose();
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Enter Your Google AI API Key">
            <div className="space-y-4">
                <p className="text-sm text-slate-600">
                    To use the AI features, please provide your Google AI API key. You can get a key from Google AI Studio. 
                    Your key is stored locally in your browser and is not shared.
                </p>
                <div>
                    <label htmlFor="api-key-input" className="sr-only">API Key</label>
                    <input
                        id="api-key-input"
                        type="password"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        placeholder="Enter your API key here"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSave}>Save Key</Button>
                </div>
            </div>
        </Modal>
    )
};

const Login: React.FC = () => {
    const { setCurrentUser, users } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
        
        if (foundUser) {
            const { password, ...userToStore } = foundUser;
            setCurrentUser(userToStore);
            return;
        }

        setError('Invalid email or password.');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full">
                <h1 className="text-3xl font-bold text-indigo-600 text-center mb-6">CSM Task Hub</h1>
                <Card>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                         <div>
                            <label htmlFor="password-login" className="block text-sm font-medium text-slate-700">Password</label>
                            <input
                                id="password-login"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm">{error}</p>}
                        <Button type="submit" className="w-full">Login</Button>
                        <div className="text-sm text-slate-500 bg-slate-100 p-3 rounded-md">
                            <p><strong>Example Logins:</strong></p>
                            <ul className="list-disc list-inside">
                                <li>manager@example.com / password</li>
                                <li>alice@example.com / password123</li>
                            </ul>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
};

const SyncStatus: React.FC = () => {
    const { isSyncing, hasUnsavedChanges, syncData, isSheetConnected } = useAppContext();

    if (!isSheetConnected) return null;

    if (isSyncing) {
         return (
            <div className="flex items-center text-sm text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
                <RefreshIcon className="w-4 h-4 mr-2 animate-spin" />
                <span className="font-medium">Syncing...</span>
            </div>
        );
    }

    if (hasUnsavedChanges) {
         return (
            <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 hidden sm:inline">Unsaved changes</span>
                <button 
                    onClick={() => syncData('push')}
                    className="flex items-center text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors"
                    title="Click to save immediately"
                >
                    <CloudIcon className="w-4 h-4 mr-2" />
                    <span>Save Now</span>
                </button>
            </div>
        );
    }

    return (
        <button 
            onClick={() => syncData('pull')}
            className="flex items-center text-sm text-green-600 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-full transition-colors cursor-pointer"
            title="Click to check for updates from Google Sheets"
        >
            <CheckCircleIcon className="w-4 h-4 mr-2" />
            <span className="font-medium">All Saved</span>
        </button>
    );
};

const Header: React.FC<{
  onLogout: () => void;
  currentUser: AuthenticatedUser;
  currentRole?: 'manager' | 'csm';
  setCurrentRole?: (role: 'manager' | 'csm') => void;
  currentCsmId?: string;
  setCurrentCsmId?: (id: string) => void;
  currentView: 'dashboard' | 'settings';
  setCurrentView: (view: 'dashboard' | 'settings') => void;
}> = ({ onLogout, currentUser, currentRole, setCurrentRole, currentCsmId, setCurrentCsmId, currentView, setCurrentView }) => {
    const { users } = useAppContext();
    // Allow any user to be selected in the dropdown
    const assignableUsers = users;

    return (
        <header className="bg-white shadow-sm mb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                     <h1 className="text-2xl font-bold text-indigo-600">CSM Task Hub</h1>
                     <SyncStatus />
                </div>
               
                <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600 hidden sm:block">Welcome, <span className="font-semibold">{currentUser.name}</span></span>
                    {currentUser.role === 'manager' && currentView === 'dashboard' && setCurrentRole && (
                        <>
                            <div className="flex items-center rounded-md border border-slate-300 p-0.5 bg-slate-100">
                                <button 
                                    onClick={() => setCurrentRole('manager')}
                                    className={`px-3 py-1 text-sm font-semibold rounded ${currentRole === 'manager' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600'}`}
                                >
                                    Manager
                                </button>
                                <button
                                    onClick={() => setCurrentRole('csm')}
                                    className={`px-3 py-1 text-sm font-semibold rounded ${currentRole === 'csm' ? 'bg-white shadow-sm text-indigo-700' : 'text-slate-600'}`}
                                >
                                    User View
                                </button>
                            </div>
                            {currentRole === 'csm' && setCurrentCsmId && (
                                <select 
                                    value={currentCsmId} 
                                    onChange={e => setCurrentCsmId(e.target.value)}
                                    className="w-48 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    {assignableUsers.map(user => (
                                        <option key={user.id} value={user.id}>
                                            Viewing as {user.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </>
                    )}
                    {currentUser.role === 'manager' && (
                         <button 
                            onClick={() => setCurrentView(currentView === 'dashboard' ? 'settings' : 'dashboard')}
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-600 flex items-center gap-2"
                            aria-label={currentView === 'dashboard' ? "Go to settings" : "Back to dashboard"}
                        >
                            {currentView === 'dashboard' ? <CogIcon /> : <span className="font-semibold text-sm">&larr; Back to Dashboard</span>}
                        </button>
                    )}
                     <Button variant="secondary" onClick={onLogout}>Logout</Button>
                </div>
            </div>
        </header>
    )
}


const AppContent: React.FC = () => {
    const { currentUser, setCurrentUser, users, apiKey, isSheetConnected } = useAppContext();

    // State for manager view
    const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');
    const [currentRole, setCurrentRole] = useState<'manager' | 'csm'>('manager');

    // Default to the current user's own agenda if they are in the list, otherwise the first user
    const [currentCsmId, setCurrentCsmId] = useState<string>('');
    
    useEffect(() => {
        if (!currentUser) return;
        
        // When switching to CSM role (User View), try to default to the current user if possible
        if (currentRole === 'csm') {
            if (!currentCsmId) {
                // If not set yet, default to self
                 setCurrentCsmId(currentUser.id);
            } else if (!users.find(u => u.id === currentCsmId)) {
                // If current selection is invalid (e.g. user deleted), reset to self or first user
                setCurrentCsmId(currentUser.id);
            }
        }
    }, [currentRole, currentUser, users, currentCsmId]);

    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    
    useEffect(() => {
        if (currentUser && !apiKey) {
            setIsApiKeyModalOpen(true);
        }
    }, [currentUser, apiKey]);


    const handleLogout = () => {
        setCurrentUser(null);
    };

    if (!currentUser) {
        return <Login />;
    }

    // Standard User (CSM) specific view
    if (currentUser.role === 'csm') {
        return (
            <>
                <header className="bg-white shadow-sm mb-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                        <div className="flex items-center gap-4">
                             <h1 className="text-2xl font-bold text-indigo-600">CSM Task Hub</h1>
                             <SyncStatus />
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-600">Welcome, <span className="font-semibold">{currentUser.name}</span></span>
                            <Button variant="secondary" onClick={handleLogout}>Logout</Button>
                        </div>
                    </div>
                </header>
                <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                    {users.length > 0 ? <CSMView csmId={currentUser.id} /> : <p>Loading...</p>}
                </main>
                <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} />
            </>
        );
    }

    // Manager view
    return (
        <>
            <Header 
                currentUser={currentUser}
                onLogout={handleLogout}
                currentRole={currentRole} 
                setCurrentRole={setCurrentRole}
                currentCsmId={currentCsmId}
                setCurrentCsmId={setCurrentCsmId}
                currentView={currentView}
                setCurrentView={setCurrentView}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {currentView === 'dashboard' ? (
                     <>
                        {currentRole === 'manager' && <ManagerView />}
                        {currentRole === 'csm' && users.length > 0 && currentCsmId && <CSMView csmId={currentCsmId} />}
                     </>
                ) : (
                    <SettingsView />
                )}
            </main>
            <ApiKeyModal isOpen={isApiKeyModalOpen} onClose={() => setIsApiKeyModalOpen(false)} />
        </>
    );
};


const App: React.FC = () => {
  return (
    <AppProvider>
        <AppContent />
    </AppProvider>
  );
}

export default App;
