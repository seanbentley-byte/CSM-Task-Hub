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

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // In a real application, you would fetch this data from an API instead of using initialData.
  const [csms, setCsms] = useState<CSM[]>(initialCsms);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>(initialTaskCompletions);
  const [actionItems, setActionItems] = useState<ActionItem[]>(initialActionItems);

  // Note: The useEffect hooks for localStorage have been removed to prepare for a backend.
  // In a real application, state updates would trigger API calls (e.g., using React Query or SWR)
  // instead of writing to local storage.

  const value = {
    csms,
    setCsms, // In a real app, this might be replaced by functions like `addCsm`, `updateCsm`
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