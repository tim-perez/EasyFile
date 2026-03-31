import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../services/api';

export function useDocuments(endpoint = '/documents') {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [activeFilters, setActiveFilters] = useState({
    documentTitle: '', caseNumber: '', county: '', status: ''
  });
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Wrapped in useCallback to satisfy the useEffect dependency array
  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get(endpoint); 
      setDocuments(response.data);
      setSelectedIds([]); 
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents.");
    } finally {
      setIsLoading(false);
    }
  }, [endpoint]);

  // 2. Safely passing fetchDocuments into the dependency array
  useEffect(() => {
    fetchDocuments();
    window.addEventListener('documentUploaded', fetchDocuments);
    return () => window.removeEventListener('documentUploaded', fetchDocuments);
  }, [fetchDocuments]);

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

  const processedDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchTitle = !activeFilters.documentTitle || (doc.documentTitle || doc.DocumentTitle) === activeFilters.documentTitle;
      const matchCase = !activeFilters.caseNumber || (doc.caseNumber || doc.CaseNumber) === activeFilters.caseNumber;
      const matchCounty = !activeFilters.county || (doc.county || doc.County) === activeFilters.county;
      const matchStatus = !activeFilters.status || (doc.status || doc.Status) === activeFilters.status;
      
      let passesGlobalSearch = true;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const searchableText = [
          doc.fileName || doc.FileName || '', doc.documentTitle || doc.DocumentTitle || '',
          doc.caseNumber || doc.CaseNumber || '', doc.county || doc.County || ''
        ].join(' ').toLowerCase();
        passesGlobalSearch = searchableText.includes(q);
      }
      return matchTitle && matchCase && matchCounty && matchStatus && passesGlobalSearch;
    });

    return filtered.sort((a, b) => {
      let aValue, bValue;
      switch (sortConfig.key) {
        case 'fileName': aValue = (a.fileName || a.FileName || '').toLowerCase(); bValue = (b.fileName || b.FileName || '').toLowerCase(); break;
        case 'documentTitle': aValue = (a.documentTitle || a.DocumentTitle || '').toLowerCase(); bValue = (b.documentTitle || b.DocumentTitle || '').toLowerCase(); break;
        case 'caseNumber': aValue = (a.caseNumber || a.CaseNumber || '').toLowerCase(); bValue = (b.caseNumber || b.CaseNumber || '').toLowerCase(); break;
        case 'county': aValue = (a.county || a.County || '').toLowerCase(); bValue = (b.county || b.County || '').toLowerCase(); break;
        case 'status': aValue = (a.status || a.Status || '').toLowerCase(); bValue = (b.status || b.Status || '').toLowerCase(); break;
        case 'date': default: aValue = new Date(a.createdAt || a.CreatedAt || a.uploadDate || 0).getTime(); bValue = new Date(b.createdAt || b.CreatedAt || b.uploadDate || 0).getTime(); break;
      }
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [documents, activeFilters, sortConfig, searchQuery]);

  return {
    documents: processedDocuments,
    originalDocuments: documents,
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