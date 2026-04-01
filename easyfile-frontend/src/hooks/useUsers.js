import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export function useUsers() {
  // Pagination State
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 20;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [selectedIds, setSelectedIds] = useState([]);

  const isFirstRender = useRef(true);

  const fetchUsers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const params = new URLSearchParams({
        pageNumber,
        pageSize,
        sortColumn: sortConfig.key,
        sortDirection: sortConfig.direction,
      });

      if (searchQuery) params.append('SearchTerm', searchQuery);
      if (roleFilter !== 'All') params.append('RoleFilter', roleFilter);

      const response = await api.get(`/users/all?${params.toString()}`);
      
      // Handle the PagedResult wrapper
      setUsers(response.data.items || response.data);
      setTotalCount(response.data.totalCount || 0);
      setTotalPages(response.data.totalPages || 1);
      setSelectedIds([]); 
    } catch (err) {
      console.error("Failed to fetch users", err);
      setError("Failed to load user data. Please refresh the page.");
    } finally {
      setIsLoading(false);
    }
  }, [pageNumber, pageSize, sortConfig, searchQuery, roleFilter]);

  // Reset to page 1 if the user searches or changes the role filter
  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    setPageNumber(1);
  }, [searchQuery, roleFilter, sortConfig]);

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

  return {
    users, 
    originalUsers: users,
    totalCount,
    totalPages,
    pageNumber,
    setPageNumber,
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