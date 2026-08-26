import React, { useState, useMemo } from 'react';
import { SEO } from '@/components/SEO';
import { Badge } from '@/components/ui/Badge';

interface DSItem {
  name: string;
  category: string;
  access: string;
  search: string;
  insert: string;
  delete: string;
  space: string;
  notes?: string;
}

interface AlgoItem {
  name: string;
  category: 'Sorting' | 'Searching' | 'Graph' | 'String';
  best: string;
  avg: string;
  worst: string;
  space: string;
  notes?: string;
}

const DATA_STRUCTURES: DSItem[] = [
  { name: 'Array (Static)', category: 'Linear', access: 'O(1)', search: 'O(n)', insert: 'O(n)', delete: 'O(n)', space: 'O(n)', notes: 'Contiguous memory block' },
  { name: 'Dynamic Array (Vector/ArrayList)', category: 'Linear', access: 'O(1)', search: 'O(n)', insert: 'O(1)*', delete: 'O(n)', space: 'O(n)', notes: '*Amortized O(1) append' },
  { name: 'Singly Linked List', category: 'Linear', access: 'O(n)', search: 'O(n)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)', notes: 'O(1) insert at known node' },
  { name: 'Doubly Linked List', category: 'Linear', access: 'O(n)', search: 'O(n)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)', notes: 'Two pointers per node' },
  { name: 'Stack (LIFO)', category: 'Linear', access: 'O(n)', search: 'O(n)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)', notes: 'Push / Pop from top' },
  { name: 'Queue (FIFO)', category: 'Linear', access: 'O(n)', search: 'O(n)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)', notes: 'Enqueue tail, dequeue head' },
  { name: 'Hash Table / Map', category: 'Hash', access: 'N/A', search: 'O(1)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)', notes: 'Worst case O(n) on collisions' },
  { name: 'Hash Set', category: 'Hash', access: 'N/A', search: 'O(1)', insert: 'O(1)', delete: 'O(1)', space: 'O(n)', notes: 'Unique keys only' },
  { name: 'Binary Search Tree (Balanced/AVL/Red-Black)', category: 'Tree', access: 'O(log n)', search: 'O(log n)', insert: 'O(log n)', delete: 'O(log n)', space: 'O(n)', notes: 'Unbalanced worst O(n)' },
  { name: 'Binary Heap (Min/Max)', category: 'Tree', access: 'O(1) [peek]', search: 'O(n)', insert: 'O(log n)', delete: 'O(log n)', space: 'O(n)', notes: 'Build heap is O(n)' },
  { name: 'Trie (Prefix Tree)', category: 'Tree', access: 'O(k)', search: 'O(k)', insert: 'O(k)', delete: 'O(k)', space: 'O(ALPHABET × k × n)', notes: 'k = string key length' },
  { name: 'Disjoint Set (Union-Find)', category: 'Advanced', access: 'N/A', search: 'O(α(n))', insert: 'O(α(n))', delete: 'N/A', space: 'O(n)', notes: 'α(n) is inverse Ackermann ≤ 4' },
];

const ALGORITHMS: AlgoItem[] = [
  // Sorting
  { name: 'Quicksort', category: 'Sorting', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n²)', space: 'O(log n)', notes: 'In-place, unstable' },
  { name: 'Mergesort', category: 'Sorting', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', notes: 'Stable, divide and conquer' },
  { name: 'Heapsort', category: 'Sorting', best: 'O(n log n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(1)', notes: 'In-place, comparison sort' },
  { name: 'Timsort (Python / Java sort)', category: 'Sorting', best: 'O(n)', avg: 'O(n log n)', worst: 'O(n log n)', space: 'O(n)', notes: 'Hybrid merge/insertion sort' },
  { name: 'Insertion Sort', category: 'Sorting', best: 'O(n)', avg: 'O(n²)', worst: 'O(n²)', space: 'O(1)', notes: 'Great for small / nearly-sorted arrays' },
  { name: 'Counting Sort', category: 'Sorting', best: 'O(n + k)', avg: 'O(n + k)', worst: 'O(n + k)', space: 'O(k)', notes: 'Non-comparison sort for integers' },
  { name: 'Radix Sort', category: 'Sorting', best: 'O(n × k)', avg: 'O(n × k)', worst: 'O(n × k)', space: 'O(n + k)', notes: 'Digit-by-digit bucket sort' },

  // Searching & Selection
  { name: 'Binary Search', category: 'Searching', best: 'O(1)', avg: 'O(log n)', worst: 'O(log n)', space: 'O(1)', notes: 'Requires sorted array' },
  { name: 'Quickselect (Kth element)', category: 'Searching', best: 'O(n)', avg: 'O(n)', worst: 'O(n²)', space: 'O(1)', notes: 'Average linear selection' },
  { name: 'Two Pointers / Sliding Window', category: 'Searching', best: 'O(n)', avg: 'O(n)', worst: 'O(n)', space: 'O(1)', notes: 'Linear array traversal' },

  // Graph
  { name: 'Breadth-First Search (BFS)', category: 'Graph', best: 'O(V + E)', avg: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', notes: 'Shortest path in unweighted graph' },
  { name: 'Depth-First Search (DFS)', category: 'Graph', best: 'O(V + E)', avg: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', notes: 'Topological sort, cycle detection' },
  { name: 'Dijkstra (with Binary Heap)', category: 'Graph', best: 'O((V + E) log V)', avg: 'O((V + E) log V)', worst: 'O((V + E) log V)', space: 'O(V)', notes: 'Non-negative edge weights only' },
  { name: 'Bellman-Ford', category: 'Graph', best: 'O(V × E)', avg: 'O(V × E)', worst: 'O(V × E)', space: 'O(V)', notes: 'Handles negative weights & detects cycles' },
  { name: 'Kruskal’s Minimum Spanning Tree', category: 'Graph', best: 'O(E log E)', avg: 'O(E log E)', worst: 'O(E log E)', space: 'O(V + E)', notes: 'Uses Disjoint Set Union' },
  { name: 'Topological Sort (Kahn’s Algo)', category: 'Graph', best: 'O(V + E)', avg: 'O(V + E)', worst: 'O(V + E)', space: 'O(V)', notes: 'DAG dependency ordering' },
];

const BIG_O_RANKS = [
  { notation: 'O(1)', label: 'Constant', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30', status: 'Excellent', desc: 'Instant lookup / math operation regardless of dataset size.' },
  { notation: 'O(log n)', label: 'Logarithmic', color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30', status: 'Great', desc: 'Binary search, balanced tree traversal. Splits input in half every step.' },
  { notation: 'O(n)', label: 'Linear', color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border-cyan-500/30', status: 'Good', desc: 'Single loop through input array, hash set building.' },
  { notation: 'O(n log n)', label: 'Linearithmic', color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/30', status: 'Fair', desc: 'Efficient sorting (MergeSort, QuickSort), Heap operations.' },
  { notation: 'O(n²)', label: 'Quadratic', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/30', status: 'Poor', desc: 'Nested double loops, bubble sort, pairwise combinations.' },
  { notation: 'O(2ⁿ)', label: 'Exponential', color: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30', status: 'Horrible', desc: 'Subsets generation, un-memoized recursive Fibonacci.' },
  { notation: 'O(n!)', label: 'Factorial', color: 'text-purple-600 dark:text-purple-400 bg-purple-500/10 border-purple-500/30', status: 'Disaster', desc: 'Permutations, brute-force Traveling Salesperson.' },
];

export const CheatSheet: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | 'DataStructures' | 'Sorting' | 'Searching' | 'Graph'>('All');

  const filteredDS = useMemo(() => {
    if (selectedCategory !== 'All' && selectedCategory !== 'DataStructures') return [];
    return DATA_STRUCTURES.filter((ds) =>
      ds.name.toLowerCase().includes(search.toLowerCase()) ||
      ds.category.toLowerCase().includes(search.toLowerCase()) ||
      (ds.notes && ds.notes.toLowerCase().includes(search.toLowerCase()))
    );
  }, [search, selectedCategory]);

  const filteredAlgos = useMemo(() => {
    return ALGORITHMS.filter((algo) => {
      if (selectedCategory !== 'All' && algo.category !== selectedCategory) return false;
      return (
        algo.name.toLowerCase().includes(search.toLowerCase()) ||
        algo.category.toLowerCase().includes(search.toLowerCase()) ||
        (algo.notes && algo.notes.toLowerCase().includes(search.toLowerCase()))
      );
    });
  }, [search, selectedCategory]);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-gray-900 dark:text-gray-100 transition-colors py-10 px-4 sm:px-6">
      <SEO
        title="Big-O & Data Structure Complexity Cheat Sheet"
        description="Comprehensive Big-O complexity reference table for Data Structures, Sorting, Searching, and Graph algorithms with time and space bounds."
        canonical="/cheatsheet"
      />

      <div className="max-w-7xl mx-auto space-y-10">
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-2">
              <span>📖 Rapid Reference Guide</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
              Big-O Complexity Cheat Sheet
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Time and Space complexities for core data structures, sorting algorithms, and graph traversals.
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search table (e.g. Quicksort, Heap, O(1))..."
              aria-label="Search cheat sheet"
              className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
            <span className="absolute left-3 top-3 text-gray-400">🔍</span>
          </div>
        </header>

        {/* 1. Big-O Visual Complexity Scale Hierarchy */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-5">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <span>📈</span> Complexity Growth Rate Scale
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              From best to worst performance as input size <code className="font-mono font-bold">n</code> increases to infinity.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {BIG_O_RANKS.map((r, i) => (
              <div
                key={i}
                className={`p-3.5 rounded-2xl border ${r.color} flex flex-col justify-between space-y-2`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-base">{r.notation}</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">{r.status}</span>
                  </div>
                  <p className="text-xs font-bold mt-1 text-gray-900 dark:text-white">{r.label}</p>
                </div>
                <p className="text-[11px] opacity-90 leading-tight">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'All', label: 'All Tables' },
            { id: 'DataStructures', label: 'Data Structures' },
            { id: 'Sorting', label: 'Sorting Algorithms' },
            { id: 'Searching', label: 'Searching & Selection' },
            { id: 'Graph', label: 'Graph Algorithms' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                selectedCategory === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25'
                  : 'bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-indigo-500/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 2. Data Structures Table */}
        {filteredDS.length > 0 && (
          <div className="bg-white dark:bg-[#111726] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden space-y-2">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  Data Structure Operations
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Average and worst-case time for Access, Search, Insertion, and Deletion.
                </p>
              </div>
              <Badge variant="primary" size="sm">
                {filteredDS.length} structures
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/80 dark:bg-[#0c101c]/80 text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-3.5">Data Structure</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Access</th>
                    <th className="px-6 py-3.5">Search</th>
                    <th className="px-6 py-3.5">Insertion</th>
                    <th className="px-6 py-3.5">Deletion</th>
                    <th className="px-6 py-3.5">Space (Worst)</th>
                    <th className="px-6 py-3.5">Key Characteristic</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80 font-mono text-xs">
                  {filteredDS.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4 font-bold font-sans text-gray-900 dark:text-white">{row.name}</td>
                      <td className="px-6 py-4 font-sans text-gray-500 dark:text-gray-400">{row.category}</td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-bold">{row.access}</td>
                      <td className="px-6 py-4 text-amber-600 dark:text-amber-400 font-bold">{row.search}</td>
                      <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-bold">{row.insert}</td>
                      <td className="px-6 py-4 text-red-600 dark:text-red-400 font-bold">{row.delete}</td>
                      <td className="px-6 py-4 text-cyan-600 dark:text-cyan-400 font-bold">{row.space}</td>
                      <td className="px-6 py-4 font-sans text-gray-500 dark:text-gray-400 text-[11px]">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 3. Algorithms Table */}
        {filteredAlgos.length > 0 && (
          <div className="bg-white dark:bg-[#111726] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden space-y-2">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white">
                  Algorithms & Traversals
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Best, Average, Worst Time and Auxiliary Space complexities.
                </p>
              </div>
              <Badge variant="success" size="sm">
                {filteredAlgos.length} algorithms
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50/80 dark:bg-[#0c101c]/80 text-[11px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-3.5">Algorithm</th>
                    <th className="px-6 py-3.5">Category</th>
                    <th className="px-6 py-3.5">Time (Best)</th>
                    <th className="px-6 py-3.5">Time (Average)</th>
                    <th className="px-6 py-3.5">Time (Worst)</th>
                    <th className="px-6 py-3.5">Space (Worst)</th>
                    <th className="px-6 py-3.5">Key Properties</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800/80 font-mono text-xs">
                  {filteredAlgos.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50/60 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-6 py-4 font-bold font-sans text-gray-900 dark:text-white">{row.name}</td>
                      <td className="px-6 py-4 font-sans text-gray-500 dark:text-gray-400">{row.category}</td>
                      <td className="px-6 py-4 text-emerald-600 dark:text-emerald-400 font-bold">{row.best}</td>
                      <td className="px-6 py-4 text-amber-600 dark:text-amber-400 font-bold">{row.avg}</td>
                      <td className="px-6 py-4 text-red-600 dark:text-red-400 font-bold">{row.worst}</td>
                      <td className="px-6 py-4 text-cyan-600 dark:text-cyan-400 font-bold">{row.space}</td>
                      <td className="px-6 py-4 font-sans text-gray-500 dark:text-gray-400 text-[11px]">{row.notes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheatSheet;
