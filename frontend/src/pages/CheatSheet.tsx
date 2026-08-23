import React from 'react';

export const CheatSheet: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <span>📖</span> Big-O Cheat Sheet
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            A quick reference guide for time and space complexity of common data structures and algorithms.
          </p>
        </header>

        {/* Data Structures */}
        <div className="bg-white dark:bg-[#111726] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold">Data Structures</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-[#0c101c] text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-bold">Data Structure</th>
                  <th className="px-6 py-4 font-bold">Access</th>
                  <th className="px-6 py-4 font-bold">Search</th>
                  <th className="px-6 py-4 font-bold">Insertion</th>
                  <th className="px-6 py-4 font-bold">Deletion</th>
                  <th className="px-6 py-4 font-bold">Space</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono">
                {[
                  { name: 'Array', access: 'O(1)', search: 'O(n)', insert: 'O(n)', delete: 'O(n)', space: 'O(n)' },
                  { name: 'Stack', access: 'O(n)', search: 'O(n)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)' },
                  { name: 'Queue', access: 'O(n)', search: 'O(n)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)' },
                  { name: 'Singly Linked List', access: 'O(n)', search: 'O(n)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)' },
                  { name: 'Hash Table', access: 'N/A', search: 'O(1)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)' },
                  { name: 'Binary Search Tree', access: 'O(log n)', search: 'O(log n)', insert: 'O(log n)', delete: 'O(log n)', space: 'O(n)' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors text-gray-700 dark:text-gray-300">
                    <td className="px-6 py-4 font-bold font-sans text-gray-900 dark:text-white">{row.name}</td>
                    <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400">{row.access}</td>
                    <td className="px-6 py-4 text-amber-600 dark:text-amber-400">{row.search}</td>
                    <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400">{row.insert}</td>
                    <td className="px-6 py-4 text-red-600 dark:text-red-400">{row.delete}</td>
                    <td className="px-6 py-4 text-cyan-600 dark:text-cyan-400">{row.space}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sorting Algorithms */}
        <div className="bg-white dark:bg-[#111726] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-xl font-bold">Sorting Algorithms</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-[#0c101c] text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-4 font-bold">Algorithm</th>
                  <th className="px-6 py-4 font-bold">Time (Best)</th>
                  <th className="px-6 py-4 font-bold">Time (Average)</th>
                  <th className="px-6 py-4 font-bold">Time (Worst)</th>
                  <th className="px-6 py-4 font-bold">Space (Worst)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800 font-mono">
                {[
                  { name: 'Quicksort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)' },
                  { name: 'Mergesort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)' },
                  { name: 'Heapsort', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)' },
                  { name: 'Bubble Sort', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
                  { name: 'Insertion Sort', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
                  { name: 'Selection Sort', best: 'O(n²)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors text-gray-700 dark:text-gray-300">
                    <td className="px-6 py-4 font-bold font-sans text-gray-900 dark:text-white">{row.name}</td>
                    <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400">{row.best}</td>
                    <td className="px-6 py-4 text-amber-600 dark:text-amber-400">{row.avg}</td>
                    <td className="px-6 py-4 text-red-600 dark:text-red-400">{row.worst}</td>
                    <td className="px-6 py-4 text-cyan-600 dark:text-cyan-400">{row.space}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheatSheet;
