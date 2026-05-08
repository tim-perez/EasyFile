import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthProvider';
import api from '../../../services/api'; 
import UploadDocumentModal from '../UploadDocumentModal';
import SubmissionReportModal from '../SubmissionReportModal';
import DocumentReportModal from '../DocumentReportModal';

export default function ActionWidget() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userDictionary, setUserDictionary] = useState({});
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [selectedReportDoc, setSelectedReportDoc] = useState(null);

  const fetchRecentSubmissions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/submissions?pageNumber=1&pageSize=1000');
      setRecentSubmissions(response.data.items || response.data || []);
    } catch (error) {
      console.error("Failed to fetch recent submissions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentSubmissions();
    window.addEventListener('documentUploaded', fetchRecentSubmissions);
    return () => window.removeEventListener('documentUploaded', fetchRecentSubmissions);
  }, []);

  useEffect(() => {
    if (user?.role === 'Admin') {
      api.get('/users/all?pageNumber=1&pageSize=1000').then(res => {
        const dictionary = {};
        const usersList = res.data.items || res.data;
        usersList.forEach(u => dictionary[u.id] = u);
        setUserDictionary(dictionary);
      }).catch(err => console.error("Failed to load user dictionary", err));
    }
  }, [user]);

  const handleOpenDocument = async (id) => {
    try {
      const response = await api.get(`/documents/${id}/url`);
      window.open(response.data.url, '_blank');
    } catch (error) {
      console.error("Error fetching document URL:", error);
    }
  };

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col h-full min-h-100 shadow-sm overflow-hidden transition-all duration-300">
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
           <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
        </div>
      ) : recentSubmissions.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-24 h-24 mb-6 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm px-4 leading-relaxed">
            No submission reports are available yet. <br/>
            Visit Submissions to upload legal files.
          </p>
          <button 
            onClick={() => navigate('/submissions')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            Go to Submissions Tab
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col h-full">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Submissions</h2>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title="Upload New Documents"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {recentSubmissions.map((submission) => {
              const submissionNumber = submission.submissionNumber || submission.SubmissionNumber || '0000';
              const uploader = userDictionary[submission.uploaderId ?? submission.UploaderId];
              const initials = uploader?.accountType === 'Guest'
                ? 'GU'
                : `${uploader?.firstName?.[0] || ''}${uploader?.lastName?.[0] || ''}`.toUpperCase() || '??';

              return (
              <div key={submission.id || submission.Id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#232323] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                
                <div className="flex items-center gap-3 overflow-hidden pr-4">
                  {user?.role === 'Admin' ? (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${uploader?.accountType === 'Guest' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'}`}>
                      {initials}
                    </div>
                  ) : (
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                  <button 
                    onClick={() => setSelectedSubmission(submission)}
                    className="text-sm font-medium text-gray-900 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 truncate text-left transition-colors"
                    title={`Submission #${submissionNumber}`}
                  >
                    Submission #{submissionNumber}
                  </button>
                </div>

                <button 
                  onClick={() => setSelectedSubmission(submission)}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  View Report
                </button>
              </div>
            )})}
          </div>
          <div className="p-4 pt-0 mt-auto">
            <button 
              onClick={() => navigate('/submissions')}
              className="w-full py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 border border-blue-100 dark:border-blue-800/50 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Go to Submissions Tab
            </button>
          </div>
        </div>
      )}

      <UploadDocumentModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
      <SubmissionReportModal isOpen={Boolean(selectedSubmission)} onClose={() => setSelectedSubmission(null)} submission={selectedSubmission} onViewDocumentReport={setSelectedReportDoc} onOpenDocument={handleOpenDocument} />
      <DocumentReportModal isOpen={Boolean(selectedReportDoc)} onClose={() => setSelectedReportDoc(null)} document={selectedReportDoc} />
    </div>
  );
}
