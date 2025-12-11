
import { User, Customer, Task, TaskCategory, CSMInputType, TaskCompletion, ActionItem, BugReport, FeatureRequest, MeetingNote } from './types';

export const users: User[] = [
    {
        id: 'csm_1',
        name: 'Sean Bentley',
        email: 'sean.bentley@pattern.com',
        password: '5pHtEuQr6vAeDRS',
        role: 'manager'
    }
];

export const customers: Customer[] = [];

export const tasks: Task[] = [];

export const taskCompletions: TaskCompletion[] = [];

export const initialActionItems: ActionItem[] = [];

export const initialBugReports: BugReport[] = [];

export const initialFeatureRequests: FeatureRequest[] = [];

export const initialMeetingNotes: MeetingNote[] = [];
