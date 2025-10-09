
import React, { useState, useMemo } from 'react';
import { Task, CSMInputType, TaskCategory, MultiSelectOption } from '../types';
import { useAppContext } from './AppContext';
import { Card, Button, Modal, Tag, PlusIcon, ArchiveIcon, ChevronDownIcon, CheckCircleIcon, UsersIcon } from './ui';

const TaskCreationModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { customers, setTasks } = useAppContext();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [category, setCategory] = useState<TaskCategory>(TaskCategory.Other);
    const [csmInputType, setCsmInputType] = useState<CSMInputType>(CSMInputType.Checkbox);
    const [multiSelectOptionsStr, setMultiSelectOptionsStr] = useState('');
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
    const [assignToAll, setAssignToAll] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const newTask: Task = {
            id: `task_${Date.now()}`,
            title,
            description,
            dueDate,
            category,
            csmInputType,
            assignedCustomerIds: assignToAll ? customers.map(c => c.id) : selectedCustomerIds,
            isArchived: false,
            createdAt: Date.now()
        };

        if (csmInputType === CSMInputType.MultiSelect) {
            newTask.multiSelectOptions = multiSelectOptionsStr.split(',').map((label, index) => ({
                id: `opt_${Date.now()}_${index}`,
                label: label.trim(),
            }));
        }

        setTasks(prev => [...prev, newTask]);
        onClose();
        // Reset form would be here
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Task">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)} required rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Due Date</label>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Category</label>
                    <select value={category} onChange={e => setCategory(e.target.value as TaskCategory)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        {Object.values(TaskCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">CSM Input Type</label>
                    <select value={csmInputType} onChange={e => setCsmInputType(e.target.value as CSMInputType)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                        {Object.values(CSMInputType).map(type => <option key={type} value={type}>{type}</option>)}
                    </select>
                </div>
                {csmInputType === CSMInputType.MultiSelect && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Multi-select Options (comma-separated)</label>
                        <input type="text" value={multiSelectOptionsStr} onChange={e => setMultiSelectOptionsStr(e.target.value)} placeholder="Happy, Neutral, Concerned" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                )}
                 <div>
                    <label className="block text-sm font-medium text-slate-700">Assign to Customers</label>
                    <div className="mt-2 space-y-2">
                        <div className="flex items-center">
                            <input id="assign-all" type="checkbox" checked={assignToAll} onChange={e => { setAssignToAll(e.target.checked); if(e.target.checked) setSelectedCustomerIds([]) }} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                            <label htmlFor="assign-all" className="ml-2 block text-sm text-slate-900">Assign to all customers</label>
                        </div>
                        {!assignToAll && (
                            <select multiple value={selectedCustomerIds} onChange={e => setSelectedCustomerIds(Array.from(e.target.selectedOptions, option => option.value))} className="mt-1 block w-full h-32 pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        )}
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} className="mr-2">Cancel</Button>
                    <Button type="submit">Create Task</Button>
                </div>
            </form>
        </Modal>
    );
};

const TaskDetails: React.FC<{ task: Task }> = ({ task }) => {
    const { customers, csms, taskCompletions } = useAppContext();
    
    const assignedCustomers = customers.filter(c => task.assignedCustomerIds.includes(c.id));

    return (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h4 className="font-semibold text-slate-700 mb-2">Completion Details</h4>
            <ul className="space-y-3">
                {assignedCustomers.map(customer => {
                    const completion = taskCompletions.find(tc => tc.taskId === task.id && tc.customerId === customer.id);
                    const csm = csms.find(c => c.id === customer.assignedCsmId);
                    
                    return (
                        <li key={customer.id} className="flex items-start justify-between p-3 bg-white rounded-md border border-slate-200">
                           <div className="flex items-start">
                                {completion?.isCompleted ? <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" /> : <div className="h-5 w-5 border-2 border-slate-300 rounded-full mr-3 mt-0.5 flex-shrink-0"></div>}
                               <div>
                                    <p className="font-semibold text-slate-800">{customer.name}</p>
                                    <p className="text-sm text-slate-500">CSM: {csm?.name || 'Unassigned'}</p>
                                    {completion?.isCompleted && (
                                        <div className="text-sm mt-1 text-slate-600 italic">
                                            {task.csmInputType === CSMInputType.TextArea && <p>Notes: "{completion.notes}"</p>}
                                            {task.csmInputType === CSMInputType.MultiSelect && 
                                                <p>Response: {completion.selectedOptions?.map(optId => task.multiSelectOptions?.find(o => o.id === optId)?.label).join(', ')}</p>
                                            }
                                        </div>
                                    )}
                               </div>
                           </div>
                           
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};


const ManagerView: React.FC = () => {
    const { tasks, setTasks, taskCompletions } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

    const activeTasks = useMemo(() => tasks.filter(t => !t.isArchived).sort((a,b) => b.createdAt - a.createdAt), [tasks]);

    const getTaskCompletionPercent = (task: Task) => {
        const completedCount = taskCompletions.filter(tc => tc.taskId === task.id && tc.isCompleted).length;
        return (completedCount / task.assignedCustomerIds.length) * 100;
    };
    
    const handleArchiveTask = (taskId: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isArchived: true } : t));
    };

    const getCategoryColor = (category: TaskCategory) => {
        switch (category) {
            case TaskCategory.Announcement: return 'bg-blue-100 text-blue-800';
            case TaskCategory.FeatureRelease: return 'bg-purple-100 text-purple-800';
            case TaskCategory.Bug: return 'bg-red-100 text-red-800';
            case TaskCategory.QuestionOfTheWeek: return 'bg-yellow-100 text-yellow-800';
            default: return 'bg-slate-100 text-slate-800';
        }
    }
    
    const isOverdue = (dueDate: string) => new Date(dueDate) < new Date() && !dueDate.includes('1970');


    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-800">Manager Dashboard</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusIcon /> <span className="ml-2">New Task</span>
                </Button>
            </div>

            <Card>
                <h2 className="text-xl font-semibold text-slate-700 mb-4">Active Tasks</h2>
                <div className="space-y-4">
                    {activeTasks.map(task => {
                        const completionPercent = getTaskCompletionPercent(task);
                        return (
                            <div key={task.id} className="border border-slate-200 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3">
                                             <Tag color={getCategoryColor(task.category)}>{task.category}</Tag>
                                             <h3 className="text-lg font-semibold text-slate-800">{task.title}</h3>
                                        </div>
                                        <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                                        <div className="flex items-center gap-4 text-sm mt-2 text-slate-600">
                                            <span className={`font-semibold ${isOverdue(task.dueDate) ? 'text-red-500' : ''}`}>Due: {task.dueDate}</span>
                                            <span className="flex items-center"><UsersIcon /> <span className="ml-1.5">{task.assignedCustomerIds.length} Customers</span></span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                                        <div className="w-32">
                                            <div className="bg-slate-200 rounded-full h-2.5">
                                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${completionPercent}%` }}></div>
                                            </div>
                                            <p className="text-sm text-center text-slate-600 mt-1">{completionPercent.toFixed(0)}% Complete</p>
                                        </div>
                                        <Button variant="secondary" onClick={() => handleArchiveTask(task.id)} className="px-2 py-1"><ArchiveIcon/></Button>
                                        <button onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} className={`transition-transform ${expandedTaskId === task.id ? 'rotate-180' : ''}`}>
                                            <ChevronDownIcon />
                                        </button>
                                    </div>
                                </div>
                                {expandedTaskId === task.id && <TaskDetails task={task} />}
                            </div>
                        )
                    })}
                </div>
            </Card>

            <TaskCreationModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default ManagerView;
