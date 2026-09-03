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

const operationTone = (value: string) => {
  if (value === 'N/A') return 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400';
  if (value.includes('O(1)')) return 'bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20 dark:text-emerald-300';
  if (value.includes('log')) return 'bg-cyan-500/10 text-cyan-700 ring-1 ring-cyan-500/20 dark:text-cyan-300';
  if (value.includes('O(n)')) return 'bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300';
  return 'bg-rose-500/10 text-rose-700 ring-1 ring-rose-500/20 dark:text-rose-300';
};

const CHART_LINES = [
  { notation: 'O(1)', label: 'Constant', color: '#10b981', dot: 'bg-emerald-500', path: 'M55 262 C200 261 400 261 610 260', point: [610, 260], desc: 'The work stays flat as input grows. Ideal for direct lookups and simple arithmetic.' },
  { notation: 'O(log n)', label: 'Logarithmic', color: '#06b6d4', dot: 'bg-cyan-500', path: 'M55 278 C160 269 325 258 610 232', point: [610, 232], desc: 'Growth is gentle because each step removes a large portion of the remaining input.' },
  { notation: 'O(n)', label: 'Linear', color: '#6366f1', dot: 'bg-indigo-500', path: 'M55 278 L610 105', point: [610, 105], desc: 'Work grows in direct proportion to input size, such as one pass through an array.' },
  { notation: 'O(n log n)', label: 'Linearithmic', color: '#f59e0b', dot: 'bg-amber-500', path: 'M55 282 C185 273 330 218 610 48', point: [610, 48], desc: 'A strong choice for efficient sorting, combining a pass with logarithmic splitting.' },
  { notation: 'O(n²)', label: 'Quadratic', color: '#f43f5e', dot: 'bg-rose-500', path: 'M55 284 C205 278 370 180 500 40', point: [500, 40], desc: 'Nested work compounds quickly. Pairwise comparisons and naive nested loops often land here.' },
  { notation: 'O(2ⁿ)', label: 'Exponential', color: '#a855f7', dot: 'bg-purple-500', path: 'M55 285 C130 280 205 235 265 42', point: [265, 42], desc: 'Each new input can multiply the work. Avoid this pattern unless the input is tightly bounded.' },
] as const;

const ComplexityChart: React.FC = () => {
  const [selectedNotation, setSelectedNotation] = useState('O(n)');
  const selectedLine = CHART_LINES.find((line) => line.notation === selectedNotation) ?? CHART_LINES[2];

  return (
    <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-[#111726]">
      <div className="flex flex-col gap-3 border-b border-gray-100 p-6 dark:border-gray-800 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-black text-gray-900 dark:text-white">How time complexity grows</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Select a curve to see how its growth affects real algorithms.</p>
        </div>
        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Lower curves scale better</span>
      </div>
      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_14rem] lg:items-center">
        <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-50 to-indigo-50/60 p-2 dark:border-gray-800 dark:from-[#0c101c] dark:to-indigo-950/20 sm:p-3">
          <svg viewBox="0 0 640 330" role="img" aria-label="Interactive chart comparing common time complexity growth rates" className="h-auto w-full">
            {[60, 110, 160, 210, 260].map((y) => <line key={y} x1="55" x2="610" y1={y} y2={y} stroke="currentColor" className="text-slate-200 dark:text-slate-800" strokeDasharray="4 6" />)}
            <line x1="55" x2="610" y1="285" y2="285" stroke="currentColor" className="text-slate-400 dark:text-slate-500" strokeWidth="2" />
            <line x1="55" x2="55" y1="25" y2="285" stroke="currentColor" className="text-slate-400 dark:text-slate-500" strokeWidth="2" />
            {CHART_LINES.map((line) => {
              const isSelected = line.notation === selectedNotation;
              return (
                <g key={line.notation} onClick={() => setSelectedNotation(line.notation)} className="cursor-pointer">
                  <path d={line.path} fill="none" stroke={line.color} strokeWidth={isSelected ? 7 : 4} strokeLinecap="round" opacity={isSelected ? 1 : 0.3} className="transition-all duration-200" />
                  <circle cx={line.point[0]} cy={line.point[1]} r={isSelected ? 8 : 5} fill={line.color} opacity={isSelected ? 1 : 0.45} className="transition-all duration-200" />
                </g>
              );
            })}
            <text x="55" y="312" className="fill-slate-500 text-[13px]">small input</text>
            <text x="525" y="312" className="fill-slate-500 text-[13px]">large input</text>
            <text x="10" y="35" className="fill-slate-500 text-[13px]">work</text>
          </svg>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-3 dark:border-indigo-900/50 dark:bg-indigo-950/30">
            <p className="font-mono text-lg font-black text-indigo-700 dark:text-indigo-300">{selectedLine.notation}</p>
            <p className="mt-1 text-xs leading-relaxed text-indigo-950 dark:text-indigo-100">{selectedLine.desc}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {CHART_LINES.map((line) => {
              const isSelected = line.notation === selectedNotation;
              return (
                <button key={line.notation} type="button" onClick={() => setSelectedNotation(line.notation)} aria-pressed={isSelected} className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition-all ${isSelected ? 'border-indigo-500 bg-indigo-50 shadow-sm dark:border-indigo-400 dark:bg-indigo-500/10' : 'border-transparent bg-gray-50 hover:border-gray-200 dark:bg-[#0c101c] dark:hover:border-gray-700'}`}>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${line.dot}`} />
                  <span><span className="block font-mono font-bold text-gray-900 dark:text-white">{line.notation}</span><span className="block text-[10px] text-gray-500 dark:text-gray-400">{line.label}</span></span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

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

        <ComplexityChart />

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
          <div className="bg-white dark:bg-[#111726] rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 via-white to-cyan-50/60 dark:from-indigo-950/20 dark:via-[#111726] dark:to-cyan-950/10">
              <div>
                <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-sm text-white">▦</span>
                  Data Structure Operations
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Compare the most common operations at a glance. Green is fastest; warmer colors grow more quickly.
                </p>
              </div>
              <Badge variant="primary" size="sm">
                {filteredDS.length} structures
              </Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm whitespace-nowrap">
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
                    <tr key={i} className="group transition-colors odd:bg-white even:bg-slate-50/60 hover:bg-indigo-50/70 dark:odd:bg-[#111726] dark:even:bg-[#0c101c]/50 dark:hover:bg-indigo-500/10">
                      <td className="px-6 py-4 font-sans font-bold text-gray-900 dark:text-white">{row.name}</td>
                      <td className="px-6 py-4 font-sans"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{row.category}</span></td>
                      <td className="px-6 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1 font-bold ${operationTone(row.access)}`}>{row.access}</span></td>
                      <td className="px-6 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1 font-bold ${operationTone(row.search)}`}>{row.search}</span></td>
                      <td className="px-6 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1 font-bold ${operationTone(row.insert)}`}>{row.insert}</span></td>
                      <td className="px-6 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1 font-bold ${operationTone(row.delete)}`}>{row.delete}</span></td>
                      <td className="px-6 py-4"><span className={`inline-flex rounded-lg px-2.5 py-1 font-bold ${operationTone(row.space)}`}>{row.space}</span></td>
                      <td className="px-6 py-4 font-sans text-[11px] text-gray-500 dark:text-gray-400">{row.notes}</td>
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
