import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import {
  Task, Customer, User, TaskCompletion, ActionItem,
  BugReport, FeatureRequest, MeetingNote, AuthenticatedUser
} from '../types';
import { db } from "../firebaseConfig";
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc
} from "firebase/firestore";



interface AppContextType {
  // State (now driven by Firestore listeners)
  tasks: Task[];                         setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  customers: Customer[];                 setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  users: User[];                         setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  taskCompletions: TaskCompletion[];     setTaskCompletions: React.Dispatch<React.SetStateAction<TaskCompletion[]>>;
  actionItems: ActionItem[];             setActionItems: React.Dispatch<React.SetStateAction<ActionItem[]>>;
  bugReports: BugReport[];               setBugReports: React.Dispatch<React.SetStateAction<BugReport[]>>;
  featureRequests: FeatureRequest[];     setFeatureRequests: React.Dispatch<React.SetStateAction<FeatureRequest[]>>;
  meetingNotes: MeetingNote[];           setMeetingNotes: React.Dispatch<React.SetStateAction<MeetingNote[]>>;

  // API key + session user (unchanged)
  apiKey: string | null;                 setApiKey: React.Dispatch<React.SetStateAction<string | null>>;
  currentUser: AuthenticatedUser | null; setCurrentUser: React.Dispatch<React.SetStateAction<AuthenticatedUser | null>>;

  // CRUD helpers (call these from the views instead of mutating arrays)
  addUser(name: string): Promise<void>;
  updateUser(id: string, patch: Partial<User>): Promise<void>;
  removeUser(id: string): Promise<void>;

  addCustomer(data: { name: string; assignedCsmId?: string }): Promise<void>;
  updateCustomer(id: string, patch: Partial<Customer>): Promise<void>;
  removeCustomer(id: string): Promise<void>;

  addTask(task: Omit<Task, 'id' | 'createdAt' | 'isArchived'>): Promise<void>;
  updateTask(id: string, patch: Partial<Task>): Promise<void>;
  toggleArchiveTask(id: string, isArchived: boolean): Promise<void>;
  removeTask(id: string): Promise<void>;

  saveTaskCompletion(data: {
    taskId: string; csmId?: string; customerId?: string;
    isCompleted: boolean; notes: string; selectedOptions: string[];
  }): Promise<void>;

  removeTaskCompletion(id: string): Promise<void>;


  addActionItem(arg: { customerId: string; text: string }): Promise<void>;
  toggleActionItem(id: string, isCompleted: boolean): Promise<void>;
  removeActionItem(id: string): Promise<void>;

  addBugReport(arg: { customerId: string; name: string; ticketLink: string }): Promise<void>;
  toggleBugReport(id: string, isCompleted: boolean): Promise<void>;
  removeBugReport(id: string): Promise<void>;

  addFeatureRequest(arg: { customerId: string; text: string }): Promise<void>;
  toggleFeatureRequest(id: string, isCompleted: boolean): Promise<void>;
  removeFeatureRequest(id: string): Promise<void>;

  saveMeetingNotes(customerId: string, text: string): Promise<void>;
  removeMeetingNotes(id: string): Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Empty arrays now; Firestore will populate via listeners
  const [tasks, setTasks] = useState<Task[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>([]);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [bugReports, setBugReports] = useState<BugReport[]>([]);
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>([]);
  const [meetingNotes, setMeetingNotes] = useState<MeetingNote[]>([]);

  // Keep existing key + session logic
  const [apiKey, setApiKey] = useState<string | null>(() => localStorage.getItem('gemini-api-key'));
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(() => {
    const storedUser = sessionStorage.getItem('currentUser');
    return storedUser ? JSON.parse(storedUser) : null;
  });

  useEffect(() => {
    if (apiKey) localStorage.setItem('gemini-api-key', apiKey);
    else localStorage.removeItem('gemini-api-key');
  }, [apiKey]);

  useEffect(() => {
    if (currentUser) sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    else sessionStorage.removeItem('currentUser');
  }, [currentUser]);

  // ---------- Realtime listeners (READ) ----------
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    }));
    unsubs.push(onSnapshot(collection(db, 'customers'), snap => {
      setCustomers(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    }));
    unsubs.push(onSnapshot(collection(db, 'tasks'), snap => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    }));
    unsubs.push(onSnapshot(collection(db, 'taskCompletions'), snap => {
      setTaskCompletions(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    }));
    unsubs.push(onSnapshot(collection(db, 'actionItems'), snap => {
      setActionItems(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    }));
    unsubs.push(onSnapshot(collection(db, 'bugReports'), snap => {
      setBugReports(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    }));
    unsubs.push(onSnapshot(collection(db, 'featureRequests'), snap => {
      setFeatureRequests(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    }));
    unsubs.push(onSnapshot(collection(db, 'meetingNotes'), snap => {
      setMeetingNotes(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
    }));

    return () => unsubs.forEach(u => u());
  }, []);

  // ---------- CRUD helpers (WRITE) ----------
  // Users
  const addUser = (name: string) =>
    addDoc(collection(db, 'users'), { name }).then(() => {});
  const updateUser = (id: string, patch: Partial<User>) =>
    updateDoc(doc(db, 'users', id), patch as any);
  const removeUser = (id: string) =>
    deleteDoc(doc(db, 'users', id));

  // Customers
  const addCustomer = (data: { name: string; assignedCsmId?: string }) =>
    addDoc(collection(db, 'customers'), { ...data }).then(() => {});
  const updateCustomer = (id: string, patch: Partial<Customer>) =>
    updateDoc(doc(db, 'customers', id), patch as any);
  const removeCustomer = (id: string) =>
    deleteDoc(doc(db, 'customers', id));

  // Tasks
  const addTask = (task: Omit<Task, 'id' | 'createdAt' | 'isArchived'>) =>
    addDoc(collection(db, 'tasks'), { ...task, isArchived: false, createdAt: Date.now() }).then(() => {});
  const updateTask = (id: string, patch: Partial<Task>) =>
    updateDoc(doc(db, 'tasks', id), patch as any);
  const toggleArchiveTask = (id: string, isArchived: boolean) =>
    updateDoc(doc(db, 'tasks', id), { isArchived });
  const removeTask = (id: string) =>
    deleteDoc(doc(db, 'tasks', id));

  // Task completions
  const saveTaskCompletion = (data: {
    taskId: string; csmId?: string; customerId?: string;
    isCompleted: boolean; notes: string; selectedOptions: string[];
  }) =>
    addDoc(collection(db, 'taskCompletions'), { ...data, completedAt: Date.now() }).then(() => {});
  const removeTaskCompletion = (id: string) =>
    deleteDoc(doc(db, 'taskCompletions', id))

  // Action Items
  const addActionItem = ({ customerId, text }: { customerId: string; text: string }) =>
    addDoc(collection(db, 'actionItems'), { customerId, text, isCompleted: false, createdAt: Date.now() }).then(() => {});
  const toggleActionItem = (id: string, isCompleted: boolean) =>
    updateDoc(doc(db, 'actionItems', id), { isCompleted, completedAt: isCompleted ? Date.now() : null });
  const removeActionItem = (id: string) =>
    deleteDoc(doc(db, 'actionItems', id));

  // Bug Reports
  const addBugReport = (arg: { customerId: string; name: string; ticketLink: string }) =>
    addDoc(collection(db, 'bugReports'), { ...arg, isCompleted: false, createdAt: Date.now() }).then(() => {});
  const toggleBugReport = (id: string, isCompleted: boolean) =>
    updateDoc(doc(db, 'bugReports', id), { isCompleted, completedAt: isCompleted ? Date.now() : null });
  const removeBugReport = (id: string) =>
    deleteDoc(doc(db, 'bugReports', id));

  // Feature Requests
  const addFeatureRequest = (arg: { customerId: string; text: string }) =>
    addDoc(collection(db, 'featureRequests'), { ...arg, isCompleted: false, createdAt: Date.now() }).then(() => {});
  const toggleFeatureRequest = (id: string, isCompleted: boolean) =>
    updateDoc(doc(db, 'featureRequests', id), { isCompleted, completedAt: isCompleted ? Date.now() : null });
  const removeFeatureRequest = (id: string) =>
    deleteDoc(doc(db, 'featureRequests', id));

  // Meeting Notes (one doc per customerId works well; here we use a collection with ids)
  const saveMeetingNotes = (customerId: string, text: string) =>
    setDoc(doc(db, 'meetingNotes', customerId), { customerId, text, updatedAt: Date.now() });
  const removeMeetingNotes = (id: string) =>
    deleteDoc(doc(db, 'meetingNotes', id));
  

  const value: AppContextType = {
    // state
    tasks, setTasks,
    customers, setCustomers,
    users, setUsers,
    taskCompletions, setTaskCompletions,
    actionItems, setActionItems,
    bugReports, setBugReports,
    featureRequests, setFeatureRequests,
    meetingNotes, setMeetingNotes,

    // session bits
    apiKey, setApiKey,
    currentUser, setCurrentUser,


    // helpers
    addUser, updateUser, removeUser,
    addCustomer, updateCustomer, removeCustomer,
    addTask, updateTask, toggleArchiveTask, removeTask,
    saveTaskCompletion,
    addActionItem, toggleActionItem, removeActionItem,
    addBugReport, toggleBugReport, removeBugReport,
    addFeatureRequest, toggleFeatureRequest, removeFeatureRequest,
    saveMeetingNotes, removeMeetingNotes, removeTaskCompletion
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
