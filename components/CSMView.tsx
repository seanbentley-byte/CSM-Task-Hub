
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from './AppContext';
import { Card, Button, CheckCircleIcon, SearchIcon, SparklesIcon, TrashIcon, BugAntIcon, LightBulbIcon, LinkIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, UsersIcon, MarkdownRenderer, PencilIcon } from './ui';
import { Task, CSMInputType, TaskCompletion, ActionItem, BugReport, FeatureRequest, Objective } from '../types';
import { GoogleGenAI } from '@google/genai';

const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    
    // Handle ISO strings by stripping time first
    let cleanDateStr = dateStr;
    if (dateStr.includes('T')) {
        cleanDateStr = dateStr.split('T')[0];
    }

    // Expecting YYYY-MM-DD
    const parts = cleanDateStr.split('-');
    if (parts.length === 3) {
         return `${parts[1]}/${parts[2]}/${parts[0]}`;
    }
    return cleanDateStr;
};

const formatDateTime = (timestamp: number | undefined) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yyyy = date.getFullYear();
    // Only return date portion as requested
    return `${mm}/${dd}/${yyyy}`;
};

// --- Helper Components for Editable Rows ---

const ObjectiveRow: React.FC<{
    item: Objective;
    onToggle: (id: string, currentStatus: boolean) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, text: string) => void;
    canEdit: boolean;
}> = ({ item, onToggle, onDelete, onUpdate, canEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(item.text);
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSave = () => {
        if (text.trim()) {
            onUpdate(item.id, text.trim());
        } else {
            setText(item.text);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setText(item.text);
            setIsEditing(false);
        }
    };

    return (
        <div className="flex flex-col bg-white rounded-md border border-slate-200 overflow-hidden transition-all duration-200">
            <div className={`flex items-center justify-between p-3 ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center flex-grow gap-3 min-w-0">
                    <input 
                        type="checkbox" 
                        checked={item.isCompleted} 
                        onChange={(e) => { e.stopPropagation(); onToggle(item.id, item.isCompleted); }} 
                        disabled={!canEdit} 
                        className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex-shrink-0" 
                    />
                    
                    {isEditing ? (
                        <input 
                            autoFocus
                            value={text} 
                            onChange={e => setText(e.target.value)} 
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                            className="flex-grow p-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-200"
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <span 
                            onClick={() => setIsExpanded(!isExpanded)} 
                            className={`flex-grow text-sm font-medium cursor-pointer ${item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-700'}`}
                        >
                            {item.text}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 ml-2">
                    {canEdit && (
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                             {!isEditing && !item.isCompleted && (
                                <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="text-slate-400 hover:text-indigo-600 p-1">
                                    <PencilIcon />
                                </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="text-slate-400 hover:text-red-600 p-1">
                                <TrashIcon />
                            </button>
                        </div>
                    )}
                    <button 
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`text-slate-400 hover:text-indigo-600 p-1 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    >
                        <ChevronDownIcon />
                    </button>
                </div>
            </div>
            
            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-10 pb-3 pt-1 border-t border-slate-100 bg-slate-50 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Added</span>
                            <p className="text-xs text-slate-600">{formatDateTime(item.createdAt)}</p>
                        </div>
                        {item.dueDate && (
                            <div>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Date</span>
                                <p className="text-xs text-slate-600">{formatDate(item.dueDate)}</p>
                            </div>
                        )}
                        {item.isCompleted && item.completedAt && (
                             <div className="col-span-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed On</span>
                                <p className="text-xs text-green-600">{formatDateTime(item.completedAt)}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const ActionItemRow: React.FC<{
    item: ActionItem;
    onToggle: (id: string, currentStatus: boolean) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, text: string) => void;
    canEdit: boolean;
}> = ({ item, onToggle, onDelete, onUpdate, canEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(item.text);

    const handleSave = () => {
        if (text.trim()) {
            onUpdate(item.id, text.trim());
        } else {
            setText(item.text);
        }
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') {
            setText(item.text);
            setIsEditing(false);
        }
    };

    return (
        <div className="flex items-center justify-between p-2 bg-white rounded-md group hover:shadow-sm border border-transparent hover:border-slate-200 transition-all">
            <div className="flex items-center flex-grow gap-3 min-w-0">
                <input 
                    type="checkbox" 
                    checked={item.isCompleted} 
                    onChange={() => onToggle(item.id, item.isCompleted)} 
                    disabled={!canEdit} 
                    className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex-shrink-0" 
                />
                
                {isEditing ? (
                    <input 
                        autoFocus
                        value={text} 
                        onChange={e => setText(e.target.value)} 
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        className="flex-grow p-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    />
                ) : (
                    <span 
                        onClick={() => canEdit && !item.isCompleted && setIsEditing(true)} 
                        className={`flex-grow text-sm truncate ${item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-700'} ${canEdit && !item.isCompleted ? 'cursor-pointer hover:text-indigo-600' : ''}`}
                        title={canEdit && !item.isCompleted ? "Click to edit" : ""}
                    >
                        {item.text}
                    </span>
                )}
            </div>
            {canEdit && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                     {!isEditing && !item.isCompleted && (
                        <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-indigo-600 p-1">
                            <PencilIcon />
                        </button>
                    )}
                    <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-600 p-1">
                        <TrashIcon />
                    </button>
                </div>
            )}
            {item.isCompleted && item.completedAt && (
                 <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                    {formatDateTime(item.completedAt)}
                 </span>
            )}
        </div>
    );
};

const BugReportRow: React.FC<{
    item: BugReport;
    onComplete: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<BugReport>) => void;
    canEdit: boolean;
}> = ({ item, onComplete, onDelete, onUpdate, canEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(item.name);
    const [link, setLink] = useState(item.ticketLink || '');

    const handleSave = () => {
        if (name.trim()) {
            onUpdate(item.id, { name: name.trim(), ticketLink: link.trim() });
        } else {
            setName(item.name);
            setLink(item.ticketLink ?? '');
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 space-y-2">
                <div>
                    <label className="block text-xs font-semibold text-indigo-800 mb-1">Bug Description</label>
                    <input 
                        autoFocus
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        className="w-full p-1.5 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Bug description..."
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-indigo-800 mb-1">Ticket Link (Optional)</label>
                    <input 
                        value={link} 
                        onChange={e => setLink(e.target.value)} 
                        className="w-full p-1.5 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="https://..."
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    <Button variant="secondary" onClick={() => { setIsEditing(false); setName(item.name); setLink(item.ticketLink ?? ''); }} className="text-xs py-1 px-2 h-8">Cancel</Button>
                    <Button onClick={handleSave} className="text-xs py-1 px-2 h-8">Save</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-between items-start p-2 rounded-md group hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
            <div 
                className={`flex-grow ${canEdit && !item.isCompleted ? 'cursor-pointer' : ''}`} 
                onClick={() => canEdit && !item.isCompleted && setIsEditing(true)}
                title={canEdit && !item.isCompleted ? "Click to edit" : ""}
            >
                <p className={`text-sm ${item.isCompleted ? 'line-through text-slate-500' : 'text-slate-800 group-hover:text-indigo-700'}`}>
                    {item.name}
                </p>
                {item.ticketLink && (
                    <a 
                        href={item.ticketLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-0.5 w-fit"
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <LinkIcon /> Ticket
                    </a>
                )}
            </div>
            <div className="flex gap-1 items-center ml-2">
                {canEdit && !item.isCompleted && (
                     <Button variant="secondary" onClick={() => onComplete(item.id)} className="text-xs py-1 px-2 h-7 mr-1">Complete</Button>
                )}
                
                {canEdit && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         {!item.isCompleted && (
                             <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-indigo-600 p-1">
                                <PencilIcon />
                            </button>
                         )}
                        <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-600 p-1">
                            <TrashIcon />
                        </button>
                    </div>
                )}
                 {item.isCompleted && item.completedAt && (
                     <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDateTime(item.completedAt)}
                     </span>
                )}
            </div>
        </div>
    );
};

const FeatureRequestRow: React.FC<{
    item: FeatureRequest;
    onComplete: (id: string) => void;
    onDelete: (id: string) => void;
    onUpdate: (id: string, updates: Partial<FeatureRequest>) => void;
    canEdit: boolean;
}> = ({ item, onComplete, onDelete, onUpdate, canEdit }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [text, setText] = useState(item.text);
    const [link, setLink] = useState(item.ticketLink || '');

    const handleSave = () => {
        if (text.trim()) {
            onUpdate(item.id, { text: text.trim(), ticketLink: link.trim() });
        } else {
            setText(item.text);
            setLink(item.ticketLink ?? '');
        }
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 space-y-2">
                <div>
                     <label className="block text-xs font-semibold text-indigo-800 mb-1">Feature Request</label>
                    <input 
                        autoFocus
                        value={text} 
                        onChange={e => setText(e.target.value)} 
                        className="w-full p-1.5 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="Feature description..."
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                </div>
                 <div>
                    <label className="block text-xs font-semibold text-indigo-800 mb-1">Ticket Link (Optional)</label>
                    <input 
                        value={link} 
                        onChange={e => setLink(e.target.value)} 
                        className="w-full p-1.5 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        placeholder="https://..."
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                    />
                </div>
                <div className="flex justify-end gap-2 mt-2">
                    <Button variant="secondary" onClick={() => { setIsEditing(false); setText(item.text); setLink(item.ticketLink ?? ''); }} className="text-xs py-1 px-2 h-8">Cancel</Button>
                    <Button onClick={handleSave} className="text-xs py-1 px-2 h-8">Save</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-between items-start p-2 rounded-md group hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all">
             <div 
                className={`flex-grow ${canEdit && !item.isCompleted ? 'cursor-pointer' : ''}`} 
                onClick={() => canEdit && !item.isCompleted && setIsEditing(true)}
                title={canEdit && !item.isCompleted ? "Click to edit" : ""}
            >
                <p className={`text-sm ${item.isCompleted ? 'line-through text-slate-500' : 'text-slate-800 group-hover:text-indigo-700'}`}>
                    {item.text}
                </p>
                {item.ticketLink && (
                    <a 
                        href={item.ticketLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-0.5 w-fit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <LinkIcon /> Ticket
                    </a>
                )}
            </div>
            <div className="flex gap-1 items-center ml-2">
                 {canEdit && !item.isCompleted && (
                     <Button variant="secondary" onClick={() => onComplete(item.id)} className="text-xs py-1 px-2 h-7 mr-1">Complete</Button>
                 )}
                 {canEdit && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         {!item.isCompleted && (
                             <button onClick={() => setIsEditing(true)} className="text-slate-400 hover:text-indigo-600 p-1">
                                <PencilIcon />
                            </button>
                         )}
                        <button onClick={() => onDelete(item.id)} className="text-slate-400 hover:text-red-600 p-1">
                            <TrashIcon />
                        </button>
                    </div>
                 )}
                 {item.isCompleted && item.completedAt && (
                     <span className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDateTime(item.completedAt)}
                     </span>
                )}
            </div>
        </div>
    );
};


const TaskCompletionForm: React.FC<{
    task: Task;
    customerId?: string;
    csmId?: string;
    existingCompletion?: TaskCompletion;
    onSave: (completion: Pick<TaskCompletion, 'isCompleted' | 'notes' | 'selectedOptions' | 'selectedOptionLabels'>) => void;
    onCancel: () => void;
    canEdit: boolean;
}> = ({ task, customerId, csmId, existingCompletion, onSave, onCancel, canEdit }) => {
    const [isCompleted, setIsCompleted] = useState(existingCompletion?.isCompleted || false);
    const [notes, setNotes] = useState(existingCompletion?.notes || '');
    const [selectedOptions, setSelectedOptions] = useState<string[]>(existingCompletion?.selectedOptions || []);
    
    const hasCheckbox = task.csmInputTypes.includes(CSMInputType.Checkbox);
    const hasTextArea = task.csmInputTypes.includes(CSMInputType.TextArea);
    const hasMultiSelect = task.csmInputTypes.includes(CSMInputType.MultiSelect);

    const handleSave = () => {
        let selectedOptionLabels: string[] = [];
        if (hasMultiSelect && task.multiSelectOptions) {
             selectedOptionLabels = selectedOptions.map(id => task.multiSelectOptions?.find(o => o.id === id)?.label || id);
        }

        const completionData: Pick<TaskCompletion, 'isCompleted' | 'notes' | 'selectedOptions' | 'selectedOptionLabels'> = {
            isCompleted: hasCheckbox ? isCompleted : (notes.trim() !== '' || selectedOptions.length > 0),
            notes,
            selectedOptions,
            selectedOptionLabels: selectedOptionLabels.length > 0 ? selectedOptionLabels : undefined
        };
        onSave(completionData);
    };
    
    const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        setSelectedOptions(value ? [value] : []);
    };


    return (
        <div className="mt-2 p-4 bg-slate-50 rounded-lg space-y-4 border border-slate-200">
            <div className="bg-white p-3 rounded border border-slate-100">
                <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Task Description</h5>
                <MarkdownRenderer content={task.description} className="text-sm text-slate-700" />
            </div>

            {hasCheckbox && (
                <div className="flex items-center">
                    <input 
                        id={`complete-${task.id}-${customerId || csmId}`} 
                        type="checkbox" 
                        checked={isCompleted} 
                        onChange={e => setIsCompleted(e.target.checked)} 
                        disabled={!canEdit}
                        className="h-4 w-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 disabled:opacity-50" 
                    />
                    <label htmlFor={`complete-${task.id}-${customerId || csmId}`} className="ml-2 block text-sm font-medium text-slate-700">Mark as Complete</label>
                </div>
            )}
            {hasMultiSelect && task.multiSelectOptions && (
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Response:</label>
                    <select
                        value={selectedOptions[0] || ''}
                        onChange={handleMultiSelectChange}
                        disabled={!canEdit}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-slate-100 disabled:text-slate-500"
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
                    <textarea 
                        id={`notes-${task.id}-${customerId || csmId}`} 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)} 
                        disabled={!canEdit}
                        rows={3} 
                        className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100"
                    ></textarea>
                </div>
            )}
            <div className="flex justify-end gap-2">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                {canEdit && <Button onClick={handleSave}>Save</Button>}
            </div>
        </div>
    )
}

const Agenda: React.FC<{ entityId: string; entityType: 'customer' | 'csm'; canEdit: boolean }> = ({ entityId, entityType, canEdit }) => {
    const { 
        customers, users, tasks, taskCompletions, setTaskCompletions,
        objectives, setObjectives,
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
    const [showArchivedObjectives, setShowArchivedObjectives] = useState(false);
    
    const [currentNotes, setCurrentNotes] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [isSavingNotes, setIsSavingNotes] = useState(false);
    const lastSavedNotesRef = useRef('');

    const [newObjective, setNewObjective] = useState('');
    const [objectiveDate, setObjectiveDate] = useState('');

    const [newActionItem, setNewActionItem] = useState('');

    const [newBugName, setNewBugName] = useState('');
    const [newBugLink, setNewBugLink] = useState('');
    const [isBugsSectionOpen, setIsBugsSectionOpen] = useState(false);

    const [newFeatureRequest, setNewFeatureRequest] = useState('');
    const [newFeatureLink, setNewFeatureLink] = useState('');
    
    const prevEntityIdRef = useRef(entityId);

    useEffect(() => {
        if (prevEntityIdRef.current !== entityId) {
            const note = meetingNotes.find(n => (isCsmView ? n.csmId === entityId : n.customerId === entityId));
            const text = note?.text || '';
            setCurrentNotes(text);
            lastSavedNotesRef.current = text;
            setEditingTaskId(null);
            prevEntityIdRef.current = entityId;
        } else {
            const note = meetingNotes.find(n => (isCsmView ? n.csmId === entityId : n.customerId === entityId));
            const remoteText = note?.text || '';
            if (remoteText !== lastSavedNotesRef.current) {
                setCurrentNotes(remoteText);
                lastSavedNotesRef.current = remoteText;
            }
        }
    }, [entityId, isCsmView, meetingNotes]);
    
    useEffect(() => {
        if (!canEdit) return; 

        const note = meetingNotes.find(n => (isCsmView ? n.csmId === entityId : n.customerId === entityId));
        const savedText = note?.text || '';
        
        if (currentNotes !== savedText) {
             setIsSavingNotes(true);
             const timer = setTimeout(() => {
                lastSavedNotesRef.current = currentNotes;
                setMeetingNotes(prev => {
                    const existing = prev.find(n => (isCsmView ? n.csmId === entityId : n.customerId === entityId));
                    if (existing) {
                        return prev.map(n => (isCsmView ? n.csmId === entityId : n.customerId === entityId) ? { ...n, text: currentNotes } : n);
                    }
                    return [...prev, { customerId: isCsmView ? undefined : entityId, csmId: isCsmView ? entityId : undefined, text: currentNotes }];
                });
                setIsSavingNotes(false);
            }, 1000); 

            return () => clearTimeout(timer);
        } else {
            setIsSavingNotes(false);
        }
    }, [currentNotes, entityId, isCsmView, canEdit]);


    const entity = isCsmView ? users.find(c => c.id === entityId) : customers.find(c => c.id === entityId);
    
    const entityObjectives = useMemo(() => objectives.filter(o => isCsmView ? o.csmId === entityId : o.customerId === entityId).sort((a, b) => b.createdAt - a.createdAt), [objectives, entityId, isCsmView]);
    const entityActionItems = useMemo(() => actionItems.filter(ai => isCsmView ? ai.csmId === entityId : ai.customerId === entityId).sort((a, b) => b.createdAt - a.createdAt), [actionItems, entityId, isCsmView]);
    const entityBugs = useMemo(() => bugReports.filter(b => isCsmView ? b.csmId === entityId : b.customerId === entityId).sort((a, b) => b.createdAt - a.createdAt), [bugReports, entityId, isCsmView]);
    const entityFeatures = useMemo(() => featureRequests.filter(fr => isCsmView ? fr.csmId === entityId : fr.customerId === entityId).sort((a, b) => b.createdAt - a.createdAt), [featureRequests, entityId, isCsmView]);
    
    const managerTasks = useMemo(() => tasks.filter(t => {
        if (t.isArchived) return false;
        
        if (isCsmView) {
            return t.assignmentType === 'csm' && t.assignedCsmIds?.includes(entityId)
        }
        return t.assignmentType === 'customer' && t.assignedCustomerIds.includes(entityId)
    }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()), [tasks, entityId, isCsmView]);

    const handleSummarizeNotes = async () => {
         if (!currentNotes || !apiKey || !canEdit) return;
        setIsSummarizing(true);
        try {
            const ai = new GoogleGenAI({ apiKey });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Summarize the following notes into key bullet points and identify any action items: \n\n${currentNotes}`,
            });
            const newText = `${currentNotes}\n\n**AI Summary:**\n${response.text}`;
            setCurrentNotes(newText); 
            lastSavedNotesRef.current = newText;
            setMeetingNotes(prev => {
                const existing = prev.find(n => (isCsmView ? n.csmId === entityId : n.customerId === entityId));
                if (existing) {
                    return prev.map(n => (isCsmView ? n.csmId === entityId : n.customerId === entityId) ? { ...n, text: newText } : n);
                }
                return [...prev, { customerId: isCsmView ? undefined : entityId, csmId: isCsmView ? entityId : undefined, text: newText }];
            });

        } catch (error) {
            console.error("Failed to summarize notes:", error);
            alert("Failed to summarize notes. Please check your API key in settings.");
        } finally {
            setIsSummarizing(false);
        }
    };

    const handleAddObjective = (e: React.FormEvent) => {
        e.preventDefault();
        if(!newObjective.trim()) return;
        const newItem: Objective = {
            id: `obj_${Date.now()}`,
            customerId: isCsmView ? undefined : entityId,
            csmId: isCsmView ? entityId : undefined,
            text: newObjective.trim(),
            dueDate: objectiveDate || undefined,
            isCompleted: false,
            createdAt: Date.now()
        };
        setObjectives(prev => [newItem, ...prev]);
        setNewObjective('');
        setObjectiveDate('');
    };

    const handleToggleObjective = (id: string, isCompleted: boolean) => {
        if (!canEdit) return;
        setObjectives(prev => prev.map(o => o.id === id ? { ...o, isCompleted: !isCompleted, completedAt: !isCompleted ? Date.now() : undefined } : o));
    };

    const handleUpdateObjective = (id: string, text: string) => {
        if (!canEdit) return;
        setObjectives(prev => prev.map(o => o.id === id ? { ...o, text } : o));
    };

    const handleDeleteObjective = (id: string) => {
        if (!canEdit) return;
        if(window.confirm('Are you sure you want to delete this objective?')) {
            setObjectives(prev => prev.filter(o => o.id !== id));
        }
    }

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
        if (!canEdit) return;
        setActionItems(prev => prev.map(ai => ai.id === id ? { ...ai, isCompleted: !isCompleted, completedAt: !isCompleted ? Date.now() : undefined } : ai));
    };

    const handleUpdateActionItem = (id: string, text: string) => {
        if (!canEdit) return;
        setActionItems(prev => prev.map(ai => ai.id === id ? { ...ai, text } : ai));
    };

    const handleDeleteActionItem = (id: string) => {
        if (!canEdit) return;
        if(window.confirm('Are you sure you want to delete this action item?')) {
            setActionItems(prev => prev.filter(ai => ai.id !== id));
        }
    }

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
        if (!canEdit) return;
        setBugReports(prev => prev.map(b => b.id === id ? { ...b, isCompleted: true, completedAt: Date.now() } : b));
    };

    const handleUpdateBug = (id: string, updates: Partial<BugReport>) => {
        if (!canEdit) return;
        setBugReports(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const handleDeleteBug = (id: string) => {
        if (!canEdit) return;
         if(window.confirm('Are you sure you want to delete this bug report?')) {
            setBugReports(prev => prev.filter(b => b.id !== id));
        }
    };
    
     const handleAddFeatureRequest = (e: React.FormEvent) => {
         e.preventDefault();
        if(!newFeatureRequest.trim()) return;
        const newRequest: FeatureRequest = {
            id: `fr_${Date.now()}`,
            customerId: isCsmView ? undefined : entityId,
            csmId: isCsmView ? entityId : undefined,
            text: newFeatureRequest.trim(),
            ticketLink: newFeatureLink.trim(),
            isCompleted: false,
            createdAt: Date.now()
        };
        setFeatureRequests(prev => [newRequest, ...prev]);
        setNewFeatureRequest('');
        setNewFeatureLink('');
    };

    const handleCompleteFeatureRequest = (id: string) => {
        if (!canEdit) return;
        setFeatureRequests(prev => prev.map(fr => fr.id === id ? { ...fr, isCompleted: true, completedAt: Date.now() } : fr));
    };

    const handleUpdateFeature = (id: string, updates: Partial<FeatureRequest>) => {
        if (!canEdit) return;
        setFeatureRequests(prev => prev.map(fr => fr.id === id ? { ...fr, ...updates } : fr));
    };

    const handleDeleteFeatureRequest = (id: string) => {
        if (!canEdit) return;
        if(window.confirm('Are you sure you want to delete this feature request?')) {
            setFeatureRequests(prev => prev.filter(fr => fr.id !== id));
        }
    };

    const handleSaveCompletion = (taskId: string, completionData: Pick<TaskCompletion, 'isCompleted' | 'notes' | 'selectedOptions' | 'selectedOptionLabels'>) => {
        setTaskCompletions(prev => {
            const existingIndex = prev.findIndex(tc => tc.taskId === taskId && (isCsmView ? tc.csmId === entityId : tc.customerId === entityId));
            const newCompletion: TaskCompletion = { 
                ...completionData, 
                taskId, 
                customerId: isCsmView ? undefined : entityId, 
                csmId: isCsmView ? entityId : undefined, 
                completedAt: Date.now() 
            };
            
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
    const activeObjectives = entityObjectives.filter(o => !o.isCompleted);
    const completedObjectives = entityObjectives.filter(o => o.isCompleted);

    const incompleteActionItems = entityActionItems.filter(ai => !ai.isCompleted);
    const completedActionItems = entityActionItems.filter(ai => ai.isCompleted);
    const visibleCompleted = showOlderCompleted ? completedActionItems : completedActionItems.slice(0, 3);

    const openBugs = entityBugs.filter(b => !b.isCompleted);
    const completedBugs = entityBugs.filter(b => b.isCompleted);

    const openFeatures = entityFeatures.filter(f => !f.isCompleted);
    const completedFeatures = entityFeatures.filter(f => f.isCompleted);
    
    if (!entity) return <div className="flex-grow flex items-center justify-center text-slate-500">Select an item to see the agenda.</div>;

    return (
        <div className="flex-grow space-y-4 pb-8">
            {/* NEW OBJECTIVES SECTION */}
            <Card className="border-l-4 border-l-indigo-600">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-slate-800">Objectives ({activeObjectives.length})</h2>
                </div>
                {canEdit && (
                    <form onSubmit={handleAddObjective} className="flex flex-col sm:flex-row gap-2 mb-6 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                        <input 
                            type="text" 
                            value={newObjective} 
                            onChange={e => setNewObjective(e.target.value)} 
                            placeholder="Set a new objective..." 
                            className="flex-grow p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 outline-none" 
                        />
                        <input 
                            type="date" 
                            value={objectiveDate} 
                            onChange={e => setObjectiveDate(e.target.value)} 
                            className="p-2 border rounded-md text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        />
                        <Button type="submit">Set</Button>
                    </form>
                )}
                <div className="space-y-3">
                    {activeObjectives.map(obj => (
                        <ObjectiveRow 
                            key={obj.id} 
                            item={obj} 
                            onToggle={handleToggleObjective} 
                            onDelete={handleDeleteObjective} 
                            onUpdate={handleUpdateObjective}
                            canEdit={canEdit} 
                        />
                    ))}
                    {activeObjectives.length === 0 && <p className="text-slate-500 text-sm italic text-center py-4">No active objectives.</p>}
                </div>
                
                {completedObjectives.length > 0 && (
                    <div className="mt-6">
                        <button 
                            onClick={() => setShowArchivedObjectives(!showArchivedObjectives)}
                            className="flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-wider"
                        >
                            <ChevronDownIcon className={`transform transition-transform ${showArchivedObjectives ? 'rotate-180' : ''}`} />
                            Archived Objectives ({completedObjectives.length})
                        </button>
                        {showArchivedObjectives && (
                            <div className="mt-3 space-y-2 animate-fadeIn">
                                {completedObjectives.map(obj => (
                                    <ObjectiveRow 
                                        key={obj.id} 
                                        item={obj} 
                                        onToggle={handleToggleObjective} 
                                        onDelete={handleDeleteObjective} 
                                        onUpdate={handleUpdateObjective}
                                        canEdit={canEdit} 
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </Card>

            <Card>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Action Items ({incompleteActionItems.length})</h2>
                {canEdit && (
                    <form onSubmit={handleAddActionItem} className="flex gap-2 mb-4">
                        <input type="text" value={newActionItem} onChange={e => setNewActionItem(e.target.value)} placeholder="Add a new action item..." className="flex-grow p-2 border rounded-md" />
                        <Button type="submit">Add</Button>
                    </form>
                )}
                <div className="space-y-2">
                    {incompleteActionItems.map(ai => (
                         <ActionItemRow 
                            key={ai.id} 
                            item={ai} 
                            onToggle={handleToggleActionItem} 
                            onDelete={handleDeleteActionItem} 
                            onUpdate={handleUpdateActionItem}
                            canEdit={canEdit} 
                        />
                    ))}
                    {incompleteActionItems.length === 0 && <p className="text-slate-500 text-sm">No active action items.</p>}
                </div>
                 {completedActionItems.length > 0 && <hr className="my-4" />}
                <div className="space-y-2">
                     {visibleCompleted.map(ai => (
                         <ActionItemRow 
                            key={ai.id} 
                            item={ai} 
                            onToggle={handleToggleActionItem} 
                            onDelete={handleDeleteActionItem} 
                            onUpdate={handleUpdateActionItem}
                            canEdit={canEdit} 
                        />
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
                    {canEdit && (
                        <form onSubmit={handleAddBug} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                            <input type="text" value={newBugName} onChange={e => setNewBugName(e.target.value)} placeholder="Bug name or description..." className="p-2 border rounded-md" required />
                            <div className="flex gap-2">
                                <input type="text" value={newBugLink} onChange={e => setNewBugLink(e.target.value)} placeholder="Link to ticket..." className="flex-grow p-2 border rounded-md" />
                                <Button type="submit">Add Bug</Button>
                            </div>
                        </form>
                    )}
                    <div className="space-y-2">
                        {openBugs.map(bug => (
                             <BugReportRow 
                                key={bug.id} 
                                item={bug} 
                                onComplete={handleCompleteBug} 
                                onDelete={handleDeleteBug} 
                                onUpdate={handleUpdateBug}
                                canEdit={canEdit} 
                             />
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
                                         <BugReportRow 
                                            key={bug.id} 
                                            item={bug} 
                                            onComplete={handleCompleteBug} 
                                            onDelete={handleDeleteBug} 
                                            onUpdate={handleUpdateBug}
                                            canEdit={canEdit} 
                                         />
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
                    {canEdit && (
                        <form onSubmit={handleAddFeatureRequest} className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
                            <input type="text" value={newFeatureRequest} onChange={e => setNewFeatureRequest(e.target.value)} placeholder="Add a new feature request..." className="p-2 border rounded-md" required />
                            <div className="flex gap-2">
                                <input type="text" value={newFeatureLink} onChange={e => setNewFeatureLink(e.target.value)} placeholder="Link to request (optional)..." className="flex-grow p-2 border rounded-md" />
                                <Button type="submit">Add Request</Button>
                            </div>
                        </form>
                    )}
                    <div className="space-y-2">
                        {openFeatures.map(fr => (
                             <FeatureRequestRow 
                                key={fr.id} 
                                item={fr} 
                                onComplete={handleCompleteFeatureRequest} 
                                onDelete={handleDeleteFeatureRequest} 
                                onUpdate={handleUpdateFeature}
                                canEdit={canEdit} 
                             />
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
                                         <FeatureRequestRow 
                                            key={fr.id} 
                                            item={fr} 
                                            onComplete={handleCompleteFeatureRequest} 
                                            onDelete={handleDeleteFeatureRequest} 
                                            onUpdate={handleUpdateFeature}
                                            canEdit={canEdit} 
                                         />
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
                                            
                                            <div className="mt-2 mb-3">
                                                <MarkdownRenderer content={task.description} className="text-slate-700 text-base" />
                                            </div>

                                            <p className={`text-sm mt-1 font-semibold ${new Date(task.dueDate) < new Date() && !isComplete ? 'text-red-500' : 'text-slate-600'}`}>Due: {formatDate(task.dueDate)}</p>
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
                                    {!isEditing && canEdit && (
                                        <Button variant="secondary" onClick={() => setEditingTaskId(task.id)}>
                                            {completion ? 'Edit' : 'Complete'}
                                        </Button>
                                    )}
                                </div>
                                {isEditing && canEdit && (
                                    <TaskCompletionForm 
                                        task={task} 
                                        customerId={isCsmView ? undefined : entityId}
                                        csmId={isCsmView ? entityId : undefined}
                                        existingCompletion={completion} 
                                        onSave={(data) => handleSaveCompletion(task.id, data)}
                                        onCancel={() => setEditingTaskId(null)}
                                        canEdit={canEdit}
                                    />
                                )}
                            </div>
                        );
                    })}
                    {managerTasks.length === 0 && <p className="text-slate-500 text-center py-4">No tasks assigned by manager.</p>}
                </div>
            </Card>

            <Card>
                <div className="flex justify-between items-center mb-2">
                     <h2 className="text-xl font-bold text-slate-800">{isCsmView ? 'Personal Notes' : 'Notes'}</h2>
                     {isSavingNotes && <span className="text-xs text-slate-500 animate-pulse">Saving...</span>}
                </div>
                 <textarea 
                    value={currentNotes} 
                    onChange={e => setCurrentNotes(e.target.value)} 
                    disabled={!canEdit}
                    rows={6} 
                    className="w-full p-2 border rounded-md disabled:bg-slate-100 disabled:text-slate-600" 
                    placeholder={canEdit ? "Start typing notes... (Auto-saves)" : "No notes available."}
                ></textarea>
                 {canEdit && (
                    <div className="flex justify-end gap-2 mt-2">
                        <Button onClick={handleSummarizeNotes} disabled={isSummarizing || !apiKey}>
                            <SparklesIcon /> {isSummarizing ? 'Summarizing...' : 'Summarize'}
                        </Button>
                    </div>
                 )}
            </Card>
        </div>
    );
};

const CSMView: React.FC<{ csmId: string }> = ({ csmId }) => {
    const { customers, users, currentUser } = useAppContext();
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const viewingUser = users.find(u => u.id === csmId);
    const myCustomers = useMemo(() => customers.filter(c => c.assignedCsmId === csmId).sort((a,b) => a.name.localeCompare(b.name)), [customers, csmId]);
    
    useEffect(() => {
        setSelectedCustomerId(null);
    }, [csmId]);

    const canEdit = useMemo(() => {
        if (!currentUser) return false;
        if (currentUser.role === 'manager') return true;
        if (currentUser.id === csmId) return true;
        return false;
    }, [currentUser, csmId]);

    return (
        <div className="flex flex-col md:flex-row gap-6 transition-all duration-300 ease-in-out">
            <div 
                className={`transition-all duration-300 ease-in-out flex-shrink-0 ${
                    isSidebarOpen ? 'w-full md:w-1/4' : 'w-full md:w-16'
                }`}
            >
                <Card className={`p-4 h-full flex flex-col ${!isSidebarOpen ? 'items-center' : ''}`}>
                    <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} mb-4`}>
                        {isSidebarOpen && (
                            <h3 className="font-bold text-slate-700 truncate mr-2" title={viewingUser?.name}>
                                {viewingUser?.name || 'CSM'}'s Dashboard
                            </h3>
                        )}
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="text-slate-500 hover:text-indigo-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors"
                            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                        >
                            {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                        </button>
                    </div>
                    
                    <div className={`space-y-4 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'} transition-opacity duration-200`}>
                        <div className="space-y-1">
                             <button
                                onClick={() => setSelectedCustomerId(null)}
                                className={`w-full text-left px-3 py-2 rounded-md transition-colors flex items-center gap-2 ${selectedCustomerId === null ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'hover:bg-slate-100 text-slate-600'}`}
                            >
                                <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                                My Personal Tasks
                            </button>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold text-slate-600 mb-2 px-3 text-sm uppercase tracking-wider">Customers</h4>
                            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                                {myCustomers.map(customer => (
                                     <button
                                        key={customer.id}
                                        onClick={() => setSelectedCustomerId(customer.id)}
                                        className={`w-full text-left px-3 py-2 rounded-md transition-colors truncate flex items-center gap-2 ${selectedCustomerId === customer.id ? 'bg-indigo-100 text-indigo-700 font-semibold' : 'hover:bg-slate-100 text-slate-600'}`}
                                        title={customer.name}
                                    >
                                        <span className={`h-2 w-2 rounded-full flex-shrink-0 ${selectedCustomerId === customer.id ? 'bg-indigo-500' : 'bg-slate-300'}`}></span>
                                        <span className="truncate">{customer.name}</span>
                                    </button>
                                ))}
                                {myCustomers.length === 0 && <p className="px-3 text-sm text-slate-400">No customers assigned.</p>}
                            </div>
                        </div>
                    </div>

                    {!isSidebarOpen && (
                         <div className="flex flex-col gap-4 w-full items-center mt-2 animate-fadeIn">
                             <button
                                onClick={() => { setSelectedCustomerId(null); }}
                                className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${selectedCustomerId === null ? 'bg-indigo-100 text-indigo-700' : 'text-slate-500 hover:bg-slate-100'}`}
                                title="My Personal Tasks"
                            >
                                <span className="font-bold text-xs">Me</span>
                            </button>
                            
                            <div className="w-full border-t border-slate-200 my-1"></div>

                            {selectedCustomerId && (
                                <div 
                                    className="w-8 h-8 flex items-center justify-center rounded-md bg-indigo-100 text-indigo-700 font-bold text-xs cursor-default"
                                    title={myCustomers.find(c => c.id === selectedCustomerId)?.name}
                                >
                                    {myCustomers.find(c => c.id === selectedCustomerId)?.name.substring(0,2).toUpperCase()}
                                </div>
                            )}
                         </div>
                    )}

                </Card>
            </div>
            
            <div className="flex-grow w-full min-w-0">
                <Agenda 
                    key={selectedCustomerId || csmId} 
                    entityId={selectedCustomerId || csmId} 
                    entityType={selectedCustomerId ? 'customer' : 'csm'} 
                    canEdit={canEdit}
                />
            </div>
        </div>
    );
};

export default CSMView;
