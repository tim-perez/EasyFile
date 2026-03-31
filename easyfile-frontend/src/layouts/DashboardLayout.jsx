import React, { useState, useEffect, useRef } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider'; 
import logo from '../assets/EasyFileLogo3.png'; 
import UploadDocumentModal from '../components/features/UploadDocumentModal';

export default function DashboardLayout() {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth(); 

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/login');
  };

  const [notifications, setNotifications] = useState([
    { id: 1, text: 'Welcome to EasyFile!', time: 'Just now', unread: true },
  ]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleDeleteNotification = (id, event) => {
    event.stopPropagation(); 
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' || e.type === 'click') {
      if (!searchQuery.trim()) return;
      
      setIsSearchFocused(false);
      setIsSearchOpen(false); 
      
      navigate(`/documents?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery(''); 
    }
  };

  useEffect(() => {
    const handleDocumentProcessed = (event) => {
      const fileName = event.detail?.fileName || 'a new document';
      const newNotif = {
        id: Date.now(), 
        text: `AI Report ready for ${fileName}`,
        time: 'Just now',
        unread: true
      };
      
      setNotifications(prev => [newNotif, ...prev]);
    };

    window.addEventListener('documentProcessed', handleDocumentProcessed);
    return () => window.removeEventListener('documentProcessed', handleDocumentProcessed);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchFocused(false);
      if (notifRef.current && !notifRef.current.contains(event.target)) setIsNotificationsOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 text-gray-900 dark:bg-[#121212] dark:text-white">
      
      <header className="relative h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b transition-colors duration-300 bg-white border-gray-200 dark:bg-[#1f1f1f] dark:border-gray-800 z-30">
        
        {isSearchOpen && (
          <div className="absolute inset-0 z-50 flex items-center bg-white dark:bg-[#1f1f1f] px-4 sm:px-6 w-full h-full">
            <button 
              onClick={() => setIsSearchOpen(false)}
              className="p-2 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <input 
              type="text" 
              autoFocus
              placeholder="Search across your workspace" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchSubmit} 
              className="w-full bg-transparent py-2 text-sm border-none focus:outline-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        )}

        <div className="flex items-center gap-4 md:w-64 shrink-0">
          <button 
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <Link to="/dashboard" className="flex items-center">
            <img src={logo} alt="EasyFile Logo" className="h-8 w-auto" />
          </Link>
        </div>

        <div className="hidden md:flex flex-1 justify-center max-w-2xl px-4 relative" ref={searchRef}>
          <div className="w-full relative flex items-center group">
            <div className="absolute left-4 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Search across your workspace" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onKeyDown={handleSearchSubmit} 
              className="w-full pl-12 pr-4 py-2 text-sm rounded-full border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 border-gray-200 text-gray-900 placeholder-gray-500 dark:bg-[#121212] dark:border-gray-700 dark:text-white dark:placeholder-gray-400"
            />
          </div>

          {isSearchFocused && searchQuery.length > 0 && (
            <div className="absolute top-full mt-2 w-full max-w-2xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50">
              <div className="p-2">
                <p className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Quick Results</p>
                <button 
                  onClick={handleSearchSubmit} 
                  className="w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-lg transition-colors flex items-center gap-3"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  Search documents for "{searchQuery}"
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-3 justify-end shrink-0">
          <button 
            onClick={() => setIsSearchOpen(true)}
            className="md:hidden p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300" 
            title="Search"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>

          <div className="relative shrink-0" ref={notifRef}>
            <button 
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsProfileOpen(false); 
              }}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent relative" 
              title="Notifications"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#1f1f1f]"></span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 top-12 mt-1 w-[320px] bg-white dark:bg-[#282828] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 flex flex-col">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-[#1f1f1f]">
                  <h3 className="font-medium text-gray-900 dark:text-white">Notifications</h3>
                  {notifications.length > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead} 
                      className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline transition-colors"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(notif => (
                      <div key={notif.id} className={`group px-4 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#333333] cursor-pointer flex gap-3 items-start ${notif.unread ? 'bg-blue-50/50 dark:bg-blue-900/20' : ''}`}>
                        <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${notif.unread ? 'bg-blue-500' : 'bg-transparent'}`}></div>
                        
                        <div className="flex-1 pr-2">
                          <p className="text-sm text-gray-800 dark:text-gray-200">{notif.text}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.time}</p>
                        </div>

                        <button 
                          onClick={(e) => handleDeleteNotification(notif.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-all"
                          title="Dismiss notification"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center min-h-55">
                      <svg className="w-16 h-16 text-gray-200 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                      <p className="text-gray-500 dark:text-gray-400 text-sm">You're all caught up!</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-colors bg-blue-600 hover:bg-blue-700 text-white shadow-sm whitespace-nowrap ml-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload
          </button>

          {user?.isGuest ? (
            <button 
              onClick={() => navigate('/login')}
              className="hidden sm:flex items-center px-4 py-2 ml-1 rounded-full font-medium text-sm whitespace-nowrap transition-colors border border-gray-300 text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 shadow-sm"
            >
              Login / Register
            </button>
          ) : (
            <div className="relative ml-1 shrink-0" ref={profileRef}>
              <button 
                onClick={() => {
                  setIsProfileOpen(!isProfileOpen);
                  setIsNotificationsOpen(false);
                }}
                className="w-8 h-8 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <img 
                  src={`https://ui-avatars.com/api/?name=${user?.firstName || 'U'}+${user?.lastName || ''}&background=0D8ABC&color=fff`} 
                  alt="User Profile" 
                />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-12 mt-1 w-75 bg-white dark:bg-[#282828] rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 py-2">
                  
                  <div className="px-4 py-3 flex items-start gap-4 border-b border-gray-200 dark:border-gray-700 mb-2">
                    <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${user?.firstName || 'U'}+${user?.lastName || ''}&background=0D8ABC&color=fff`} 
                        alt="User Profile" 
                      />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-medium text-base text-gray-900 dark:text-white truncate">
                        {user?.firstName} {user?.lastName}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5 flex items-center gap-1.5">
                        <span>{user?.role} Account</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                        <span>Account #{user?.id}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col">
                    <button 
                      onClick={() => {
                        navigate('/account');
                        setIsProfileOpen(false); 
                      }}
                      className="w-full px-4 py-2.5 flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3f3f3f] transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-500 dark:text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Your Account
                    </button>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full px-4 py-2.5 flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#3f3f3f] transition-colors"
                    >
                      <svg className="w-6 h-6 text-gray-500 dark:text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign out
                    </button>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden z-0">
        
        <aside 
          className={`shrink-0 flex flex-col border-r transition-all duration-300 ease-in-out bg-white border-gray-200 dark:bg-[#1f1f1f] dark:border-gray-800
            ${isSidebarExpanded ? 'w-64' : 'w-18'}
          `}
        >
          <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
            
            <Link 
              to="/dashboard" 
              className={`flex items-center rounded-lg cursor-pointer transition-colors duration-200
                ${isSidebarExpanded ? 'px-4 py-3' : 'px-0 py-3 justify-center'}
                ${isActive('/dashboard') || isActive('/') 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
              `}
              title={!isSidebarExpanded ? "Dashboard" : ""}
            >
              <svg className={`w-6 h-6 shrink-0 ${isSidebarExpanded ? 'mr-4' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              {isSidebarExpanded && <span className="truncate">Dashboard</span>}
            </Link>

            <Link 
              to="/documents" 
              className={`flex items-center rounded-lg cursor-pointer transition-colors duration-200
                ${isSidebarExpanded ? 'px-4 py-3' : 'px-0 py-3 justify-center'}
                ${isActive('/documents') 
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium' 
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
              `}
              title={!isSidebarExpanded ? "Documents" : ""}
            >
              <svg className={`w-6 h-6 shrink-0 ${isSidebarExpanded ? 'mr-4' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isSidebarExpanded && <span className="truncate">Documents</span>}
            </Link>

            {user?.role !== 'Guest' && (
              <Link 
                to="/recycle-bin" 
                className={`flex items-center rounded-lg cursor-pointer transition-colors duration-200
                  ${isSidebarExpanded ? 'px-4 py-3' : 'px-0 py-3 justify-center'}
                  ${isActive('/recycle-bin') 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
                `}
                title={!isSidebarExpanded ? "Recycle Bin" : ""}
              >
                <svg className={`w-6 h-6 shrink-0 ${isSidebarExpanded ? 'mr-4' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {isSidebarExpanded && <span className="truncate">Recycle Bin</span>}
              </Link>
            )}

            {user?.role === 'Admin' && (
              <Link 
                to="/users" 
                className={`flex items-center rounded-lg cursor-pointer transition-colors duration-200
                  ${isSidebarExpanded ? 'px-4 py-3' : 'px-0 py-3 justify-center'}
                  ${isActive('/users') 
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}
                `}
                title={!isSidebarExpanded ? "Users" : ""}
              >
                <svg className={`w-6 h-6 shrink-0 ${isSidebarExpanded ? 'mr-4' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                {isSidebarExpanded && <span className="truncate">Users</span>}
              </Link>
            )}

          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 transition-colors duration-300 bg-gray-50 dark:bg-[#121212]">
          <Outlet context={{ onOpenUploadModal: () => setIsUploadModalOpen(true) }} />
        </main>
      </div>

      <UploadDocumentModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
      />

    </div>
  );
}