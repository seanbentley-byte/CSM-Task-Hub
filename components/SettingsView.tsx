import React, { useState, useMemo } from 'react';
import { useAppContext } from './AppContext';
import { Card, Button } from './ui';
import { Customer, CSM } from '../types';

const SettingsView: React.FC = () => {
    const { csms, setCsms, customers, setCustomers, setTaskCompletions, setActionItems } = useAppContext();
    const [newCustomerNames, setNewCustomerNames] = useState('');
    const [assignedCsmForNew, setAssignedCsmForNew] = useState<string>(csms[0]?.id || '');
    const [newCsmName, setNewCsmName] = useState('');

    const customersByCsm = useMemo(() => {
        const map = new Map<string, number>();
        customers.forEach(customer => {
            map.set(customer.assignedCsmId, (map.get(customer.assignedCsmId) || 0) + 1);
        });
        return map;
    }, [customers]);

    const handleRemoveCsm = (csmId: string) => {
        // Safeguard, but primary check is the disabled button state
        if (customersByCsm.get(csmId) > 0) {
            console.error("Attempted to remove a CSM with assigned customers.");
            return;
        }
        setCsms(prev => prev.filter(csm => csm.id !== csmId));
    };

    const handleAddCsm = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCsmName.trim()) return;
        const newCsm: CSM = { id: `csm_${Date.now()}`, name: newCsmName.trim() };
        setCsms(prev => [...prev, newCsm]);
        setNewCsmName('');
    };

    const handleRemoveCustomer = (customerId: string) => {
        setCustomers(prev => prev.filter(c => c.id !== customerId));
        // Also remove associated data
        setTaskCompletions(prev => prev.filter(tc => tc.customerId !== customerId));
        setActionItems(prev => prev.filter(ai => ai.customerId !== customerId));
    };
    
    const handleReassignCustomer = (customerId: string, newCsmId: string) => {
        setCustomers(prev => prev.map(c => c.id === customerId ? {...c, assignedCsmId: newCsmId} : c));
    };

    const handleAddCustomers = (e: React.FormEvent) => {
        e.preventDefault();
        const names = newCustomerNames.split('\n').map(name => name.trim()).filter(Boolean);
        if (names.length === 0 || !assignedCsmForNew) {
            alert("Please provide customer names and select a CSM.");
            return;
        }

        const newCustomers: Customer[] = names.map(name => ({
            id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            name,
            assignedCsmId: assignedCsmForNew,
        }));
        setCustomers(prev => [...prev, ...newCustomers]);
        setNewCustomerNames('');
    };

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-slate-800">Settings</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                <Card>
                    <h2 className="text-xl font-semibold text-slate-700 mb-4">Manage CSMs</h2>
                    <ul className="space-y-2 mb-6">
                        {csms.map(csm => {
                            const customerCount = customersByCsm.get(csm.id) || 0;
                            const canRemove = customerCount === 0;
                            return (
                                <li key={csm.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                                    <span>{csm.name}</span>
                                    <Button 
                                        variant="danger" 
                                        onClick={() => handleRemoveCsm(csm.id)} 
                                        disabled={!canRemove}
                                        title={!canRemove ? `Cannot remove: ${csm.name} still has ${customerCount} customer(s) assigned.` : `Remove ${csm.name}`}
                                        className="px-2 py-1 text-xs"
                                    >
                                        Remove
                                    </Button>
                                </li>
                            );
                        })}
                         {csms.length === 0 && <li className="text-slate-500 text-center p-2">No CSMs found.</li>}
                    </ul>
                    <form onSubmit={handleAddCsm} className="flex gap-2 border-t pt-4">
                        <input type="text" value={newCsmName} onChange={e => setNewCsmName(e.target.value)} placeholder="New CSM Name..." className="flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
                        <Button type="submit">Add CSM</Button>
                    </form>
                </Card>

                <Card>
                    <h2 className="text-xl font-semibold text-slate-700 mb-4">Manage Customers</h2>
                    <ul className="max-h-80 overflow-y-auto space-y-2 mb-6 pr-2 list-none">
                        {customers.sort((a,b) => a.name.localeCompare(b.name)).map(customer => (
                             <li key={customer.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                                <span className="font-medium flex-1">{customer.name}</span>
                                <div className="flex items-center gap-2">
                                    <select 
                                        value={customer.assignedCsmId} 
                                        onChange={(e) => handleReassignCustomer(customer.id, e.target.value)}
                                        className="w-36 pl-2 pr-8 py-1 text-sm border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md"
                                        aria-label={`CSM for ${customer.name}`}
                                    >
                                        {csms.map(csm => <option key={csm.id} value={csm.id}>{csm.name}</option>)}
                                    </select>
                                    <Button variant="danger" onClick={() => handleRemoveCustomer(customer.id)} className="px-2 py-1 text-xs">Remove</Button>
                                </div>
                            </li>
                        ))}
                        {customers.length === 0 && <li className="text-slate-500 text-center p-2">No customers found.</li>}
                    </ul>

                    <form onSubmit={handleAddCustomers} className="space-y-4 border-t pt-4">
                        <h3 className="font-semibold text-slate-600">Add New Customers</h3>
                         <div>
                            <label htmlFor="customer-names" className="block text-sm font-medium text-slate-700">Customer Names (one per line)</label>
                            <textarea 
                                id="customer-names"
                                value={newCustomerNames}
                                onChange={e => setNewCustomerNames(e.target.value)}
                                rows={4}
                                placeholder="Innovate Corp&#10;Synergy Solutions"
                                className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                        <div>
                             <label htmlFor="assign-csm" className="block text-sm font-medium text-slate-700">Assign to CSM</label>
                             <select id="assign-csm" value={assignedCsmForNew} onChange={e => setAssignedCsmForNew(e.target.value)} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md" disabled={csms.length === 0}>
                                {csms.length > 0 ? csms.map(csm => <option key={csm.id} value={csm.id}>{csm.name}</option>) : <option>Create a CSM first</option>}
                            </select>
                        </div>
                        <div className="text-right">
                             <Button type="submit" disabled={csms.length === 0}>Add Customers</Button>
                        </div>
                    </form>
                </Card>
            </div>
        </div>
    );
}

export default SettingsView;