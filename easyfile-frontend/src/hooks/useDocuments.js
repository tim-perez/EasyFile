import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import api from '../services/api';

export function useDocuments(endpoint = '/documents') {
  // 1. New Pagination State
  const [documents, setDocuments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageNumber, setPageNumber] = useState(1);
  const pageSize = 20; 

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [activeFilters, setActiveFilters] = useState({ documentTitle: '', caseNumber: '', county: '', status: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Use a ref to track if it's the first render to prevent double-fetching
  const isFirstRender = useRef(true);

  // 2. Fetch directly from the backend using URL Query Parameters
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const params = new URLSearchParams({
        pageNumber,
        pageSize,
        sortColumn: sortConfig.key,
        sortDirection: sortConfig.direction,
      });

      if (searchQuery) params.append('SearchTerm', searchQuery);
      if (activeFilters.documentTitle) params.append('DocumentTitle', activeFilters.documentTitle);
      if (activeFilters.caseNumber) params.append('CaseNumber', activeFilters.caseNumber);
      if (activeFilters.county) params.append('County', activeFilters.county);
      if (activeFilters.status) params.append('Status', activeFilters.status);

      const response = await api.get(`${endpoint}?${params.toString()}`); 
      
      // Safely handle the new PagedResult wrapper the backend is sending
      setDocuments(response.data.items || response.data);
      setTotalCount(response.data.totalCount || 0);
      setTotalPages(response.data.totalPages || 1);
      setSelectedIds([]); 
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents.");
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, pageNumber, pageSize, sortConfig, activeFilters, searchQuery]);

  // Reset to page 1 if the user changes a search term or filter
  useEffect(() => {
    if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
    }
    setPageNumber(1);
  }, [searchQuery, activeFilters, sortConfig]);

  // Trigger fetch when any parameter changes
  useEffect(() => {
    fetchDocuments();
    window.addEventListener('documentUploaded', fetchDocuments);
    return () => window.removeEventListener('documentUploaded', fetchDocuments);
  }, [fetchDocuments]);

  // Note: In server-side pagination, these will only show options from the current page.
  const uniqueOptions = useMemo(() => ({
    titles: [...new Set(documents.map(d => d.documentTitle || d.DocumentTitle).filter(Boolean))],
    cases: [...new Set(documents.map(d => d.caseNumber || d.CaseNumber).filter(Boolean))],
    counties: [...new Set(documents.map(d => d.county || d.County).filter(Boolean))],
    statuses: [...new Set(documents.map(d => d.status || d.Status).filter(Boolean))]
  }), [documents]);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const handleSelectAll = (e, currentDocs) => {
    if (e.target.checked) setSelectedIds(currentDocs.map(doc => doc.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
  };

  return {
    documents, 
    originalDocuments: documents, 
    totalCount,
    totalPages,
    pageNumber,
    setPageNumber,
    isLoading,
    error,
    fetchDocuments,
    selectedIds,
    handleSelectAll,
    handleSelectOne,
    sortConfig,
    handleSort,
    activeFilters,
    setActiveFilters,
    searchQuery,
    setSearchQuery,
    uniqueOptions
  };
}