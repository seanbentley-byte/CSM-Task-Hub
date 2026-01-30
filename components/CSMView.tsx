
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useAppContext } from './AppContext';
import { Card, Button, CheckCircleIcon, SearchIcon, SparklesIcon, TrashIcon, BugAntIcon, LightBulbIcon, LinkIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, UsersIcon, MarkdownRenderer, PencilIcon } from './ui';
import { Task, CSMInputType, TaskCompletion, ActionItem, BugReport, FeatureRequest, Objective, TaskUrgency } from '../types';
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
        <div className="flex flex-col bg-white rounded-md border border-slate-200 overflow-hidden transition-all duration-200 group">
            <div className={`flex items-center justify-between p-3 min-w-0 ${isExpanded ? 'bg-indigo-50/30' : 'hover:bg-slate-50'}`}>
                <div className="flex items-center flex-grow gap-3 min-w-0 mr-2">
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
                            className="flex-grow p-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-0"
                            onClick={e => e.stopPropagation()}
                        />
                    ) : (
                        <div className="flex flex-wrap items-center gap-2 flex-grow min-w-0 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                            <span 
                                className={`text-sm font-medium break-words max-w-full ${item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-700'}`}
                            >
                                {item.text}
                            </span>
                            {item.dueDate && (
                                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded uppercase tracking-tight whitespace-nowrap">
                                    {formatDate(item.dueDate)}
                                </span>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
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
                <div className="px-10 pb-3 pt-1 border-t border-slate-100 bg-slate-50 animate-fadeIn overflow-hidden">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="min-w-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Added</span>
                            <p className="text-xs text-slate-600 truncate">{formatDateTime(item.createdAt)}</p>
                        </div>
                        {item.dueDate && (
                            <div className="min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Date</span>
                                <p className="text-xs text-slate-600 truncate">{formatDate(item.dueDate)}</p>
                            </div>
                        )}
                        {item.isCompleted && item.completedAt && (
                             <div className="col-span-2 min-w-0">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed On</span>
                                <p className="text-xs text-green-600 truncate">{formatDateTime(item.completedAt)}</p>
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
        <div className="flex items-center justify-between p-2 bg-white rounded-md group hover:shadow-sm border border-transparent hover:border-slate-200 transition-all overflow-hidden">
            <div className="flex items-center flex-grow gap-3 min-w-0 mr-2">
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
                        className="flex-grow p-1 text-sm border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 min-w-0"
                    />
                ) : (
                    <span 
                        onClick={() => canEdit && !item.isCompleted && setIsEditing(true)} 
                        className={`flex-grow text-sm break-words ${item.isCompleted ? 'text-slate-500 line-through' : 'text-slate-700'} ${canEdit && !item.isCompleted ? 'cursor-pointer hover:text-indigo-600' : ''}`}
                        title={canEdit && !item.isCompleted ? "Click to edit" : ""}
                    >
                        {item.text}
                    </span>
                )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                {canEdit && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                     <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                        {formatDateTime(item.completedAt)}
                     </span>
                )}
            </div>
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
            <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 space-y-2 overflow-hidden">
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-md group hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all overflow-hidden gap-2">
            <div 
                className={`flex-grow min-w-0 ${canEdit && !item.isCompleted ? 'cursor-pointer' : ''}`} 
                onClick={() => canEdit && !item.isCompleted && setIsEditing(true)}
                title={canEdit && !item.isCompleted ? "Click to edit" : ""}
            >
                <p className={`text-sm break-words ${item.isCompleted ? 'line-through text-slate-500' : 'text-slate-800 group-hover:text-indigo-700 font-medium'}`}>
                    {item.name}
                </p>
                {item.ticketLink && (
                    <a 
                        href={item.ticketLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1 w-fit whitespace-nowrap overflow-hidden"
                        onClick={(e) => e.stopPropagation()} 
                    >
                        <LinkIcon /> <span className="truncate max-w-[150px]">View Ticket</span>
                    </a>
                )}
            </div>
            <div className="flex gap-2 items-center flex-shrink-0 self-end sm:self-auto">
                {canEdit && !item.isCompleted && (
                     <Button variant="secondary" onClick={() => onComplete(item.id)} className="text-xs py-1 px-3 h-8">Complete</Button>
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
                     <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
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
    // fix: Correct state declaration with destructuring [isEditing, setIsEditing] = useState(false)
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
            <div className="p-3 bg-indigo-50 rounded-md border border-indigo-200 space-y-2 overflow-hidden">
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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-md group hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all overflow-hidden gap-2">
             <div 
                className={`flex-grow min-w-0 ${canEdit && !item.isCompleted ? 'cursor-pointer' : ''}`} 
                onClick={() => canEdit && !item.isCompleted && setIsEditing(true)} 
                title={canEdit && !item.isCompleted ? "Click to edit" : ""}
            >
                <p className={`text-sm break-words ${item.isCompleted ? 'line-through text-slate-500' : 'text-slate-800 group-hover:text-indigo-700 font-medium'}`}>
                    {item.text}
                </p>
                {item.ticketLink && (
                    <a 
                        href={item.ticketLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1 w-fit whitespace-nowrap overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <LinkIcon /> <span className="truncate max-w-[150px]">View Ticket</span>
                    </a>
                )}
            </div>
            <div className="flex gap-2 items-center flex-shrink-0 self-end sm:self-auto">
                 {canEdit && !item.isCompleted && (
                     <Button variant="secondary" onClick={() => onComplete(item.id)} className="text-xs py-1 px-3 h-8">Complete</Button>
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
                     <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
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
        <div className="mt-2 p-4 bg-slate-50 rounded-lg space-y-4 border border-slate-200 overflow-hidden">
            <div className="bg-white p-3 rounded border border-slate-100 shadow-sm overflow-hidden">
                <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Task Details</h5>
                <MarkdownRenderer content={task.description} className="text-sm text-slate-700 leading-relaxed" />
            </div>

            {hasCheckbox && (
                <div className="flex items-center p-1">
                    <input 
                        id={`complete-${task.id}-${customerId || csmId}`} 
                        type="checkbox" 
                        checked={isCompleted} 
                        onChange={e => setIsCompleted(e.target.checked)} 
                        disabled={!canEdit}
                        className="h-5 w-5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500 cursor-pointer disabled:opacity-50" 
                    />
                    <label htmlFor={`complete-${task.id}-${customerId || csmId}`} className="ml-3 block text-sm font-semibold text-slate-700 cursor-pointer">Mark as Complete</label>
                </div>
            )}
            {hasMultiSelect && task.multiSelectOptions && (
                 <div className="p-1">
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tighter text-[10px]">Your Response:</label>
                    <select
                        value={selectedOptions[0] || ''}
                        onChange={handleMultiSelectChange}
                        disabled={!canEdit}
                        className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm disabled:bg-slate-100 disabled:text-slate-500"
                    >
                        <option value="">Select an option...</option>
                        {task.multiSelectOptions.map(opt => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                    </select>
                </div>
            )}
            {hasTextArea && (
                <div className="p-1">
                    <label htmlFor={`notes-${task.id}-${customerId || csmId}`} className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-tighter text-[10px]">Additional Notes:</label>
                    <textarea 
                        id={`notes-${task.id}-${customerId || csmId}`} 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)} 
                        disabled={!canEdit}
                        rows={3} 
                        className="mt-1 block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-slate-100 break-words"
                        placeholder="Type any relevant information here..."
                    ></textarea>
                </div>
            )}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <Button variant="secondary" onClick={onCancel}>Cancel</Button>
                {canEdit && <Button onClick={handleSave}>Save Completion</Button>}
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
        meetingNotes, setMeetingNotes
    } = useAppContext();
    
    const isCsmView = entityType === 'csm';
    
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
    const [showOlderCompleted, setShowOlderCompleted] = useState(false);
    const [showCompletedBugs, setShowCompletedBugs] = useState(false);
    const [showCompletedFeatures, setShowCompletedFeatures] = useState(false);
    const [showArchivedObjectives, setShowArchivedObjectives] = useState(false);
    const [showCompletedManagerTasks, setShowCompletedManagerTasks] = useState(false);
    const [isObjectivesSectionOpen, setIsObjectivesSectionOpen] = useState(false);
    const [isActionItemsSectionOpen, setIsActionItemsSectionOpen] = useState(true);
    const [isManagerTasksOpen, setIsManagerTasksOpen] = useState(true);
    
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
    
    const urgencyMap: Record<TaskUrgency, number> = {
        [TaskUrgency.High]: 0,
        [TaskUrgency.Normal]: 1,
        [TaskUrgency.Low]: 2,
    };

    const sortedManagerTasks = useMemo(() => {
        return tasks.filter(t => {
            if (t.isArchived) return false;
            
            if (isCsmView) {
                return t.assignmentType === 'csm' && t.assignedCsmIds?.includes(entityId)
            }
            return t.assignmentType === 'customer' && t.assignedCustomerIds.includes(entityId)
        }).sort((a, b) => {
            // Sort by Urgency first
            const urgencyA = urgencyMap[a.urgency || TaskUrgency.Normal];
            const urgencyB = urgencyMap[b.urgency || TaskUrgency.Normal];
            if (urgencyA !== urgencyB) return urgencyA - urgencyB;
            
            // Sort by Due Date second
            return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
    }, [tasks, entityId, isCsmView]);

    const activeManagerTasks = useMemo(() => {
        return sortedManagerTasks.filter(task => {
            const completion = taskCompletions.find(tc => tc.taskId === task.id && (isCsmView ? tc.csmId === entityId : tc.customerId === entityId));
            return !completion?.isCompleted;
        });
    }, [sortedManagerTasks, taskCompletions, entityId, isCsmView]);

    const completedManagerTasks = useMemo(() => {
        return sortedManagerTasks.filter(task => {
            const completion = taskCompletions.find(tc => tc.taskId === task.id && (isCsmView ? tc.csmId === entityId : tc.customerId === entityId));
            return completion?.isCompleted;
        });
    }, [sortedManagerTasks, taskCompletions, entityId, isCsmView]);

    const handleSummarizeNotes = async () => {
         if (!currentNotes || !canEdit) return;
        setIsSummarizing(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
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
            alert("Failed to summarize notes.");
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
    
    if (!entity) return <div className="flex-grow flex items-center justify-center text-slate-500 py-12">Select an item to see the agenda.</div>;

    const renderTaskCard = (task: Task) => {
        const completion = taskCompletions.find(tc => tc.taskId === task.id && (isCsmView ? tc.csmId === entityId : tc.customerId === entity.id));
        const isEditing = editingTaskId === task.id;
        const isComplete = completion?.isCompleted || false;

        const getUrgencyColor = (urgency: TaskUrgency) => {
            switch (urgency) {
                case TaskUrgency.High: return 'bg-red-600 text-white';
                case TaskUrgency.Normal: return 'bg-yellow-500 text-white';
                case TaskUrgency.Low: return 'bg-slate-400 text-white';
                default: return 'bg-slate-400 text-white';
            }
        };

        return (
            <div key={task.id} className={`p-4 rounded-md border overflow-hidden transition-all duration-200 ${isComplete ? 'bg-green-50/50 border-green-200 shadow-sm opacity-75' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div className="flex items-start flex-grow min-w-0 w-full">
                        {isComplete ? <CheckCircleIcon className="h-6 w-6 text-green-500 mr-3 mt-0.5 flex-shrink-0" /> : <div className="h-6 w-6 border-2 border-slate-300 rounded-full mr-3 mt-0.5 flex-shrink-0 bg-white"></div>}
                        <div className="flex-grow min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <p className="font-bold text-slate-800 text-lg break-words leading-tight">{task.title}</p>
                                <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider ${getUrgencyColor(task.urgency)}`}>{task.urgency}</span>
                            </div>
                            
                            <div className="mt-1 mb-3">
                                <MarkdownRenderer content={task.description} className="text-slate-600 text-sm leading-relaxed" />
                            </div>

                            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold">
                                <span className={`px-2 py-0.5 rounded ${new Date(task.dueDate) < new Date() && !isComplete ? 'text-red-600 bg-red-50' : 'text-slate-500 bg-slate-100'}`}>
                                    Due: {formatDate(task.dueDate)}
                                </span>
                                {isComplete && <span className="text-green-600 font-bold uppercase tracking-wider text-[10px]">Complete</span>}
                            </div>

                            {isComplete && completion && (
                                <div className="mt-4 p-3 bg-white/60 rounded border border-green-100 text-xs text-slate-600 italic space-y-2 overflow-hidden">
                                    {task.csmInputTypes.includes(CSMInputType.TextArea) && completion.notes && <p className="break-words"><strong>Note:</strong> "{completion.notes}"</p>}
                                    {task.csmInputTypes.includes(CSMInputType.MultiSelect) && completion.selectedOptions &&
                                        <p><strong>Response:</strong> <span className="font-bold not-italic text-slate-800">{completion.selectedOptions?.map(optId => task.multiSelectOptions?.find(o => o.id === optId)?.label).join(', ')}</span></p>
                                    }
                                </div>
                            )}
                        </div>
                    </div>
                    {!isEditing && canEdit && (
                        <Button variant={isComplete ? "secondary" : "primary"} onClick={() => setEditingTaskId(task.id)} className="w-full sm:w-auto flex-shrink-0 shadow-none">
                            {isComplete ? 'Update' : 'Complete Task'}
                        </Button>
                    )}
                </div>
                {isEditing && canEdit && (
                    <div className="mt-6 border-t border-slate-100 pt-4">
                        <TaskCompletionForm 
                            task={task} 
                            customerId={isCsmView ? undefined : entityId}
                            csmId={isCsmView ? entityId : undefined}
                            existingCompletion={completion} 
                            onSave={(data) => handleSaveCompletion(task.id, data)}
                            onCancel={() => setEditingTaskId(null)}
                            canEdit={canEdit}
                        />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex-grow space-y-6 pb-12 overflow-hidden">
            {/* 1. COLLAPSIBLE OBJECTIVES SECTION */}
            <details 
                className="bg-white shadow-sm rounded-lg overflow-hidden transition-all duration-300 open:ring-2 open:ring-indigo-100" 
                onToggle={(e) => setIsObjectivesSectionOpen((e.target as HTMLDetailsElement).open)}
                open={isObjectivesSectionOpen}
            >
                <summary className="p-5 font-bold text-slate-800 text-xl cursor-pointer flex items-center justify-between list-none">
                    <div className="flex items-center gap-2">
                         Objectives ({activeObjectives.length})
                    </div>
                    <ChevronDownIcon className={`transition-transform transform ${isObjectivesSectionOpen ? 'rotate-180' : ''}`} />
                </summary>
                <div className="p-5 pt-0 overflow-hidden">
                    {canEdit && (
                        <form onSubmit={handleAddObjective} className="flex flex-col sm:flex-row gap-3 mb-6 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                            <input 
                                type="text" 
                                value={newObjective} 
                                onChange={e => setNewObjective(e.target.value)} 
                                placeholder="What is the goal?..." 
                                className="flex-grow p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-w-0" 
                            />
                            <div className="flex gap-2">
                                <input 
                                    type="date" 
                                    value={objectiveDate} 
                                    onChange={e => setObjectiveDate(e.target.value)} 
                                    className="p-2.5 border border-slate-200 rounded-md text-sm text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none flex-1" 
                                />
                                <Button type="submit" className="flex-shrink-0">Set Objective</Button>
                            </div>
                        </form>
                    )}
                    <div className="space-y-3 overflow-hidden">
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
                        {activeObjectives.length === 0 && <p className="text-slate-400 text-sm italic text-center py-6 bg-slate-50/50 rounded-lg">No active objectives.</p>}
                    </div>
                    
                    {completedObjectives.length > 0 && (
                        <div className="mt-6 border-t border-slate-100 pt-4">
                            <button 
                                onClick={() => setShowArchivedObjectives(!showArchivedObjectives)}
                                className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                            >
                                <ChevronDownIcon className={`w-3 h-3 transform transition-transform ${showArchivedObjectives ? 'rotate-180' : ''}`} />
                                View Archived Objectives ({completedObjectives.length})
                            </button>
                            {showArchivedObjectives && (
                                <div className="mt-3 space-y-2 animate-fadeIn overflow-hidden">
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
                </div>
            </details>

            {/* 2. COLLAPSIBLE ACTION ITEMS SECTION */}
            <details 
                className="bg-white shadow-sm rounded-lg overflow-hidden transition-all duration-300 open:ring-2 open:ring-indigo-100" 
                onToggle={(e) => setIsActionItemsSectionOpen((e.target as HTMLDetailsElement).open)}
                open={isActionItemsSectionOpen}
            >
                <summary className="p-5 font-bold text-slate-800 text-xl cursor-pointer flex items-center justify-between list-none">
                    <div className="flex items-center gap-2">
                        Action Items ({incompleteActionItems.length})
                    </div>
                    <ChevronDownIcon className={`transition-transform transform ${isActionItemsSectionOpen ? 'rotate-180' : ''}`} />
                </summary>
                <div className="p-5 pt-0 overflow-hidden">
                    {canEdit && (
                        <form onSubmit={handleAddActionItem} className="flex gap-2 mb-6 p-4 bg-indigo-50/50 rounded-lg border border-indigo-100">
                            <input type="text" value={newActionItem} onChange={e => setNewActionItem(e.target.value)} placeholder="Add a new action item..." className="flex-grow p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-w-0" />
                            <Button type="submit" className="flex-shrink-0">Add Item</Button>
                        </form>
                    )}
                    <div className="space-y-2 overflow-hidden">
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
                        {incompleteActionItems.length === 0 && <p className="text-slate-400 text-sm italic text-center py-6 bg-slate-50/50 rounded-lg">All items completed!</p>}
                    </div>
                    {completedActionItems.length > 0 && (
                        <div className="mt-6 border-t border-slate-100 pt-4 space-y-2 overflow-hidden">
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
                                <Button variant="secondary" onClick={() => setShowOlderCompleted(!showOlderCompleted)} className="w-full mt-2 py-1 text-xs">
                                    {showOlderCompleted ? 'Hide History' : `Show ${completedActionItems.length - 3} Previous Items`}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </details>

            {/* 3. COLLAPSIBLE MANAGER TASKS SECTION */}
            <details 
                className="bg-white shadow-sm rounded-lg overflow-hidden transition-all duration-300 open:ring-2 open:ring-indigo-100" 
                onToggle={(e) => setIsManagerTasksOpen((e.target as HTMLDetailsElement).open)}
                open={isManagerTasksOpen}
            >
                <summary className="p-5 font-bold text-slate-800 text-xl cursor-pointer flex items-center justify-between list-none">
                    <div className="flex items-center gap-2">
                         Assigned Tasks ({activeManagerTasks.length})
                    </div>
                    <ChevronDownIcon className={`transition-transform transform ${isManagerTasksOpen ? 'rotate-180' : ''}`} />
                </summary>
                <div className="p-5 pt-0 overflow-hidden">
                    <div className="space-y-4 overflow-hidden">
                        {activeManagerTasks.map(task => renderTaskCard(task))}
                        
                        {activeManagerTasks.length === 0 && (
                            <div className="text-center py-8 bg-slate-50/50 rounded-lg border border-dashed border-slate-300">
                                <p className="text-slate-400 italic">No incomplete tasks assigned.</p>
                            </div>
                        )}

                        {completedManagerTasks.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <button 
                                    onClick={() => setShowCompletedManagerTasks(!showCompletedManagerTasks)}
                                    className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                                >
                                    <ChevronDownIcon className={`w-3 h-3 transform transition-transform ${showCompletedManagerTasks ? 'rotate-180' : ''}`} />
                                    Archived Tasks ({completedManagerTasks.length})
                                </button>
                                {showCompletedManagerTasks && (
                                    <div className="mt-3 space-y-4 animate-fadeIn">
                                        {completedManagerTasks.map(task => renderTaskCard(task))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </details>

            {/* 4. OPEN BUGS SECTION */}
            <details className="bg-white shadow-sm rounded-lg overflow-hidden transition-all duration-300 open:ring-2 open:ring-indigo-100" onToggle={(e) => setIsBugsSectionOpen((e.target as HTMLDetailsElement).open)} open={isBugsSectionOpen}>
                <summary className="p-5 font-bold text-slate-800 text-xl cursor-pointer flex items-center justify-between list-none">
                    <div className="flex items-center gap-2">
                        <BugAntIcon /> Open Bugs ({openBugs.length})
                    </div>
                    <ChevronDownIcon className={`transition-transform transform ${isBugsSectionOpen ? 'rotate-180' : ''}`} />
                </summary>
                <div className="p-5 pt-0 overflow-hidden">
                    {canEdit && (
                        <form onSubmit={handleAddBug} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 p-4 bg-red-50/30 rounded-lg border border-red-100">
                            <input type="text" value={newBugName} onChange={e => setNewBugName(e.target.value)} placeholder="Bug description..." className="p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-red-400 outline-none text-sm min-w-0" required />
                            <div className="flex gap-2">
                                <input type="text" value={newBugLink} onChange={e => setNewBugLink(e.target.value)} placeholder="Ticket link (URL)..." className="flex-grow p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-red-400 outline-none text-sm min-w-0" />
                                <Button type="submit" variant="primary" className="bg-red-600 hover:bg-red-700">Add Bug</Button>
                            </div>
                        </form>
                    )}
                    <div className="space-y-1 overflow-hidden">
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
                        {openBugs.length === 0 && <p className="text-slate-400 text-sm italic text-center py-6 bg-slate-50/50 rounded-lg">Clean slate! No open bugs.</p>}
                    </div>
                    {completedBugs.length > 0 && (
                        <div className="mt-6 border-t border-slate-100 pt-4 overflow-hidden">
                            <button 
                                onClick={() => setShowCompletedBugs(!showCompletedBugs)}
                                className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                            >
                                <ChevronDownIcon className={`w-3 h-3 transform transition-transform ${showCompletedBugs ? 'rotate-180' : ''}`} />
                                Resolved Bugs ({completedBugs.length})
                            </button>
                            {showCompletedBugs && (
                                <div className="mt-3 space-y-1 animate-fadeIn overflow-hidden">
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
                        </div>
                    )}
                </div>
            </details>
            
            {/* 5. FEATURE REQUESTS SECTION */}
            <details className="bg-white shadow-sm rounded-lg overflow-hidden transition-all duration-300 open:ring-2 open:ring-indigo-100">
                <summary className="p-5 font-bold text-slate-800 text-xl cursor-pointer flex items-center justify-between list-none">
                     <div className="flex items-center gap-2">
                        <LightBulbIcon /> Feature Requests ({openFeatures.length})
                    </div>
                    <ChevronDownIcon className="transition-transform transform details-open:-rotate-180" />
                </summary>
                <div className="p-5 pt-0 overflow-hidden">
                    {canEdit && (
                        <form onSubmit={handleAddFeatureRequest} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6 p-4 bg-indigo-50/30 rounded-lg border border-indigo-100">
                            <input type="text" value={newFeatureRequest} onChange={e => setNewFeatureRequest(e.target.value)} placeholder="What functionality is missing?..." className="p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-w-0" required />
                            <div className="flex gap-2">
                                <input type="text" value={newFeatureLink} onChange={e => setNewFeatureLink(e.target.value)} placeholder="Tracking link (optional)..." className="flex-grow p-2.5 border border-slate-200 rounded-md focus:ring-2 focus:ring-indigo-500 outline-none text-sm min-w-0" />
                                <Button type="submit">Add Request</Button>
                            </div>
                        </form>
                    )}
                    <div className="space-y-1 overflow-hidden">
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
                        {openFeatures.length === 0 && <p className="text-slate-400 text-sm italic text-center py-6 bg-slate-50/50 rounded-lg">No pending feature requests.</p>}
                    </div>

                    {completedFeatures.length > 0 && (
                        <div className="mt-6 border-t border-slate-100 pt-4 overflow-hidden">
                            <button 
                                onClick={() => setShowCompletedFeatures(!showCompletedFeatures)}
                                className="flex items-center gap-2 text-[10px] font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                            >
                                <ChevronDownIcon className={`w-3 h-3 transform transition-transform ${showCompletedFeatures ? 'rotate-180' : ''}`} />
                                Released Features ({completedFeatures.length})
                            </button>
                            {showCompletedFeatures && (
                                <div className="mt-3 space-y-1 animate-fadeIn overflow-hidden">
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
                        </div>
                    )}
                </div>
            </details>

            {/* 6. NOTES SECTION */}
            <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-200">
                <div className="flex justify-between items-center mb-4">
                     <h2 className="text-xl font-bold text-slate-800">{isCsmView ? 'Personal Work Notes' : 'Customer Account Notes'}</h2>
                     {isSavingNotes && <span className="text-[10px] font-bold text-indigo-500 animate-pulse uppercase tracking-widest">Saving Changes...</span>}
                </div>
                 <textarea 
                    value={currentNotes} 
                    onChange={e => setCurrentNotes(e.target.value)} 
                    disabled={!canEdit}
                    rows={8} 
                    className="w-full p-4 border border-slate-200 rounded-md disabled:bg-slate-50 disabled:text-slate-600 focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all shadow-inner leading-relaxed" 
                    placeholder={canEdit ? "Start typing account updates or meeting notes here... (Changes are saved automatically)" : "No notes available for this account."}
                ></textarea>
                 {canEdit && (
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="secondary" onClick={handleSummarizeNotes} disabled={isSummarizing || !currentNotes} className="shadow-none border-slate-200">
                            <SparklesIcon /> {isSummarizing ? 'Analyzing...' : 'AI Summary'}
                        </Button>
                    </div>
                 )}
            </Card>
        </div>
    );
};

const CSMView: React.FC<{ csmId: string }> = ({ csmId }) => {
    const { customers, users, currentUser, tasks, taskCompletions } = useAppContext();
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

    // Counter helper for manager assigned tasks
    const getIncompleteTaskCount = (entityId: string, entityType: 'csm' | 'customer') => {
        return tasks.filter(task => {
            if (task.isArchived) return false;
            
            const isAssigned = entityType === 'csm'
                ? (task.assignmentType === 'csm' && task.assignedCsmIds?.includes(entityId))
                : (task.assignmentType === 'customer' && task.assignedCustomerIds.includes(entityId));
            
            if (!isAssigned) return false;

            const completion = taskCompletions.find(tc => 
                tc.taskId === task.id && 
                (entityType === 'csm' ? tc.csmId === entityId : tc.customerId === entityId)
            );
            return !completion?.isCompleted;
        }).length;
    };

    return (
        <div className="flex flex-col md:flex-row gap-6 transition-all duration-300 ease-in-out min-h-[calc(100vh-12rem)]">
            <div 
                className={`transition-all duration-300 ease-in-out flex-shrink-0 ${
                    isSidebarOpen ? 'w-full md:w-1/4' : 'w-full md:w-16'
                }`}
            >
                <Card className={`p-4 h-full flex flex-col shadow-none ring-1 ring-slate-200 ${!isSidebarOpen ? 'items-center' : ''}`}>
                    <div className={`flex items-center ${isSidebarOpen ? 'justify-between' : 'justify-center'} mb-6 pb-4 border-b border-slate-100`}>
                        {isSidebarOpen && (
                            <div className="min-w-0">
                                <h3 className="font-bold text-slate-800 truncate" title={viewingUser?.name}>
                                    {viewingUser?.name || 'CSM'}
                                </h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">Dashboard</p>
                            </div>
                        )}
                        <button 
                            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                            className="text-slate-400 hover:text-indigo-600 p-2 rounded-md hover:bg-slate-50 transition-colors flex-shrink-0"
                            title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                        >
                            {isSidebarOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                        </button>
                    </div>
                    
                    <div className={`space-y-6 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 hidden'} transition-opacity duration-200 flex-grow overflow-y-auto`}>
                        <div className="space-y-1">
                             <button
                                onClick={() => setSelectedCustomerId(null)}
                                className={`w-full text-left px-3 py-2.5 rounded-md transition-all flex items-center gap-3 group ${selectedCustomerId === null ? 'bg-indigo-600 text-white font-bold shadow-md' : 'hover:bg-slate-100 text-slate-600'}`}
                            >
                                {(() => {
                                    const count = getIncompleteTaskCount(csmId, 'csm');
                                    return (
                                        <div className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold ${selectedCustomerId === null ? 'bg-white text-indigo-700' : (count > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500')}`}>
                                            {count}
                                        </div>
                                    );
                                })()}
                                <span className="text-sm">My Personal Work</span>
                            </button>
                        </div>
                        
                        <div>
                            <div className="flex items-center justify-between mb-3 px-3">
                                <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest">Portfolio</h4>
                                <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-bold">{myCustomers.length}</span>
                            </div>
                            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                                {myCustomers.map(customer => {
                                    const count = getIncompleteTaskCount(customer.id, 'customer');
                                    const isSelected = selectedCustomerId === customer.id;
                                    return (
                                         <button
                                            key={customer.id}
                                            onClick={() => setSelectedCustomerId(customer.id)}
                                            className={`w-full text-left px-3 py-2.5 rounded-md transition-all truncate flex items-center gap-3 group ${isSelected ? 'bg-indigo-600 text-white font-bold shadow-md' : 'hover:bg-slate-100 text-slate-600'}`}
                                            title={customer.name}
                                        >
                                            <div className={`flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full text-[10px] font-bold ${isSelected ? 'bg-white text-indigo-700' : (count > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-500')}`}>
                                                {count}
                                            </div>
                                            <span className="truncate text-sm">{customer.name}</span>
                                        </button>
                                    );
                                })}
                                {myCustomers.length === 0 && <p className="px-3 text-sm text-slate-400 italic">No assigned customers.</p>}
                            </div>
                        </div>
                    </div>

                    {!isSidebarOpen && (
                         <div className="flex flex-col gap-4 w-full items-center mt-2 animate-fadeIn overflow-hidden">
                             <button
                                onClick={() => { setSelectedCustomerId(null); }}
                                className={`w-10 h-10 flex flex-col items-center justify-center rounded-lg transition-all relative ${selectedCustomerId === null ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}
                                title="My Personal Tasks"
                            >
                                <span className="font-bold text-[10px] uppercase">Me</span>
                                {(() => {
                                    const count = getIncompleteTaskCount(csmId, 'csm');
                                    return count > 0 && (
                                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-1 rounded-full border border-white">
                                            {count}
                                        </div>
                                    );
                                })()}
                            </button>
                            
                            <div className="w-8 border-t border-slate-200 my-2"></div>

                            <div className="flex flex-col gap-2 overflow-y-auto max-h-[60vh]">
                                {myCustomers.map(c => {
                                    const count = getIncompleteTaskCount(c.id, 'customer');
                                    const isSelected = selectedCustomerId === c.id;
                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => setSelectedCustomerId(c.id)}
                                            className={`w-10 h-10 flex flex-shrink-0 items-center justify-center rounded-lg transition-all font-bold text-xs relative ${isSelected ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                            title={c.name}
                                        >
                                            {c.name.substring(0,2).toUpperCase()}
                                            {count > 0 && (
                                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] px-1 rounded-full border border-white">
                                                    {count}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                         </div>
                    )}

                </Card>
            </div>
            
            <div className="flex-grow w-full min-w-0 overflow-hidden">
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
