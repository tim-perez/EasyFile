import React from 'react';
import { useState } from 'react';

export default function InformationWidgets() {

  const [isPlayingDemo, setIsPlayingDemo] = useState(false);

  return (
    <div className="space-y-6 h-full flex flex-col">
      
      {/* TUTORIAL WIDGET */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">DEMO: A Tour of EasyFile</h2>
        
        {/* INLINE YOUTUBE PLAYER FACADE */}
        <div className="aspect-video bg-gray-900 rounded-xl mb-4 flex items-center justify-center relative overflow-hidden group border border-gray-200 dark:border-gray-800 shadow-inner">
          
          {isPlayingDemo ? (
            /* 1. Embed URL added with autoplay so it starts when clicked */
            <iframe
              width="100%"
              height="100%"
              src="https://www.youtube.com/embed/P_hF_U1MeVE?autoplay=1"
              title="EasyFile Demo"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            ></iframe>
          ) : (
            /* 2. Fetched the max resolution thumbnail for the video ID */
            <div 
              onClick={() => setIsPlayingDemo(true)}
              className="w-full h-full flex flex-col items-center justify-center cursor-pointer bg-black"
              style={{
                backgroundImage: `url('https://img.youtube.com/vi/P_hF_U1MeVE/maxresdefault.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>

              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white shadow-2xl group-hover:scale-110 transition-transform">
                  <svg className="w-7 h-7 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
              <span className="absolute z-10 top-3 right-3 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow-sm">
                EasyFile Insider
              </span>
            </div>
          )}

        </div>

        <h3 className="text-sm font-bold mb-2 text-gray-900 dark:text-white">Using AI to Automate Document Review</h3>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
          In this demo, we walk you through the process of uploading a document and how our AI-powered system automatically extracts key information, categorizes it, and generates a comprehensive report. Say goodbye to manual data entry and hello to effortless document management!
        </p>
        
        {/* 3. Added the direct URL to the external button */}
        <button 
          onClick={() => window.open('https://youtu.be/P_hF_U1MeVE', '_blank')}
          className="w-full text-sm font-semibold bg-gray-100 dark:bg-[#ffffff1a] hover:bg-gray-200 dark:hover:bg-[#ffffff2a] text-gray-900 dark:text-white py-2.5 rounded-full transition-all"
        >
          Watch on YouTube
        </button>
      </div>

      {/* CONNECT WITH DEVELOPER WIDGET */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl p-6 shadow-sm flex-1">
        <h2 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Connect with the Developer</h2>
        <div className="flex flex-col gap-1">
          
          <a 
            href="https://tim-perez.github.io/" 
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
            href="https://www.linkedin.com/in/tim-perez-/" 
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
            href="https://github.com/tim-perez/EasyFile" 
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