import React, { useState, useEffect } from 'react';
import { AppProvider, useAppContext } from './components/AppContext';
import ManagerView from './components/ManagerView';
import CSMView from './components/CSMView';
import SettingsView from './components/SettingsView';
import { CogIcon, Button, Modal } from './components/ui';

type View = 'dashboard' | 'settings';
type Role = 'manager' | 'csm';

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

const Header: React.FC<{
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  currentCsmId: string;
  setCurrentCsmId: (id: string) => void;
  currentView: View;
  setCurrentView: (view: View) => void;
}> = ({ currentRole, setCurrentRole, currentCsmId, setCurrentCsmId, currentView, setCurrentView }) => {
    const { csms } = useAppContext();
    return (
        <header className="bg-white shadow-sm mb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-indigo-600">CSM Task Hub</h1>
                <div className="flex items-center gap-4">
                    {currentView === 'dashboard' && (
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
                                    CSM
                                </button>
                            </div>
                            {currentRole === 'csm' && (
                                <select 
                                    value={currentCsmId} 
                                    onChange={e => setCurrentCsmId(e.target.value)}
                                    className="w-48 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                >
                                    {csms.map(csm => (
                                        <option key={csm.id} value={csm.id}>
                                            Viewing as {csm.name}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </>
                    )}
                    <button 
                        onClick={() => setCurrentView(currentView === 'dashboard' ? 'settings' : 'dashboard')}
                        className="p-2 rounded-full hover:bg-slate-100 text-slate-600 flex items-center gap-2"
                        aria-label={currentView === 'dashboard' ? "Go to settings" : "Back to dashboard"}
                    >
                        {currentView === 'dashboard' ? <CogIcon /> : <span className="font-semibold text-sm">&larr; Back to Dashboard</span>}
                    </button>
                </div>
            </div>
        </header>
    )
}


const AppContent: React.FC = () => {
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [currentRole, setCurrentRole] = useState<Role>('manager');
    const { csms, apiKey } = useAppContext();
    const [currentCsmId, setCurrentCsmId] = useState<string>(csms[0]?.id || '');
    const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
    
    useEffect(() => {
        if (!apiKey) {
            setIsApiKeyModalOpen(true);
        }
    }, [apiKey]);

    useEffect(() => {
        // If the currently selected CSM gets deleted, default to the first available CSM.
        if (csms.length > 0 && !csms.find(c => c.id === currentCsmId)) {
            setCurrentCsmId(csms[0].id);
        } else if (csms.length === 0) {
            setCurrentCsmId('');
        }
    }, [csms, currentCsmId]);

    return (
        <>
            <Header 
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
                        {currentRole === 'csm' && csms.length > 0 && <CSMView csmId={currentCsmId} />}
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
