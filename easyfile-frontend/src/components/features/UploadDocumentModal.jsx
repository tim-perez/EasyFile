import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import api from '../../services/api';

export default function UploadDocumentModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [uploadState, setUploadState] = useState('idle'); 
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleCloseModal = () => {
    onClose(); 
    
    setTimeout(() => {
      setUploadState('idle');
      setProgress(0);
      setErrorMessage('');
    }, 300);
  };

  if (!isOpen) return null;

  const handleFileSelect = (file) => {
    if (!file) return;
    
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage("Invalid file type. Please upload a PDF or Image (JPG/PNG).");
      setUploadState('error');
      return;
    }

    processUpload(file);
  };

  const processUpload = async (file) => {
    setUploadState('processing');
    setProgress(0);
    setStatusText('Encrypting and uploading file...');

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 40 && prev < 45) setStatusText('Extracting text via AWS Textract...');
        if (prev >= 60 && prev < 65) setStatusText('AI Legal Review in progress...');
        
        if (prev >= 85) return 85; 
        return prev + 2; 
      });
    }, 150);

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const currentUserId = user?.id || localStorage.getItem('id') || "1";
      formData.append('userId', currentUserId);

      await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      clearInterval(progressInterval);
      setProgress(100);
      setStatusText('Scan Complete!');

      setTimeout(() => {
        setUploadState('success');
        
        window.dispatchEvent(new Event('documentUploaded')); 
        window.dispatchEvent(new CustomEvent('documentProcessed', { 
          detail: { fileName: file.name } 
        }));
        
      }, 500);

    } catch (error) {
      clearInterval(progressInterval);
      setUploadState('error');
      setErrorMessage(
        error.response?.data?.error ||    
        error.response?.data?.message || 
        'An error occurred during upload or analysis. Please try again.'
      );
    }
  };

  const onDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const goToDocuments = () => {
    handleCloseModal();
    navigate('/documents');
  };

  const resetUploader = () => {
    setUploadState('idle');
    setProgress(0);
    setErrorMessage('');
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 transition-opacity backdrop-blur-sm px-4">
      
      <div className="bg-white dark:bg-[#1f1f1f] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all">
        
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Upload Legal Document</h2>
          <button 
            onClick={handleCloseModal} 
            disabled={uploadState === 'processing'}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 md:p-10 flex flex-col items-center justify-center min-h-87.5">
          
          {uploadState === 'idle' && (
            <div 
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`w-full flex flex-col items-center justify-center py-16 border-2 border-dashed rounded-xl transition-all duration-200
                ${isDragging 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-[#121212]'}`}
            >
              <div className="w-20 h-20 bg-blue-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mb-6 shadow-sm">
                <svg className="w-10 h-10 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Drag and drop document here</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 text-center max-w-xs">
                Please upload the cover page or first page of the legal document (PDF, JPG, PNG). Single file uploads only.
              </p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => handleFileSelect(e.target.files[0])} 
                className="hidden" 
                accept=".pdf, image/jpeg, image/png"
              />
              <button 
                onClick={() => fileInputRef.current.click()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors uppercase text-sm tracking-wider"
              >
                Select File
              </button>
            </div>
          )}

          {uploadState === 'processing' && (
            <div className="flex flex-col items-center justify-center animate-pulse">
              <div className="relative flex items-center justify-center w-32 h-32 mb-6">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="6" className="text-gray-200 dark:text-gray-700" />
                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" strokeWidth="6" className="text-blue-600 dark:text-blue-500 transition-all duration-200 ease-out" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={strokeDashoffset} 
                    strokeLinecap="round" 
                  />
                </svg>
                <span className="absolute text-xl font-bold text-gray-900 dark:text-white">{progress}%</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{statusText}</h3>
              <p className="text-gray-500 dark:text-gray-400">Please do not close this window.</p>
            </div>
          )}

          {uploadState === 'success' && (
            <div className="flex flex-col items-center justify-center">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload Complete</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 text-center">
                Your document was successfully uploaded and scanned by AI.
              </p>
              
              <div className="flex gap-4">
                <button onClick={resetUploader} className="px-6 py-2.5 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#333] dark:text-gray-200 dark:hover:bg-[#444] font-medium rounded-lg transition-colors">
                  Upload More
                </button>
                <button onClick={goToDocuments} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors">
                  Go to Documents
                </button>
              </div>
            </div>
          )}

          {uploadState === 'error' && (
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
                <svg className="w-12 h-12 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Upload Failed</h3>
              <p className="text-red-600 dark:text-red-400 mb-8 max-w-md bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/50">
                {errorMessage}
              </p>
              
              <button onClick={resetUploader} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors">
                Try Again
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}