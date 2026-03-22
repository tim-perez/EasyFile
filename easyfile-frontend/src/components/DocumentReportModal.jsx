import React, { useState } from 'react';
import api from '../services/api'; 

export default function DocumentReportModal({ isOpen, onClose, document }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !document) return null;

  // NEW: Convert the C# pipeline string ("Warning 1|Warning 2") back into an array
  const realWarnings = document?.warnings || document?.Warnings
    ? (document.warnings || document.Warnings).split('|').filter(w => w.trim() !== '') 
    : [];

  const handleDownloadReport = async () => {
    try {
      setIsDownloading(true);
      
      const response = await api.get(`/documents/${document.id}/report/download`, {
        responseType: 'blob' 
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${document.fileName || document.FileName || 'Legal_Document'}_AI_Report.pdf`);
      
      window.document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("Download Error:", error);
      alert("The backend PDF generator is not connected yet! We need to build the C# endpoint.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity backdrop-blur-sm px-4">
      
      <div className="bg-white dark:bg-[#1f1f1f] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col transition-all overflow-hidden border border-gray-200 dark:border-gray-800">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a]">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              E-Filing Document Intelligence
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              File: <span className="font-medium text-gray-700 dark:text-gray-300">{document.fileName || document.FileName}</span>
            </p>
          </div>
          <button 
            onClick={onClose} 
            disabled={isDownloading}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 flex-1 bg-white dark:bg-[#1f1f1f]">
          <div className="bg-white dark:bg-[#1f1f1f] pb-4 px-2">
            
            {/* 🔴 PRE-FLIGHT REJECTION WARNINGS */}
            <div className="mb-8 border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-xl overflow-hidden">
              <div className="bg-red-100 dark:bg-red-900/30 px-4 py-3 border-b border-red-200 dark:border-red-900/50 flex items-center gap-2">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <h3 className="font-semibold text-red-800 dark:text-red-300">Pre-Flight Rejection Warnings</h3>
              </div>
              <ul className="p-4 space-y-2">
                {/* DYNAMIC: Map over the real warnings from the AI */}
                {realWarnings.length > 0 ? (
                  realWarnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                      <span className="mt-0.5 text-red-500">•</span>
                      {warning}
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-green-700 dark:text-green-400 font-medium">
                    No critical issues detected by AI.
                  </li>
                )}
              </ul>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* 🏛 1. Setup & Categorization */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gray-50 dark:bg-[#1a1a1a]">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">1. Setup & Categorization</h3>
                <div className="grid grid-cols-1 gap-4">
                
                  <div className="w-full bg-white dark:bg-[#282828] p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Case Title / Name</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{document.caseTitle || document.CaseTitle || 'Unknown'}</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Filing Type</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-200">
                        {document.filingType || document.FilingType || 'Unknown'}
                        
                        {/* NEW: If it's a subsequent filing, boldly inject the real Case Number! */}
                        {(document.filingType === 'Subsequent Filing' || document.FilingType === 'Subsequent Filing') && 
                         (document.caseNumber !== 'Missing' && document.CaseNumber !== 'Missing') && (
                          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 ml-1">
                            ({document.caseNumber || document.CaseNumber})
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Case Category</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{document.caseCategory || document.CaseCategory || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Case Type</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{document.caseType || document.CaseType || 'Unknown'}</p>
                    </div>
                  </div>
                  
                </div>
              </div>

              {/* ⚖️ 2. Parties & Representation */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gray-50 dark:bg-[#1a1a1a]">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">2. Parties & Representation</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Filed By (On Behalf Of)</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{document.filedBy || document.FiledBy || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Refers To (As To)</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{document.refersTo || document.RefersTo || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Representation</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{document.representation || document.Representation || 'Unknown'}</p>
                  </div>
                </div>
              </div>

              {/* 📑 3. Document Specifics */}
              <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gray-50 dark:bg-[#1a1a1a] md:col-span-2">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">3. Document Specifics</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">E-Filing Document Type</p>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{document.eFilingDocType || document.EFilingDocType || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Exact Document Title</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate" title={document.documentTitle || document.DocumentTitle}>{document.documentTitle || document.DocumentTitle || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Estimated Filing Fee</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{document.estimatedFee || document.EstimatedFee || '$0.00'}</p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
        
        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] flex justify-end gap-3">
          <button 
            onClick={onClose} 
            disabled={isDownloading}
            className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Close
          </button>
          
          <button 
            onClick={handleDownloadReport}
            disabled={isDownloading}
            className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin w-4 h-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Report
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}