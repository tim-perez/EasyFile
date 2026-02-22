import { useState } from 'react';
import { createDocument } from '../services/api';

export default function UploadForm({ onUploadSuccess }) {
  const [orderId, setOrderId] = useState('');
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const documentData = {
      orderId: parseInt(orderId),
      title: title,
      fileType: fileType,
      tags: tags,
      uploaderId: 1, 
      fileUrl: `local/storage/${title}`
    };

    // Package data into FormData for multipart/form-data transmission
    const formData = new FormData();
    formData.append('orderId', documentData.orderId);
    formData.append('title', documentData.title);
    formData.append('fileType', documentData.fileType);
    formData.append('tags', documentData.tags);
    formData.append('uploaderId', 1);
    formData.append('file', file);

    try {
      await createDocument(formData);
      alert('File successfully uploaded to local storage!');
      setTitle('');
      setTags('');
      setOrderId('');
      setFile(null);
      // Reset the file input visually
      document.getElementById('fileInput').value = '';
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error('Error uploading:', error);
    }
  };

  return (
    <div className="upload-form-container">
      <h2 className="upload-title">Upload Document</h2>
      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group form-group-1">
          <label className="form-label">Order ID</label>
          <input type="number" required value={orderId} onChange={e => setOrderId(e.target.value)} placeholder="e.g. 1" className="form-input" />
        </div>
        <div className="form-group form-group-2">
          <label className="form-label">File Title</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Summons.pdf" className="form-input" />
        </div>
        <div className="form-group form-group-1">
          <label className="form-label">Type</label>
          <select value={fileType} onChange={e => setFileType(e.target.value)} className="form-input">
            <option value="PDF">PDF</option>
            <option value="DOCX">DOCX</option>
          </select>
        </div>
        <div className="form-group form-group-1-5">
          <label className="form-label">Tags</label>
          <input type="text" value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. Urgent" className="form-input" />
        </div>
        <div className="form-group form-group-2">
          <label className="form-label">Select File</label>
          <input type="file" id="fileInput" required onChange={e => setFile(e.target.files[0])} className="form-input" accept=".pdf,.docx" />
        </div>
        <button type="submit" className="submit-btn">
          Submit
        </button>
      </form>
    </div>
  );
}