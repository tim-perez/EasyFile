import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../context/AuthProvider';
import api from '../../../services/api';

export default function AnalyticsWidget() {
  const { user } = useAuth();
  
  const [stats, setStats] = useState({ total: 0, totalDocuments: 0, totalSubmissions: 0, accepted: 0, rejected: 0 });
  const [topCounties, setTopCounties] = useState([]);
  
  const [adminStats, setAdminStats] = useState({ totalUsers: 0, activeGuests: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        
        // Fetch native stats from the new backend endpoint
        const analyticsRes = await api.get('/documents/analytics');
        setStats({
          total: analyticsRes.data.total,
          totalDocuments: analyticsRes.data.totalDocuments ?? analyticsRes.data.total,
          totalSubmissions: analyticsRes.data.totalSubmissions ?? 0,
          accepted: analyticsRes.data.accepted ?? 0,
          rejected: analyticsRes.data.rejected ?? 0
        });
        setTopCounties(analyticsRes.data.topCounties);

        // Fetch user stats (safely checking if it's an array or paginated)
        if (user?.role === 'Admin') {
          const usersRes = await api.get('/users/all?pageNumber=1&pageSize=1000');
          const usersList = usersRes.data.items || usersRes.data; 
          setAdminStats({
            totalUsers: usersList.filter(u => u.accountType !== 'Guest').length,
            activeGuests: usersList.filter(u => u.accountType === 'Guest').length
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
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{user?.role === 'Admin' ? 'Total submissions from all users' : 'Total uploaded documents'}</p>
      
      {/* Big Number */}
      <div className="text-[3.5rem] leading-none font-light mb-6 text-gray-900 dark:text-white">
        {isLoading ? '-' : user?.role === 'Admin' ? stats.totalSubmissions : stats.total}
      </div>
      
      {user?.role !== 'Admin' ? (
        <>
          {/* CUSTOMER VIEW: Document Breakdown */}
          <div className="border-t border-gray-200 dark:border-gray-800 py-4">
            <h3 className="text-sm font-semibold mb-1 text-gray-900 dark:text-white">Summary</h3>
            <div className="space-y-3 mt-3">
              <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-300">Accepted</span>
                <span className="font-medium text-green-600 dark:text-green-400">{isLoading ? '-' : stats.accepted}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-300">Rejected</span>
                <span className="font-medium text-red-600 dark:text-red-400">{isLoading ? '-' : stats.rejected}</span>
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
        <>
          {/* ADMIN VIEW: Global User Stats */}
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

            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
              <div className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-1">Total Documents Uploaded</div>
              <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{isLoading ? '-' : stats.totalDocuments}</div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
              <h3 className="text-sm font-semibold mb-1 text-gray-900 dark:text-white">Summary</h3>
              <div className="space-y-3 mt-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Accepted Documents</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{isLoading ? '-' : stats.accepted}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600 dark:text-gray-300">Rejected Documents</span>
                  <span className="font-medium text-red-600 dark:text-red-400">{isLoading ? '-' : stats.rejected}</span>
                </div>
              </div>
            </div>
          </div>
        </>
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
