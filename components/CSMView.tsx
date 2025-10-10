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
            const baseCompletion = existingIndex > -1 ? prev[existingIndex] : { taskId: task.id, customerId, isCompleted: false };
            const updatedCompletion = { ...baseCompletion, ...updates };
            
            if (!task.csmInputTypes.includes(CSMInputType.Checkbox)) {
                updatedCompletion.isCompleted = !!updatedCompletion.notes || (updatedCompletion.selectedOptions && updatedCompletion.selectedOptions.length > 0);
            }

            if (existingIndex > -1) {
                const newCompletions = [...prev];
                newCompletions[existingIndex] = updatedCompletion;
                return newCompletions;
            }
            return [...prev, updatedCompletion];
        });
    };

    const isOverdue = (dueDate: string) => new Date(dueDate) < new Date() && !dueDate.includes('1970');

    const renderInputs = () => {
        return (
            <div className="space-y-4">
                {task.csmInputTypes.map(type => {
                    switch (type) {
                        case CSMInputType.Checkbox:
                            return (
                                <div key={type} className="flex items-center">
                                    <input type="checkbox" id={`task-${task.id}-checkbox`} checked={completion.isCompleted} onChange={(e) => updateCompletion({ isCompleted: e.target.checked })} className="h-5 w-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                                    <label htmlFor={`task-${task.id}-checkbox`} className="ml-3 font-medium text-slate-700">Mark as complete</label>
                                </div>
                            );
                        case CSMInputType.TextArea:
                            return <textarea key={type} value={completion.notes || ''} onChange={(e) => updateCompletion({ notes: e.target.value })} rows={3} placeholder="Add comments/notes..." className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />;
                        case CSMInputType.MultiSelect:
                            return (
                                <select key={type} value={completion.selectedOptions || []} onChange={(e) => updateCompletion({ selectedOptions: Array.from(e.target.selectedOptions, option => option.value) })} className="block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                    <option value="" disabled>Select response...</option>
                                    {task.multiSelectOptions?.map(opt => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                                </select>
                            );
                        default:
                            return null;
                    }
                })}
            </div>
        );
    };
    
    return (
        <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
            <div className="flex justify-between items-start">
                <div>
                    <h4 className="font-semibold text-slate-800">{task.title}</h4>
                    <p className="text-sm text-slate-600 mt-1">{task.description}</p>
                    <div className="flex items-center gap-4 text-sm mt-2">
                        {task.fileAttachment && <a href={task.fileAttachment.url} className="text-indigo-600 hover:underline font-medium">View Attachment</a>}
                        <span className={`font-semibold ${isOverdue(task.dueDate) ? 'text-red-500' : 'text-slate-600'}`}>Due: {task.dueDate}</span>
                    </div>
                </div>
                 <Tag>{task.category}</Tag>
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200">
                {renderInputs()}
            </div>
        </div>
    );
};

const CustomerAgendaView: React.FC<{ customer: Customer }> = ({ customer }) => {
    const { tasks, actionItems, setActionItems } = useAppContext();
    const [newActionItemText, setNewActionItemText] = useState('');
    const [showArchivedTasks, setShowArchivedTasks] = useState(false);
    const [showOlderActionItems, setShowOlderActionItems] = useState(false);

    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [editingItemText, setEditingItemText] = useState('');

    const managerTasks = useMemo(() => tasks
        .filter(t => t.assignedCustomerIds.includes(customer.id) && t.isArchived === showArchivedTasks)
        .sort((a,b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()), [tasks, customer.id, showArchivedTasks]);

    const { incompleteItems, visibleCompleteItems, hiddenCompleteItemsCount } = useMemo(() => {
        const items = actionItems
            .filter(ai => ai.customerId === customer.id)
            .sort((a, b) => b.createdAt - a.createdAt); 

        const incomplete = items.filter(item => !item.isCompleted);
        const complete = items.filter(item => item.isCompleted);
        
        const hiddenCount = complete.length > 5 ? complete.length - 5 : 0;
        const visible = showOlderActionItems ? complete : complete.slice(0, 5);

        return {
            incompleteItems: incomplete,
            visibleCompleteItems: visible,
            hiddenCompleteItemsCount: showOlderActionItems ? 0 : hiddenCount,
        };
    }, [actionItems, customer.id, showOlderActionItems]);
        
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
        setActionItems(prev => [newItem, ...prev]);
        setNewActionItemText('');
    };
    
    const toggleActionItem = (itemId: string) => {
        setActionItems(prev => prev.map(item => item.id === itemId ? {...item, isCompleted: !item.isCompleted} : item));
    };

    const handleEditActionItem = (item: ActionItem) => {
        setEditingItemId(item.id);
        setEditingItemText(item.text);
    };

    const handleSaveActionItem = () => {
        if (!editingItemId || !editingItemText.trim()) {
            setEditingItemId(null); // Cancel edit if text is empty
            return;
        };
        setActionItems(prev =>
            prev.map(item =>
                item.id === editingItemId ? { ...item, text: editingItemText.trim() } : item
            )
        );
        setEditingItemId(null);
        setEditingItemText('');
    };
    
    const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSaveActionItem();
        } else if (e.key === 'Escape') {
            setEditingItemId(null);
            setEditingItemText('');
        }
    };


    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    };

    return (
        <Card className="flex-1">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Agenda: {customer.name}</h2>
            <div className="space-y-10">
                 <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Action Items</h3>
                    <div className="space-y-3">
                        {incompleteItems.map(item => (
                            <div key={item.id} className="flex items-start p-3 rounded-md bg-white hover:bg-slate-50">
                                <input type="checkbox" checked={item.isCompleted} onChange={() => toggleActionItem(item.id)} className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 flex-shrink-0"/>
                                <div className="ml-3 flex-grow">
                                    {editingItemId === item.id ? (
                                        <input
                                            type="text"
                                            value={editingItemText}
                                            onChange={e => setEditingItemText(e.target.value)}
                                            onBlur={handleSaveActionItem}
                                            onKeyDown={handleEditKeyDown}
                                            className="w-full px-1 py-0.5 border border-indigo-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm"
                                            autoFocus
                                        />
                                    ) : (
                                        <span onClick={() => handleEditActionItem(item)} className="cursor-pointer">{item.text}</span>
                                    )}
                                    <span className="block text-xs text-slate-400">Created: {formatDate(item.createdAt)}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                     <form onSubmit={handleAddActionItem} className="mt-4 flex gap-2">
                        <input type="text" value={newActionItemText} onChange={e => setNewActionItemText(e.target.value)} placeholder="Add new action item..." className="flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        <Button type="submit"><PlusIcon/></Button>
                    </form>

                    {visibleCompleteItems.length > 0 && (
                        <div className="mt-6">
                            <h4 className="text-md font-semibold text-slate-600 mb-3 border-b pb-1">Completed</h4>
                            <div className="space-y-3">
                                {visibleCompleteItems.map(item => (
                                    <div key={item.id} className="flex items-start p-3 rounded-md bg-slate-50 text-slate-500">
                                        <input type="checkbox" checked={item.isCompleted} onChange={() => toggleActionItem(item.id)} className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 flex-shrink-0"/>
                                        <div className="ml-3">
                                            <span className="line-through">{item.text}</span>
                                            <span className="block text-xs text-slate-400">Created: {formatDate(item.createdAt)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {hiddenCompleteItemsCount > 0 && !showOlderActionItems && (
                                <div className="text-center mt-4">
                                    <Button variant="secondary" onClick={() => setShowOlderActionItems(true)}>
                                        Show {hiddenCompleteItemsCount} older completed items
                                    </Button>
                                </div>
                            )}
                            {showOlderActionItems && (
                                <div className="text-center mt-4">
                                    <Button variant="secondary" onClick={() => setShowOlderActionItems(false)}>
                                        Show fewer completed items
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div>
                    <div className="flex justify-between items-center mb-3 border-b pb-2">
                        <h3 className="text-lg font-semibold text-slate-700">Additional Items</h3>
                        <label className="flex items-center text-sm font-medium text-slate-600">
                             <input id="show-archived" type="checkbox" checked={showArchivedTasks} onChange={e => setShowArchivedTasks(e.target.checked)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 mr-2" />
                             Show Archived
                        </label>
                    </div>
                    <div className="space-y-4">
                        {managerTasks.length > 0 ? managerTasks.map(task => (
                            <ManagerTaskItem key={task.id} task={task} customerId={customer.id} />
                        )) : <p className="text-slate-500 py-4 text-center">No {showArchivedTasks ? 'archived' : 'active'} items.</p>}
                    </div>
                </div>
                 
                 <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-3 border-b pb-2">Meeting Notes</h3>
                    <textarea rows={6} placeholder="General notes for this customer..." className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
            </div>
        </Card>
    );
};

const CSMView: React.FC<{ csmId: string }> = ({ csmId }) => {
    const { customers, tasks, taskCompletions } = useAppContext();
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

    const myCustomers = useMemo(() => customers.filter(c => c.assignedCsmId === csmId).sort((a, b) => a.name.localeCompare(b.name)), [customers, csmId]);

    const selectedCustomer = useMemo(() => myCustomers.find(c => c.id === selectedCustomerId), [myCustomers, selectedCustomerId]);
    
    useState(() => {
        if (myCustomers.length > 0 && !selectedCustomerId) {
            setSelectedCustomerId(myCustomers[0].id);
        }
    });

    const getOpenTaskCount = (customerId: string) => {
        const assignedTasks = tasks.filter(t => !t.isArchived && t.assignedCustomerIds.includes(customerId));
        const completedTaskIds = new Set(taskCompletions.filter(tc => tc.customerId === customerId && tc.isCompleted).map(tc => tc.taskId));
        return assignedTasks.filter(t => !completedTaskIds.has(t.id)).length;
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