import React, { useState, useEffect } from 'react';
import api from '../../services/api'; 

export default function EditDocumentModal({ isOpen, onClose, selectedDocs, onSuccess }) {
  const [formData, setFormData] = useState({
    fileName: '',
    documentTitle: '',
    caseNumber: '',
    county: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(''); // NEW: Dedicated error state

  // If exactly ONE document is selected, pre-fill the form so they can see what they are editing.
  // If multiple are selected, keep it blank so we only send deliberate updates.
  useEffect(() => {
    if (isOpen && selectedDocs.length === 1) {
      const doc = selectedDocs[0];
      setFormData({
        fileName: doc.fileName || doc.FileName || '',
        documentTitle: doc.documentTitle || doc.DocumentTitle || '',
        caseNumber: doc.caseNumber || doc.CaseNumber || '',
        county: doc.county || doc.County || ''
      });
    } else {
      setFormData({ fileName: '', documentTitle: '', caseNumber: '', county: '' });
    }
    setError(''); // Reset error state whenever the modal opens
  }, [isOpen, selectedDocs]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCloseModal = () => {
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Extract IDs (handling potential casing differences from the backend)
      const documentIds = selectedDocs.map(doc => doc.id || doc.Id);

      // Only send fields that actually have text in them
      const payload = {
        documentIds,
        fileName: formData.fileName.trim() !== '' ? formData.fileName : null,
        documentTitle: formData.documentTitle.trim() !== '' ? formData.documentTitle : null,
        caseNumber: formData.caseNumber.trim() !== '' ? formData.caseNumber : null,
        county: formData.county.trim() !== '' ? formData.county : null,
      };

      await api.put('/documents/bulk-edit', payload);
      onSuccess(); 
      handleCloseModal(); 
    } catch (err) {
      console.error("Failed to edit documents:", err);
      // Cleanly display the error in the UI instead of a browser alert
      setError(err.response?.data?.message || "Failed to save edits. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isBulk = selectedDocs.length > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity">
      <div className="bg-white dark:bg-[#1f1f1f] w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a]">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {isBulk ? `Edit ${selectedDocs.length} Documents` : 'Edit Document'}
          </h2>
          {isBulk && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
              Note: Only fields you type in will be updated across all selected files. Leave blank to keep existing data.
            </p>
          )}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* NEW: Inline Error Display */}
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File Name</label>
            <input
              type="text"
              name="fileName"
              value={formData.fileName}
              onChange={handleChange}
              placeholder={isBulk ? "Leave blank to keep original names" : ""}
              className="w-full px-4 py-2 bg-white dark:bg-[#151515] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">AI Document Title</label>
            <input
              type="text"
              name="documentTitle"
              value={formData.documentTitle}
              onChange={handleChange}
              placeholder={isBulk ? "Leave blank to keep original titles" : ""}
              className="w-full px-4 py-2 bg-white dark:bg-[#151515] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Case Number</label>
            <input
              type="text"
              name="caseNumber"
              value={formData.caseNumber}
              onChange={handleChange}
              placeholder={isBulk ? "Leave blank to keep original case numbers" : ""}
              className="w-full px-4 py-2 bg-white dark:bg-[#151515] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">County</label>
            <input
              type="text"
              name="county"
              value={formData.county}
              onChange={handleChange}
              placeholder={isBulk ? "Leave blank to keep original counties" : ""}
              className="w-full px-4 py-2 bg-white dark:bg-[#151515] border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-800 mt-6">
            <button
              type="button"
              onClick={handleCloseModal}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center min-w-30"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}