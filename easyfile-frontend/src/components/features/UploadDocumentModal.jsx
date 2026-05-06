import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import api from '../../services/api';

const MAX_FILE_SIZE = 25 * 1024 * 1024;

export default function UploadDocumentModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadState, setUploadState] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const reset = () => {
    setSelectedFiles([]);
    setUploadState('idle');
    setProgress(0);
    setStatusText('');
    setErrorMessage('');
    setIsDragging(false);
    setShowConfirm(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCloseModal = () => {
    if (uploadState === 'processing') return;
    onClose();
    setTimeout(reset, 300);
  };

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    const invalid = incoming.find(file => file.type !== 'application/pdf' || !file.name.toLowerCase().endsWith('.pdf'));
    if (invalid) {
      setErrorMessage('Upload Failed: EasyFile only accepts PDF legal documents.');
      setUploadState('error');
      return;
    }

    const oversized = incoming.find(file => file.size > MAX_FILE_SIZE);
    if (oversized) {
      setErrorMessage(`Upload Failed: ${oversized.name} is too large. Maximum file size is 25 MB.`);
      setUploadState('error');
      return;
    }

    setUploadState('idle');
    setErrorMessage('');
    setSelectedFiles(prev => {
      const existing = new Set(prev.map(file => `${file.name}-${file.size}-${file.lastModified}`));
      const next = incoming.filter(file => !existing.has(`${file.name}-${file.size}-${file.lastModified}`));
      return [...prev, ...next];
    });
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const openLocalPreview = (file) => {
    const url = window.URL.createObjectURL(file);
    window.open(url, '_blank', 'noopener,noreferrer');
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  };

  const submitFiles = async () => {
    setShowConfirm(false);
    setUploadState('processing');
    setProgress(0);
    setStatusText('Uploading documents...');

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 35 && prev < 40) setStatusText('Extracting first-page text...');
        if (prev >= 60 && prev < 65) setStatusText('AI legal review in progress...');
        if (prev >= 85) return 85;
        return prev + 2;
      });
    }, 180);

    try {
      const formData = new FormData();
      selectedFiles.forEach(file => formData.append('files', file));
      formData.append('userId', user?.id || localStorage.getItem('id') || '1');

      const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      clearInterval(progressInterval);
      setProgress(100);
      setStatusText(`Submission #${response.data?.submissionNumber || ''} complete`);

      setTimeout(() => {
        setUploadState('success');
        window.dispatchEvent(new Event('documentUploaded'));
        window.dispatchEvent(new Event('submissionUploaded'));
        window.dispatchEvent(new CustomEvent('documentProcessed', {
          detail: { fileName: `${selectedFiles.length} document(s)` }
        }));
      }, 500);
    } catch (error) {
      clearInterval(progressInterval);
      setUploadState('error');
      setErrorMessage(error.message || 'An error occurred during upload or analysis. Please try again.');
    }
  };

  const onDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  };

  const goToSubmissions = () => {
    handleCloseModal();
    navigate('/submissions');
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-[#1f1f1f] w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all">
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Legal Documents</h2>
          <button onClick={handleCloseModal} disabled={uploadState === 'processing'} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 md:p-8 flex flex-col min-h-87.5">
          {uploadState === 'idle' && (
            <>
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                className={`w-full flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-xl transition-all duration-200 ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#121212]'}`}
              >
                <div className="w-16 h-16 bg-blue-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mb-5 shadow-sm">
                  <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Drag and drop PDFs here</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 text-center max-w-sm">
                  Only PDF legal documents are accepted. EasyFile will review the first page of each uploaded document.
                </p>

                <input type="file" ref={fileInputRef} onChange={(event) => addFiles(event.target.files)} className="hidden" accept=".pdf,application/pdf" multiple />
                <button onClick={() => fileInputRef.current.click()} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors uppercase text-sm tracking-wider">
                  Select PDFs
                </button>
              </div>

              {selectedFiles.length > 0 && (
                <div className="mt-6 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedFiles.length} document(s) ready</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">First page reviewed for each PDF</span>
                  </div>
                  <div className="divide-y divide-gray-200 dark:divide-gray-800 max-h-56 overflow-y-auto">
                    {selectedFiles.map((file, index) => (
                      <div key={`${file.name}-${file.lastModified}`} className="px-4 py-3 flex items-center justify-between gap-4">
                        <button onClick={() => openLocalPreview(file)} className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline truncate text-left">
                          {file.name}
                        </button>
                        <button onClick={() => removeFile(index)} className="text-red-600 hover:text-red-700 dark:text-red-400 p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20" title="Remove document">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 py-4 bg-gray-50 dark:bg-[#1a1a1a] flex flex-wrap justify-end gap-3">
                    <button onClick={() => fileInputRef.current.click()} className="px-5 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#333] dark:text-gray-200 dark:hover:bg-[#444] font-medium rounded-lg transition-colors">
                      Upload More
                    </button>
                    <button onClick={() => setShowConfirm(true)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors">
                      Submit
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {uploadState === 'processing' && (
            <div className="flex flex-1 flex-col items-center justify-center animate-pulse py-12">
              <div className="relative flex items-center justify-center w-32 h-32 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="6" className="text-gray-200 dark:text-gray-700" />
                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="6" className="text-blue-600 dark:text-blue-500 transition-all duration-200 ease-out" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
                </svg>
                <span className="absolute text-xl font-bold text-gray-900 dark:text-white">{progress}%</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{statusText}</h3>
              <p className="text-gray-500 dark:text-gray-400">Please do not close this window.</p>
            </div>
          )}

          {uploadState === 'success' && (
            <div className="flex flex-1 flex-col items-center justify-center py-12">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Submission Complete</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">Your documents were uploaded and reviewed by AI.</p>
              <div className="flex gap-4">
                <button onClick={reset} className="px-6 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#333] dark:text-gray-200 dark:hover:bg-[#444] font-medium rounded-lg transition-colors">Upload More</button>
                <button onClick={goToSubmissions} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors">Go to Submissions</button>
              </div>
            </div>
          )}

          {uploadState === 'error' && (
            <div className="flex flex-1 flex-col items-center justify-center text-center py-12">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload Failed</h3>
              <p className="text-red-600 dark:text-red-400 mb-8 max-w-md bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/50">{errorMessage}</p>
              <button onClick={() => setUploadState('idle')} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors">Try Again</button>
            </div>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-md bg-white dark:bg-[#242424] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Confirm Submission</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">Submit {selectedFiles.length} PDF document(s) for AI review?</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">Cancel</button>
              <button onClick={submitFiles} className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
