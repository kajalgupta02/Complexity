import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-gray-200 dark:border-gray-800/80 bg-white dark:bg-[#070a12] text-gray-600 dark:text-gray-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/25">
              <span className="text-lg font-black text-white font-mono">Ω</span>
            </div>
            <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              Complexity
            </span>
          </Link>

          <nav className="flex items-center gap-6 text-sm">
            <Link to="/" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Home
            </Link>
            <Link to="/analyzer" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              Analyzer
            </Link>
            <Link to="/about" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
              About
            </Link>
          </nav>

          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Complexity • Static Big-O Analyzer
          </p>
        </div>
      </div>
    </footer>
  );
};
