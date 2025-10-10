
export interface CSM {
  id: string;
  name: string;
}

export interface Customer {
  id: string;
  name: string;
  assignedCsmId: string;
}

export enum TaskCategory {
  Announcement = 'Announcement',
  FeatureRelease = 'Feature Release',
  Bug = 'Bug',
  QuestionOfTheWeek = 'Question of the Week',
  Other = 'Other',
}

export enum CSMInputType {
  Checkbox = 'Checkbox',
  TextArea = 'Text Area',
  MultiSelect = 'Multi-select Dropdown',
}

export interface MultiSelectOption {
  id: string;
  label: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  category: TaskCategory;
  csmInputTypes: CSMInputType[];
  multiSelectOptions?: MultiSelectOption[];
  assignedCustomerIds: string[];
  fileAttachment?: { name: string; url: string };
  isArchived: boolean;
  createdAt: number;
}

export interface TaskCompletion {
  taskId: string;
  customerId: string;
  isCompleted: boolean;
  notes?: string;
  selectedOptions?: string[]; // array of option IDs
}

export interface ActionItem {
  id: string;
  customerId: string;
  text: string;
  dueDate?: string;
  isCompleted: boolean;
  createdAt: number;
}