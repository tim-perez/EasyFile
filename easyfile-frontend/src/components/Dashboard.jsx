import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import CustomerPortal from './UserPortal';
import AdminPortal from './AdminPortal';

export default function Dashboard() {
    const { user } = useContext(AuthContext);
    const role = user?.role; // Safely access role with optional chaining

    console.log('User role from context:', role); // Debugging line to check the role value

    // Conditional Routing based on RBAC
    if (role === 'Customer') {
        return <CustomerPortal />;
    } 

    if (role === 'Admin') {
        return <AdminPortal />;
    }

    // Fallback if role is unrecognized or missing
    return (
        <div className="flex justify-center items-center h-screen text-white bg-[#1f1f1f]">
            <p>Error: Unauthorized role or missing access level.</p>
        </div>
    );
}


// import { useState, useEffect } from 'react';
// import CategoryColumn from './CategoryColumn';
// import UploadForm from './UploadForm';
// import { getOrders } from '../services/api';
// import '../index.css';

// export default function Dashboard() {
//   const [orders, setOrders] = useState([]);
//   const [refreshKey, setRefreshKey] = useState(0);
//   const categories = ["Service of Process", "Court Filings", "Courtesy Copies", "Efilings"];

//   useEffect(() => {
//     const fetchOrders = async () => {
//       try {
//         const data = await getOrders();
//         setOrders(data);
//       } catch (error) {
//         console.error('Error fetching orders:', error);
//       }
//     };
    
//     fetchOrders();
//   }, [refreshKey]);

//   const handleUploadSuccess = () => {
//     setRefreshKey(prevKey => prevKey + 1);
//   };

//   return (
//     <div className="dashboard">
//       <h1 className="dashboard-title">EasyFile Dashboard</h1>
      
//       <UploadForm onUploadSuccess={handleUploadSuccess} />

//       <div className="queue-container">
//         {categories.map(category => (
//           <CategoryColumn 
//             key={category} 
//             category={category} 
//             orders={orders.filter(o => o.category === category)} 
//           />
//         ))}
//       </div>
//     </div>
//   );
// }