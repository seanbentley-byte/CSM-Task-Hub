
import React, { useState, useMemo } from 'react';
import { Task, Customer, CSMInputType, TaskCompletion, ActionItem } from '../types';
import { useAppContext } from './AppContext';
import { Card, Button, Tag, ClipboardListIcon, PlusIcon } from './ui';

const ManagerTaskItem: React.FC<{ task: Task; customerId: string }> = ({ task, customerId }) => {
    const { taskCompletions, setTaskCompletions } = useAppContext();

    const completion = useMemo(() => 
        taskCompletions.find(tc => tc.taskId === task.id && tc.customerId === customerId) || { taskId: task.id, customerId, isCompleted: false }, 
        [taskCompletions, task.id, customerId]
    );

    const updateCompletion = (updates: Partial<TaskCompletion>) => {
        setTaskCompletions(prev => {
            const existingIndex = prev.findIndex(tc => tc.taskId === task.id && tc.customerId === customerId);
            if (existingIndex > -1) {
                const newCompletions = [...prev];
                newCompletions[existingIndex] = { ...newCompletions[existingIndex], ...updates };
                return newCompletions;
            }
            return [...prev, { taskId: task.id, customerId, isCompleted: false, ...updates }];
        });
    };

    const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateCompletion({ isCompleted: e.target.checked });
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        updateCompletion({ notes: e.target.value, isCompleted: e.target.value.trim() !== '' });
    };

    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(e.target.selectedOptions, option => option.value);
        updateCompletion({ selectedOptions: selected, isCompleted: selected.length > 0 });
    };

    const isOverdue = (dueDate: string) => new Date(dueDate) < new Date() && !dueDate.includes('1970');


    const renderInput = () => {
        switch (task.csmInputType) {
            case CSMInputType.Checkbox:
                return (
                    <div className="flex items-center">
                        <input type="checkbox" id={`task-${task.id}`} checked={completion.isCompleted} onChange={handleCheckboxChange} className="h-5 w-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                        <label htmlFor={`task-${task.id}`} className="ml-2 font-medium text-slate-700">Mark as complete</label>
                    </div>
                );
            case CSMInputType.TextArea:
                return <textarea value={completion.notes || ''} onChange={handleTextChange} rows={3} placeholder="Add comments/notes..." className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />;
            case CSMInputType.MultiSelect:
                return (
                    <select value={completion.selectedOptions || []} onChange={handleMultiSelectChange} className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        <option value="" disabled>Select sentiment...</option>
                        {task.multiSelectOptions?.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                    </select>
                );
            default:
                return null;
        }
    };
    
    return (
        <div className="p-4 bg-white border rounded-lg">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold text-slate-800">{task.title}</h4>
                    <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                    <div className="flex items-center gap-4 text-sm mt-2">
                        {task.fileAttachment && <a href={task.fileAttachment.url} className="text-indigo-600 hover:underline font-medium">View Attachment</a>}
                        <span className={`font-semibold ${isOverdue(task.dueDate) ? 'text-red-500' : 'text-slate-600'}`}>Due: {task.dueDate}</span>
                    </div>
                </div>
                 <Tag>{task.category}</Tag>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
                {renderInput()}
            </div>
        </div>
    );
};

const CustomerAgendaView: React.FC<{ customer: Customer }> = ({ customer }) => {
    const { tasks, actionItems, setActionItems } = useAppContext();
    const [newActionItemText, setNewActionItemText] = useState('');

    const managerTasks = useMemo(() => tasks
        .filter(t => !t.isArchived && t.assignedCustomerIds.includes(customer.id))
        .sort((a,b) => b.createdAt - a.createdAt), [tasks, customer.id]);

    const customerActionItems = useMemo(() => actionItems
        .filter(ai => ai.customerId === customer.id)
        .sort((a,b) => Number(a.isCompleted) - Number(b.isCompleted) || b.createdAt - a.createdAt), [actionItems, customer.id]);
        
    const handleAddActionItem = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newActionItemText.trim()) return;
        const newItem: ActionItem = {
            id: `ai_${Date.now()}`,
            customerId: customer.id,
            text: newActionItemText,
            isCompleted: false,
            createdAt: Date.now()
        };
        setActionItems(prev => [...prev, newItem]);
        setNewActionItemText('');
    };
    
    const toggleActionItem = (itemId: string) => {
        setActionItems(prev => prev.map(item => item.id === itemId ? {...item, isCompleted: !item.isCompleted} : item));
    };

    return (
        <Card className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Agenda: {customer.name}</h2>
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-3">Manager-Assigned Tasks</h3>
                    <div className="space-y-4">
                        {managerTasks.length > 0 ? managerTasks.map(task => (
                            <ManagerTaskItem key={task.id} task={task} customerId={customer.id} />
                        )) : <p className="text-slate-500">No tasks assigned by manager.</p>}
                    </div>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-3">Action Items</h3>
                    <div className="space-y-3">
                        {customerActionItems.map(item => (
                             <div key={item.id} className={`flex items-center p-3 rounded-md ${item.isCompleted ? 'bg-slate-50 text-slate-500' : 'bg-white'}`}>
                                <input type="checkbox" checked={item.isCompleted} onChange={() => toggleActionItem(item.id)} className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"/>
                                <span className={`ml-3 ${item.isCompleted ? 'line-through' : ''}`}>{item.text}</span>
                            </div>
                        ))}
                    </div>
                     <form onSubmit={handleAddActionItem} className="mt-4 flex gap-2">
                        <input type="text" value={newActionItemText} onChange={e => setNewActionItemText(e.target.value)} placeholder="Add new action item..." className="flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        <Button type="submit"><PlusIcon/></Button>
                    </form>
                </div>
                 <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-3">Meeting Notes</h3>
                    <textarea rows={6} placeholder="General notes for this customer..." className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
            </div>
        </Card>
    );
};

const CSMView: React.FC<{ csmId: string }> = ({ csmId }) => {
    const { customers, tasks, taskCompletions } = useAppContext();
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    const myCustomers = useMemo(() => customers.filter(c => c.assignedCsmId === csmId), [customers, csmId]);

    const selectedCustomer = useMemo(() => myCustomers.find(c => c.id === selectedCustomerId), [myCustomers, selectedCustomerId]);

    const getOpenTaskCount = (customerId: string) => {
        const assignedTasks = tasks.filter(t => !t.isArchived && t.assignedCustomerIds.includes(customerId));
        const completedCount = taskCompletions.filter(tc => tc.customerId === customerId && tc.isCompleted).length;
        return assignedTasks.length - completedCount;
    }

    return (
        <div className="flex gap-6 items-start">
            <Card className="w-1/3">
                <h2 className="text-xl font-semibold text-slate-700 mb-4">My Customers</h2>
                <ul className="space-y-2">
                    {myCustomers.map(customer => {
                        const openTasks = getOpenTaskCount(customer.id);
                        return (
                             <li key={customer.id}>
                                <button onClick={() => setSelectedCustomerId(customer.id)} className={`w-full text-left p-3 rounded-md transition-colors ${selectedCustomerId === customer.id ? 'bg-indigo-100 text-indigo-800' : 'hover:bg-slate-100'}`}>
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold">{customer.name}</span>
                                        {openTasks > 0 && <Tag color="bg-red-100 text-red-800">{openTasks} open</Tag>}
                                    </div>
                                </button>
                            </li>
                        )
                    })}
                </ul>
            </Card>

            <div className="w-2/3">
                {selectedCustomer ? (
                    <CustomerAgendaView customer={selectedCustomer} />
                ) : (
                    <Card className="flex flex-col items-center justify-center h-96 text-center">
                        <ClipboardListIcon/>
                        <h3 className="mt-2 text-lg font-medium text-slate-800">Select a Customer</h3>
                        <p className="mt-1 text-sm text-slate-500">Choose a customer from the list to view their agenda.</p>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default CSMView;
