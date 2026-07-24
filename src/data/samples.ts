export interface Sample {
  id: string;
  title: string;
  description: string;
  complexity: string;
  language: 'javascript' | 'python' | 'java' | 'cpp';
  code: string;
}

export const SAMPLES: Sample[] = [
  // O(1)
  {
    id: 'o1-js',
    title: 'Array Access',
    description: 'Direct array index access is always constant time',
    complexity: 'O(1)',
    language: 'javascript',
    code: `function getFirst(arr) {
  return arr[0];
}`
  },
  {
    id: 'o1-py',
    title: 'Dictionary Lookup',
    description: 'Hash map / dict key access is constant time average case',
    complexity: 'O(1)',
    language: 'python',
    code: `def get_value(d, key):
    return d[key]`
  },
  {
    id: 'o1-java',
    title: 'HashMap Get',
    description: 'HashMap key lookup is O(1) average case',
    complexity: 'O(1)',
    language: 'java',
    code: `public class Example {
    public static <K, V> V getValue(java.util.HashMap<K, V> map, K key) {
        return map.get(key);
    }
}`
  },
  {
    id: 'o1-cpp',
    title: 'unordered_map Access',
    description: 'Hash table access via unordered_map is average O(1)',
    complexity: 'O(1)',
    language: 'cpp',
    code: `#include <unordered_map>

int getValue(const std::unordered_map<int, int>& m, int key) {
  return m.at(key);
}`
  },
  // O(log n)
  {
    id: 'ologn-js',
    title: 'Binary Search',
    description: 'Halves the search space each iteration',
    complexity: 'O(log n)',
    language: 'javascript',
    code: `function binarySearch(arr, target) {
  let low = 0, high = arr.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`
  },
  {
    id: 'ologn-py',
    title: 'Binary Search',
    description: 'Halves the search space each step → logarithmic',
    complexity: 'O(log n)',
    language: 'python',
    code: `def binary_search(arr, target):
    low, high = 0, len(arr) - 1
    while low <= high:
        mid = (low + high) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`
  },
  {
    id: 'ologn-java',
    title: 'Binary Search',
    description: 'Each step halves the search space',
    complexity: 'O(log n)',
    language: 'java',
    code: `public class BinarySearch {
    public static int search(int[] arr, int target) {
        int low = 0, high = arr.length - 1;
        while (low <= high) {
            int mid = (low + high) / 2;
            if (arr[mid] == target) return mid;
            if (arr[mid] < target) low = mid + 1;
            else high = mid - 1;
        }
        return -1;
    }
}`
  },
  {
    id: 'ologn-cpp',
    title: 'Binary Search',
    description: 'Classic divide-and-conquer search',
    complexity: 'O(log n)',
    language: 'cpp',
    code: `#include <vector>

int binarySearch(const std::vector<int>& arr, int target) {
  int low = 0, high = arr.size() - 1;
  while (low <= high) {
    int mid = (low + high) / 2;
    if (arr[mid] == target) return mid;
    if (arr[mid] < target) low = mid + 1;
    else high = mid - 1;
  }
  return -1;
}`
  },
  // O(n)
  {
    id: 'on-js',
    title: 'Linear Search',
    description: 'Worst case: visit every element once',
    complexity: 'O(n)',
    language: 'javascript',
    code: `function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) return i;
  }
  return -1;
}`
  },
  {
    id: 'on-py',
    title: 'Linear Search',
    description: 'Iterates through each element once → linear',
    complexity: 'O(n)',
    language: 'python',
    code: `def linear_search(arr, target):
    for i, val in enumerate(arr):
        if val == target:
            return i
    return -1`
  },
  {
    id: 'on-java',
    title: 'Linear Search',
    description: 'Single loop through all elements',
    complexity: 'O(n)',
    language: 'java',
    code: `public class LinearSearch {
    public static int search(int[] arr, int target) {
        for (int i = 0; i < arr.length; i++) {
            if (arr[i] == target) return i;
        }
        return -1;
    }
}`
  },
  {
    id: 'on-cpp',
    title: 'Linear Search',
    description: 'One loop over n elements',
    complexity: 'O(n)',
    language: 'cpp',
    code: `#include <vector>

int linearSearch(const std::vector<int>& arr, int target) {
  for (size_t i = 0; i < arr.size(); i++) {
    if (arr[i] == target) return i;
  }
  return -1;
}`
  },
  // O(n log n)
  {
    id: 'onlogn-js',
    title: 'Merge Sort',
    description: 'Divide into halves (log n) and merge each level (n)',
    complexity: 'O(n log n)',
    language: 'javascript',
    code: `function mergeSort(arr) {
  if (arr.length <= 1) return arr;
  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid));
  const right = mergeSort(arr.slice(mid));
  return merge(left, right);
}

function merge(a, b) {
  const out = [];
  let i = 0, j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] < b[j]) out.push(a[i++]);
    else out.push(b[j++]);
  }
  return [...out, ...a.slice(i), ...b.slice(j)];
}`
  },
  {
    id: 'onlogn-py',
    title: 'Merge Sort',
    description: 'Recursive split log n levels × linear merging',
    complexity: 'O(n log n)',
    language: 'python',
    code: `def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(a, b):
    out = []
    i = j = 0
    while i < len(a) and j < len(b):
        if a[i] < b[j]:
            out.append(a[i]); i += 1
        else:
            out.append(b[j]); j += 1
    out.extend(a[i:]); out.extend(b[j:])
    return out`
  },
  {
    id: 'onlogn-java',
    title: 'Merge Sort',
    description: 'Classic divide-and-conquer sort',
    complexity: 'O(n log n)',
    language: 'java',
    code: `import java.util.Arrays;

public class MergeSort {
    public static void sort(int[] arr) {
        if (arr.length > 1) {
            int mid = arr.length / 2;
            int[] left = Arrays.copyOfRange(arr, 0, mid);
            int[] right = Arrays.copyOfRange(arr, mid, arr.length);
            sort(left); sort(right);
            merge(arr, left, right);
        }
    }
    private static void merge(int[] arr, int[] l, int[] r) {
        int i = 0, j = 0, k = 0;
        while (i < l.length && j < r.length)
            arr[k++] = (l[i] < r[j]) ? l[i++] : r[j++];
        while (i < l.length) arr[k++] = l[i++];
        while (j < r.length) arr[k++] = r[j++];
    }
}`
  },
  {
    id: 'onlogn-cpp',
    title: 'std::sort Call',
    description: 'The standard library sort is O(n log n)',
    complexity: 'O(n log n)',
    language: 'cpp',
    code: `#include <vector>
#include <algorithm>

void sortVec(std::vector<int>& v) {
  std::sort(v.begin(), v.end());
}`
  },
  // O(n²)
  {
    id: 'on2-js',
    title: 'Bubble Sort',
    description: 'Two nested loops, each ~n iterations',
    complexity: 'O(n²)',
    language: 'javascript',
    code: `function bubbleSort(arr) {
  const n = arr.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      if (arr[j] > arr[j + 1]) {
        [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
      }
    }
  }
  return arr;
}`
  },
  {
    id: 'on2-py',
    title: 'Bubble Sort',
    description: 'Double nested loops → quadratic',
    complexity: 'O(n²)',
    language: 'python',
    code: `def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr`
  },
  {
    id: 'on2-java',
    title: 'Selection Sort',
    description: 'Two nested iterations → quadratic',
    complexity: 'O(n²)',
    language: 'java',
    code: `public class SelectionSort {
    public static void sort(int[] arr) {
        int n = arr.length;
        for (int i = 0; i < n; i++) {
            int minIdx = i;
            for (int j = i + 1; j < n; j++) {
                if (arr[j] < arr[minIdx]) minIdx = j;
            }
            int tmp = arr[minIdx];
            arr[minIdx] = arr[i];
            arr[i] = tmp;
        }
    }
}`
  },
  {
    id: 'on2-cpp',
    title: 'Bubble Sort',
    description: 'Two nested for loops → O(n²)',
    complexity: 'O(n²)',
    language: 'cpp',
    code: `#include <vector>

void bubbleSort(std::vector<int>& arr) {
  int n = arr.size();
  for (int i = 0; i < n; i++) {
    for (int j = 0; j < n - i - 1; j++) {
      if (arr[j] > arr[j + 1]) {
        std::swap(arr[j], arr[j + 1]);
      }
    }
  }
}`
  },
  // O(2ⁿ)
  {
    id: 'o2n-js',
    title: 'Naive Fibonacci',
    description: 'Two recursive calls per step → exponential explosion',
    complexity: 'O(2ⁿ)',
    language: 'javascript',
    code: `function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}`
  },
  {
    id: 'o2n-py',
    title: 'Naive Fibonacci',
    description: 'Branching recursion with 2 calls per frame',
    complexity: 'O(2ⁿ)',
    language: 'python',
    code: `def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)`
  },
  {
    id: 'o2n-java',
    title: 'Naive Fibonacci',
    description: 'Classic exponential recursion',
    complexity: 'O(2ⁿ)',
    language: 'java',
    code: `public class Fib {
    public static int fib(int n) {
        if (n <= 1) return n;
        return fib(n - 1) + fib(n - 2);
    }
}`
  },
  {
    id: 'o2n-cpp',
    title: 'Naive Fibonacci',
    description: 'Uncached recursive fib is exponential',
    complexity: 'O(2ⁿ)',
    language: 'cpp',
    code: `int fib(int n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}`
  },
];

export const COMPLEXITIES = [
  'All',
  'O(1)',
  'O(log n)',
  'O(n)',
  'O(n log n)',
  'O(n²)',
  'O(2ⁿ)',
];

export const LANGUAGES = [
  { id: 'all', label: 'All' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
];
