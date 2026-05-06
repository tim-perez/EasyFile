import React, { useEffect, useState } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { useDocuments } from '../hooks/useDocuments';
import api from '../services/api';
import SortableHeader from '../components/common/SortableHeader';
import DocumentReportModal from '../components/features/DocumentReportModal';
import SubmissionReportModal from '../components/features/SubmissionReportModal';

export default function Submissions() {
  const { user } = useAuth();
  const { onOpenUploadModal } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    documents: submissions, originalDocuments, totalCount, totalPages, pageNumber, setPageNumber,
    isLoading, error, fetchDocuments, selectedIds, handleSelectAll, handleSelectOne,
    sortConfig, handleSort, setSearchQuery
  } = useDocuments('/submissions');

  const [expandedIds, setExpandedIds] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [userDictionary, setUserDictionary] = useState({});
  const [activePopoverId, setActivePopoverId] = useState(null);

  const globalSearchQuery = searchParams.get('q') || '';

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery, setSearchQuery]);

  useEffect(() => {
    if (user?.role === 'Admin') {
      api.get('/users/all?pageNumber=1&pageSize=1000').then(res => {
        const dictionary = {};
        const usersList = res.data.items || res.data;
        usersList.forEach(u => dictionary[u.id] = u);
        setUserDictionary(dictionary);
      }).catch(err => console.error('Failed to load user dictionary', err));
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = () => setActivePopoverId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleExpanded = (id) => {
    setExpandedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const handleOpenDocument = async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/url`);
      if (response.data?.url) window.open(response.data.url, '_blank');
    } catch (err) {
      alert(err.message || 'Failed to open document.');
    }
  };

  const handleDeleteSubmission = async (submissionId) => {
    if (!window.confirm('Move this submission and its documents to the Recycle Bin?')) return;
    try {
      await api.delete(`/submissions/${submissionId}`);
      fetchDocuments();
      window.dispatchEvent(new Event('documentUploaded'));
    } catch (err) {
      alert(err.message || 'Error deleting submission.');
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Move ${selectedIds.length} submissions to the Recycle Bin?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/submissions/${id}`)));
      fetchDocuments();
      window.dispatchEvent(new Event('documentUploaded'));
    } catch (err) {
      alert(err.message || 'Error deleting submissions.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const documentsFor = (submission) => submission.documents || submission.Documents || [];
  const submissionNumber = (submission) => submission.submissionNumber || submission.SubmissionNumber || '0000';

  return (
    <div className="w-full relative pb-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Submissions</h1>

      {error && <div className="mb-4 p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">{error}</div>}

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${selectedIds.length > 0 ? 'max-h-40 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 shadow-sm rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800">{selectedIds.length} selected</span>
          {user?.role !== 'Guest' && (
            <button onClick={handleBulkDelete} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Move to Recycle Bin
            </button>
          )}
        </div>
      </div>

      {globalSearchQuery && (
        <div className="mb-4 flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium border border-blue-200 dark:border-blue-800 w-fit">
          <span>Search: "{globalSearchQuery}"</span>
          <button onClick={() => { const params = new URLSearchParams(searchParams); params.delete('q'); setSearchParams(params); }} className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : submissions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#1a1a1a]">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm">
            <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /></svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No submissions found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm max-w-sm">Upload one or more legal PDFs to create a submission.</p>
          {originalDocuments.length === 0 && (
            <button onClick={onOpenUploadModal} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Upload Documents
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <div className="w-full min-w-300">
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-1 flex items-center justify-center">
                  <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer" checked={submissions.length > 0 && selectedIds.length === submissions.length} onChange={(event) => handleSelectAll(event, submissions)} />
                </div>
                <div className="col-span-1"></div>
                <SortableHeader label="Submission #" sortKey="submissionNumber" colSpan={1} currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="County" sortKey="county" colSpan={2} currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Case Number" sortKey="caseNumber" colSpan={2} currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Documents Uploaded" sortKey="documentsUploaded" colSpan={2} currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Date Submitted" sortKey="date" colSpan={1} currentSort={sortConfig} onSort={handleSort} />
                <div className="col-span-2 text-right">Actions</div>
              </div>

              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {submissions.map(submission => {
                  const docs = documentsFor(submission);
                  const expanded = expandedIds.includes(submission.id);
                  return (
                    <div key={submission.id}>
                      <div className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all group ${selectedIds.includes(submission.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#282828]'}`}>
                        <div className="col-span-1 flex items-center justify-center">
                          <input type="checkbox" className={`rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer transition-opacity ${selectedIds.includes(submission.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} checked={selectedIds.includes(submission.id)} onChange={() => handleSelectOne(submission.id)} />
                        </div>

                        <div className="col-span-1 flex items-center gap-2">
                          <button onClick={() => toggleExpanded(submission.id)} className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400" title={expanded ? 'Collapse submission' : 'Expand submission'}>
                            <svg className={`w-5 h-5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                          </button>
                          {user?.role === 'Admin' && (
                            <div className="relative" onClick={(event) => event.stopPropagation()}>
                              <button onClick={() => setActivePopoverId(activePopoverId === submission.id ? null : submission.id)} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                                {`${userDictionary[submission.uploaderId]?.firstName?.[0] || ''}${userDictionary[submission.uploaderId]?.lastName?.[0] || ''}`.toUpperCase() || '??'}
                              </button>
                              {activePopoverId === submission.id && (
                                <div className="absolute left-0 top-10 z-30 w-64 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
                                  <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">Uploader Details</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Name</span><span className="font-medium text-gray-900 dark:text-gray-100">{userDictionary[submission.uploaderId]?.firstName} {userDictionary[submission.uploaderId]?.lastName}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Account #</span><span className="font-medium text-gray-900 dark:text-gray-200">{submission.uploaderId}</span></div>
                                    <div className="flex justify-between"><span className="text-gray-500 dark:text-gray-400">Role</span><span className="font-medium text-gray-900 dark:text-gray-200">{userDictionary[submission.uploaderId]?.accountType}</span></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="col-span-1"><span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">#{submissionNumber(submission)}</span></div>
                        <div className="col-span-2"><span className="text-sm text-gray-700 dark:text-gray-300 truncate">{submission.county || submission.County || 'Unknown'}</span></div>
                        <div className="col-span-2"><span className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded truncate">{submission.caseNumber || submission.CaseNumber || 'Not Yet Assigned'}</span></div>
                        <div className="col-span-2"><span className="text-sm text-gray-900 dark:text-gray-200 font-medium">{submission.documentsUploaded ?? submission.DocumentsUploaded ?? docs.length}</span></div>
                        <div className="col-span-1"><span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatDate(submission.createdAt || submission.CreatedAt)}</span></div>
                        <div className="col-span-2 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setSelectedSubmission(submission)} className="text-blue-500 hover:text-blue-700 text-sm font-medium">View Full Report</button>
                          {user?.role !== 'Guest' && (
                            <button onClick={() => handleDeleteSubmission(submission.id)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400" title="Move to Recycle Bin">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {expanded && (
                        <div className="bg-gray-50 dark:bg-[#171717] px-14 py-4 border-t border-gray-200 dark:border-gray-800">
                          {docs.length === 0 ? (
                            <div className="text-sm text-red-600 dark:text-red-400">No active documents remain for this submission.</div>
                          ) : (
                            <div className="space-y-2">
                              {docs.map(doc => (
                                <div key={doc.id} className="grid grid-cols-12 gap-4 items-center bg-white dark:bg-[#202020] border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3">
                                  <button onClick={() => handleOpenDocument(doc.id)} className="col-span-4 text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate">{doc.fileName || doc.FileName}</button>
                                  <span className="col-span-3 text-sm text-gray-700 dark:text-gray-300 truncate">{doc.eFilingDocType || doc.EFilingDocType || doc.documentTitle || doc.DocumentTitle || 'Unknown'}</span>
                                  <span className={`col-span-2 text-xs font-bold uppercase ${doc.prediction === 'Rejected' || doc.Prediction === 'Rejected' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>{doc.prediction || doc.Prediction || 'Unknown'}</span>
                                  <button onClick={() => setSelectedDocument(doc)} className="col-span-3 text-right text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">View Full Report</button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1a1a]">
              <div className="text-sm text-gray-500 dark:text-gray-400">Showing <span className="font-medium text-gray-900 dark:text-white">{((pageNumber - 1) * 20) + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(pageNumber * 20, totalCount)}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalCount}</span> results</div>
              <div className="flex gap-2">
                <button onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))} disabled={pageNumber === 1} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">Previous</button>
                <div className="flex items-center px-4 font-medium text-sm text-gray-700 dark:text-gray-300">Page {pageNumber} of {totalPages}</div>
                <button onClick={() => setPageNumber(prev => Math.min(prev + 1, totalPages))} disabled={pageNumber === totalPages} className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      <SubmissionReportModal isOpen={Boolean(selectedSubmission)} onClose={() => setSelectedSubmission(null)} submission={selectedSubmission} onViewDocumentReport={setSelectedDocument} onOpenDocument={handleOpenDocument} />
      <DocumentReportModal isOpen={Boolean(selectedDocument)} onClose={() => setSelectedDocument(null)} document={selectedDocument} />
    </div>
  );
}
