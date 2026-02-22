import { useState, useEffect } from 'react';
import CategoryColumn from './CategoryColumn';
import UploadForm from './UploadForm';
import { getOrders } from '../services/api';
import '../index.css';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const categories = ["Service of Process", "Court Filings", "Courtesy Copies", "Efilings"];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getOrders();
        setOrders(data);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };
    
    fetchOrders();
  }, [refreshKey]);

  const handleUploadSuccess = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return (
    <div className="dashboard">
      <h1 className="dashboard-title">EasyFile Dashboard</h1>
      
      <UploadForm onUploadSuccess={handleUploadSuccess} />

      <div className="queue-container">
        {categories.map(category => (
          <CategoryColumn 
            key={category} 
            category={category} 
            orders={orders.filter(o => o.category === category)} 
          />
        ))}
      </div>
    </div>
  );
}