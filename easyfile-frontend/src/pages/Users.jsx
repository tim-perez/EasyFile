import React, { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import api from '../services/api';

export default function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState(''); // NEW: Inline error for the main page
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  
  const [selectedIds, setSelectedIds] = useState([]);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editError, setEditError] = useState(''); // NEW: Inline error for the modal
  const [editFormData, setEditFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', businessName: '', accountType: '', newPassword: ''
  });

  useEffect(() => {
    if (user?.role === 'Admin') {
      fetchUsers();
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setPageError('');
      const response = await api.get('/users/all');
      setUsers(response.data);
      setSelectedIds([]); 
    } catch (error) {
      console.error("Failed to fetch users", error);
      setPageError("Failed to load user data. Please refresh the page.");
    } finally {
      setLoading(false);
    }
  };

  const processedUsers = useMemo(() => {
    let filtered = users.filter(u => {
      const matchesSearch = 
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toString().includes(searchQuery);
      
      const matchesRole = roleFilter === 'All' || u.accountType === roleFilter;
      return matchesSearch && matchesRole;
    });

    return filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortConfig.key) {
        case 'id': aValue = a.id; bValue = b.id; break;
        case 'name': aValue = `${a.firstName} ${a.lastName}`.toLowerCase(); bValue = `${b.firstName} ${b.lastName}`.toLowerCase(); break;
        case 'accountType': aValue = a.accountType.toLowerCase(); bValue = b.accountType.toLowerCase(); break;
        case 'date': default: aValue = new Date(a.createdAt || 0).getTime(); bValue = new Date(b.createdAt || 0).getTime(); break;
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, searchQuery, roleFilter, sortConfig]);

  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(processedUsers.map(u => u.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);

  const handleSort = (key) => setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const handleBulkBan = async () => {
    if (!window.confirm(`You are about to deactivate ${selectedIds.length} user(s). They will no longer be able to log in, but their documents will be saved. Proceed?`)) return;
    setPageError('');
    try {
      await Promise.all(selectedIds.map(id => api.put(`/users/admin-ban/${id}`)));
      fetchUsers();
    } catch (error) {
      console.error("Failed to ban users", error);
      setPageError("An error occurred while deactivating users.");
    }
  };

  const handleBulkUnban = async () => {
    if (!window.confirm(`You are about to reactivate ${selectedIds.length} user(s). They will regain full access to their accounts. Proceed?`)) return;
    setPageError('');
    try {
      await Promise.all(selectedIds.map(id => api.put(`/users/admin-unban/${id}`)));
      fetchUsers();
    } catch (error) {
      console.error("Failed to unban users", error);
      setPageError("An error occurred while reactivating users.");
    }
  };

  const openEditModal = (u) => {
    setEditError('');
    setEditingUser(u);
    setEditFormData({
      firstName: u.firstName, lastName: u.lastName, email: u.email, 
      phone: u.phone || '', businessName: u.businessName || '', 
      accountType: u.accountType, newPassword: '' 
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    try {
      await api.put(`/users/admin-update/${editingUser.id}`, {
        firstName: editFormData.firstName, lastName: editFormData.lastName,
        email: editFormData.email, phone: editFormData.phone,
        businessName: editFormData.businessName, accountType: editFormData.accountType
      });

      if (editFormData.newPassword.trim() !== '') {
        await api.put(`/users/admin-reset-password/${editingUser.id}`, { newPassword: editFormData.newPassword });
      }

      setIsEditModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Failed to update user", error);
      setEditError(error.response?.data?.message || "Failed to save user updates.");
    }
  };

  const SortableHeader = ({ label, sortKey, colSpan = 1, align = 'left' }) => (
    <div className={`col-span-${colSpan} flex items-center ${align === 'right' ? 'justify-end' : ''} cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors select-none`} onClick={() => handleSort(sortKey)}>
      {label}
      <span className="ml-1 text-[10px] text-gray-400">{sortConfig.key === sortKey ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}</span>
    </div>
  );

  if (user?.role !== 'Admin') return <Navigate to="/dashboard" replace />;

  return (
    <div className="max-w-7xl mx-auto w-full relative pb-12">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input 
              type="text" placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 w-full border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a1a] text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-[#1a1a1a] text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer">
            <option value="All">All Roles</option>
            <option value="Admin">Admins</option>
            <option value="Customer">Customers</option>
            <option value="Guest">Guests</option>
            <option value="Banned">Banned</option>
          </select>
        </div>
      </div>

      {pageError && (
        <div className="mb-4 p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
          {pageError}
        </div>
      )}

      {/* SMOOTH ANIMATED ACTION BAR */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${selectedIds.length > 0 ? 'max-h-40 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 shadow-sm rounded-lg px-4 py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-700 pr-6">
              {selectedIds.length} selected
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={handleBulkUnban} className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition flex items-center gap-1.5 whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Reactivate
            </button>
            <button onClick={handleBulkBan} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition flex items-center gap-1.5 border-l border-gray-300 dark:border-gray-700 pl-4 whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
              Ban / Deactivate
            </button>
          </div>
        </div>
      </div>

      {/* THE GRID TABLE */}
      <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-275">
            
            {/* TABLE HEADER */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <div className="col-span-1 flex items-center justify-center">
                <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer" checked={processedUsers.length > 0 && selectedIds.length === processedUsers.length} onChange={handleSelectAll} />
              </div>
              <SortableHeader label="ID" sortKey="id" colSpan={1} />
              <SortableHeader label="User" sortKey="name" colSpan={4} />
              <SortableHeader label="Account Type" sortKey="accountType" colSpan={3} />
              <SortableHeader label="Date Joined" sortKey="date" colSpan={2} />
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* TABLE BODY */}
            {loading ? (
              <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            ) : processedUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No users match your filter settings.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {processedUsers.map((u) => (
                  <div key={u.id} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors group ${selectedIds.includes(u.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#282828]'}`}>
                    
                    <div className="col-span-1 flex items-center justify-center">
                      <input type="checkbox" className={`rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer transition-opacity ${selectedIds.includes(u.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} checked={selectedIds.includes(u.id)} onChange={() => handleSelectOne(u.id)} />
                    </div>

                    <div className="col-span-1 flex items-center pr-2">
                      <span className="text-sm font-mono text-gray-500 dark:text-gray-400">#{u.id}</span>
                    </div>

                    <div className="col-span-4 flex flex-col pr-4 overflow-hidden">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{u.firstName} {u.lastName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{u.email}</span>
                    </div>

                    <div className="col-span-3 flex items-center pr-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${u.accountType === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' : 
                          u.accountType === 'Guest' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800' : 
                          u.accountType === 'Banned' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800' : 
                          'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'}`}
                      >
                        {u.accountType}
                      </span>
                    </div>

                    <div className="col-span-2 flex flex-col">
                      <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatDate(u.createdAt)}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Joined</span>
                    </div>

                    <div className="col-span-1 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(u)} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium whitespace-nowrap">Edit</button>
                    </div>

                  </div>
                ))}
              </div>
            )}
            
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white dark:bg-[#1f1f1f] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit User #{editingUser?.id}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 overflow-y-auto max-h-[70vh]">
              
              {editError && (
                <div className="mb-4 p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
                  {editError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                  <input type="text" required value={editFormData.firstName} onChange={e => setEditFormData({...editFormData, firstName: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-[#2a2a2a] dark:border-gray-600 dark:text-white outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                  <input type="text" required value={editFormData.lastName} onChange={e => setEditFormData({...editFormData, lastName: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-[#2a2a2a] dark:border-gray-600 dark:text-white outline-none focus:border-blue-500" />
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                <input type="email" required value={editFormData.email} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-[#2a2a2a] dark:border-gray-600 dark:text-white outline-none focus:border-blue-500" />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
                  <select value={editFormData.accountType} onChange={e => setEditFormData({...editFormData, accountType: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-[#2a2a2a] dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 cursor-pointer">
                    <option value="Customer">Customer</option>
                    <option value="Admin">Admin</option>
                    <option value="Guest">Guest</option>
                    <option value="Banned">Banned</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Force Password Reset</label>
                  <input type="text" placeholder="Leave blank to keep current" value={editFormData.newPassword} onChange={e => setEditFormData({...editFormData, newPassword: e.target.value})} className="w-full px-3 py-2 border rounded-lg dark:bg-[#2a2a2a] dark:border-gray-600 dark:text-white outline-none focus:border-blue-500 placeholder-gray-400 dark:placeholder-gray-500" />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}