
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
            jsonStringify(t.multiSelectOptions), t.isArchived, t.createdAt
        ]);
        return [['ID', 'Title', 'Description', 'Due Date', 'Category', 'Input Types (JSON)', 'Assignment Type', 'Customer IDs (JSON)', 'CSM IDs (JSON)', 'Options (JSON)', 'Archived', 'Created At'], ...rows];
    }
    rowsToTasks = (rows: any[][]): Task[] => {
        if (!rows || rows.length < 2) return [];
        return rows.slice(1).map(r => ({
            id: r[0], title: r[1], description: r[2], dueDate: r[3], category: r[4],
            csmInputTypes: jsonParse(r[5]) || [], assignmentType: r[6],
            assignedCustomerIds: jsonParse(r[7]) || [], assignedCsmIds: jsonParse(r[8]),
            multiSelectOptions: jsonParse(r[9]), isArchived: r[10] === 'TRUE' || r[10] === true, createdAt: Number(r[11])
        }));
    }

    // Completions
    completionsToRows = (completions: TaskCompletion[]) => {
        const rows = completions.map(tc => [
            tc.taskId, tc.customerId || '', tc.csmId || '', tc.isCompleted, tc.notes || '', jsonStringify(tc.selectedOptions), tc.completedAt || ''
        ]);
        return [['Task ID', 'Customer ID', 'CSM ID', 'Is Completed', 'Notes', 'Selected Options (JSON)', 'Completed At'], ...rows];
    }
    rowsToCompletions = (rows: any[][]): TaskCompletion[] => {
        if (!rows || rows.length < 2) return [];
        return rows.slice(1).map(r => ({
            taskId: r[0], customerId: r[1] || undefined, csmId: r[2] || undefined, 
            isCompleted: r[3] === 'TRUE' || r[3] === true, notes: r[4], 
            selectedOptions: jsonParse(r[5]), completedAt: r[6] ? Number(r[6]) : undefined
        }));
    }

    // Action Items
    actionItemsToRows = (items: ActionItem[]) => {
        const rows = items.map(ai => [
            ai.id, ai.customerId || '', ai.csmId || '', ai.text, ai.isCompleted, ai.completedAt || '', ai.createdAt
        ]);
        return [['ID', 'Customer ID', 'CSM ID', 'Text', 'Is Completed', 'Completed At', 'Created At'], ...rows];
    }
    rowsToActionItems = (rows: any[][]): ActionItem[] => {
        if (!rows || rows.length < 2) return [];
        return rows.slice(1).map(r => ({
            id: r[0], customerId: r[1] || undefined, csmId: r[2] || undefined, text: r[3],
            isCompleted: r[4] === 'TRUE' || r[4] === true, completedAt: r[5] ? Number(r[5]) : undefined, createdAt: Number(r[6])
        }));
    }

    // Bug Reports
    bugsToRows = (bugs: BugReport[]) => {
        const rows = bugs.map(b => [
            b.id, b.customerId || '', b.csmId || '', b.name, b.ticketLink, b.isCompleted, b.completedAt || '', b.createdAt
        ]);
        return [['ID', 'Customer ID', 'CSM ID', 'Name', 'Ticket Link', 'Is Completed', 'Completed At', 'Created At'], ...rows];
    }
    rowsToBugs = (rows: any[][]): BugReport[] => {
        if (!rows || rows.length < 2) return [];
        return rows.slice(1).map(r => ({
            id: r[0], customerId: r[1] || undefined, csmId: r[2] || undefined, name: r[3], ticketLink: r[4],
            isCompleted: r[5] === 'TRUE' || r[5] === true, completedAt: r[6] ? Number(r[6]) : undefined, createdAt: Number(r[7])
        }));
    }

    // Feature Requests
    featuresToRows = (reqs: FeatureRequest[]) => {
        const rows = reqs.map(f => [
            f.id, f.customerId || '', f.csmId || '', f.text, f.isCompleted, f.completedAt || '', f.createdAt
        ]);
        return [['ID', 'Customer ID', 'CSM ID', 'Text', 'Is Completed', 'Completed At', 'Created At'], ...rows];
    }
    rowsToFeatures = (rows: any[][]): FeatureRequest[] => {
        if (!rows || rows.length < 2) return [];
        return rows.slice(1).map(r => ({
            id: r[0], customerId: r[1] || undefined, csmId: r[2] || undefined, text: r[3],
            isCompleted: r[4] === 'TRUE' || r[4] === true, completedAt: r[5] ? Number(r[5]) : undefined, createdAt: Number(r[6])
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
            [TAB_NAMES.COMPLETIONS]: this.completionsToRows(data.completions),
            [TAB_NAMES.ACTION_ITEMS]: this.actionItemsToRows(data.actionItems),
            [TAB_NAMES.BUG_REPORTS]: this.bugsToRows(data.bugs),
            [TAB_NAMES.FEATURE_REQUESTS]: this.featuresToRows(data.features),
            [TAB_NAMES.MEETING_NOTES]: this.notesToRows(data.notes),
        };

        const response = await fetch(webAppUrl, {
            method: 'POST',
            mode: 'no-cors', // Important for GAS Web Apps
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        // Note: With mode: 'no-cors', we get an opaque response. We cannot check response.ok or response.json().
        // We assume success if no network error occurred.
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
        
        // data structure expected: { [TabName]: any[][] }
        
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
