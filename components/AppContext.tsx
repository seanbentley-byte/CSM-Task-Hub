import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { Task, Customer, CSM, TaskCompletion, ActionItem, BugReport, FeatureRequest, MeetingNote } from '../types';
import { 
    tasks as initialTasks, 
    customers as initialCustomers, 
    csms as initialCsms, 
    taskCompletions as initialTaskCompletions,
    initialActionItems,
    initialBugReports,
    initialFeatureRequests,
    initialMeetingNotes
} from '../data';

interface AppContextType {
    tasks: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    customers: Customer[];
    setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    csms: CSM[];
    setCsms: React.Dispatch<React.SetStateAction<CSM[]>>;
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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // This setup uses React state and will reset on page refresh.
    // It's a placeholder for a proper backend connection where data would be fetched and persisted.
    const [tasks, setTasks] = useState<Task[]>(initialTasks);
    const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
    const [csms, setCsms] = useState<CSM[]>(initialCsms);
    const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>(initialTaskCompletions);
    const [actionItems, setActionItems] = useState<ActionItem[]>(initialActionItems);
    const [bugReports, setBugReports] = useState<BugReport[]>(initialBugReports);
    const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>(initialFeatureRequests);
    const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>(initialMeetingNotes);
    const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('gemini-api-key'));
    
    useEffect(() => {
        if (apiKey) {
            localStorage.setItem('gemini-api-key', apiKey);
        } else {
            localStorage.removeItem('gemini-api-key');
        }
    }, [apiKey]);


    const value = {
        tasks, setTasks,
        customers, setCustomers,
        csms, setCsms,
        taskCompletions, setTaskCompletions,
        actionItems, setActionItems,
        bugReports, setBugReports,
        featureRequests, setFeatureRequests,
        meetingNotes, setMeetingNotes,
        apiKey, setApiKey,
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
