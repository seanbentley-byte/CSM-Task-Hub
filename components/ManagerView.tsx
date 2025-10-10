import React, { useState, useMemo, useEffect } from 'react';
import { Task, CSMInputType, TaskCategory } from '../types';
import { useAppContext } from './AppContext';
import { Card, Button, Modal, Tag, PlusIcon, ArchiveIcon, ChevronDownIcon, CheckCircleIcon, UsersIcon, PencilIcon, SearchIcon } from './ui';

const TaskFormModal: React.FC<{ isOpen: boolean; onClose: () => void; editingTask: Task | null }> = ({ isOpen, onClose, editingTask }) => {
    const { customers, setTasks } = useAppContext();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [category, setCategory] = useState<TaskCategory>(TaskCategory.Other);
    const [csmInputTypes, setCsmInputTypes] = useState<CSMInputType[]>([]);
    const [multiSelectOptionsStr, setMultiSelectOptionsStr] = useState('');
    const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]);
    const [assignToAll, setAssignToAll] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (editingTask) {
                setTitle(editingTask.title);
                setDescription(editingTask.description);
                setDueDate(editingTask.dueDate);
                setCategory(editingTask.category);
                setCsmInputTypes(editingTask.csmInputTypes);
                setMultiSelectOptionsStr(editingTask.multiSelectOptions?.map(o => o.label).join(', ') || '');
                setSelectedCustomerIds(editingTask.assignedCustomerIds);
                setAssignToAll(editingTask.assignedCustomerIds.length === customers.length);
            } else {
                setTitle('');
                setDescription('');
                setDueDate('');
                setCategory(TaskCategory.Other);
                setCsmInputTypes([CSMInputType.Checkbox]);
                setMultiSelectOptionsStr('');
                setSelectedCustomerIds([]);
                setAssignToAll(false);
            }
        }
    }, [editingTask, isOpen, customers]);

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
            assignedCustomerIds: assignToAll ? customers.map(c => c.id) : selectedCustomerIds,
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

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={editingTask ? "Edit Task" : "Create New Task"}>
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

                <div className="flex justify-end pt-4">
                    <Button type="button" variant="secondary" onClick={onClose} className="mr-2">Cancel</Button>
                    <Button type="submit" disabled={csmInputTypes.length === 0}>{editingTask ? "Save Changes" : "Create Task"}</Button>
                </div>
            </form>
        </Modal>
    );
};

const TaskDetails: React.FC<{ task: Task }> = ({ task }) => {
    const { customers, csms, taskCompletions } = useAppContext();
    const [selectedOptionFilter, setSelectedOptionFilter] = useState<string>('all');

    const hasMultiSelect = task.csmInputTypes.includes(CSMInputType.MultiSelect);

    const filteredCustomers = useMemo(() => {
        const assignedCustomers = customers.filter(c => task.assignedCustomerIds.includes(c.id));
        if (!hasMultiSelect || selectedOptionFilter === 'all') {
            return assignedCustomers;
        }
        return assignedCustomers.filter(customer => {
            const completion = taskCompletions.find(tc => tc.taskId === task.id && tc.customerId === customer.id);
            return completion?.selectedOptions?.includes(selectedOptionFilter);
        });
    }, [customers, task.assignedCustomerIds, hasMultiSelect, selectedOptionFilter, taskCompletions, task.id]);


    return (
        <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-slate-700">Completion Details</h4>
                {hasMultiSelect && (
                     <div>
                        <label htmlFor={`filter-${task.id}`} className="text-sm font-medium text-slate-600 mr-2">Filter by response:</label>
                         <select
                             id={`filter-${task.id}`}
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
            </div>
            
            <ul className="space-y-3">
                {filteredCustomers.map(customer => {
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
                                        <div className="text-sm mt-1 text-slate-600 italic space-y-1">
                                            {task.csmInputTypes.includes(CSMInputType.TextArea) && completion.notes && <p>Notes: "{completion.notes}"</p>}
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
                 {filteredCustomers.length === 0 && <p className="text-center text-slate-500 py-4">No customers match this filter.</p>}
            </ul>
        </div>
    );
};

const ManagerView: React.FC = () => {
    const { tasks, setTasks, taskCompletions } = useAppContext();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>('all');
    const [showArchived, setShowArchived] = useState(false);


    const filteredTasks = useMemo(() => {
        return tasks
            .filter(task => task.isArchived === showArchived)
            .filter(task => categoryFilter === 'all' || task.category === categoryFilter)
            .filter(task => task.title.toLowerCase().includes(searchQuery.toLowerCase()))
            .sort((a,b) => b.createdAt - a.createdAt);
    }, [tasks, showArchived, categoryFilter, searchQuery]);

    const getTaskCompletionPercent = (task: Task) => {
        if(task.assignedCustomerIds.length === 0) return 0;
        const completedCount = taskCompletions.filter(tc => tc.taskId === task.id && tc.isCompleted).length;
        return (completedCount / task.assignedCustomerIds.length) * 100;
    };
    
    const handleArchiveTask = (taskId: string) => {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isArchived: !t.isArchived } : t));
    };
    
    const handleEditTask = (task: Task) => {
        setEditingTask(task);
        setIsModalOpen(true);
    };

    const handleOpenCreateModal = () => {
        setEditingTask(null);
        setIsModalOpen(true);
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
                <Button onClick={handleOpenCreateModal}>
                    <PlusIcon /> <span className="ml-2">New Task</span>
                </Button>
            </div>
            
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
                                        <p className="text-sm text-slate-500 mt-1">{task.description}</p>
                                        <div className="flex items-center gap-4 text-sm mt-2 text-slate-600">
                                            <span className={`font-semibold ${isOverdue(task.dueDate) ? 'text-red-500' : ''}`}>Due: {task.dueDate}</span>
                                            <span className="flex items-center"><UsersIcon /> <span className="ml-1.5">{task.assignedCustomerIds.length} Customers</span></span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                                        <div className="w-32 text-center">
                                            <div className="bg-slate-200 rounded-full h-2.5">
                                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${completionPercent}%` }}></div>
                                            </div>
                                            <p className="text-sm text-slate-600 mt-1">{completionPercent.toFixed(0)}% Complete</p>
                                        </div>
                                        <Button variant="secondary" onClick={() => handleEditTask(task)} className="px-2 py-1"><PencilIcon/></Button>
                                        <Button variant="secondary" onClick={() => handleArchiveTask(task.id)} className="px-2 py-1" title={task.isArchived ? "Unarchive" : "Archive"}><ArchiveIcon/></Button>
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

            <TaskFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} editingTask={editingTask} />
        </div>
    );
};

export default ManagerView;