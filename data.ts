
import { CSM, Customer, Task, TaskCategory, CSMInputType, TaskCompletion, ActionItem } from './types';

export const initialCsms: CSM[] = [
  { id: 'csm1', name: 'Alice Johnson' },
  { id: 'csm2', name: 'Bob Williams' },
];

export const initialCustomers: Customer[] = [
  { id: 'cust1', name: 'Innovate Corp', assignedCsmId: 'csm1' },
  { id: 'cust2', name: 'Synergy Solutions', assignedCsmId: 'csm1' },
  { id: 'cust3', name: 'Quantum Dynamics', assignedCsmId: 'csm2' },
  { id: 'cust4', name: 'Apex Enterprises', assignedCsmId: 'csm2' },
  { id: 'cust5', name: 'Stellar Tech', assignedCsmId: 'csm1' },
];

export const initialTasks: Task[] = [
  {
    id: 'task1',
    title: 'Announce Q3 Product Updates',
    description: 'Walk through the new features released in Q3. A deck has been attached.',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
    category: TaskCategory.FeatureRelease,
    csmInputTypes: [CSMInputType.Checkbox],
    assignedCustomerIds: ['cust1', 'cust2', 'cust3', 'cust4', 'cust5'],
    fileAttachment: { name: 'Q3_Updates.pdf', url: '#' },
    isArchived: false,
    createdAt: Date.now() - 100000,
  },
  {
    id: 'task2',
    title: 'Gather Feedback on New UI',
    description: 'Ask customers for their initial thoughts on the new user interface. Please record their sentiment.',
    dueDate: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString().split('T')[0],
    category: TaskCategory.QuestionOfTheWeek,
    csmInputTypes: [CSMInputType.MultiSelect],
    multiSelectOptions: [
      { id: 'opt1', label: 'Happy' },
      { id: 'opt2', label: 'Neutral' },
      { id: 'opt3', label: 'Concerned' },
      { id: 'opt4', label: 'At Risk' },
    ],
    assignedCustomerIds: ['cust1', 'cust2', 'cust3', 'cust4', 'cust5'],
    isArchived: false,
    createdAt: Date.now() - 200000,
  },
  {
    id: 'task3',
    title: 'Confirm Receipt of Holiday Schedule',
    description: 'Ensure all customers are aware of our support schedule during the upcoming holidays.',
    dueDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
    category: TaskCategory.Announcement,
    csmInputTypes: [CSMInputType.TextArea, CSMInputType.Checkbox],
    assignedCustomerIds: ['cust2', 'cust4'],
    isArchived: false,
    createdAt: Date.now() - 300000,
  },
];

export const initialTaskCompletions: TaskCompletion[] = [
  { taskId: 'task1', customerId: 'cust1', isCompleted: true },
  { taskId: 'task1', customerId: 'cust3', isCompleted: true },
  { taskId: 'task2', customerId: 'cust1', isCompleted: true, selectedOptions: ['opt1'] },
  { taskId: 'task3', customerId: 'cust2', isCompleted: true, notes: 'Customer confirmed and has no concerns.' },
];

export const initialActionItems: ActionItem[] = [
    { id: 'ai1', customerId: 'cust1', text: 'Follow-up on Q3 goals', isCompleted: false, createdAt: Date.now() - 50000 },
    { id: 'ai2', customerId: 'cust1', text: 'Send over new API documentation', isCompleted: true, createdAt: Date.now() - 150000 },
    { id: 'ai3', customerId: 'cust3', text: 'Schedule Q4 planning session', isCompleted: false, dueDate: new Date(new Date().setDate(new Date().getDate() + 5)).toISOString().split('T')[0], createdAt: Date.now() },
];