import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';


export default function UploadDocumentModal() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    if (user && user.isGuest === true) {
      const currentCount = parseInt(localStorage.getItem('guestDocCount'), 10);
      
      if (currentCount >= 5) {
        window.alert("You have reached the 5 document limit for guests. Please register for an account to upload more!");
        navigate('/register');
        return;
      }
    }

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/documents/upload', { /* ... */ });
      
      if (response.ok) {
        setIsModalOpen(false);
        setSelectedFile(null);
        
        if (user && user.isGuest === true) {
           const currentCount = parseInt(localStorage.getItem('guestDocCount'), 10);
           localStorage.setItem('guestDocCount', (currentCount + 1).toString());
        }
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