import React, { useState, useEffect } from 'react';
import { useAppContext } from './AppContext';
import { Card, Button, TrashIcon, PencilIcon } from './ui';
import { CSM, Customer } from '../types';

const SettingsView: React.FC = () => {
    const { 
        csms, setCsms, 
        customers, setCustomers,
        setTaskCompletions,
        setActionItems,
        setBugReports,
        setFeatureRequests,
        setMeetingNotes,
        apiKey, setApiKey
    } = useAppContext();
    
    // CSM Management
    const [csmName, setCsmName] = useState('');
    const [editingCsm, setEditingCsm] = useState<CSM | null>(null);
    
    // Customer Management
    const [customerName, setCustomerName] = useState('');
    const [assignedCsmId, setAssignedCsmId] = useState<string>('');
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    // API Key Management
    const [tempApiKey, setTempApiKey] = useState(apiKey || '');

    useEffect(() => {
        if (csms.length > 0 && !assignedCsmId) {
            setAssignedCsmId(csms[0].id);
        }
    }, [csms, assignedCsmId]);
    
    useEffect(() => {
        setTempApiKey(apiKey || '');
    }, [apiKey]);


    // Handlers for CSM
    const handleCsmSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!csmName) return;

        if (editingCsm) {
            setCsms(prev => prev.map(c => c.id === editingCsm.id ? { ...c, name: csmName } : c));
            setEditingCsm(null);
        } else {
            const newCsm: CSM = { id: `csm_${Date.now()}`, name: csmName };
            setCsms(prev => [...prev, newCsm]);
        }
        setCsmName('');
    };

    const handleEditCsm = (csm: CSM) => {
        setEditingCsm(csm);
        setCsmName(csm.name);
    };

    const handleDeleteCsm = (csmId: string) => {
        if (window.confirm('Are you sure? This will also unassign their customers.')) {
            setCsms(prev => prev.filter(c => c.id !== csmId));
            setCustomers(prev => prev.map(cust => cust.assignedCsmId === csmId ? { ...cust, assignedCsmId: '' } : cust));
        }
    };
    
    // Handlers for Customer
    const handleCustomerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName || !assignedCsmId) return;

        if (editingCustomer) {
            setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, name: customerName, assignedCsmId } : c));
            setEditingCustomer(null);
        } else {
            const newCustomer: Customer = { id: `cust_${Date.now()}`, name: customerName, assignedCsmId };
            setCustomers(prev => [...prev, newCustomer]);
        }
        setCustomerName('');
        setAssignedCsmId(csms[0]?.id || '');
    };
    
    const handleEditCustomer = (customer: Customer) => {
        setEditingCustomer(customer);
        setCustomerName(customer.name);
        setAssignedCsmId(customer.assignedCsmId);
    };

    const handleDeleteCustomer = (customerId: string) => {
        if (window.confirm('Are you sure? This will delete the customer and all their associated data (task completions, notes, bugs, etc.).')) {
            setCustomers(prev => prev.filter(c => c.id !== customerId));
            setTaskCompletions(prev => prev.filter(tc => tc.customerId !== customerId));
            setActionItems(prev => prev.filter(ai => ai.customerId !== customerId));
            setBugReports(prev => prev.filter(b => b.customerId !== customerId));
            setFeatureRequests(prev => prev.filter(fr => fr.customerId !== customerId));
            setMeetingNotes(prev => prev.filter(n => n.customerId !== customerId));
        }
    };
    
    const handleApiKeySave = () => {
        setApiKey(tempApiKey);
        alert('API Key updated!');
    };

    return (
        <div className="space-y-8">
             {/* API Key Management */}
             <Card>
                <h2 className="text-2xl font-bold text-slate-800 mb-4">API Settings</h2>
                <div>
                    <label htmlFor="api-key-settings" className="block text-sm font-medium text-slate-700 mb-1">Google AI API Key</label>
                    <div className="flex gap-2">
                        <input
                            id="api-key-settings"
                            type="password"
                            value={tempApiKey}
                            onChange={e => setTempApiKey(e.target.value)}
                            placeholder="Enter your API key"
                            className="flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <Button onClick={handleApiKeySave}>Save</Button>
                    </div>
                </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* CSM Management */}
                <Card>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Manage CSMs</h2>
                    <form onSubmit={handleCsmSubmit} className="flex gap-2 mb-4">
                        <input 
                            type="text" 
                            value={csmName}
                            onChange={e => setCsmName(e.target.value)}
                            placeholder="Enter CSM name"
                            className="flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <Button type="submit">{editingCsm ? 'Update' : 'Add'}</Button>
                        {editingCsm && <Button type="button" variant="secondary" onClick={() => { setEditingCsm(null); setCsmName(''); }}>Cancel</Button>}
                    </form>
                    <ul className="space-y-2">
                        {csms.map(csm => (
                            <li key={csm.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                                <span>{csm.name}</span>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => handleEditCsm(csm)} className="p-2"><PencilIcon/></Button>
                                    <Button variant="danger" onClick={() => handleDeleteCsm(csm.id)} className="p-2"><TrashIcon/></Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* Customer Management */}
                <Card>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Manage Customers</h2>
                    <form onSubmit={handleCustomerSubmit} className="space-y-4 mb-4">
                        <input 
                            type="text" 
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="Enter customer name"
                            className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                        <select 
                            value={assignedCsmId} 
                            onChange={e => setAssignedCsmId(e.target.value)}
                            className="w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            disabled={csms.length === 0}
                        >
                            <option value="">{csms.length > 0 ? 'Select a CSM' : 'Please add a CSM first'}</option>
                            {csms.map(csm => <option key={csm.id} value={csm.id}>{csm.name}</option>)}
                        </select>
                        <div className="flex justify-end gap-2">
                            <Button type="submit" disabled={csms.length === 0}>{editingCustomer ? 'Update' : 'Add'}</Button>
                            {editingCustomer && <Button type="button" variant="secondary" onClick={() => { setEditingCustomer(null); setCustomerName(''); setAssignedCsmId(csms[0]?.id || ''); }}>Cancel</Button>}
                        </div>
                    </form>
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {customers.map(customer => (
                            <li key={customer.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                                <div>
                                    <p>{customer.name}</p>
                                    <p className="text-sm text-slate-500">{csms.find(c => c.id === customer.assignedCsmId)?.name || 'Unassigned'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => handleEditCustomer(customer)} className="p-2"><PencilIcon/></Button>
                                    <Button variant="danger" onClick={() => handleDeleteCustomer(customer.id)} className="p-2"><TrashIcon/></Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
        </div>
    );
};

export default SettingsView;
