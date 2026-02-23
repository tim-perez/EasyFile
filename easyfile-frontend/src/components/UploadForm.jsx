import { useState, useContext } from 'react';
import { createDocument } from '../services/api';
import { AuthContext } from '../context/AuthContext'; 

export default function UploadForm({ onUploadSuccess }) {
  const [orderId, setOrderId] = useState('');
  const [title, setTitle] = useState('');
  const [fileType, setFileType] = useState('PDF');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState(null);

  // Extract the JWT token from the AuthContext
  const { token } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Package data into FormData for multipart/form-data transmission
    const formData = new FormData();
    formData.append('OrderId', orderId);
    formData.append('Title', title);
    formData.append('FileType', fileType);
    formData.append('Tags', tags);
    
    // The C# backend will extract the User ID from the JWT token, 
    // and generate the S3 fileUrl itself, so we no longer send those.
    formData.append('File', file);

    try {
      // Pass the token to the API service
      await createDocument(formData, token);
      
      alert('File successfully uploaded to AWS S3! ☁️');
      
      setTitle('');
      setTags('');
      setOrderId('');
      setFile(null);
      document.getElementById('fileInput').value = '';
      if (onUploadSuccess) onUploadSuccess();
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Upload failed. Check console for details.');
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