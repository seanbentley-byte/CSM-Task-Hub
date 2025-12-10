
import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from './AppContext';
import { Card, Button, TrashIcon, PencilIcon, CloudIcon, RefreshIcon, CheckCircleIcon } from './ui';
import { User, Customer, GoogleSheetsConfig } from '../types';
import { sheetsService } from '../sheets';

const APP_SCRIPT_CODE = `// --- GOOGLE APPS SCRIPT CODE ---
// Copy and paste this ENTIRE block into Extensions > Apps Script

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  const data = {};
  sheets.forEach(sheet => {
    // Get all data, filter out empty rows
    const range = sheet.getDataRange();
    const values = range.getValues();
    // Simple check to ensure we don't send back thousands of empty rows
    if (values.length > 0) {
       data[sheet.getName()] = values;
    } else {
       data[sheet.getName()] = [];
    }
  });
  
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    const rawData = JSON.parse(e.postData.contents);
    
    Object.keys(rawData).forEach(tabName => {
      let sheet = ss.getSheetByName(tabName);
      if (!sheet) {
        sheet = ss.insertSheet(tabName);
      }
      
      const values = rawData[tabName];
      if (values && values.length > 0) {
        // Clear old content but keep formatting
        sheet.clearContents();
        // Write new data
        sheet.getRange(1, 1, values.length, values[0].length).setValues(values);
      }
    });
    
    // Return success
    return ContentService.createTextOutput(JSON.stringify({status: "success"}))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({status: "error", message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

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
        currentUser, setCurrentUser,
        sheetsConfig, setSheetsConfig,
        isSheetConnected, syncData, isSyncing, lastSyncTime
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

    // Sheets Config
    const [webAppUrl, setWebAppUrl] = useState('');
    
    // Allow assigning customers to ANY user (Manager or CSM)
    const assignableUsers = users;

    useEffect(() => {
        if (assignableUsers.length > 0 && !assignedCsmId) {
            setAssignedCsmId(assignableUsers[0].id);
        }
    }, [assignableUsers, assignedCsmId]);
    
    useEffect(() => {
        setTempApiKey(apiKey || '');
    }, [apiKey]);

    useEffect(() => {
        if (sheetsConfig) {
            setWebAppUrl(sheetsConfig.webAppUrl);
        }
    }, [sheetsConfig]);

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
        setAssignedCsmId(assignableUsers[0]?.id || '');
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

    const handleSaveSheetsConfig = () => {
        if (!webAppUrl.includes('script.google.com')) {
             alert("Please enter a valid Google Apps Script Web App URL.");
             return;
        }
        setSheetsConfig({ webAppUrl });
    };

    const copyCodeToClipboard = () => {
        navigator.clipboard.writeText(APP_SCRIPT_CODE);
        alert("Code copied to clipboard!");
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                 {/* Google Sheets Integration */}
                 <Card className="lg:col-span-2 border-indigo-200 ring-4 ring-indigo-50">
                    <div className="flex items-start justify-between">
                         <div>
                            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                <CloudIcon /> Google Sheets Backend
                            </h2>
                            <p className="text-slate-600 mt-1">
                                Store your data in a Google Sheet for free. No server required.
                            </p>
                        </div>
                        {isSheetConnected && (
                            <div className="flex items-center gap-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                                <CheckCircleIcon /> Connected
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-6 bg-slate-50 p-4 rounded-md border border-slate-200">
                        <h3 className="font-semibold text-slate-800 mb-2">How to Connect (5 Minutes)</h3>
                        <ol className="list-decimal list-inside text-sm text-slate-700 space-y-2 mb-4">
                            <li>Create a new blank Google Sheet at <a href="https://sheets.new" target="_blank" className="text-indigo-600 underline">sheets.new</a>.</li>
                            <li>In the Sheet, go to <strong>Extensions</strong> &gt; <strong>Apps Script</strong>.</li>
                            <li>Delete any existing code in <code>Code.gs</code> and paste the code below.</li>
                            <li>Click the blue <strong>Deploy</strong> button &gt; <strong>New deployment</strong>.</li>
                            <li>Click the <strong>gear icon</strong> next to "Select type" and choose <strong>Web app</strong>.</li>
                            <li><strong>IMPORTANT:</strong> Set "Who has access" to <strong>Anyone</strong>. (This allows the app to save data without a login popup).</li>
                            <li>Click <strong>Deploy</strong>. 
                                <span className="block ml-5 text-xs text-slate-500 mt-1">
                                    (Authorize access &gt; Advanced &gt; Go to Untitled Project (unsafe) &gt; Allow)
                                </span>
                            </li>
                            <li>Copy the <strong>Web App URL</strong> and paste it below.</li>
                        </ol>
                         <div className="relative">
                            <pre className="bg-slate-800 text-slate-200 p-4 rounded-md text-xs overflow-x-auto h-48 font-mono leading-relaxed">
                                {APP_SCRIPT_CODE}
                            </pre>
                            <button 
                                onClick={copyCodeToClipboard}
                                className="absolute top-2 right-2 bg-white text-slate-800 text-xs px-2 py-1 rounded shadow hover:bg-slate-100 font-medium"
                            >
                                Copy Code
                            </button>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-sm font-medium text-slate-700">Web App URL</label>
                        <input 
                            type="text" 
                            value={webAppUrl} 
                            onChange={e => setWebAppUrl(e.target.value)} 
                            placeholder="https://script.google.com/macros/s/..." 
                            className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm sm:text-sm"
                        />
                    </div>

                    <div className="mt-4 flex gap-4 items-center">
                        <Button onClick={handleSaveSheetsConfig} disabled={!webAppUrl}>Save & Connect</Button>
                        
                        {sheetsConfig && isSheetConnected && (
                            <div className="flex gap-2">
                                <Button variant="secondary" onClick={() => syncData('pull')} disabled={isSyncing}>
                                     <RefreshIcon className="w-4 h-4 mr-2" /> {isSyncing ? 'Syncing...' : 'Pull Data'}
                                </Button>
                                <Button variant="primary" onClick={() => syncData('push')} disabled={isSyncing}>
                                    <CloudIcon /> {isSyncing ? 'Syncing...' : 'Push Data'}
                                </Button>
                            </div>
                        )}
                         {lastSyncTime && <span className="text-sm text-slate-500">Last synced: {new Date(lastSyncTime).toLocaleTimeString()}</span>}
                    </div>
                </Card>

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
                        <select value={assignedCsmId} onChange={e => setAssignedCsmId(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md" disabled={assignableUsers.length === 0}>
                            <option value="">{assignableUsers.length > 0 ? 'Select a User' : 'Please add a User first'}</option>
                            {assignableUsers.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                        </select>
                        <div className="flex justify-end gap-2">
                             {editingCustomer && <Button type="button" variant="secondary" onClick={resetCustomerForm}>Cancel</Button>}
                            <Button type="submit" disabled={assignableUsers.length === 0}>{editingCustomer ? 'Update Customer' : 'Add Customer(s)'}</Button>
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
                    <h2 className="text-2xl font-bold text-slate-800 mb-4">Gemini API Settings</h2>
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
