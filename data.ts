import { CSM, Customer, Task, TaskCategory, CSMInputType, TaskCompletion, ActionItem, BugReport, FeatureRequest, MeetingNote } from './types';

export const csms: CSM[] = [
    { id: 'csm_1', name: 'Alice' },
    { id: 'csm_2', name: 'Bob' },
    { id: 'csm_3', name: 'Charlie' },
];

export const customers: Customer[] = [
    { id: 'cust_1', name: 'Globex Corp', assignedCsmId: 'csm_1' },
    { id: 'cust_2', name: 'Soylent Corp', assignedCsmId: 'csm_1' },
    { id: 'cust_3', name: 'Initech', assignedCsmId: 'csm_2' },
    { id: 'cust_4', name: 'Umbrella Corp', assignedCsmId: 'csm_2' },
    { id: 'cust_5', name: 'Stark Industries', assignedCsmId: 'csm_3' },
    { id: 'cust_6', name: 'Wayne Enterprises', assignedCsmId: 'csm_3' },
];

export const tasks: Task[] = [
    {
        id: 'task_1',
        title: 'Announce New Feature X',
        description: 'Please acknowledge that you have seen the announcement for **New Feature X**.',
        dueDate: '2024-08-15',
        category: TaskCategory.Announcement,
        csmInputTypes: [CSMInputType.Checkbox],
        assignedCustomerIds: ['cust_1', 'cust_2', 'cust_3', 'cust_4', 'cust_5', 'cust_6'],
        isArchived: false,
        createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
    {
        id: 'task_2',
        title: 'Feedback on Feature Y',
        description: 'Provide feedback on your experience with **Feature Y** using the options below.',
        dueDate: '2024-08-20',
        category: TaskCategory.FeatureRelease,
        csmInputTypes: [CSMInputType.MultiSelect, CSMInputType.TextArea],
        assignedCustomerIds: ['cust_1', 'cust_3', 'cust_5'],
        multiSelectOptions: [
            { id: 'opt_1', label: 'Very Satisfied' },
            { id: 'opt_2', label: 'Satisfied' },
            { id: 'opt_3', label: 'Neutral' },
            { id: 'opt_4', label: 'Unsatisfied' },
        ],
        isArchived: false,
        createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    },
    {
        id: 'task_3',
        title: 'QoW: How do you use our reporting feature?',
        description: 'This week, we\'d love to hear about how you leverage our reporting suite. Please provide a brief description of your primary use case.',
        dueDate: '2024-08-10',
        category: TaskCategory.QuestionOfTheWeek,
        csmInputTypes: [CSMInputType.TextArea],
        assignedCustomerIds: ['cust_2', 'cust_4', 'cust_6'],
        isArchived: false,
        createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    },
    {
        id: 'task_4',
        title: 'Archived Task Example',
        description: 'This is an old task that has been archived.',
        dueDate: '2024-01-01',
        category: TaskCategory.Other,
        csmInputTypes: [CSMInputType.Checkbox],
        assignedCustomerIds: ['cust_1'],
        isArchived: true,
        createdAt: Date.now() - 100 * 24 * 60 * 60 * 1000,
    }
];

export const taskCompletions: TaskCompletion[] = [
    { taskId: 'task_1', customerId: 'cust_1', isCompleted: true, completedAt: Date.now() - 1 * 24 * 60 * 60 * 1000 },
    { taskId: 'task_1', customerId: 'cust_3', isCompleted: true, completedAt: Date.now() - 1 * 24 * 60 * 60 * 1000 },
    { taskId: 'task_2', customerId: 'cust_1', isCompleted: true, selectedOptions: ['opt_1'], notes: 'We love it! Super useful for our team.', completedAt: Date.now() - 2 * 24 * 60 * 60 * 1000 },
    { taskId: 'task_3', customerId: 'cust_2', isCompleted: true, notes: 'We use it for monthly board reporting.', completedAt: Date.now() - 3 * 24 * 60 * 60 * 1000 },
];

export const initialActionItems: ActionItem[] = [
    { id: 'ai_1', customerId: 'cust_1', text: 'Follow up on support ticket #123', isCompleted: false, createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000 },
    { id: 'ai_2', customerId: 'cust_1', text: 'Schedule Q4 business review', isCompleted: false, createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000 },
    { id: 'ai_3', customerId: 'cust_1', text: 'Send over new documentation', isCompleted: true, createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, completedAt: Date.now() - 3 * 24 * 60 * 60 * 1000 },
    { id: 'ai_4', customerId: 'cust_2', text: 'Check on integration progress', isCompleted: false, createdAt: Date.now() },
];

export const initialBugReports: BugReport[] = [
    { id: 'bug_1', customerId: 'cust_1', name: 'Dashboard widget not loading', ticketLink: 'https://clickup.com/t/12345', isCompleted: false, createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000 },
    { id: 'bug_2', customerId: 'cust_3', name: 'CSV export fails for large datasets', ticketLink: 'https://clickup.com/t/67890', isCompleted: true, createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, completedAt: Date.now() - 2 * 24 * 60 * 60 * 1000 },
];

export const initialFeatureRequests: FeatureRequest[] = [
    { id: 'fr_1', customerId: 'cust_1', text: 'Requesting a dark mode for the UI.', isCompleted: false, createdAt: Date.now() - 1 * 24 * 60 * 60 * 1000 },
    { id: 'fr_2', customerId: 'cust_4', text: 'Ability to integrate with Slack for notifications.', isCompleted: true, createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000, completedAt: Date.now() - 5 * 24 * 60 * 60 * 1000 },
];

export const initialMeetingNotes: MeetingNote[] = [
    { customerId: 'cust_1', text: 'Meeting on 2024-08-01:\n- Discussed Q3 performance.\n- Customer is happy with recent updates.\n- Raised a concern about the reporting dashboard loading speed.' },
    { customerId: 'cust_2', text: '' },
];
