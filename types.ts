export enum TaskCategory {
    Announcement = 'Announcement',
    FeatureRelease = 'Feature Release',
    Bug = 'Bug Fix',
    QuestionOfTheWeek = 'Question of the Week',
    Other = 'Other',
}

export enum CSMInputType {
    Checkbox = 'Checkbox',
    TextArea = 'Text Area',
    MultiSelect = 'Multi-Select',
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
    assignedCustomerIds: string[];
    multiSelectOptions?: MultiSelectOption[];
    isArchived: boolean;
    createdAt: number;
}

export interface Customer {
    id: string;
    name: string;
    assignedCsmId: string;
}

export interface CSM {
    id: string;
    name: string;
}

export interface TaskCompletion {
    taskId: string;
    customerId: string;
    isCompleted: boolean;
    notes?: string;
    selectedOptions?: string[];
    completedAt?: number;
}

export interface ActionItem {
    id: string;
    customerId: string;
    text: string;
    isCompleted: boolean;
    completedAt?: number;
    createdAt: number;
}

export interface BugReport {
    id: string;
    customerId: string;
    name: string;
    ticketLink: string;
    isCompleted: boolean;
    completedAt?: number;
    createdAt: number;
}

export interface FeatureRequest {
    id: string;
    customerId: string;
    text: string;
    isCompleted: boolean;
    completedAt?: number;
    createdAt: number;
}

export interface MeetingNote {
    customerId: string;
    text: string;
}
