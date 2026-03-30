import React from 'react';

export default function InformationWidgets() {
  return (
    <div className="space-y-6">
      
      {/* 📺 TUTORIAL WIDGET */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Tutorial: Upload a Document</h2>
        
        {/* Video Placeholder - Matches YT Studio Dark Sidebar */}
        <div className="aspect-video bg-gray-100 dark:bg-black rounded-xl mb-4 flex items-center justify-center relative overflow-hidden group cursor-pointer border border-gray-200 dark:border-gray-800">
           <div className="flex flex-col items-center gap-2">
             <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform">
               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
             </div>
             <span className="text-gray-500 dark:text-gray-400 text-xs font-medium">Watch Tutorial</span>
           </div>
           <span className="absolute top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
             EasyFile Insider
           </span>
        </div>

        <h3 className="text-sm font-bold mb-2 text-gray-900 dark:text-white">Using AI to Automate Document Review</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
          In this tutorial, we walk you through the process of uploading a document and how our AI-powered system automatically extracts key information, categorizes it, and generates a comprehensive report. Say goodbye to manual data entry and hello to effortless document management!
        </p>
        
        <button className="w-full text-sm font-semibold bg-gray-100 dark:bg-[#ffffff1a] hover:bg-gray-200 dark:hover:bg-[#ffffff2a] text-gray-900 dark:text-white py-2.5 rounded-full transition-all">
          Watch on YouTube
        </button>
      </div>

      {/* 🔗 CONNECT WITH DEVELOPER WIDGET */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Connect with the Developer</h2>
        <div className="flex flex-col gap-1">
          
          <a 
            href="https://yourportfolio.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#232323] group transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl group-hover:scale-110 transition-transform">🌐</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">Portfolio Website</span>
            </div>
            <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>

          <a 
            href="https://linkedin.com/in/yourprofile" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#232323] group transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl group-hover:scale-110 transition-transform">💼</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">LinkedIn Profile</span>
            </div>
            <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>

          <a 
            href="https://github.com/yourusername" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#232323] group transition-colors border border-transparent hover:border-gray-100 dark:hover:border-gray-800"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl group-hover:scale-110 transition-transform">📁</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">GitHub Repository</span>
            </div>
            <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
          </a>

        </div>
      </div>

    </div>
  );
}