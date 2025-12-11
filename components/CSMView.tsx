
import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { Card, Button, CheckCircleIcon, SearchIcon, SparklesIcon, TrashIcon, BugAntIcon, LightBulbIcon, LinkIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, UsersIcon, MarkdownRenderer } from './ui';
import { Task, CSMInputType, TaskCompletion, ActionItem, BugReport, FeatureRequest } from '../types';
import { GoogleGenAI } from '@google/genai';


const TaskCompletionForm: React.FC<{
    task: Task;
    customerId?: string;
    csmId?: string;
    existingCompletion?: TaskCompletion;
    onSave: (completion: Pick<TaskCompletion, 'isCompleted' | 'notes' | 'selectedOptions'>) => void;
    onCancel: () => void;
}> = ({ task, customerId, csmId, existingCompletion, onSave, onCancel }) => {
    const [isCompleted, setIsCompleted] = useState(existingCompletion?.isCompleted || false);
    const [notes, setNotes] = useState(existingCompletion?.notes || '');
    const [selectedOptions, setSelectedOptions] = useState<string[]>(existingCompletion?.selectedOptions || []);
    
    const hasCheckbox = task.csmInputTypes.includes(CSMInputType.Checkbox);
    const hasTextArea = task.csmInputTypes.includes(CSMInputType.TextArea);
    const hasMultiSelect = task.csmInputTypes.includes(CSMInputType.MultiSelect);

    const handleSave = () => {
        const completionData: Pick<TaskCompletion, 'isCompleted' | 'notes' | 'selectedOptions'> = {
            isCompleted: hasCheckbox ? isCompleted : (notes.trim() !== '' || selectedOptions.length > 0),
            notes,
            selectedOptions,
        };
        onSave(completionData);
    };
    
    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedOptions(value ? [value] : []);
    };


    return (
        <div className="mt-2 p-4 bg-slate-50 rounded-lg space-y-4 border border-slate-200">
            {/* Show description in context while editing */}
            <div className="bg-white p-3 rounded border border-slate-100">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Task Description</h5>
                <MarkdownRenderer content={task.description} className="text-sm text-slate-700" />
            </div>

            {hasCheckbox && (
                <div className="flex items-center">
                    <input id={`complete-${task.id}-${customerId || csmId}`} type="checkbox" checked={isCompleted} onChange={e => setIsCompleted(e.target.checked)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500" />
                    <label htmlFor={`complete-${task.id}-${customerId || csmId}`} className="ml-2 block text-sm font-medium text-slate-700">Mark as Complete</label>
                </div>
            )}
            {hasMultiSelect && task.multiSelectOptions && (
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Response:</label>
                    <select
                        value={selectedOptions[0] || ''}
                        onChange={handleMultiSelectChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        <option value="">Select an option...</option>
                        {task.multiSelectOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            )}
            {hasTextArea && (
                <div>
                    <label htmlFor={`notes-${task.id}-${customerId || csmId}`} className="block text-sm font-medium text-slate-700">Notes:</label>
                    <textarea id={`notes-${task.id}-${customerId || csmId}`} value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"></textarea>
                </div>
            )}
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleSave}>Save</Button>
            </div>
        </div>
    )
}

const Agenda: React.FC<{ entityId: string; entityType: 'customer' | 'csm' }> = ({ entityId, entityType }) => {
    const { 
        customers, users, tasks, taskCompletions, setTaskCompletions,
        actionItems, setActionItems,
        bugReports, setBugReports,
        featureRequests, setFeatureRequests,
        meetingNotes, setMeetingNotes,
        apiKey
    } = useAppContext();

    const isCsmView = entityType === 'csm';
    
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [showOlderCompleted, setShowOlderCompleted] = useState(false);
    const [showCompletedBugs, setShowCompletedBugs] = useState(false);
    const [showCompletedFeatures, setShowCompletedFeatures] = useState(false);
    
    // Notes
    const [currentNotes, setCurrentNotes] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    
    // Action Items
    const [newActionItem, setNewActionItem] = useState('');

    // Bug Reports
    const [newBugName, setNewBugName] = useState('');
    const [newBugLink, setNewBugLink] = useState('');
    const [isBugsSectionOpen, setIsBugsSectionOpen] = useState(false);

    // Feature Requests
    const [newFeatureRequest, setNewFeatureRequest] = useState('');
    
    useEffect(() => {
        const note = meetingNotes.find(n => (isCsmView ? n.csmId === entityId : n.customerId === entityId));
        setCurrentNotes(note?.text || '');
        setEditingTaskId(null); // Reset editing state when entity changes
    }, [entityId, meetingNotes, isCsmView]);
    
    const entity = isCsmView ? users.find(c => c.id === entityId) : customers.find(c => c.id === entityId);
    
    // Filter all data for the selected entity
    const entityActionItems = useMemo(() => actionItems.filter(ai => isCsmView ? ai.csmId === entityId : ai.customerId === entityId).sort((a, b) => b.createdAt - a.createdAt), [actionItems, entityId, isCsmView]);
    const entityBugs = useMemo(() => bugReports.filter(b => isCsmView ? b.csmId === entityId : b.customerId === entityId).sort((a, b) => b.createdAt - a.createdAt), [bugReports, entityId, isCsmView]);
    const entityFeatures = useMemo(() => featureRequests.filter(fr => isCsmView ? fr.csmId === entityId : fr.customerId === entityId).sort((a, b) => b.createdAt - a.createdAt), [featureRequests, entityId, isCsmView]);
    const managerTasks = useMemo(() => tasks.filter(t => {
        if (isCsmView) {
            return !t.isArchived && t.assignmentType === 'csm' && t.assignedCsmIds?.includes(entityId)
        }
        return !t.isArchived && t.assignmentType === 'customer' && t.assignedCustomerIds.includes(entityId)
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()), [tasks, entityId, isCsmView]);

    // Notes Handlers
    const handleSaveNotes = () => {
        setMeetingNotes(prev => {
            const existing = prev.find(n => (isCsmView ? n.csmId === entityId : n.customerId === entityId));
            if (existing) {
                return prev.map(n => (isCsmView ? n.csmId === entityId : n.customerId === entityId) ? { ...n, text: currentNotes } : n);
            }
            return [...prev, { customerId: isCsmView ? undefined : entityId, csmId: isCsmView ? entityId : undefined, text: currentNotes }];
        });
    };

    const handleSummarizeNotes = async () => {
        if (!currentNotes || !apiKey) return;
        setIsSummarizing(true);
        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Summarize the following notes into key bullet points and identify any action items: \n\n${currentNotes}`,
            });
            setCurrentNotes(prev => `${prev}\n\n**AI Summary:**\n${response.text}`);
        } catch (error) {
            console.error("Failed to summarize notes:", error);
            alert("Failed to summarize notes. Please check your API key in settings.");
        } finally {
            setIsSummarizing(false);
        }
    };

    // Action Item Handlers
    const handleAddActionItem = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newActionItem.trim()) return;
        const newItem: ActionItem = {
            id: `ai_${Date.now()}`,
            customerId: isCsmView ? undefined : entityId,
            csmId: isCsmView ? entityId : undefined,
            text: newActionItem.trim(),
            isCompleted: false,
            createdAt: Date.now()
        };
        setActionItems(prev => [newItem, ...prev]);
        setNewActionItem('');
    };
    
    const handleToggleActionItem = (id: string, isCompleted: boolean) => {
        setActionItems(prev => prev.map(ai => ai.id === id ? { ...ai, isCompleted: !isCompleted, completedAt: !isCompleted ? Date.now() : undefined } : ai));
    };

    const handleDeleteActionItem = (id: string) => {
        if(window.confirm('Are you sure you want to delete this action item?')) {
            setActionItems(prev => prev.filter(ai => ai.id !== id));
        }
    }

    // Bug Report Handlers
    const handleAddBug = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newBugName.trim()) return;
        const newBug: BugReport = {
            id: `bug_${Date.now()}`,
            customerId: isCsmView ? undefined : entityId,
            csmId: isCsmView ? entityId : undefined,
            name: newBugName.trim(),
            ticketLink: newBugLink.trim(),
            isCompleted: false,
            createdAt: Date.now()
        };
        setBugReports(prev => [newBug, ...prev]);
        setNewBugName('');
        setNewBugLink('');
    };

    const handleCompleteBug = (id: string) => {
        setBugReports(prev => prev.map(b => b.id === id ? { ...b, isCompleted: true, completedAt: Date.now() } : b));
    };
    
    // Feature Request Handlers
     const handleAddFeatureRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newFeatureRequest.trim()) return;
        const newRequest: FeatureRequest = {
            id: `fr_${Date.now()}`,
            customerId: isCsmView ? undefined : entityId,
            csmId: isCsmView ? entityId : undefined,
            text: newFeatureRequest.trim(),
            isCompleted: false,
            createdAt: Date.now()
        };
        setFeatureRequests(prev => [newRequest, ...prev]);
        setNewFeatureRequest('');
    };

    const handleCompleteFeatureRequest = (id: string) => {
        setFeatureRequests(prev => prev.map(fr => fr.id === id ? { ...fr, isCompleted: true, completedAt: Date.now() } : fr));
    };


    // Task Completion Handlers
    const handleSaveCompletion = (taskId: string, completionData: Pick<TaskCompletion, 'isCompleted' | 'notes' | 'selectedOptions'>) => {
        setTaskCompletions(prev => {
            const existingIndex = prev.findIndex(tc => tc.taskId === taskId && (isCsmView ? tc.csmId === entityId : tc.customerId === entityId));
            const newCompletion: TaskCompletion = { ...completionData, taskId, customerId: isCsmView ? undefined : entityId, csmId: isCsmView ? entityId : undefined, completedAt: Date.now() };
            if (existingIndex > -1) {
                const updated = [...prev];
                updated[existingIndex] = newCompletion;
                return updated;
            }
            return [...prev, newCompletion];
        });
        setEditingTaskId(null);
    };

    // Rendering Logic
    const incompleteActionItems = entityActionItems.filter(ai => !ai.isCompleted);
    const completedActionItems = entityActionItems.filter(ai => ai.isCompleted);
    const visibleCompleted = showOlderCompleted ? completedActionItems : completedActionItems.slice(0, 3);

    const openBugs = entityBugs.filter(b => !b.isCompleted);
    const completedBugs = entityBugs.filter(b => b.isCompleted);

    const openFeatures = entityFeatures.filter(f => !f.isCompleted);
    const completedFeatures = entityFeatures.filter(f => f.isCompleted);
    
    if (!entity) return <div className="flex-grow flex items-center justify-center text-slate-500">Select an item to see the agenda.</div>;

    return (
        <div className="flex-grow space-y-4 pb-8 max-h-full overflow-y-auto">
            <Card>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Action Items ({incompleteActionItems.length})</h2>
                <form onSubmit={handleAddActionItem} className="flex gap-2 mb-4">
                    <input type="text" value={newActionItem} onChange={e => setNewActionItem(e.target.value)} placeholder="Add a new action item..." className="flex-grow p-2 border rounded-md" />
                    <Button type="submit">Add</Button>
                </form>
                <div className="space-y-2">
                    {incompleteActionItems.map(ai => (
                         <div key={ai.id} className="flex items-center justify-between p-2 bg-white rounded-md group">
                            <div className="flex items-center">
                               <input type="checkbox" checked={false} onChange={() => handleToggleActionItem(ai.id, false)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer" />
                                <span className="ml-3">{ai.text}</span>
                            </div>
                            <button onClick={() => handleDeleteActionItem(ai.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"><TrashIcon /></button>
                         </div>
                    ))}
                    {incompleteActionItems.length === 0 && <p className="text-slate-500 text-sm">No active action items.</p>}
                </div>
                 {completedActionItems.length > 0 && <hr className="my-4" />}
                <div className="space-y-2">
                     {visibleCompleted.map(ai => (
                         <div key={ai.id} className="flex items-center justify-between p-2 bg-white rounded-md group">
                            <div className="flex items-center">
                               <input type="checkbox" checked={true} onChange={() => handleToggleActionItem(ai.id, true)} className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer" />
                                <span className="ml-3 text-slate-500 line-through">{ai.text}</span>
                            </div>
                             <button onClick={() => handleDeleteActionItem(ai.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"><TrashIcon /></button>
                         </div>
                    ))}
                    {completedActionItems.length > 3 && (
                        <Button variant="secondary" onClick={() => setShowOlderCompleted(!showOlderCompleted)} className="w-full mt-2">
                            {showOlderCompleted ? 'Hide older items' : `Show ${completedActionItems.length - 3} older items...`}
                        </Button>
                    )}
                </div>
            </Card>

            <details className="bg-white shadow-sm rounded-lg open:ring-2 open:ring-indigo-200" onToggle={(e) => setIsBugsSectionOpen((e.target as HTMLDetailsElement).open)} open={isBugsSectionOpen}>
                <summary className="p-6 font-bold text-slate-800 text-xl cursor-pointer flex items-center justify-between list-none">
                    <div className="flex items-center gap-2">
                        <BugAntIcon /> Open Bugs ({openBugs.length})
                    </div>
                    <ChevronDownIcon className={`transition-transform transform ${isBugsSectionOpen ? 'rotate-180' : ''}`} />
                </summary>
                <div className="p-6 pt-0">
                    <form onSubmit={handleAddBug} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                        <input type="text" value={newBugName} onChange={e => setNewBugName(e.target.value)} placeholder="Bug name or description..." className="p-2 border rounded-md" required />
                        <div className="flex gap-2">
                            <input type="text" value={newBugLink} onChange={e => setNewBugLink(e.target.value)} placeholder="Link to ticket (e.g., ClickUp)..." className="flex-grow p-2 border rounded-md" />
                            <Button type="submit">Add Bug</Button>
                        </div>
                    </form>
                    <div className="space-y-2">
                        {openBugs.map(bug => (
                            <div key={bug.id} className="flex justify-between items-center p-2">
                                <div>
                                    <p>{bug.name}</p>
                                    {bug.ticketLink && <a href={bug.ticketLink} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline flex items-center gap-1"><LinkIcon />Ticket</a>}
                                </div>
                                <Button variant="secondary" onClick={() => handleCompleteBug(bug.id)}>Complete</Button>
                            </div>
                        ))}
                        {openBugs.length === 0 && <p className="text-slate-500 text-sm">No open bugs.</p>}
                    </div>
                    {completedBugs.length > 0 && (
                        <>
                            <hr className="my-4" />
                            <Button variant="secondary" onClick={() => setShowCompletedBugs(!showCompletedBugs)} className="w-full">
                                {showCompletedBugs ? 'Hide' : 'Show'} {completedBugs.length} Completed Bug{completedBugs.length > 1 ? 's' : ''}
                            </Button>
                            {showCompletedBugs && (
                                <div className="mt-4 space-y-2">
                                    {completedBugs.map(bug => (
                                        <div key={bug.id} className="flex justify-between items-center p-2 text-slate-500 bg-slate-50 rounded-md">
                                            <p className="line-through">{bug.name}</p>
                                            {bug.completedAt && <span className="text-xs">Completed: {new Date(bug.completedAt).toLocaleDateString()}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </details>
            
            <details className="bg-white shadow-sm rounded-lg open:ring-2 open:ring-indigo-200">
                <summary className="p-6 font-bold text-slate-800 text-xl cursor-pointer flex items-center gap-2 list-none justify-between">
                     <div className="flex items-center gap-2">
                        <LightBulbIcon /> Feature Requests ({openFeatures.length})
                    </div>
                    <ChevronDownIcon className="transition-transform transform details-open:-rotate-180" />
                </summary>
                <div className="p-6 pt-0">
                    <form onSubmit={handleAddFeatureRequest} className="flex gap-2 mb-4">
                        <input type="text" value={newFeatureRequest} onChange={e => setNewFeatureRequest(e.target.value)} placeholder="Add a new feature request..." className="flex-grow p-2 border rounded-md" />
                        <Button type="submit">Add Request</Button>
                    </form>
                    <div className="space-y-2">
                        {openFeatures.map(fr => (
                            <div key={fr.id} className="flex justify-between items-center p-2">
                                <p>{fr.text}</p>
                                <Button variant="secondary" onClick={() => handleCompleteFeatureRequest(fr.id)}>Complete</Button>
                            </div>
                        ))}
                        {openFeatures.length === 0 && <p className="text-slate-500 text-sm">No open feature requests.</p>}
                    </div>

                    {completedFeatures.length > 0 && (
                        <>
                            <hr className="my-4" />
                            <Button variant="secondary" onClick={() => setShowCompletedFeatures(!showCompletedFeatures)} className="w-full">
                                {showCompletedFeatures ? 'Hide' : 'Show'} {completedFeatures.length} Completed Request{completedFeatures.length > 1 ? 's' : ''}
                            </Button>
                            {showCompletedFeatures && (
                                <div className="mt-4 space-y-2">
                                    {completedFeatures.map(fr => (
                                        <div key={fr.id} className="flex justify-between items-center p-2 text-slate-500 bg-slate-50 rounded-md">
                                            <p className="line-through">{fr.text}</p>
                                            {fr.completedAt && <span className="text-xs">Completed: {new Date(fr.completedAt).toLocaleDateString()}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </details>

            <Card>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Manager Assigned Tasks</h2>
                <div className="space-y-4">
                    {managerTasks.map(task => {
                        const completion = taskCompletions.find(tc => tc.taskId === task.id && (isCsmView ? tc.csmId === entityId : tc.customerId === entity.id));
                        const isEditing = editingTaskId === task.id;
                        const isComplete = completion?.isCompleted || false;

                        return (
                             <div key={task.id} className={`p-3 rounded-md border ${isComplete ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start flex-grow">
                                        {isComplete ? <CheckCircleIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" /> : <div className="h-5 w-5 border-2 border-slate-300 rounded-full mr-3 mt-0.5 flex-shrink-0"></div>}
                                        <div className="flex-grow">
                                            <p className="font-semibold text-slate-800 text-lg">{task.title}</p>
                                            
                                            {/* Description - Made prominent */}
                                            <div className="mt-2 mb-3">
                                                <MarkdownRenderer content={task.description} className="text-slate-700 text-base" />
                                            </div>

                                            <p className={`text-sm mt-1 font-semibold ${new Date(task.dueDate) < new Date() && !isComplete ? 'text-red-500' : 'text-slate-600'}`}>Due: {task.dueDate}</p>
                                            {isComplete && completion && (
                                                <div className="text-sm mt-1 text-slate-600 italic space-y-1">
                                                    {task.csmInputTypes.includes(CSMInputType.TextArea) && completion.notes && <p>Notes: "{completion.notes}"</p>}
                                                    {task.csmInputTypes.includes(CSMInputType.MultiSelect) && completion.selectedOptions &&
                                                        <p>Response: <span className="font-semibold not-italic">{completion.selectedOptions?.map(optId => task.multiSelectOptions?.find(o => o.id === optId)?.label).join(', ')}</span></p>
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {!isEditing && (
                                        <Button variant="secondary" onClick={() => setEditingTaskId(task.id)}>
                                            {completion ? 'Edit' : 'Complete'}
                                        </Button>
                                    )}
                                </div>
                                {isEditing && (
                                    <TaskCompletionForm 
                                        task={task} 
                                        customerId={isCsmView ? undefined : entityId}
                                        csmId={isCsmView ? entityId : undefined}
                                        existingCompletion={completion} 
                                        onSave={(data) => handleSaveCompletion(task.id, data)}
                                        onCancel={() => setEditingTaskId(null)}
                                    />
                                )}
                            </div>
                        );
                    })}
                    {managerTasks.length === 0 && <p className="text-slate-500 text-center py-4">No tasks assigned by manager.</p>}
                </div>
            </Card>

            <Card>
                <h2 className="text-xl font-bold text-slate-800 mb-2">{isCsmView ? 'Personal Notes' : 'Meeting Notes'}</h2>
                 <textarea value={currentNotes} onChange={e => setCurrentNotes(e.target.value)} rows={6} className="w-full p-2 border rounded-md" placeholder="Start typing notes..."></textarea>
                 <div className="flex justify-end gap-2 mt-2">
                    <Button variant="secondary" onClick={handleSaveNotes}>Save Notes</Button>
                    <Button onClick={handleSummarizeNotes} disabled={isSummarizing || !apiKey}>
                        <SparklesIcon /> {isSummarizing ? 'Summarizing...' : 'Summarize'}
                    </Button>
                 </div>
            </Card>
        </div>
    );
};

const CSMView: React.FC<{ csmId: string }> = ({ csmId }) => {
    return <Agenda entityId={csmId} entityType="csm" />;
};

export default CSMView;
