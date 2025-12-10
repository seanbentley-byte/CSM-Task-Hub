
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

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Core Data
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>(initialTaskCompletions);
    const [actionItems, setActionItems] = useState<ActionItem[]>(initialActionItems);
    const [bugReports, setBugReports] = useState<BugReport[]>(initialBugReports);
    const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>(initialFeatureRequests);
    const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>(initialMeetingNotes);
    
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
    const [isSheetConnected, setIsSheetConnected] = useState(false);
    
    // Sync State
    const [isSyncing, setIsSyncingState] = useState(false);
    const isSyncingRef = useRef(false); // Ref to access current value inside effects instantly
    const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const lastChangeTimeRef = useRef<number>(Date.now());

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

    // --- Dirty Checking Effect ---
    // Watches all data arrays. If they change AND we aren't currently syncing (loading data), mark as dirty.
    useEffect(() => {
        if (!isSheetConnected) return;
        
        // If the change was triggered by a sync operation, ignore it.
        if (isSyncingRef.current) return;

        setHasUnsavedChanges(true);
        lastChangeTimeRef.current = Date.now();

    }, [tasks, customers, users, taskCompletions, actionItems, bugReports, featureRequests, meetingNotes, isSheetConnected]);


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
                // The updates below will trigger the Dirty Checking Effect.
                // However, isSyncingRef.current is true, so it will correctly ignore them.
                if (data.users && data.users.length > 0) setUsers(data.users);
                if (data.customers && data.customers.length > 0) setCustomers(data.customers);
                if (data.tasks && data.tasks.length > 0) setTasks(data.tasks);
                if (data.taskCompletions && data.taskCompletions.length > 0) setTaskCompletions(data.taskCompletions);
                if (data.actionItems && data.actionItems.length > 0) setActionItems(data.actionItems);
                if (data.bugReports && data.bugReports.length > 0) setBugReports(data.bugReports);
                if (data.featureRequests && data.featureRequests.length > 0) setFeatureRequests(data.featureRequests);
                if (data.meetingNotes && data.meetingNotes.length > 0) setMeetingNotes(data.meetingNotes);
                setHasUnsavedChanges(false);
            }
            setLastSyncTime(Date.now());
        } catch (error) {
            console.error("Sync Error", error);
            // Don't alert on auto-saves to avoid disrupting user
            if (direction === 'pull') {
                 alert("Sync Failed. Check console.");
            }
        } finally {
            setIsSyncing(false);
        }
    }, [sheetsConfig, isSheetConnected, users, customers, tasks, taskCompletions, actionItems, bugReports, featureRequests, meetingNotes]);

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

    // --- Auto-Load Interval ---
    // Checks every 5 minutes. Only pulls if NO unsaved changes locally.
    useEffect(() => {
        if (!isSheetConnected) return;
        
        const interval = setInterval(() => {
             if (!hasUnsavedChanges && !isSyncingRef.current) {
                 console.log('Auto-pulling...');
                 syncData('pull');
             }
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [hasUnsavedChanges, isSheetConnected, syncData]);

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
