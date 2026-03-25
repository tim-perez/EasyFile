import { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import DocumentReportModal from '../components/DocumentReportModal'; 
import EditDocumentModal from '../components/EditDocumentModal'; 

export default function Documents() {
  const { onOpenUploadModal } = useOutletContext();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportDocument, setSelectedReportDocument] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const globalSearchQuery = searchParams.get('q') || '';

  // NEW: SORTING & FILTERING STATE
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' }); // Default: Latest date
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    documentTitle: '',
    caseNumber: '',
    county: '',
    status: ''
  });
  
  // ==========================================
  // API FETCH & ACTIONS
  // ==========================================
  useEffect(() => {
    fetchDocuments();
    window.addEventListener('documentUploaded', fetchDocuments);
    return () => window.removeEventListener('documentUploaded', fetchDocuments);
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/documents'); 
      setDocuments(response.data);
      setSelectedIds([]); 
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadAllReports = async () => {
    try {
      const response = await api.post('/documents/bulk-download/reports', { documentIds: selectedIds }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'EasyFile_Reports.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download reports:", error);
      alert("Failed to generate zip file.");
    }
  };

  const handleDownloadAllFiles = async () => {
    try {
      const response = await api.post('/documents/bulk-download/files', { documentIds: selectedIds }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'EasyFile_Originals.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download original files:", error);
      alert("Failed to download files.");
    }
  };

const handleDeleteDocument = async (documentId) => {
    if (!window.confirm("Move this document to the Recycle Bin?")) return;
    try {
      await api.delete(`/documents/${documentId}`);
      fetchDocuments();
    } catch (error) {
      console.error("Failed to delete document:", error); // <-- Linter is happy!
      alert("Error deleting document.");
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Move ${selectedIds.length} documents to the Recycle Bin?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/documents/${id}`)));
      fetchDocuments(); 
    } catch (error) {
      console.error("Failed to bulk delete:", error); // <-- Linter is happy!
      alert("Error moving documents.");
    }
  };

  const handleOpenDocument = async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/url`);
      if (response.data?.url) window.open(response.data.url, '_blank');
    } catch (error) {
      console.error("Failed to open document", error);
    }
  };

  // ==========================================
  // NEW: FILTERING & SORTING PIPELINE
  // ==========================================
  
  // 1. Generate dynamic dropdown options based on the data we actually have
  const uniqueOptions = useMemo(() => {
    return {
      titles: [...new Set(documents.map(d => d.documentTitle || d.DocumentTitle).filter(Boolean))],
      cases: [...new Set(documents.map(d => d.caseNumber || d.CaseNumber).filter(Boolean))],
      counties: [...new Set(documents.map(d => d.county || d.County).filter(Boolean))],
      statuses: [...new Set(documents.map(d => d.status || d.Status).filter(Boolean))]
    };
  }, [documents]);

  const handleFilterChange = (key, value) => {
    setActiveFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setActiveFilters({ documentTitle: '', caseNumber: '', county: '', status: '' });
    setIsFilterMenuOpen(false);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // 2. Apply Filters and Sorting to create the final array we render
  const processedDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      // 1. Dropdown Filters
      const matchTitle = !activeFilters.documentTitle || (doc.documentTitle || doc.DocumentTitle) === activeFilters.documentTitle;
      const matchCase = !activeFilters.caseNumber || (doc.caseNumber || doc.CaseNumber) === activeFilters.caseNumber;
      const matchCounty = !activeFilters.county || (doc.county || doc.County) === activeFilters.county;
      const matchStatus = !activeFilters.status || (doc.status || doc.Status) === activeFilters.status;
      const passesDropdowns = matchTitle && matchCase && matchCounty && matchStatus;

      // 2. Global Search Bar Filter
      let passesGlobalSearch = true;
      if (globalSearchQuery) {
        const q = globalSearchQuery.toLowerCase();
        // Squish all searchable text into one giant string to easily search across everything
        const searchableText = [
          doc.fileName || doc.FileName,
          doc.documentTitle || doc.DocumentTitle,
          doc.caseNumber || doc.CaseNumber,
          doc.county || doc.County
        ].join(' ').toLowerCase();
        
        passesGlobalSearch = searchableText.includes(q);
      }

      return passesDropdowns && passesGlobalSearch;
    });

    return filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'fileName':
          aValue = (a.fileName || a.FileName || '').toLowerCase();
          bValue = (b.fileName || b.FileName || '').toLowerCase();
          break;
        case 'documentTitle':
          aValue = (a.documentTitle || a.DocumentTitle || '').toLowerCase();
          bValue = (b.documentTitle || b.DocumentTitle || '').toLowerCase();
          break;
        case 'caseNumber':
          aValue = (a.caseNumber || a.CaseNumber || '').toLowerCase();
          bValue = (b.caseNumber || b.CaseNumber || '').toLowerCase();
          break;
        case 'county':
          aValue = (a.county || a.County || '').toLowerCase();
          bValue = (b.county || b.County || '').toLowerCase();
          break;
        case 'status':
          aValue = (a.status || a.Status || '').toLowerCase();
          bValue = (b.status || b.Status || '').toLowerCase();
          break;
        case 'date':
        default:
          aValue = new Date(a.createdAt || a.CreatedAt || a.uploadDate || 0).getTime();
          bValue = new Date(b.createdAt || b.CreatedAt || b.uploadDate || 0).getTime();
          break;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [documents, activeFilters, sortConfig, globalSearchQuery]);
  
  // ==========================================
  // HELPERS
  // ==========================================
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(processedDocuments.map(doc => doc.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  const getStatusBadge = (status) => {
    const currentStatus = status || 'Processed';
    if (currentStatus.toLowerCase() === 'incomplete') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800/50">Incomplete</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">{currentStatus}</span>;
  };

  // NEW: Helper for Sortable Headers
  const SortableHeader = ({ label, sortKey, colSpan = 1 }) => (
    <div 
      className={`col-span-${colSpan} flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors select-none`}
      onClick={() => handleSort(sortKey)}
    >
      {label}
      <span className="ml-1 text-[10px] text-gray-400">
        {sortConfig.key === sortKey ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    </div>
  );

  const selectedDocumentObjects = documents.filter(doc => selectedIds.includes(doc.id));
  const activeFilterCount = Object.values(activeFilters).filter(val => val !== '').length;

  return (
    <div className="max-w-7xl mx-auto w-full relative pb-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Documents</h1>

      {/* SMOOTH ANIMATED ACTION BAR */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${selectedIds.length > 0 ? 'max-h-40 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 shadow-sm rounded-lg px-4 py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800 w-full lg:w-auto">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400 whitespace-nowrap">{selectedIds.length || 0} selected</span>
            <div className="hidden sm:block h-4 w-px bg-blue-200 dark:bg-blue-700"></div>
            <button onClick={() => setIsEditModalOpen(true)} className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap">Edit</button>
            <select onChange={(e) => {
              if (e.target.value === 'reports') handleDownloadAllReports();
              if (e.target.value === 'files') handleDownloadAllFiles();
              e.target.value = '';
            }} className="text-sm bg-transparent font-medium text-gray-700 dark:text-gray-300 cursor-pointer outline-none hover:text-blue-600 dark:hover:text-blue-400 w-full sm:w-auto truncate">
              <option value="" disabled selected>More Actions...</option>
              <option value="reports">Download All Reports</option>
              <option value="files">Download All Original Files</option>
            </select>
          </div>
          <button onClick={handleBulkDelete} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition flex items-center justify-center lg:justify-end gap-2 whitespace-nowrap w-full lg:w-auto lg:ml-auto">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Move to Recycle Bin
          </button>
        </div>
      </div>

      {/* FILTER BUTTON, ACTIVE SEARCH BADGE, & DROPDOWN PANEL */}
      <div className="mb-4 px-2 relative flex flex-wrap items-center gap-3 z-20">
        
        <button 
          onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
          className={`flex items-center text-sm font-medium transition px-3 py-1.5 rounded-md ${isFilterMenuOpen || activeFilterCount > 0 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'}`}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>

        {/* Active Search Badge */}
        {globalSearchQuery && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium border border-blue-200 dark:border-blue-800 animate-fade-in">
            <span>Search: "{globalSearchQuery}"</span>
            <button 
              onClick={() => {
                const params = new URLSearchParams(searchParams);
                params.delete('q');
                setSearchParams(params);
              }}
              className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {/* EXPANDABLE FILTER PANEL */}
        {isFilterMenuOpen && (
          <div className="absolute top-full left-0 mt-2 w-full max-w-4xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl p-4 z-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">AI Document Title</label>
                <select value={activeFilters.documentTitle} onChange={(e) => handleFilterChange('documentTitle', e.target.value)} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
                  <option value="">All Titles</option>
                  {uniqueOptions.titles.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Case Number</label>
                <select value={activeFilters.caseNumber} onChange={(e) => handleFilterChange('caseNumber', e.target.value)} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
                  <option value="">All Cases</option>
                  {uniqueOptions.cases.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">County</label>
                <select value={activeFilters.county} onChange={(e) => handleFilterChange('county', e.target.value)} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
                  <option value="">All Counties</option>
                  {uniqueOptions.counties.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                <select value={activeFilters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
                  <option value="">All Statuses</option>
                  {uniqueOptions.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition">Clear All Filters</button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : error ? (
        <div className="text-red-500 text-center py-10">{error}</div>
      ) : processedDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#1a1a1a]">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-8 shadow-sm">
              <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No documents found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm max-w-sm">
            {documents.length === 0 ? "Your legal document vault is currently empty." : "No documents match your current filter settings."}
          </p>
          {documents.length === 0 && (
            <button onClick={onOpenUploadModal} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Upload Documents
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-275">
              
              {/* SORTABLE TABLE HEADER */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-1 flex items-center justify-center">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer" 
                    checked={processedDocuments.length > 0 && selectedIds.length === processedDocuments.length}
                    onChange={handleSelectAll}
                  />
                </div>
                <SortableHeader label="File Name" sortKey="fileName" colSpan={2} />
                <SortableHeader label="AI Document Title" sortKey="documentTitle" colSpan={2} />
                <SortableHeader label="Case Number" sortKey="caseNumber" colSpan={2} />
                <SortableHeader label="County" sortKey="county" colSpan={1} />
                <SortableHeader label="Status" sortKey="status" colSpan={1} />
                <SortableHeader label="Date" sortKey="date" colSpan={1} />
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* TABLE ROWS - Now mapping over processedDocuments instead of documents */}
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {processedDocuments.map((doc) => (
                  <div 
                      key={doc.id} 
                      className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all duration-300 group 
                        ${selectedIds.includes(doc.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#282828]'}
                        ${globalSearchQuery ? 'ring-inset ring-2 ring-blue-400 bg-blue-50/30 dark:bg-blue-900/20 shadow-inner' : ''}
                      `}
                    >                    
                    <div className="col-span-1 flex items-center justify-center">
                      <input 
                        type="checkbox" 
                        className={`rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer transition-opacity ${selectedIds.includes(doc.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        checked={selectedIds.includes(doc.id)}
                        onChange={() => handleSelectOne(doc.id)}
                      />
                    </div>

                    <div className="col-span-2 flex flex-col pr-4 overflow-hidden">
                      <button onClick={() => handleOpenDocument(doc.id)} className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate text-left w-full block transition-colors" title={doc.fileName || doc.FileName || 'Unknown File'}>
                        {doc.fileName || doc.FileName || 'Unknown File'}
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate w-full block">PDF Document</span>
                    </div>

                    <div className="col-span-2 flex items-center pr-2 overflow-hidden">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate w-full block" title={doc.documentTitle || doc.DocumentTitle}>{doc.documentTitle || doc.DocumentTitle || 'Processing...'}</span>
                    </div>

                    <div className="col-span-2 flex items-center pr-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded truncate">{doc.caseNumber || doc.CaseNumber || 'Missing'}</span>
                    </div>

                    <div className="col-span-1 flex items-center pr-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{doc.county || doc.County || 'Los Angeles'}</span>
                    </div>

                    <div className="col-span-1 flex items-center">{getStatusBadge(doc.status || doc.Status)}</div>

                    <div className="col-span-1 flex flex-col">
                      <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatDate(doc.createdAt || doc.CreatedAt || doc.uploadDate || new Date())}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Uploaded</span>
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setSelectedReportDocument(doc); setIsReportModalOpen(true); }} className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium whitespace-nowrap">View Report</button>
                      <button onClick={() => handleDeleteDocument(doc.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" title="Move to Recycle Bin">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
              
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      <DocumentReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} document={selectedReportDocument} />
      <EditDocumentModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} selectedDocs={selectedDocumentObjects} onSuccess={fetchDocuments} />
    </div>
  );
}

// import { useState, useEffect } from 'react';
// import UploadDocumentModal from './UploadDocumentModal';
// import ReviewModal from './ReviewModal';

// export default function Documents() {
//   const [documents, setDocuments] = useState([]);
//   const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
//   const [selectedDocument, setSelectedDocument] = useState([]);
//   const [viewingReport, setViewingReport] = useState(null);

//   const toggleSelection = (id) => {
//     if (selectedDocument.includes(id)) {
//       setSelectedDocument(selectedDocument.filter(existingId => existingId !== id));
//     } else {
//       setSelectedDocument([...selectedDocument, id]);
//     }
//   };

//   const handleDelete = async () => {
//     try {
//       const response = await fetch('/api/documents/recycle', {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(selectedDocument),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to recycle documents');
//       }

//       const remainingDocuments = documents.filter((doc) => !selectedDocument.includes(doc.id));
//       setDocuments(remainingDocuments);
//       setSelectedDocument([]);

//     } catch (error) {
//       console.error('Error recycling documents:', error);
//     }
//   };

//   useEffect(() => {
//     const fetchDocuments = async () => {
//       try {
//         const response = await fetch('/api/documents');
//         if (response.ok) {
//           const data = await response.json();
//           setDocuments(data);
//         }
//       } catch (error) {
//         console.error("Error fetching documents:", error);
//       }
//     };

//     fetchDocuments();
//   }, []);



//   return (
//     <div className="p-8 text-white w-full h-full overflow-y-auto">
//       {/* 1. Title */}
//       <h1 className="text-2xl font-bold mb-6">Account Documents</h1>

//       {/* 3. Filter Placeholder & 4. Trash Can Placeholder */}
//       <div className="flex items-center space-x-4 mb-4 text-gray-400 border-b border-gray-700 pb-2">
//         <button className="hover:text-white">≡ Filter</button>
//         {/* We will add the logic to show the 🗑️ trash icon here later */}
//       </div>

//       {/* The Data Table */}
//       <div className="w-full border border-gray-700 rounded-md overflow-hidden">
//         <div className="mb-4">
//           {selectedDocument.length > 0 && (
//             <button className="text-red-500 hover:text-red-400 flex items-center gap-2" onClick={handleDelete}>
//               🗑️ Delete Selected
//             </button>
//           )}
//         </div>
//         <table className="w-full text-left text-sm text-gray-300">
//           <thead className="border-b border-gray-700 bg-[#1f1f1f]">
//             <tr>
//               <th className="p-4 w-12">
//                 <input type="checkbox" className="rounded bg-gray-800 border-gray-600" onClick={toggleSelection} />
//               </th>
//               <th className="p-4 font-medium">Document</th>
//               <th className="p-4 font-medium">Status</th>
//               <th className="p-4 font-medium">Reviewer</th>
//               <th className="p-4 font-medium">Date</th>
//               <th className="p-4 font-medium">Report</th>
//               <th className="p-4 font-medium">Review</th>
//             </tr>
//           </thead>
          
//           <tbody>
//             {documents.length === 0 ? (
//               <tr>
//                 <td colSpan="7" className="p-12">
//                   <div className="flex flex-col items-center justify-center text-gray-500 space-y-4">
//                     {/* 1. Placeholder Image */}
//                     <div className="w-32 h-32 bg-gray-700 rounded-md flex items-center justify-center">
//                       <span className="text-4xl">📄</span> {/* Replace with your actual image later */}
//                     </div>
                    
//                     {/* 2. Empty Text */}
//                     <p>No documents available</p>
                    
//                     {/* 3. Upload Button (via Modal Component) */}
//                     <UploadDocumentModal />
//                   </div>
//                 </td>
//               </tr>
//             ) : (
//               documents.map((doc) => (
//                 <tr key={doc.id} className="border-b border-gray-700 hover:bg-[#2a2a2a]">
//                   <td className="p-4"><input type="checkbox" className="rounded bg-gray-800 border-gray-600" onClick={() => toggleSelection(doc.id)} /></td>
//                   <td className="p-4">{doc.name}</td>
//                   <td className="p-4">{doc.status}</td>
//                   <td className="p-4">{doc.reviewer}</td>
//                   <td className="p-4">
//                     <div>{doc.date}</div>
//                     <div className="text-xs text-gray-500 mt-1">Uploaded</div>
//                   </td>
//                   <td className="p-4">
//                     {doc.aiReport ? (
//                       <button 
//                         onClick={() => setViewingReport(doc.aiReport)}
//                         className="text-blue-400 hover:text-blue-300 font-medium underline transition"
//                       >
//                         View Report
//                       </button>
//                     ) : (
//                       <span className="text-gray-600 italic">No Report</span>
//                     )}
//                   </td>
//                   <td className="p-4">
//                     <button className="text-blue-400 hover:underline" onClick={() => setIsReviewModalOpen(true)}>
//                       Leave a Review
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
      
//       {/* Keeping your modal here so it can be triggered */}
//       <UploadDocumentModal />
//       {isReviewModalOpen && (
//         <ReviewModal onClose={() => setIsReviewModalOpen(false)} />
//       )}

//       {/* NEW: The AI Report Modal */}
//       {viewingReport && (
//         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
//           <div className="bg-[#1f1f1f] border border-gray-700 p-6 rounded-lg shadow-xl max-w-2xl w-full m-4">
//             <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
//               <h2 className="text-xl font-bold text-white flex items-center gap-2">
//                 🤖 AI Document Analysis
//               </h2>
//               <button 
//                 onClick={() => setViewingReport(null)}
//                 className="text-gray-400 hover:text-white transition"
//               >
//                 ✕
//               </button>
//             </div>
            
//             {/* whitespace-pre-wrap ensures the AI's bullet points format correctly! */}
//             <div className="text-gray-300 whitespace-pre-wrap mb-6 max-h-96 overflow-y-auto leading-relaxed">
//               {viewingReport}
//             </div>
            
//             <div className="flex justify-end">
//               <button
//                 onClick={() => setViewingReport(null)}
//                 className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition"
//               >
//                 Close Report
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }