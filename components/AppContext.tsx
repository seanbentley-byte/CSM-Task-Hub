
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { Task, Customer, User, TaskCompletion, ActionItem, BugReport, FeatureRequest, MeetingNote, AuthenticatedUser, GoogleSheetsConfig } from '../types';
import { 
    tasks as initialTasks, 
    customers as initialCustomers, 
    users as initialUsers, 
    taskCompletions as initialTaskCompletions,
    initialActionItems,
    initialBugReports,
    initialFeatureRequests,
    initialMeetingNotes
} from '../data';
import { sheetsService } from '../sheets';

interface AppContextType {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    users: User[];
    setUsers: React.Dispatch<React.SetStateAction<User[]>>;
    taskCompletions: TaskCompletion[];
    setTaskCompletions: React.Dispatch<React.SetStateAction<TaskCompletion[]>>;
    actionItems: ActionItem[];
    setActionItems: React.Dispatch<React.SetStateAction<ActionItem[]>>;
    bugReports: BugReport[];
    setBugReports: React.Dispatch<React.SetStateAction<BugReport[]>>;
    featureRequests: FeatureRequest[];
    setFeatureRequests: React.Dispatch<React.SetStateAction<FeatureRequest[]>>;
    meetingNotes: MeetingNote[];
    setMeetingNotes: React.Dispatch<React.SetStateAction<MeetingNote[]>>;
    apiKey: string | null;
    setApiKey: React.Dispatch<React.SetStateAction<string | null>>;
    currentUser: AuthenticatedUser | null;
    setCurrentUser: React.Dispatch<React.SetStateAction<AuthenticatedUser | null>>;
    
    // Google Sheets Props
    sheetsConfig: GoogleSheetsConfig | null;
    setSheetsConfig: React.Dispatch<React.SetStateAction<GoogleSheetsConfig | null>>;
    isSheetConnected: boolean;
    syncData: (direction: 'push' | 'pull') => Promise<void>;
    isSyncing: boolean;
    lastSyncTime: number | null;
    hasUnsavedChanges: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// DEFAULT CONFIGURATION - Hardcoded based on user request
const DEFAULT_SHEETS_CONFIG: GoogleSheetsConfig = {
    webAppUrl: 'https://script.google.com/macros/s/AKfycbznQomIHirp_udhUAOLjENRMVHAOipknWS-R2Ig4lLmujEfSloWh9G4qYSTfhBFNbUy/exec'
};

// Helper hook for localStorage persistence
function useStickyState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stickyValue = localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
        console.warn(`Error parsing localStorage key "${key}":`, error);
        return defaultValue;
    }
  });

  useEffect(() => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.warn(`Error saving localStorage key "${key}":`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Core Data - Persisted in LocalStorage to survive reloads
    const [tasks, setTasks] = useStickyState<Task[]>('csm_tasks', initialTasks);
    const [customers, setCustomers] = useStickyState<Customer[]>('csm_customers', initialCustomers);
    const [users, setUsers] = useStickyState<User[]>('csm_users', initialUsers);
    const [taskCompletions, setTaskCompletions] = useStickyState<TaskCompletion[]>('csm_completions', initialTaskCompletions);
    const [actionItems, setActionItems] = useStickyState<ActionItem[]>('csm_actionItems', initialActionItems);
    const [bugReports, setBugReports] = useStickyState<BugReport[]>('csm_bugReports', initialBugReports);
    const [featureRequests, setFeatureRequests] = useStickyState<FeatureRequest[]>('csm_featureRequests', initialFeatureRequests);
    const [meetingNotes, setMeetingNotes] = useStickyState<MeetingNote[]>('csm_meetingNotes', initialMeetingNotes);
    
    // Auth & Config
    const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('gemini-api-key'));
    const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(() => {
        const storedUser = sessionStorage.getItem('currentUser');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // Google Sheets State
    const [sheetsConfig, setSheetsConfig] = useState<GoogleSheetsConfig | null>(() => {
        const stored = localStorage.getItem('sheetsConfig');
        return stored ? JSON.parse(stored) : DEFAULT_SHEETS_CONFIG;
    });
    
    // Initialize connected state based on config existence immediately to prevent race conditions
    const [isSheetConnected, setIsSheetConnected] = useState(() => {
        const stored = localStorage.getItem('sheetsConfig');
        const config = stored ? JSON.parse(stored) : DEFAULT_SHEETS_CONFIG;
        return !!(config && config.webAppUrl);
    });
    
    // Sync State
    const [isSyncing, setIsSyncingState] = useState(false);
    const isSyncingRef = useRef(false); // Ref to access current value inside effects instantly
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const lastChangeTimeRef = useRef<number>(Date.now());
    const isFirstRender = useRef(true);

    const setIsSyncing = (val: boolean) => {
        isSyncingRef.current = val;
        setIsSyncingState(val);
    };

    // Persistence Effects
    useEffect(() => {
        if (apiKey) {
            localStorage.setItem('gemini-api-key', apiKey);
        } else {
            localStorage.removeItem('gemini-api-key');
        }
    }, [apiKey]);

    useEffect(() => {
        if (currentUser) {
            sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            sessionStorage.removeItem('currentUser');
        }
    }, [currentUser]);

    useEffect(() => {
        if (sheetsConfig && sheetsConfig.webAppUrl) {
            localStorage.setItem('sheetsConfig', JSON.stringify(sheetsConfig));
            setIsSheetConnected(true);
        } else {
            localStorage.removeItem('sheetsConfig');
            setIsSheetConnected(false);
        }
    }, [sheetsConfig]);

    // Ensure Hardcoded User Exists
    useEffect(() => {
        const hardcodedManager = initialUsers.find(u => u.id === 'csm_1');
        if (hardcodedManager) {
            setUsers(prev => {
                const exists = prev.some(u => u.id === hardcodedManager.id);
                if (!exists) {
                    console.log("Restoring hardcoded manager...");
                    return [hardcodedManager, ...prev];
                }
                return prev;
            });
        }
    }, []);
    

    // --- Sync Logic ---
    const syncData = useCallback(async (direction: 'push' | 'pull') => {
        if (!sheetsConfig || !isSheetConnected) return;

        setIsSyncing(true);
        try {
            if (direction === 'push') {
                await sheetsService.syncToSheets(sheetsConfig.webAppUrl, {
                    users, customers, tasks, completions: taskCompletions,
                    actionItems, bugs: bugReports, features: featureRequests, notes: meetingNotes
                });
                setHasUnsavedChanges(false);
            } else {
                const data = await sheetsService.loadFromSheets(sheetsConfig.webAppUrl);
                
                // We update state here. The Dirty Checking Effect will run after these updates.
                // Because isSyncingRef.current is true, it will ignore these updates.
                
                if (data.users) {
                     // Ensure hardcoded user remains even after sync
                     const hardcodedManager = initialUsers.find(u => u.id === 'csm_1');
                     if (hardcodedManager && !data.users.find(u => u.id === hardcodedManager.id)) {
                         data.users.unshift(hardcodedManager);
                     }
                     setUsers(data.users);
                }
                if (data.customers) setCustomers(data.customers);
                if (data.tasks) setTasks(data.tasks);
                if (data.taskCompletions) setTaskCompletions(data.taskCompletions);
                if (data.actionItems) setActionItems(data.actionItems);
                if (data.bugReports) setBugReports(data.bugReports);
                if (data.featureRequests) setFeatureRequests(data.featureRequests);
                if (data.meetingNotes) setMeetingNotes(data.meetingNotes);
                
                setHasUnsavedChanges(false);
            }
            setLastSyncTime(Date.now());
        } catch (error) {
            console.error("Sync Error", error);
            // Don't alert on auto-saves to avoid disrupting user
            if (direction === 'pull') {
                 console.log("Sync Failed - this may be due to network issues or Apps Script limits.");
            }
        } finally {
            setIsSyncing(false);
        }
    }, [sheetsConfig, isSheetConnected, users, customers, tasks, taskCompletions, actionItems, bugReports, featureRequests, meetingNotes]);


    // --- Initial Load Effect ---
    // Runs when connection is established and we haven't synced yet (e.g., on app load)
    useEffect(() => {
        if (isSheetConnected && !lastSyncTime) {
            console.log("Initial load from Sheet...");
            syncData('pull');
        }
    }, [isSheetConnected, lastSyncTime, syncData]);


    // --- Dirty Checking Effect ---
    // Watches all data arrays. If they change AND we aren't currently syncing (loading data), mark as dirty.
    useEffect(() => {
        // Prevent marking dirty on initial render
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (!isSheetConnected) return;
        
        // If the change was triggered by a sync operation, ignore it.
        if (isSyncingRef.current) return;

        setHasUnsavedChanges(true);
        lastChangeTimeRef.current = Date.now();

    }, [tasks, customers, users, taskCompletions, actionItems, bugReports, featureRequests, meetingNotes, isSheetConnected]);


    // --- Auto-Save Interval ---
    // Checks every 5 seconds. If dirty and last change was > 10 seconds ago, save.
    useEffect(() => {
        if (!isSheetConnected) return;

        const interval = setInterval(() => {
            const timeSinceLastChange = Date.now() - lastChangeTimeRef.current;
            // Debounce: Wait 10 seconds after last edit before saving
            if (hasUnsavedChanges && !isSyncingRef.current && timeSinceLastChange > 10000) {
                console.log('Auto-saving...');
                syncData('push');
            }
        }, 5000); 

        return () => clearInterval(interval);
    }, [hasUnsavedChanges, isSheetConnected, syncData]);

    // Removed Auto-Load Interval to prevent data overwrites and improve performance.
    // Sync will now only happen on initial load, manual trigger, or push (save).

    const value = {
        tasks, setTasks,
        customers, setCustomers,
        users, setUsers,
        taskCompletions, setTaskCompletions,
        actionItems, setActionItems,
        bugReports, setBugReports,
        featureRequests, setFeatureRequests,
        meetingNotes, setMeetingNotes,
        apiKey, setApiKey,
        currentUser, setCurrentUser,
        sheetsConfig, setSheetsConfig,
        isSheetConnected,
        syncData, isSyncing, lastSyncTime,
        hasUnsavedChanges
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
