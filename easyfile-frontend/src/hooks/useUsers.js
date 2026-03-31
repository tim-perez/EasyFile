import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';

export function useUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await api.get('/users/all');
      setUsers(response.data);
      setSelectedIds([]); 
    } catch (err) {
      console.error("Failed to fetch users", err);
      setError("Failed to load user data. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const handleSelectAll = (e, currentUsers) => {
    if (e.target.checked) setSelectedIds(currentUsers.map(u => u.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
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

  return {
    users: processedUsers,
    originalUsers: users,
    isLoading,
    error,
    setError,
    fetchUsers,
    selectedIds,
    handleSelectAll,
    handleSelectOne,
    sortConfig,
    handleSort,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter
  };
}