import { useState, useEffect } from 'react';

function App() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Ensure this port matches C# backend port
    fetch('https://localhost:5192/api/orders')
      .then(response => response.json())
      .then(data => setOrders(data))
      .catch(error => console.error('Error fetching orders:', error));
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>EasyFile Dashboard</h1>
      
      <h2>Incoming Orders</h2>
      {orders.length === 0 ? (
        <p>No orders found. Ensure your C# server is running and you submitted the Postman requests.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {orders.map(order => (
            <div key={order.orderId} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '5px' }}>
              <h3>Order #{order.orderId} - {order.category}</h3>
              <p><strong>Status:</strong> {order.status}</p>
              <p><strong>Auto-Extracted Summary:</strong> {order.summary}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;