import React, { useState } from 'react';

export default function UploadDocumentModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        // Note: The browser automatically sets the correct 'multipart/form-data' boundary 
        // when you pass a FormData object directly to the body.
        body: formData,
        headers: {
          // 'Authorization': `Bearer ${userToken}` // Uncomment if using JWTs
        }
      });
      
      if (response.ok) {
        setIsModalOpen(false);
        setSelectedFile(null);
        // Next: Trigger a refresh of the document list
      }
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>Upload Document</button>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Upload a Document</h2>
            
            <input type="file" onChange={handleFileChange} />
            
            <button onClick={handleUpload}>Submit</button>
            <button onClick={() => setIsModalOpen(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}