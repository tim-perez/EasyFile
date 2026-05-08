import React, { useState } from 'react';
import api from '../../services/api'; 
import { parsePipeList } from '../../utils/documentTypes';

export default function DocumentReportModal({ isOpen, onClose, document, zIndex = 50 }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !document) return null;

  const isSubstantiveWarning = (warning) => {
    const normalized = String(warning || '').trim().toLowerCase();
    return normalized !== ''
      && normalized !== 'none'
      && normalized !== 'none.'
      && normalized !== '(none)'
      && normalized !== '[]';
  };

  const parsedWarnings = parsePipeList(document.warnings || document.Warnings);
  const realWarnings = parsedWarnings.filter(isSubstantiveWarning);
  const suggestedTypes = parsePipeList(document.suggestedDocumentTypes || document.SuggestedDocumentTypes);
  
  const fee = document.documentFee ?? document.DocumentFee ?? document.estimatedFee ?? document.EstimatedFee ?? '$0.00';
  const storedPrediction = document.prediction || document.Prediction || 'Unknown';
  const prediction = realWarnings.length > 0
    ? 'Rejected'
    : storedPrediction === 'Rejected' && parsedWarnings.length > 0
      ? 'Accepted'
      : storedPrediction;

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
      alert("Failed to download the PDF report. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 transition-opacity backdrop-blur-sm p-6 md:p-12" style={{ zIndex }}>      
      <div className="bg-white dark:bg-[#1f1f1f] w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col transition-all overflow-hidden border border-gray-200 dark:border-gray-800">        
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a]">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              E-Filing Document Intelligence
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                File: <span className="font-medium text-gray-700 dark:text-gray-300">{document.fileName || document.FileName}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} disabled={isDownloading} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition disabled:opacity-50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 flex-1 bg-white dark:bg-[#1f1f1f] space-y-6">
          
          {/* Section 1: Pre-Flight Rejection Warnings */}
          <div className="border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 rounded-xl overflow-hidden">
            <div className="bg-red-100 dark:bg-red-900/30 px-4 py-3 border-b border-red-200 dark:border-red-900/50 flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <h3 className="font-semibold text-red-800 dark:text-red-300">Pre-Flight Rejection Warning(s)</h3>
            </div>
            <ul className="p-4 space-y-2">
              {realWarnings.length === 0 ? (
                <li className="text-sm text-green-700 dark:text-green-400 font-medium">None</li>
              ) : (
                realWarnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-red-700 dark:text-red-400">
                    <span className="mt-0.5 text-red-500">•</span>{warning}
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section 2: Suggested Document Types */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gray-50 dark:bg-[#1a1a1a]">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 border-b border-gray-200 dark:border-gray-800 pb-2">Suggested Document Type(s)</h3>
              {suggestedTypes.length > 0 ? (
                <ul className="list-decimal pl-5 space-y-1.5 text-sm font-medium text-gray-800 dark:text-gray-200">
                  {suggestedTypes.map((type, index) => <li key={index}>{type}</li>)}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">Unknown</p>
              )}
            </div>

            {/* Section 3: Exact Document Title */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gray-50 dark:bg-[#1a1a1a]">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 dark:border-gray-800 pb-2">Exact Document Title</h3>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-3">
                {document.documentTitle || document.DocumentTitle || 'Unknown'}
              </p>
            </div>

            {/* Section 4: Document Fee */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gray-50 dark:bg-[#1a1a1a]">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 dark:border-gray-800 pb-2">Document Fee</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-2">
                {typeof fee === 'number' ? `$${fee.toFixed(2)}` : fee}
              </p>
            </div>

            {/* Section 5: Predicted Clerk Decision */}
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gray-50 dark:bg-[#1a1a1a]">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 border-b border-gray-200 dark:border-gray-800 pb-2">Predicted Clerk Decision</h3>
              <div className="mt-3">
                <span className={`inline-flex items-center px-4 py-1.5 rounded-md text-sm font-bold uppercase tracking-wider ${
                  prediction === 'Rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' 
                    : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                }`}>
                  {prediction}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] flex justify-end gap-3 shrink-0">
          <button onClick={onClose} disabled={isDownloading} className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50">
            Close
          </button>
          <button onClick={handleDownloadReport} disabled={isDownloading} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm flex items-center gap-2 transition-colors disabled:opacity-75 disabled:cursor-not-allowed">
            {isDownloading ? 'Downloading...' : 'Download Report'}
          </button>
        </div>

      </div>
    </div>
  );
}
