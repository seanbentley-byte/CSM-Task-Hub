
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { CSM, Customer, Task, TaskCompletion, ActionItem } from '../types';
import { initialCsms, initialCustomers, initialTasks, initialTaskCompletions, initialActionItems } from '../data';

interface AppContextType {
  csms: CSM[];
  customers: Customer[];
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  taskCompletions: TaskCompletion[];
  setTaskCompletions: React.Dispatch<React.SetStateAction<TaskCompletion[]>>;
  actionItems: ActionItem[];
  setActionItems: React.Dispatch<React.SetStateAction<ActionItem[]>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [csms] = useState<CSM[]>(initialCsms);
  const [customers] = useState<Customer[]>(initialCustomers);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [taskCompletions, setTaskCompletions] = useState<TaskCompletion[]>(initialTaskCompletions);
  const [actionItems, setActionItems] = useState<ActionItem[]>(initialActionItems);

  const value = {
    csms,
    customers,
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
