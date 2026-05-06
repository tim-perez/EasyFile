import React, { useState } from 'react';
import api from '../../services/api';

export default function SubmissionReportModal({ isOpen, onClose, submission, onViewDocumentReport, onOpenDocument }) {
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen || !submission) return null;

  const documents = submission.documents || submission.Documents || [];
  const acceptedCount = submission.acceptedCount ?? submission.AcceptedCount ?? documents.filter(doc => (doc.prediction || doc.Prediction) === 'Accepted').length;
  const rejectedCount = submission.rejectedCount ?? submission.RejectedCount ?? documents.filter(doc => (doc.prediction || doc.Prediction) === 'Rejected').length;

  const downloadReports = async () => {
    try {
      setIsDownloading(true);
      const response = await api.get(`/submissions/${submission.id}/report/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = window.document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Submission_${submission.submissionNumber || submission.SubmissionNumber}_Reports.zip`);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(error.message || 'Failed to download submission reports.');
    } finally {
      setIsDownloading(false);
    }
  };

  const value = (text, fallback = 'Unknown') => text || fallback;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6 md:p-12">
      <div className="bg-white dark:bg-[#1f1f1f] w-full max-w-5xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-start px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a]">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Submission Report #{submission.submissionNumber || submission.SubmissionNumber}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{documents.length} active document(s) reviewed</p>
          </div>
          <button onClick={onClose} disabled={isDownloading} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition disabled:opacity-50">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-6 flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gray-50 dark:bg-[#1a1a1a]">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Case Info</h3>
              <div className="space-y-3 text-sm">
                <p><span className="text-gray-500 dark:text-gray-400">County: </span><span className="font-medium text-gray-900 dark:text-gray-200">{value(submission.county || submission.County)}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400">Filing Type: </span><span className="font-medium text-gray-900 dark:text-gray-200">{value(submission.filingType || submission.FilingType)}</span></p>
                {(submission.caseNumber || submission.CaseNumber) !== 'Not Yet Assigned' ? (
                  <p><span className="text-gray-500 dark:text-gray-400">Case Number: </span><span className="font-mono font-medium text-gray-900 dark:text-gray-200">{submission.caseNumber || submission.CaseNumber}</span></p>
                ) : (
                  <>
                    <p><span className="text-gray-500 dark:text-gray-400">Case Name: </span><span className="font-medium text-gray-900 dark:text-gray-200">{value(submission.caseTitle || submission.CaseTitle)}</span></p>
                    <p><span className="text-gray-500 dark:text-gray-400">Case Category: </span><span className="font-medium text-gray-900 dark:text-gray-200">{value(submission.caseCategory || submission.CaseCategory)}</span></p>
                    <p><span className="text-gray-500 dark:text-gray-400">Case Type: </span><span className="font-medium text-gray-900 dark:text-gray-200">{value(submission.caseType || submission.CaseType)}</span></p>
                  </>
                )}
              </div>
            </section>

            <section className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gray-50 dark:bg-[#1a1a1a]">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Case Participants</h3>
              <div className="space-y-3 text-sm">
                <p><span className="text-gray-500 dark:text-gray-400">Plaintiff(s) / Petitioner(s): </span><span className="font-medium text-gray-900 dark:text-gray-200">{value(submission.plaintiffsOrPetitioners || submission.PlaintiffsOrPetitioners)}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400">Defendant(s) / Respondent(s): </span><span className="font-medium text-gray-900 dark:text-gray-200">{value(submission.defendantsOrRespondents || submission.DefendantsOrRespondents)}</span></p>
                <p><span className="text-gray-500 dark:text-gray-400">Attorney(s): </span><span className="font-medium text-gray-900 dark:text-gray-200">{value(submission.attorneys || submission.Attorneys, 'None')}</span></p>
              </div>
            </section>
          </div>

          <section className="mt-6 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Document(s) Uploaded</h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-800">
              {documents.length === 0 ? (
                <div className="px-5 py-5 text-sm text-red-600 dark:text-red-400">No active documents remain in this submission.</div>
              ) : documents.map(doc => (
                <div key={doc.id} className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
                  <button onClick={() => onOpenDocument(doc.id)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate">{doc.fileName || doc.FileName}</button>
                  <button onClick={() => onViewDocumentReport(doc)} className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400">View Report</button>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gray-50 dark:bg-[#1a1a1a]">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Court Fees</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">${Number(submission.totalCourtFees || submission.TotalCourtFees || 0).toFixed(2)}</p>
            </div>
            <div className="border border-gray-200 dark:border-gray-800 rounded-xl p-5 bg-gray-50 dark:bg-[#1a1a1a] lg:col-span-2">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Summary</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{acceptedCount}/{documents.length} document(s) likely to be accepted</p>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-200 mt-1">{rejectedCount}/{documents.length} document(s) likely to be rejected</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] flex justify-end gap-3">
          <button onClick={onClose} disabled={isDownloading} className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg">Close</button>
          <button onClick={downloadReports} disabled={isDownloading || documents.length === 0} className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-60">
            {isDownloading ? 'Downloading...' : 'Download Reports'}
          </button>
        </div>
      </div>
    </div>
  );
}
