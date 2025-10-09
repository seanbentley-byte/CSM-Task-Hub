
import React, { useState } from 'react';
import { AppProvider, useAppContext } from './components/AppContext';
import ManagerView from './components/ManagerView';
import CSMView from './components/CSMView';

type Role = 'manager' | 'csm';

const Header: React.FC<{
  currentRole: Role;
  setCurrentRole: (role: Role) => void;
  currentCsmId: string;
  setCurrentCsmId: (id: string) => void;
}> = ({ currentRole, setCurrentRole, currentCsmId, setCurrentCsmId }) => {
    const { csms } = useAppContext();
    return (
        <header className="bg-white shadow-sm mb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-indigo-600">CSM Task Hub</h1>
                <div className="flex items-center gap-4">
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
                </div>
            </div>
        </header>
    )
}


const AppContent: React.FC = () => {
    const [currentRole, setCurrentRole] = useState<Role>('manager');
    const { csms } = useAppContext();
    const [currentCsmId, setCurrentCsmId] = useState<string>(csms[0]?.id || '');

    return (
        <>
            <Header 
                currentRole={currentRole} 
                setCurrentRole={setCurrentRole}
                currentCsmId={currentCsmId}
                setCurrentCsmId={setCurrentCsmId}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                {currentRole === 'manager' && <ManagerView />}
                {currentRole === 'csm' && <CSMView csmId={currentCsmId} />}
            </main>
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
