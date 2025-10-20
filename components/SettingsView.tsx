import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from './AppContext';
import { Card, Button, TrashIcon, PencilIcon } from './ui';
import { User, Customer } from '../types';

const SettingsView: React.FC = () => {
    const { 
        users, setUsers, 
        customers, setCustomers,
        setTaskCompletions,
        setActionItems,
        setBugReports,
        setFeatureRequests,
        setMeetingNotes,
        apiKey, setApiKey,
        currentUser, setCurrentUser
    } = useAppContext();

    const customerFormRef = useRef<HTMLFormElement>(null);
    
    // User Management
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userPassword, setUserPassword] = useState('');
    const [userRole, setUserRole] = useState<'manager' | 'csm'>('csm');
    const [editingUser, setEditingUser] = useState<User | null>(null);
    
    // Customer Management
    const [customerName, setCustomerName] = useState('');
    const [assignedCsmId, setAssignedCsmId] = useState<string>('');
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

    // API Key Management
    const [tempApiKey, setTempApiKey] = useState(apiKey || '');
    
    // My Account
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordChangeMsg, setPasswordChangeMsg] = useState({ type: '', text: ''});
    
    const csms = users.filter(u => u.role === 'csm');

    useEffect(() => {
        if (csms.length > 0 && !assignedCsmId) {
            setAssignedCsmId(csms[0].id);
        }
    }, [csms, assignedCsmId]);
    
    useEffect(() => {
        setTempApiKey(apiKey || '');
    }, [apiKey]);

    // Handlers for User
    const resetUserForm = () => {
        setEditingUser(null);
        setUserName('');
        setUserEmail('');
        setUserPassword('');
        setUserRole('csm');
    }

    const handleUserSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userName || !userEmail || (!editingUser && !userPassword)) return;

        if (editingUser) {
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, name: userName, email: userEmail, role: userRole, password: userPassword || u.password } : u));
        } else {
            const newUser: User = { id: `user_${Date.now()}`, name: userName, email: userEmail, role: userRole, password: userPassword };
            setUsers(prev => [...prev, newUser]);
        }
        resetUserForm();
    };

    const handleEditUser = (user: User) => {
        setEditingUser(user);
        setUserName(user.name);
        setUserEmail(user.email);
        setUserRole(user.role);
        setUserPassword('');
    };

    const handleDeleteUser = (userId: string) => {
        if (users.length <= 1) {
            alert("You cannot delete the last user.");
            return;
        }
        if (window.confirm('Are you sure? This will also unassign their customers if they are a CSM.')) {
            setUsers(prev => prev.filter(u => u.id !== userId));
            setCustomers(prev => prev.map(cust => cust.assignedCsmId === userId ? { ...cust, assignedCsmId: '' } : cust));
        }
    };
    
    // Handlers for Customer
    const resetCustomerForm = () => {
        setEditingCustomer(null);
        setCustomerName('');
        setAssignedCsmId(csms[0]?.id || '');
    }

    const handleCustomerSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!customerName.trim() || !assignedCsmId) return;

        if (editingCustomer) {
            setCustomers(prev => prev.map(c => c.id === editingCustomer.id ? { ...c, name: customerName, assignedCsmId } : c));
        } else {
            const customerNames = customerName.split('\n').filter(name => name.trim() !== '');
            const newCustomers: Customer[] = customerNames.map((name, index) => ({
                id: `cust_${Date.now()}_${index}`,
                name: name.trim(),
                assignedCsmId
            }));
            setCustomers(prev => [...prev, ...newCustomers]);
        }
        resetCustomerForm();
    };
    
    const handleEditCustomer = (customer: Customer) => {
        setEditingCustomer(customer);
        setCustomerName(customer.name);
        setAssignedCsmId(customer.assignedCsmId);
        customerFormRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    
    const handlePasswordChange = (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordChangeMsg({ type: '', text: '' });

        if (!currentUser) return;
        if (newPassword !== confirmPassword) {
            setPasswordChangeMsg({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        if (newPassword.length < 6) {
             setPasswordChangeMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
            return;
        }

        const userInDb = users.find(u => u.id === currentUser.id);
        if (userInDb?.password !== currentPassword) {
            setPasswordChangeMsg({ type: 'error', text: 'Current password is incorrect.' });
            return;
        }
        
        setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, password: newPassword } : u));
        setPasswordChangeMsg({ type: 'success', text: 'Password updated successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* User Management */}
                <Card>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Manage Users</h2>
                    <form onSubmit={handleUserSubmit} className="space-y-4 mb-4 p-4 border rounded-md bg-slate-50">
                        <h3 className="font-semibold text-lg">{editingUser ? `Editing ${editingUser.name}` : 'Add New User'}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input type="text" value={userName} onChange={e => setUserName(e.target.value)} placeholder="Full Name" required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md" />
                            <select value={userRole} onChange={e => setUserRole(e.target.value as 'manager' | 'csm')} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md">
                                <option value="csm">CSM</option>
                                <option value="manager">Manager</option>
                            </select>
                        </div>
                        <input type="email" value={userEmail} onChange={e => setUserEmail(e.target.value)} placeholder="Login Email" required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md" />
                        <input type="password" value={userPassword} onChange={e => setUserPassword(e.target.value)} placeholder={editingUser ? "New Password (optional)" : "Password"} required={!editingUser} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md" />
                        <div className="flex justify-end gap-2">
                            {editingUser && <Button type="button" variant="secondary" onClick={resetUserForm}>Cancel</Button>}
                            <Button type="submit">{editingUser ? 'Update User' : 'Add User'}</Button>
                        </div>
                    </form>
                    <ul className="space-y-2">
                        {users.map(user => (
                            <li key={user.id} className="flex justify-between items-center p-2 bg-slate-50 rounded-md">
                                <div>
                                    <p className="font-semibold">{user.name} <span className="text-xs font-normal text-white bg-indigo-500 px-2 py-0.5 rounded-full">{user.role}</span></p>
                                    <p className="text-sm text-slate-500">{user.email}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => handleEditUser(user)} className="p-2" title="Edit User"><PencilIcon/></Button>
                                    <Button variant="danger" onClick={() => handleDeleteUser(user.id)} className="p-2" title="Delete User"><TrashIcon/></Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>

                {/* Customer Management */}
                <Card>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Manage Customers</h2>
                    <form ref={customerFormRef} onSubmit={handleCustomerSubmit} className={`space-y-4 mb-4 p-4 border rounded-md bg-slate-50 transition-all ${editingCustomer ? 'ring-2 ring-indigo-500' : 'border-slate-200'}`}>
                        <h3 className="font-semibold text-lg">{editingCustomer ? `Editing ${editingCustomer.name}` : 'Add New Customer(s)'}</h3>
                        {editingCustomer ? (
                             <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter customer name" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md" />
                        ) : (
                            <textarea value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Enter customer names, one per line" rows={3} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md" />
                        )}
                        <select value={assignedCsmId} onChange={e => setAssignedCsmId(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md" disabled={csms.length === 0}>
                            <option value="">{csms.length > 0 ? 'Select a CSM' : 'Please add a CSM first'}</option>
                            {csms.map(csm => <option key={csm.id} value={csm.id}>{csm.name}</option>)}
                        </select>
                        <div className="flex justify-end gap-2">
                             {editingCustomer && <Button type="button" variant="secondary" onClick={resetCustomerForm}>Cancel</Button>}
                            <Button type="submit" disabled={csms.length === 0}>{editingCustomer ? 'Update Customer' : 'Add Customer(s)'}</Button>
                        </div>
                    </form>
                    <ul className="space-y-2 max-h-96 overflow-y-auto">
                        {customers.sort((a,b) => a.name.localeCompare(b.name)).map(customer => (
                            <li key={customer.id} className={`flex justify-between items-center p-2 rounded-md transition-colors ${editingCustomer?.id === customer.id ? 'bg-indigo-100' : 'bg-slate-50'}`}>
                                <div>
                                    <p>{customer.name}</p>
                                    <p className="text-sm text-slate-500">{users.find(c => c.id === customer.assignedCsmId)?.name || 'Unassigned'}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" onClick={() => handleEditCustomer(customer)} className="p-2" title="Edit Customer"><PencilIcon/></Button>
                                    <Button variant="danger" onClick={() => handleDeleteCustomer(customer.id)} className="p-2" title="Delete Customer"><TrashIcon/></Button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Card>
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">My Account</h2>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div>
                             <label className="block text-sm font-medium text-slate-700">Email</label>
                             <p className="mt-1 text-slate-800 font-semibold">{currentUser?.email}</p>
                        </div>
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current Password" required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md" />
                        <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md" />
                        <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" required className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md" />
                         {passwordChangeMsg.text && (
                             <p className={`text-sm ${passwordChangeMsg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>{passwordChangeMsg.text}</p>
                         )}
                        <div className="flex justify-end">
                             <Button type="submit">Change Password</Button>
                        </div>
                    </form>
                </Card>
                 <Card>
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">API Settings</h2>
                    <div>
                        <label htmlFor="api-key-settings" className="block text-sm font-medium text-slate-700 mb-1">Google AI API Key</label>
                        <div className="flex gap-2">
                            <input id="api-key-settings" type="password" value={tempApiKey} onChange={e => setTempApiKey(e.target.value)} placeholder="Enter your API key" className="flex-grow px-3 py-2 bg-white border border-slate-300 rounded-md" />
                            <Button onClick={handleApiKeySave}>Save</Button>
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SettingsView;