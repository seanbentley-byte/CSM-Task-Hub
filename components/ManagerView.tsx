import React, { useState, useMemo, useEffect } from 'react';
import { Task, CSMInputType, TaskCategory, MultiSelectOption, Customer, User } from '../types';
import { useAppContext } from './AppContext';
import { Card, Button, Modal, Tag, PlusIcon, ArchiveIcon, ChevronDownIcon, CheckCircleIcon, UsersIcon, PencilIcon, SearchIcon, TrashIcon, DownloadIcon, MarkdownRenderer, SparklesIcon } from './ui';
import { GoogleGenAI, Type } from '@google/genai';

interface AIGeneratedTaskData {
    title: string;
    description: string;
    category: TaskCategory;
    csmInputTypes: CSMInputType[];
}

const AITaskModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void;
    onTaskGenerated: (data: AIGeneratedTaskData) => void;
}> = ({ isOpen, onClose, onTaskGenerated }) => {
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const { apiKey } = useAppContext();

    const handleGenerate = async () => {
        if (!prompt) return;
        if (!apiKey) {
            setError('API Key not found. Please set it in the Settings page.');
            return;
        }
        setIsLoading(true);
        setError('');

        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Parse the following request and generate a task object based on the provided schema. The request is: "${prompt}". The description should be suitable for a customer success manager and support markdown formatting.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            description: { type: Type.STRING },
                            category: { type: Type.STRING, enum: Object.values(TaskCategory) },
                            csmInputTypes: {
                                type: Type.ARRAY,
                                items: { type: Type.STRING, enum: Object.values(CSMInputType) }
                            },
                        },
                        required: ['title', 'description', 'category', 'csmInputTypes']
                    },
                },
            });

            const generatedData = JSON.parse(response.text);
            onTaskGenerated(generatedData);
            onClose();

        } catch (e) {
            console.error(e);
            setError('Failed to generate task. Check your API key or rephrase your prompt.');
        } finally {
            setIsLoading(false);
            setPrompt('');
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Task with AI">
            <div className="space-y-4">
                <p className="text-sm text-slate-600">Describe the task you want to create. For example: "Create a task to announce the new feature X, it should be a simple checkbox acknowledgment."</p>
                <textarea 
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    rows={4}
                    placeholder="Enter task description here..."
                    className="w-full p-2 border rounded-md"
                    disabled={isLoading}
                />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
                    <Button onClick={handleGenerate} disabled={isLoading}>
                        {isLoading ? 'Generating...' : 'Generate Task'}
                    </Button>
                </div>
            </div>
        </Modal>
    )
};


const TaskFormModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    editingTask: Task | null;
    initialData?: Partial<AIGeneratedTaskData>;
}> = ({ isOpen, onClose, editingTask, initialData }) => {
    const { customers, users, setTasks } = useAppContext();
    const csms = users.filter(u => u.role === 'csm');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [category, setCategory] = useState<TaskCategory>(TaskCategory.Other);
    const [csmInputTypes, setCsmInputTypes] = useState<CSMInputType[]>([]);
    const [multiSelectOptionsStr, setMultiSelectOptionsStr] = useState('');
    
    const [assignmentType, setAssignmentType] = useState<'customer' | 'csm'>('customer');

    const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
    const [assignToAll, setAssignToAll] = useState(false);

    const [selectedCsmIds, setSelectedCsmIds] = useState<string[]>([]);
    const [assignToAllCsms, setAssignToAllCsms] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const data = editingTask || initialData;
            setTitle(data?.title || '');
            setDescription(data?.description || '');
            setDueDate(editingTask?.dueDate || '');
            setCategory(data?.category || TaskCategory.Other);
            setCsmInputTypes(data?.csmInputTypes || [CSMInputType.Checkbox]);
            setMultiSelectOptionsStr(editingTask?.multiSelectOptions?.map(o => o.label).join(', ') || '');
            
            setAssignmentType(editingTask?.assignmentType || 'customer');
            
            setSelectedCustomerIds(editingTask?.assignedCustomerIds || []);
            setAssignToAll(editingTask?.assignedCustomerIds.length === customers.length);

            setSelectedCsmIds(editingTask?.assignedCsmIds || []);
            setAssignToAllCsms(!!editingTask?.assignedCsmIds && editingTask.assignedCsmIds.length === csms.length);
        }
    }, [editingTask, initialData, isOpen, customers, csms]);

    const handleInputTypeChange = (type: CSMInputType, checked: boolean) => {
        if (checked) {
            setCsmInputTypes(prev => [...prev, type]);
        } else {
            setCsmInputTypes(prev => prev.filter(t => t !== type));
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        const taskData = {
            title,
            description,
            dueDate,
            category,
            csmInputTypes,
            assignmentType,
            assignedCustomerIds: assignmentType === 'customer' ? (assignToAll ? customers.map(c => c.id) : selectedCustomerIds) : [],
            assignedCsmIds: assignmentType === 'csm' ? (assignToAllCsms ? csms.map(c => c.id) : selectedCsmIds) : [],
            multiSelectOptions: csmInputTypes.includes(CSMInputType.MultiSelect) 
                ? multiSelectOptionsStr.split(',').map((label, index) => ({
                    id: `opt_${Date.now()}_${index}`,
                    label: label.trim(),
                  }))
                : [],
        };

        if (editingTask) {
            setTasks(prev => prev.map(t => t.id === editingTask.id ? { ...t, ...taskData } : t));
        } else {
            const newTask: Task = {
                id: `task_${Date.now()}`,
                ...taskData,
                isArchived: false,
                createdAt: Date.now()
            };
            setTasks(prev => [newTask, ...prev]);
        }
        onClose();
    };

    const handleCustomerSelection = (customerId: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedCustomerIds(prev => [...prev, customerId]);
        } else {
            setSelectedCustomerIds(prev => prev.filter(id => id !== customerId));
        }
    };

    const handleCsmSelection = (csmId: string, isChecked: boolean) => {
        if (isChecked) {
            setSelectedCsmIds(prev => [...prev, csmId]);
        } else {
            setSelectedCsmIds(prev => prev.filter(id => id !== csmId));
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingTask ? "Edit Task" : "Create New Task"}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700">Title</label>
                    <input type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700">Description (Markdown supported)</label>
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
                    <label className="block text-sm font-medium text-slate-700">CSM Input Types</label>
                    <div className="mt-2 space-y-2">
                        {Object.values(CSMInputType).map(type => (
                            <div key={type} className="flex items-center">
                                <input id={`input-type-${type}`} type="checkbox" checked={csmInputTypes.includes(type)} onChange={e => handleInputTypeChange(type, e.target.checked)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                                <label htmlFor={`input-type-${type}`} className="ml-2 block text-sm text-slate-900">{type}</label>
                            </div>
                        ))}
                    </div>
                </div>
                {csmInputTypes.includes(CSMInputType.MultiSelect) && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Multi-select Options (comma-separated)</label>
                        <input type="text" value={multiSelectOptionsStr} onChange={e => setMultiSelectOptionsStr(e.target.value)} placeholder="Happy, Neutral, Concerned" className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                    </div>
                )}
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Assign To</label>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center">
                            <input type="radio" id="assign-type-customer" name="assignment-type" value="customer" checked={assignmentType === 'customer'} onChange={() => setAssignmentType('customer')} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                            <label htmlFor="assign-type-customer" className="ml-2 block text-sm text-slate-900">Customers</label>
                        </div>
                         <div className="flex items-center">
                            <input type="radio" id="assign-type-csm" name="assignment-type" value="csm" checked={assignmentType === 'csm'} onChange={() => setAssignmentType('csm')} className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500" />
                            <label htmlFor="assign-type-csm" className="ml-2 block text-sm text-slate-900">CSMs</label>
                        </div>
                    </div>
                 </div>

                {assignmentType === 'customer' ? (
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Assign to Customers</label>
                        <div className="mt-2 space-y-2">
                            <div className="flex items-center">
                                <input id="assign-all" type="checkbox" checked={assignToAll} onChange={e => { setAssignToAll(e.target.checked); if(e.target.checked) setSelectedCustomerIds([]) }} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                                <label htmlFor="assign-all" className="ml-2 block text-sm text-slate-900">Assign to all customers</label>
                            </div>
                            {!assignToAll && (
                                 <div className="mt-1 w-full max-h-40 overflow-y-auto border border-slate-300 rounded-md p-2 space-y-1 bg-white">
                                    {customers.map(c => (
                                        <div key={c.id} className="flex items-center p-1 rounded-md hover:bg-slate-50">
                                            <input
                                                id={`customer-${c.id}`}
                                                type="checkbox"
                                                checked={selectedCustomerIds.includes(c.id)}
                                                onChange={e => handleCustomerSelection(c.id, e.target.checked)}
                                                className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                            />
                                            <label htmlFor={`customer-${c.id}`} className="ml-3 block text-sm text-slate-900 flex-1 cursor-pointer">{c.name}</label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Assign to CSMs</label>
                        <div className="mt-2 space-y-2">
                            <div className="flex items-center">
                                <input id="assign-all-csms" type="checkbox" checked={assignToAllCsms} onChange={e => { setAssignToAllCsms(e.target.checked); if(e.target.checked) setSelectedCsmIds([]) }} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                                <label htmlFor="assign-all-csms" className="ml-2 block text-sm text-slate-900">Assign to all CSMs</label>
                            </div>
                            {!assignToAllCsms && (
                                 <div className="mt-1 w-full max-h-40 overflow-y-auto border border-slate-300 rounded-md p-2 space-y-1 bg-white">
                                    {csms.map(c => (
                                        <div key={c.id} className="flex items-center p-1 rounded-md hover:bg-slate-50">
                                            <input
                                                id={`csm-${c.id}`}
                                                type="checkbox"
                                                checked={selectedCsmIds.includes(c.id)}
                                                onChange={e => handleCsmSelection(c.id, e.target.checked)}
                                                className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                                            />
                                            <label htmlFor={`csm-${c.id}`} className="ml-3 block text-sm text-slate-900 flex-1 cursor-pointer">{c.name}</label>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}


                <div className="flex justify-end pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} className="mr-2">Cancel</Button>
                    <Button type="submit" disabled={csmInputTypes.length === 0}>{editingTask ? "Save Changes" : "Create Task"}</Button>
                </div>
            </form>
        </Modal>
    );
};

const TaskDetails: React.FC<{ task: Task }> = ({ task }) => {
    const { customers, users, taskCompletions } = useAppContext();
    const csms = users.filter(u => u.role === 'csm');
    const [selectedOptionFilter, setSelectedOptionFilter] = useState<string>('all');
    const [completionStatusFilter, setCompletionStatusFilter] = useState<'all' | 'completed' | 'incomplete'>('all');

    const hasMultiSelect = task.csmInputTypes.includes(CSMInputType.MultiSelect);

    const filteredCustomers = useMemo(() => {
        let assignedCustomers = customers.filter(c => task.assignedCustomerIds.includes(c.id));
        
        // Filter by multi-select response
        if (hasMultiSelect && selectedOptionFilter !== 'all') {
            assignedCustomers = assignedCustomers.filter(customer => {
                const completion = taskCompletions.find(tc => tc.taskId === task.id && tc.customerId === customer.id);
                return completion?.selectedOptions?.includes(selectedOptionFilter);
            });
        }
    
        // Filter by completion status
        if (completionStatusFilter !== 'all') {
            assignedCustomers = assignedCustomers.filter(customer => {
                const completion = taskCompletions.find(tc => tc.taskId === task.id && tc.customerId === customer.id);
                const isCompleted = completion?.isCompleted || false;
                
                if (completionStatusFilter === 'completed') {
                    return isCompleted;
                }
                if (completionStatusFilter === 'incomplete') {
                    return !isCompleted;
                }
                return true;
            });
        }
        
        return assignedCustomers;
    }, [customers, task.assignedCustomerIds, hasMultiSelect, selectedOptionFilter, completionStatusFilter, taskCompletions, task.id]);


    if (task.assignmentType === 'csm') {
        const assignedCsms = csms.filter(c => task.assignedCsmIds?.includes(c.id));
        return (
             <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                <h4 className="font-semibold text-slate-700 mb-2">CSM Completion Details</h4>
                 <ul className="space-y-3">
                    {assignedCsms.map(csm => {
                        const completion = taskCompletions.find(tc => tc.taskId === task.id && tc.csmId === csm.id);
                        return (
                            <li key={csm.id} className="flex items-start justify-between p-3 bg-white rounded-md border border-slate-200">
                                <div className="flex items-start">
                                    {completion?.isCompleted ? <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" /> : <div className="h-5 w-5 border-2 border-slate-300 rounded-full mr-3 mt-0.5 flex-shrink-0"></div>}
                                   <div>
                                        <p className="font-semibold text-slate-800">{csm.name}</p>
                                        {completion?.isCompleted && (
                                            <div className="text-sm mt-1 text-slate-600 italic space-y-1">
                                                {task.csmInputTypes.includes(CSMInputType.TextArea) && completion.notes && <p>Notes: <MarkdownRenderer content={completion.notes} className="inline-block" /></p>}
                                                {task.csmInputTypes.includes(CSMInputType.MultiSelect) && completion.selectedOptions &&
                                                    <p>Response: <span className="font-semibold not-italic">{completion.selectedOptions?.map(optId => task.multiSelectOptions?.find(o => o.id === optId)?.label).join(', ')}</span></p>
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
        )
    }

    return (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-slate-700">Completion Details</h4>
                <div className="flex gap-4 items-center">
                    {hasMultiSelect && (
                         <div>
                            <label htmlFor={`filter-response-${task.id}`} className="text-sm font-medium text-slate-600 mr-2">Filter by response:</label>
                             <select
                                 id={`filter-response-${task.id}`}
                                 value={selectedOptionFilter}
                                 onChange={e => setSelectedOptionFilter(e.target.value)}
                                 className="border-slate-300 rounded-md text-sm py-1 pl-2 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                             >
                                 <option value="all">All Responses</option>
                                 {task.multiSelectOptions?.map(opt => (
                                     <option key={opt.id} value={opt.id}>{opt.label}</option>
                                 ))}
                             </select>
                         </div>
                     )}
                     <div>
                        <label htmlFor={`filter-status-${task.id}`} className="text-sm font-medium text-slate-600 mr-2">Filter by status:</label>
                        <select
                            id={`filter-status-${task.id}`}
                            value={completionStatusFilter}
                            onChange={e => setCompletionStatusFilter(e.target.value as 'all' | 'completed' | 'incomplete')}
                            className="border-slate-300 rounded-md text-sm py-1 pl-2 pr-8 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="all">All Customers</option>
                            <option value="completed">Completed</option>
                            <option value="incomplete">Incomplete</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <ul className="space-y-3">
                {filteredCustomers.map(customer => {
                    const completion = taskCompletions.find(tc => tc.taskId === task.id && tc.customerId === customer.id);
                    const csm = users.find(c => c.id === customer.assignedCsmId);
                    
                    return (
                        <li key={customer.id} className="flex items-start justify-between p-3 bg-white rounded-md border border-slate-200">
                           <div className="flex items-start">
                                {completion?.isCompleted ? <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" /> : <div className="h-5 w-5 border-2 border-slate-300 rounded-full mr-3 mt-0.5 flex-shrink-0"></div>}
                               <div>
                                    <p className="font-semibold text-slate-800">{customer.name}</p>
                                    <p className="text-sm text-slate-500">CSM: {csm?.name || 'Unassigned'}</p>
                                    {completion?.isCompleted && (
                                        <div className="text-sm mt-1 text-slate-600 italic space-y-1">
                                            {task.csmInputTypes.includes(CSMInputType.TextArea) && completion.notes && <p>Notes: <MarkdownRenderer content={completion.notes} className="inline-block" /></p>}
                                            {task.csmInputTypes.includes(CSMInputType.MultiSelect) && completion.selectedOptions &&
                                                <p>Response: <span className="font-semibold not-italic">{completion.selectedOptions?.map(optId => task.multiSelectOptions?.find(o => o.id === optId)?.label).join(', ')}</span></p>
                                            }
                                        </div>
                                    )}
                               </div>
                           </div>
                           
                        </li>
                    );
                })}
                 {filteredCustomers.length === 0 && <p className="text-center text-slate-500 py-4">No customers match the current filters.</p>}
            </ul>
        </div>
    );
};

const DashboardStats: React.FC = () => {
    const { users, customers, tasks, taskCompletions } = useAppContext();
    const csms = users.filter(u => u.role === 'csm');

    const stats = useMemo(() => {
        const activeTasks = tasks.filter(t => !t.isArchived);
        const now = new Date();
        const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const getTaskCompletionPercent = (task: Task) => {
            const assignedCount = task.assignmentType === 'csm' ? task.assignedCsmIds?.length || 0 : task.assignedCustomerIds.length;
            if (assignedCount === 0) return 100;

            const completedCount = taskCompletions.filter(tc => tc.taskId === task.id && tc.isCompleted).length;
            return (completedCount / assignedCount) * 100;
        };

        const overdueTasks = activeTasks.filter(t => new Date(t.dueDate) < now && getTaskCompletionPercent(t) < 100).length;
        const dueSoonTasks = activeTasks.filter(t => {
            const dueDate = new Date(t.dueDate);
            return dueDate >= now && dueDate <= sevenDaysFromNow && getTaskCompletionPercent(t) < 100;
        }).length;

        const csmCompletionRates = csms.map(csm => {
            const csmCustomers = customers.filter(c => c.assignedCsmId === csm.id);
            const csmCustomerIds = new Set(csmCustomers.map(c => c.id));
            
            let totalAssignments = 0;
            let completedAssignments = 0;

            activeTasks.forEach(task => {
                if (task.assignmentType === 'customer') {
                    const assignmentsForThisCsm = task.assignedCustomerIds.filter(id => csmCustomerIds.has(id));
                    if(assignmentsForThisCsm.length > 0) {
                        totalAssignments += assignmentsForThisCsm.length;
                        const completions = taskCompletions.filter(tc => tc.taskId === task.id && tc.isCompleted && csmCustomerIds.has(tc.customerId || '')).length;
                        completedAssignments += completions;
                    }
                } else if (task.assignmentType === 'csm') {
                    if (task.assignedCsmIds?.includes(csm.id)) {
                        totalAssignments++;
                        const completion = taskCompletions.find(tc => tc.taskId === task.id && tc.csmId === csm.id);
                        if (completion?.isCompleted) {
                            completedAssignments++;
                        }
                    }
                }
            });

            const rate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 100;
            return { name: csm.name, rate: Math.round(rate) };
        });

        return { overdueTasks, dueSoonTasks, csmCompletionRates };
    }, [csms, customers, tasks, taskCompletions]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
                <h3 className="text-slate-500 font-semibold">Overdue Tasks</h3>
                <p className="text-4xl font-bold text-red-500">{stats.overdueTasks}</p>
            </Card>
            <Card>
                <h3 className="text-slate-500 font-semibold">Tasks Due Soon</h3>
                <p className="text-4xl font-bold text-yellow-600">{stats.dueSoonTasks}</p>
            </Card>
            <Card className="lg:col-span-2">
                 <h3 className="text-slate-500 font-semibold mb-2">CSM Completion Rates</h3>
                 <div className="space-y-2">
                     {stats.csmCompletionRates.map(csm => (
                         <div key={csm.name}>
                             <div className="flex justify-between text-sm font-medium text-slate-600 mb-1">
                                 <span>{csm.name}</span>
                                 <span>{csm.rate}%</span>
                             </div>
                             <div className="bg-slate-200 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${csm.rate}%` }}></div>
                            </div>
                         </div>
                     ))}
                 </div>
            </Card>
        </div>
    )
};


const ManagerView: React.FC = () => {
    const { tasks, setTasks, taskCompletions, setTaskCompletions, customers, users } = useAppContext();
    const csms = users.filter(u => u.role === 'csm');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [initialTaskData, setInitialTaskData] = useState<Partial<AIGeneratedTaskData> | undefined>(undefined);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
    const [showArchived, setShowArchived] = useState(false);
    const [completionFilter, setCompletionFilter] = useState<'all' | 'completed' | 'incomplete'>('all');


    const getTaskCompletionPercent = (task: Task) => {
        const assignedCount = task.assignmentType === 'csm' ? task.assignedCsmIds?.length || 0 : task.assignedCustomerIds.length;
        if (assignedCount === 0) return 0;
        const completedCount = taskCompletions.filter(tc => tc.taskId === task.id && tc.isCompleted).length;
        return (completedCount / assignedCount) * 100;
    };

    const filteredTasks = useMemo(() => {
        return tasks
            .filter(task => task.isArchived === showArchived)
            .filter(task => categoryFilter === 'all' || task.category === categoryFilter)
            .filter(task => {
                if (completionFilter === 'all') return true;
                const percent = getTaskCompletionPercent(task);
                if (completionFilter === 'completed') return percent === 100;
                if (completionFilter === 'incomplete') return percent < 100;
                return true;
            })
            .filter(task => task.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a,b) => b.createdAt - a.createdAt);
    }, [tasks, showArchived, categoryFilter, searchQuery, completionFilter, taskCompletions]);
    
    const handleArchiveTask = (taskId: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isArchived: !t.isArchived } : t));
    };
    
    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setInitialTaskData(undefined);
        setIsFormModalOpen(true);
    };

    const handleOpenCreateModal = () => {
        setEditingTask(null);
        setInitialTaskData(undefined);
        setIsFormModalOpen(true);
    };
    
    const handleTaskGeneratedByAI = (data: AIGeneratedTaskData) => {
        setEditingTask(null);
        setInitialTaskData(data);
        setIsFormModalOpen(true);
    };

    const handleDeleteTask = (taskId: string) => {
        if (window.confirm('Are you sure you want to permanently delete this task and all its completion data?')) {
            setTasks(prev => prev.filter(t => t.id !== taskId));
            setTaskCompletions(prev => prev.filter(tc => tc.taskId !== taskId));
        }
    };

    const handleExportTask = (task: Task) => {
        const isCsmTask = task.assignmentType === 'csm';
        const assignedEntities = isCsmTask 
            ? csms.filter(c => task.assignedCsmIds?.includes(c.id))
            : customers.filter(c => task.assignedCustomerIds.includes(c.id));
        
        const csvRows = [
            [isCsmTask ? 'CSM Name' : 'Customer Name', 'Assigned CSM', 'Completion Status', 'Notes', 'Response']
        ];

        for (const entity of assignedEntities) {
            const csm = isCsmTask ? entity : csms.find(c => c.id === (entity as Customer).assignedCsmId);
            const completion = taskCompletions.find(tc => 
                tc.taskId === task.id && 
                (isCsmTask ? tc.csmId === entity.id : tc.customerId === entity.id)
            );
            const responseLabel = completion?.selectedOptions
                ?.map(optId => task.multiSelectOptions?.find(o => o.id === optId)?.label)
                .join(', ') || '';

            csvRows.push([
                `"${entity.name}"`,
                `"${csm?.name || 'N/A'}"`,
                completion?.isCompleted ? 'Completed' : 'Incomplete',
                `"${completion?.notes || ''}"`,
                `"${responseLabel}"`
            ]);
        }
        
        const csvContent = "data:text/csv;charset=utf-8," + csvRows.map(e => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        const safeTitle = task.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.setAttribute("download", `${safeTitle}_export.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                <div className="flex gap-2">
                    <Button onClick={() => setIsAIModalOpen(true)} variant="secondary">
                        <SparklesIcon /> Generate with AI
                    </Button>
                    <Button onClick={handleOpenCreateModal}>
                        <PlusIcon /> New Task
                    </Button>
                </div>
            </div>
            
            <DashboardStats />

             <Card>
                <div className="flex flex-col md:flex-row gap-4 mb-4">
                    <div className="relative flex-grow">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3"><SearchIcon/></span>
                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search tasks by title..." className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value as TaskCategory | 'all')} className="border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="all">All Categories</option>
                        {Object.values(TaskCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                     <select value={completionFilter} onChange={e => setCompletionFilter(e.target.value as 'all' | 'completed' | 'incomplete')} className="border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                        <option value="all">All Statuses</option>
                        <option value="incomplete">Incomplete</option>
                        <option value="completed">Completed</option>
                    </select>
                     <div className="flex items-center">
                        <input id="show-archived" type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                        <label htmlFor="show-archived" className="ml-2 block text-sm font-medium text-slate-700">Show Archived</label>
                    </div>
                </div>

                <h2 className="text-xl font-semibold text-slate-700 mb-4">{showArchived ? "Archived Tasks" : "Active Tasks"}</h2>
                <div className="space-y-4">
                    {filteredTasks.map(task => {
                        const completionPercent = getTaskCompletionPercent(task);
                        return (
                            <div key={task.id} className="border border-slate-200 rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3">
                                             <Tag color={getCategoryColor(task.category)}>{task.category}</Tag>
                                             <h3 className="text-lg font-semibold text-slate-800">{task.title}</h3>
                                        </div>
                                        <MarkdownRenderer content={task.description} className="text-sm text-slate-500 mt-1 prose prose-sm max-w-none" />
                                        <div className="flex items-center gap-4 text-sm mt-2 text-slate-600">
                                            <span className={`font-semibold ${isOverdue(task.dueDate) && completionPercent < 100 ? 'text-red-500' : ''}`}>Due: {task.dueDate}</span>
                                            <span className="flex items-center"><UsersIcon /> <span className="ml-1.5">{task.assignmentType === 'csm' ? `${task.assignedCsmIds?.length || 0} CSMs` : `${task.assignedCustomerIds.length} Customers`}</span></span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                        <div className="w-32 text-center">
                                            <div className="bg-slate-200 rounded-full h-2.5">
                                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${completionPercent}%` }}></div>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1">{completionPercent.toFixed(0)}% Complete</p>
                                        </div>
                                        <Button variant="secondary" onClick={() => handleEditTask(task)} className="px-2 py-1" title="Edit Task"><PencilIcon/></Button>
                                        <Button variant="secondary" onClick={() => handleArchiveTask(task.id)} className="px-2 py-1" title={task.isArchived ? "Unarchive" : "Archive"}><ArchiveIcon/></Button>
                                        <Button variant="secondary" onClick={() => handleExportTask(task)} className="px-2 py-1" title="Export to CSV"><DownloadIcon/></Button>
                                        <Button variant="danger" onClick={() => handleDeleteTask(task.id)} className="px-2 py-1" title="Delete Task"><TrashIcon/></Button>
                                        <button onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)} className={`p-1 rounded-full hover:bg-slate-100 transition-transform ${expandedTaskId === task.id ? 'rotate-180' : ''}`}>
                                            <ChevronDownIcon />
                                        </button>
                                    </div>
                                </div>
                                {expandedTaskId === task.id && <TaskDetails task={task} />}
                            </div>
                        )
                    })}
                     {filteredTasks.length === 0 && <p className="text-center text-slate-500 py-4">No tasks match the current filters.</p>}
                </div>
            </Card>

            <TaskFormModal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} editingTask={editingTask} initialData={initialTaskData}/>
            <AITaskModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} onTaskGenerated={handleTaskGeneratedByAI} />
        </div>
    );
};

export default ManagerView;