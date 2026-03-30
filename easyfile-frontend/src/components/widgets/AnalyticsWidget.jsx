import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import api from '../../services/api';

export default function AnalyticsWidget() {
  const { user } = useContext(AuthContext);
  
  // Shared & Customer States
  const [stats, setStats] = useState({ total: 0, processed: 0, incomplete: 0 });
  const [topCounties, setTopCounties] = useState([]);
  
  // Admin Specific States
  const [adminStats, setAdminStats] = useState({ totalUsers: 0, activeGuests: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // 1. Fetch Documents (Backend already decides if it returns all docs or just the user's!)
        const docsRes = await api.get('/documents');
        const docs = docsRes.data;

        // 2. Calculate Standard Document Stats
        const processedCount = docs.filter(d => d.status === 'Processed' || d.Status === 'Processed').length;
        const incompleteCount = docs.filter(d => ['Incomplete', 'Pending'].includes(d.status || d.Status)).length;

        setStats({ total: docs.length, processed: processedCount, incomplete: incompleteCount });

        // 3. Calculate "Top Counties"
        const countyCounts = docs.reduce((acc, doc) => {
          const county = doc.county || doc.County || 'Unknown';
          if (county !== 'Unknown') acc[county] = (acc[county] || 0) + 1;
          return acc;
        }, {});

        const sorted = Object.entries(countyCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => ({ name, count }));
        setTopCounties(sorted);

        // ==========================================
        // 4. ADMIN ONLY: Fetch User Statistics
        // ==========================================
        if (user?.role === 'Admin') {
          const usersRes = await api.get('/users/all');
          const users = usersRes.data;
          setAdminStats({
            totalUsers: users.length,
            activeGuests: users.filter(u => u.accountType === 'Guest').length
          });
        }

      } catch (error) {
        console.error("Failed to load analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  return (
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 h-full min-h-100 flex flex-col shadow-sm transition-all duration-300">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-1">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {user?.role === 'Admin' ? 'Global Platform Analytics' : 'Document Analytics'}
        </h2>
        {user?.role === 'Admin' && (
          <span className="bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded">Admin View</span>
        )}
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Total uploaded documents</p>
      
      {/* Big Number */}
      <div className="text-[3.5rem] leading-none font-light mb-6 text-gray-900 dark:text-white">
        {isLoading ? '-' : stats.total}
      </div>
      
      {/* ========================================== */}
      {/* CUSTOMER VIEW: Document Breakdown          */}
      {/* ========================================== */}
      {user?.role !== 'Admin' ? (
        <>
          <div className="border-t border-gray-200 dark:border-gray-800 py-4">
            <h3 className="text-sm font-semibold mb-1 text-gray-900 dark:text-white">Summary</h3>
            <div className="space-y-3 mt-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-300">Processed</span>
                <span className="font-medium text-gray-900 dark:text-white">{isLoading ? '-' : stats.processed}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-300">Incomplete</span>
                <span className="font-medium text-amber-600 dark:text-amber-400">{isLoading ? '-' : stats.incomplete}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mb-6">
            <h3 className="text-sm font-semibold mb-3 text-gray-900 dark:text-white">Top counties by volume</h3>
            <div className="space-y-2">
              {isLoading ? <div className="text-sm text-gray-500">Loading...</div> : topCounties.length > 0 ? topCounties.map((county, index) => (
                <div key={index} className="flex justify-between items-center text-sm group">
                  <span className="text-gray-600 dark:text-gray-300 truncate uppercase tracking-tight">{county.name}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{county.count}</span>
                </div>
              )) : <div className="text-sm text-gray-400 italic">No county data available.</div>}
            </div>
          </div>
        </>
      ) : (
      // ==========================================
      // ADMIN VIEW: Global User Stats
      // ==========================================
        <div className="flex flex-col gap-4 mt-2 mb-6">
          <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl border border-purple-100 dark:border-purple-800/30">
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium mb-1">Total Registered Users</div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{isLoading ? '-' : adminStats.totalUsers}</div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-800/30 flex justify-between items-center">
            <div>
              <div className="text-sm text-orange-600 dark:text-orange-400 font-medium mb-1">Active Guest Sessions</div>
              <div className="text-xs text-orange-500/80">Pending 24hr purge</div>
            </div>
            <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{isLoading ? '-' : adminStats.activeGuests}</div>
          </div>
        </div>
      )}

      {/* Footer Pill Button */}
      <div className="mt-auto">
        <Link 
          to="/documents" 
          className="inline-block text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-white bg-gray-100 hover:bg-gray-200 dark:bg-[#ffffff1a] dark:hover:bg-[#ffffff2a] px-5 py-2.5 rounded-full transition-all"
        >
          Go to documents tab
        </Link>
      </div>

    </div>
  );
}

// import React, { useState, useEffect } from 'react';
// import { Link } from 'react-router-dom';
// import api from '../../services/api';

// export default function AnalyticsWidget() {
//   const [stats, setStats] = useState({
//     total: 0,
//     processed: 0,
//     incomplete: 0
//   });
  
//   const [topCounties, setTopCounties] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const fetchStats = async () => {
//       try {
//         setIsLoading(true);
//         const response = await api.get('/documents');
//         const docs = response.data;

//         // 1. Calculate Status Breakdown (Processed vs Incomplete)
//         const processedCount = docs.filter(d => d.status === 'Processed' || d.Status === 'Processed').length;
//         // Incomplete includes anything flagged as Incomplete or Pending
//         const incompleteCount = docs.filter(d => 
//           ['Incomplete', 'Pending'].includes(d.status || d.Status)
//         ).length;

//         setStats({
//           total: docs.length,
//           processed: processedCount,
//           incomplete: incompleteCount
//         });

//         // 2. Calculate "Top Counties" (The YT Studio "Top Content" equivalent)
//         const countyCounts = docs.reduce((acc, doc) => {
//           const county = doc.county || doc.County || 'Unknown';
//           if (county !== 'Unknown') {
//             acc[county] = (acc[county] || 0) + 1;
//           }
//           return acc;
//         }, {});

//         // Sort by volume and take the top 3
//         const sorted = Object.entries(countyCounts)
//           .sort((a, b) => b[1] - a[1])
//           .slice(0, 3)
//           .map(([name, count]) => ({ name, count }));

//         setTopCounties(sorted);

//       } catch (error) {
//         console.error("Failed to load analytics:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     fetchStats();
//   }, []);

//   return (
//     <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 h-full min-h-100 flex flex-col shadow-sm">
      
//       {/* Header */}
//       <h2 className="text-lg font-semibold mb-1 text-gray-900 dark:text-white">Document analytics</h2>
//       <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Total uploaded documents</p>
      
//       {/* Big Number */}
//       <div className="text-[3.5rem] leading-none font-light mb-6 text-gray-900 dark:text-white">
//         {isLoading ? '-' : stats.total}
//       </div>
      
//       {/* Summary Section (Processed & Incomplete) */}
//       <div className="border-t border-gray-200 dark:border-gray-800 py-4">
//         <h3 className="text-sm font-semibold mb-1 text-gray-900 dark:text-white">Summary</h3>
//         <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">All time</p>
        
//         <div className="space-y-3">
//           <div className="flex justify-between items-center text-sm">
//             <span className="text-gray-600 dark:text-gray-300">Processed</span>
//             <span className="font-medium text-gray-900 dark:text-white">
//               {isLoading ? '-' : stats.processed} 
//               <span className="text-green-500 ml-1">↑</span>
//             </span>
//           </div>
          
//           <div className="flex justify-between items-center text-sm">
//             <span className="text-gray-600 dark:text-gray-300">Incomplete</span>
//             <span className="font-medium text-amber-600 dark:text-amber-400">
//               {isLoading ? '-' : stats.incomplete}
//             </span>
//           </div>
//         </div>
//       </div>

//       {/* Top Content (Top Counties) */}
//       <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mb-6">
//         <h3 className="text-sm font-semibold mb-1 text-gray-900 dark:text-white">Top counties</h3>
//         <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">By filing volume</p>
        
//         <div className="space-y-2">
//           {isLoading ? (
//             <div className="text-sm text-gray-500">Loading...</div>
//           ) : topCounties.length > 0 ? (
//             topCounties.map((county, index) => (
//               <div key={index} className="flex justify-between items-center text-sm group">
//                 <span className="text-gray-600 dark:text-gray-300 truncate uppercase tracking-tight">{county.name}</span>
//                 <span className="font-medium text-gray-900 dark:text-white">{county.count}</span>
//               </div>
//             ))
//           ) : (
//             <div className="text-sm text-gray-400 italic">No county data available.</div>
//           )}
//         </div>
//       </div>

//       {/* Footer Pill Button */}
//       <div className="mt-auto">
//         <Link 
//           to="/documents" 
//           className="inline-block text-xs font-bold uppercase tracking-widest text-gray-900 dark:text-white bg-gray-100 hover:bg-gray-200 dark:bg-[#ffffff1a] dark:hover:bg-[#ffffff2a] px-5 py-2.5 rounded-full transition-all"
//         >
//           Go to documents tab
//         </Link>
//       </div>

//     </div>
//   );
// }