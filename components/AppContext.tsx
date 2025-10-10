import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { CSM, Customer, Task, TaskCompletion, ActionItem } from '../types';
import { initialCsms, initialCustomers, initialTasks, initialTaskCompletions, initialActionItems } from '../data';

interface AppContextType {
  csms: CSM[];
  setCsms: React.Dispatch<React.SetStateAction<CSM[]>>;
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  taskCompletions: TaskCompletion[];
  setTaskCompletions: React.Dispatch<React.SetStateAction<TaskCompletion[]>>;
  actionItems: ActionItem[];
  setActionItems: React.Dispatch<React.SetStateAction<ActionItem[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const loadFromStorage = <T,>(key: string, fallback: T): T => {
    try {
        const stored = localStorage.getItem(key);
        if (stored) {
            return JSON.parse(stored);
        }
    } catch (error) {
        console.error(`Error parsing ${key} from localStorage`, error);
    }
    return fallback;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [csms, setCsms] = useState<CSM[]>(() => loadFromStorage('csms', initialCsms));
  const [customers, setCustomers] = useState<Customer[]>(() => loadFromStorage('customers', initialCustomers));
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>(initialTaskCompletions);
  const [actionItems, setActionItems] = useState<ActionItem[]>(initialActionItems);

  useEffect(() => {
    localStorage.setItem('csms', JSON.stringify(csms));
  }, [csms]);

  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(customers));
  }, [customers]);

  const value = {
    csms,
    setCsms,
    customers,
    setCustomers,
    tasks,
    setTasks,
    taskCompletions,
    setTaskCompletions,
    actionItems,
    setActionItems,
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