
import { User, Customer, Task, TaskCompletion, ActionItem, BugReport, FeatureRequest, MeetingNote } from './types';

// Map data types to Sheet Tab Names
export const TAB_NAMES = {
    USERS: 'Users',
    CUSTOMERS: 'Customers',
    TASKS: 'Tasks',
    COMPLETIONS: 'TaskCompletions',
    ACTION_ITEMS: 'ActionItems',
    BUG_REPORTS: 'BugReports',
    FEATURE_REQUESTS: 'FeatureRequests',
    MEETING_NOTES: 'MeetingNotes'
};

// Serialization Helpers
const jsonStringify = (val: any) => JSON.stringify(val);
const jsonParse = (val: any) => {
    try {
        return val ? JSON.parse(val) : undefined;
    } catch (e) {
        return undefined;
    }
};

// Date Formatting Helpers
const formatDateForSheet = (timestamp: number | string | undefined) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return ''; // Invalid date check
    
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const parseDateFromSheet = (val: string | number | undefined) => {
    if (!val) return undefined;
    // If it's already a number (timestamp), return it
    if (typeof val === 'number') return val;
    // If it's a string, try to parse it
    const parsed = new Date(val).getTime();
    return isNaN(parsed) ? 0 : parsed;
}

const cleanDateString = (val: any) => {
    if (!val) return '';
    const s = String(val);
    return s.split('T')[0];
}

export class SheetsService {

    constructor() {}

    // --- Data Transformation Methods ---
    // These convert between App Objects and 2D Arrays (Rows)

    // Users
    usersToRows = (users: User[]) => {
        const rows = users.map(u => [u.id, u.name, u.email, u.password || '', u.role]);
        return [['ID', 'Name', 'Email', 'Password', 'Role'], ...rows];
    }
    rowsToUsers = (rows: any[][]): User[] => {
        if (!rows || rows.length < 2) return [];
        return rows.slice(1).map(r => ({ id: r[0], name: r[1], email: r[2], password: r[3], role: r[4] }));
    }

    // Customers
    customersToRows = (customers: Customer[]) => {
        const rows = customers.map(c => [c.id, c.name, c.assignedCsmId]);
        return [['ID', 'Name', 'Assigned CSM ID'], ...rows];
    }
    rowsToCustomers = (rows: any[][]): Customer[] => {
        if (!rows || rows.length < 2) return [];
        return rows.slice(1).map(r => ({ id: r[0], name: r[1], assignedCsmId: r[2] }));
    }

    // Tasks
    tasksToRows = (tasks: Task[]) => {
        const rows = tasks.map(t => [
            t.id, t.title, t.description, t.dueDate, t.category, 
            jsonStringify(t.csmInputTypes), t.assignmentType, 
            jsonStringify(t.assignedCustomerIds), jsonStringify(t.assignedCsmIds), 
            jsonStringify(t.multiSelectOptions), t.isArchived, formatDateForSheet(t.createdAt)
        ]);
        return [['ID', 'Title', 'Description', 'Due Date', 'Category', 'Input Types (JSON)', 'Assignment Type', 'Customer IDs (JSON)', 'CSM IDs (JSON)', 'Options (JSON)', 'Archived', 'Created At'], ...rows];
    }
    rowsToTasks = (rows: any[][]): Task[] => {
        if (!rows || rows.length < 2) return [];
        return rows.slice(1).map(r => ({
            id: r[0], title: r[1], description: r[2], dueDate: cleanDateString(r[3]), category: r[4],
            csmInputTypes: jsonParse(r[5]) || [], assignmentType: r[6],
            assignedCustomerIds: jsonParse(r[7]) || [], assignedCsmIds: jsonParse(r[8]),
            multiSelectOptions: jsonParse(r[9]), isArchived: r[10] === 'TRUE' || r[10] === true, createdAt: parseDateFromSheet(r[11]) || 0
        }));
    }

    // Completions
    // UPDATED: Now accepts 'tasks' to backfill missing labels
    completionsToRows = (completions: TaskCompletion[], tasks: Task[]) => {
        const rows = completions.map(tc => {
            // Logic to determine readable labels
            let readableLabels = tc.selectedOptionLabels || [];
            
            // If we have IDs but no labels (legacy data), look them up
            if (readableLabels.length === 0 && tc.selectedOptions && tc.selectedOptions.length > 0) {
                const task = tasks.find(t => t.id === tc.taskId);
                if (task && task.multiSelectOptions) {
                    readableLabels = tc.selectedOptions.map(optId => {
                        const option = task.multiSelectOptions?.find(o => o.id === optId);
                        return option ? option.label : optId; // Fallback to ID if not found
                    });
                } else {
                     readableLabels = tc.selectedOptions; // Fallback to IDs if task not found
                }
            }
            
            // Join with commas for a clean sheet view (e.g. "Happy, Excited")
            const readableResponseStr = readableLabels.join(', ');

            return [
                tc.taskId, tc.customerId || '', tc.csmId || '', tc.isCompleted, tc.notes || '', 
                jsonStringify(tc.selectedOptions), readableResponseStr, formatDateForSheet(tc.completedAt)
            ];
        });
        return [['Task ID', 'Customer ID', 'CSM ID', 'Is Completed', 'Notes', 'Selected Options (IDs)', 'Response Text (Readable)', 'Completed At'], ...rows];
    }
    rowsToCompletions = (rows: any[][]): TaskCompletion[] => {
        if (!rows || rows.length < 2) return [];
        return rows.slice(1).map(r => ({
            taskId: r[0], customerId: r[1] || undefined, csmId: r[2] || undefined, 
            isCompleted: r[3] === 'TRUE' || r[3] === true, notes: r[4], 
            selectedOptions: jsonParse(r[5]), 
            // Skip r[6] (Readable Response) during import as it's for display only
            completedAt: parseDateFromSheet(r[7])
        }));
    }

    // Action Items
    actionItemsToRows = (items: ActionItem[]) => {
        const rows = items.map(ai => [
            ai.id, ai.customerId || '', ai.csmId || '', ai.text, ai.isCompleted, formatDateForSheet(ai.completedAt), formatDateForSheet(ai.createdAt)
        ]);
        return [['ID', 'Customer ID', 'CSM ID', 'Text', 'Is Completed', 'Completed At', 'Created At'], ...rows];
    }
    rowsToActionItems = (rows: any[][]): ActionItem[] => {
        if (!rows || rows.length < 2) return [];
        return rows.slice(1).map(r => ({
            id: r[0], customerId: r[1] || undefined, csmId: r[2] || undefined, text: r[3],
            isCompleted: r[4] === 'TRUE' || r[4] === true, completedAt: parseDateFromSheet(r[5]), createdAt: parseDateFromSheet(r[6]) || 0
        }));
    }

    // Bug Reports
    bugsToRows = (bugs: BugReport[]) => {
        const rows = bugs.map(b => [
            b.id, b.customerId || '', b.csmId || '', b.name, b.ticketLink, b.isCompleted, formatDateForSheet(b.completedAt), formatDateForSheet(b.createdAt)
        ]);
        return [['ID', 'Customer ID', 'CSM ID', 'Name', 'Ticket Link', 'Is Completed', 'Completed At', 'Created At'], ...rows];
    }
    rowsToBugs = (rows: any[][]): BugReport[] => {
        if (!rows || rows.length < 2) return [];
        return rows.slice(1).map(r => ({
            id: r[0], customerId: r[1] || undefined, csmId: r[2] || undefined, name: r[3], ticketLink: r[4],
            isCompleted: r[5] === 'TRUE' || r[5] === true, completedAt: parseDateFromSheet(r[6]), createdAt: parseDateFromSheet(r[7]) || 0
        }));
    }

    // Feature Requests
    featuresToRows = (reqs: FeatureRequest[]) => {
        const rows = reqs.map(f => [
            f.id, f.customerId || '', f.csmId || '', f.text, f.isCompleted, formatDateForSheet(f.completedAt), formatDateForSheet(f.createdAt), f.ticketLink || ''
        ]);
        return [['ID', 'Customer ID', 'CSM ID', 'Text', 'Is Completed', 'Completed At', 'Created At', 'Ticket Link'], ...rows];
    }
    rowsToFeatures = (rows: any[][]): FeatureRequest[] => {
        if (!rows || rows.length < 2) return [];
        return rows.slice(1).map(r => ({
            id: r[0], customerId: r[1] || undefined, csmId: r[2] || undefined, text: r[3],
            isCompleted: r[4] === 'TRUE' || r[4] === true, completedAt: parseDateFromSheet(r[5]), createdAt: parseDateFromSheet(r[6]) || 0, ticketLink: r[7] || ''
        }));
    }

    // Meeting Notes
    notesToRows = (notes: MeetingNote[]) => {
        const rows = notes.map(n => [
            n.customerId || '', n.csmId || '', n.text
        ]);
        return [['Customer ID', 'CSM ID', 'Text'], ...rows];
    }
    rowsToNotes = (rows: any[][]): MeetingNote[] => {
        if (!rows || rows.length < 2) return [];
        return rows.slice(1).map(r => ({
            customerId: r[0] || undefined, csmId: r[1] || undefined, text: r[2]
        }));
    }

    // --- API Calls (using Google Apps Script Web App) ---

    syncToSheets = async (
        webAppUrl: string, 
        data: {
            users: User[], customers: Customer[], tasks: Task[], completions: TaskCompletion[],
            actionItems: ActionItem[], bugs: BugReport[], features: FeatureRequest[], notes: MeetingNote[]
        }
    ) => {
        // Construct payload where keys are Tab Names and values are 2D arrays
        const payload = {
            [TAB_NAMES.USERS]: this.usersToRows(data.users),
            [TAB_NAMES.CUSTOMERS]: this.customersToRows(data.customers),
            [TAB_NAMES.TASKS]: this.tasksToRows(data.tasks),
            // Pass 'tasks' to completionsToRows so it can look up option labels
            [TAB_NAMES.COMPLETIONS]: this.completionsToRows(data.completions, data.tasks),
            [TAB_NAMES.ACTION_ITEMS]: this.actionItemsToRows(data.actionItems),
            [TAB_NAMES.BUG_REPORTS]: this.bugsToRows(data.bugs),
            [TAB_NAMES.FEATURE_REQUESTS]: this.featuresToRows(data.features),
            [TAB_NAMES.MEETING_NOTES]: this.notesToRows(data.notes),
        };

        const response = await fetch(webAppUrl, {
            method: 'POST',
            mode: 'no-cors', // Important for GAS Web Apps
            headers: {
                'Content-Type': 'text/plain', 
            },
            body: JSON.stringify(payload)
        });
        
        return true;
    }

    loadFromSheets = async (webAppUrl: string) => {
        const response = await fetch(webAppUrl, {
            method: 'GET',
            redirect: 'follow'
        });

        if (!response.ok) {
            throw new Error(`Failed to load data: ${response.statusText}`);
        }

        const data = await response.json();
        
        return {
            users: this.rowsToUsers(data[TAB_NAMES.USERS]),
            customers: this.rowsToCustomers(data[TAB_NAMES.CUSTOMERS]),
            tasks: this.rowsToTasks(data[TAB_NAMES.TASKS]),
            taskCompletions: this.rowsToCompletions(data[TAB_NAMES.COMPLETIONS]),
            actionItems: this.rowsToActionItems(data[TAB_NAMES.ACTION_ITEMS]),
            bugReports: this.rowsToBugs(data[TAB_NAMES.BUG_REPORTS]),
            featureRequests: this.rowsToFeatures(data[TAB_NAMES.FEATURE_REQUESTS]),
            meetingNotes: this.rowsToNotes(data[TAB_NAMES.MEETING_NOTES]),
        };
    }
}

export const sheetsService = new SheetsService();
