
import React, { createContext, useContext, useState, ReactNode, useEffect, useRef, useCallback } from 'react';
import { Task, Customer, User, TaskCompletion, Objective, ActionItem, BugReport, FeatureRequest, MeetingNote, AuthenticatedUser, GoogleSheetsConfig } from '../types';
import { 
    tasks as initialTasks, 
    customers as initialCustomers, 
    users as initialUsers, 
    taskCompletions as initialTaskCompletions,
    initialObjectives,
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
    objectives: Objective[];
    setObjectives: React.Dispatch<React.SetStateAction<Objective[]>>;
    actionItems: ActionItem[];
    setActionItems: React.Dispatch<React.SetStateAction<ActionItem[]>>;
    bugReports: BugReport[];
    setBugReports: React.Dispatch<React.SetStateAction<BugReport[]>>;
    featureRequests: FeatureRequest[];
    setFeatureRequests: React.Dispatch<React.SetStateAction<FeatureRequest[]>>;
    meetingNotes: MeetingNote[];
    setMeetingNotes: React.Dispatch<React.SetStateAction<MeetingNote[]>>;
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
    const [objectives, setObjectives] = useStickyState<Objective[]>('csm_objectives', initialObjectives);
    const [actionItems, setActionItems] = useStickyState<ActionItem[]>('csm_actionItems', initialActionItems);
    const [bugReports, setBugReports] = useStickyState<BugReport[]>('csm_bugReports', initialBugReports);
    const [featureRequests, setFeatureRequests] = useStickyState<FeatureRequest[]>('csm_featureRequests', initialFeatureRequests);
    const [meetingNotes, setMeetingNotes] = useStickyState<MeetingNote[]>('csm_meetingNotes', initialMeetingNotes);
    
    // Auth & Config
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
                    objectives, actionItems, bugs: bugReports, features: featureRequests, notes: meetingNotes
                });
                setHasUnsavedChanges(false);
            } else {
                const data = await sheetsService.loadFromSheets(sheetsConfig.webAppUrl);
                
                if (data.users) {
                     const hardcodedManager = initialUsers.find(u => u.id === 'csm_1');
                     if (hardcodedManager && !data.users.find(u => u.id === hardcodedManager.id)) {
                         data.users.unshift(hardcodedManager);
                     }
                     setUsers(data.users);
                }
                if (data.customers) setCustomers(data.customers);
                if (data.tasks) setTasks(data.tasks);
                if (data.taskCompletions) setTaskCompletions(data.taskCompletions);
                if (data.objectives) setObjectives(data.objectives);
                if (data.actionItems) setActionItems(data.actionItems);
                if (data.bugReports) setBugReports(data.bugReports);
                if (data.featureRequests) setFeatureRequests(data.featureRequests);
                if (data.meetingNotes) setMeetingNotes(data.meetingNotes);
                
                setHasUnsavedChanges(false);
            }
            setLastSyncTime(Date.now());
        } catch (error) {
            console.error("Sync Error", error);
            if (direction === 'pull') {
                 console.log("Sync Failed - this may be due to network issues or Apps Script limits.");
            }
        } finally {
            setIsSyncing(false);
        }
    }, [sheetsConfig, isSheetConnected, users, customers, tasks, taskCompletions, objectives, actionItems, bugReports, featureRequests, meetingNotes]);


    // --- Initial Load Effect ---
    useEffect(() => {
        if (isSheetConnected && !lastSyncTime) {
            syncData('pull');
        }
    }, [isSheetConnected, lastSyncTime, syncData]);


    // --- Dirty Checking Effect ---
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (!isSheetConnected) return;
        if (isSyncingRef.current) return;

        setHasUnsavedChanges(true);
        lastChangeTimeRef.current = Date.now();

    }, [tasks, customers, users, taskCompletions, objectives, actionItems, bugReports, featureRequests, meetingNotes, isSheetConnected]);


    // --- Auto-Save Interval ---
    useEffect(() => {
        if (!isSheetConnected) return;

        const interval = setInterval(() => {
            const timeSinceLastChange = Date.now() - lastChangeTimeRef.current;
            if (hasUnsavedChanges && !isSyncingRef.current && timeSinceLastChange > 10000) {
                syncData('push');
            }
        }, 5000); 

        return () => clearInterval(interval);
    }, [hasUnsavedChanges, isSheetConnected, syncData]);

    const value = {
        tasks, setTasks,
        customers, setCustomers,
        users, setUsers,
        taskCompletions, setTaskCompletions,
        objectives, setObjectives,
        actionItems, setActionItems,
        bugReports, setBugReports,
        featureRequests, setFeatureRequests,
        meetingNotes, setMeetingNotes,
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
