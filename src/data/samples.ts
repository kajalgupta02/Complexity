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
  // O(√n)
  {
    id: 'osqrtn-js',
    title: 'Trial Division Primality',
    description: 'Divisors come in pairs up to √n, so we only need sqrt(n) checks',
    complexity: 'O(√n)',
    language: 'javascript',
    code: `function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}`
  },
  {
    id: 'osqrtn-py',
    title: 'Trial Division Primality',
    description: 'Checks divisors only up to sqrt(n) → sublinear',
    complexity: 'O(√n)',
    language: 'python',
    code: `import math

def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(math.isqrt(n)) + 1):
        if n % i == 0:
            return False
    return True`
  },
  {
    id: 'osqrtn-java',
    title: 'Trial Division Primality',
    description: 'Loop condition i*i <= n gives sqrt(n) iterations',
    complexity: 'O(√n)',
    language: 'java',
    code: `public class Primality {
    public static boolean isPrime(int n) {
        if (n < 2) return false;
        for (long i = 2; i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }
}`
  },
  {
    id: 'osqrtn-cpp',
    title: 'Trial Division Primality',
    description: 'Classic sqrt bound for prime testing',
    complexity: 'O(√n)',
    language: 'cpp',
    code: `#include <cmath>

bool isPrime(int n) {
  if (n < 2) return false;
  for (int i = 2; (long long)i * i <= n; i++) {
    if (n % i == 0) return false;
  }
  return true;
}`
  },
  // O(n³)
  {
    id: 'on3-js',
    title: 'Matrix Multiplication (Naive)',
    description: 'Triple nested loops: row × column × inner dot product',
    complexity: 'O(n³)',
    language: 'javascript',
    code: `function multiply(A, B) {
  const n = A.length;
  const C = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      for (let k = 0; k < n; k++) {
        C[i][j] += A[i][k] * B[k][j];
      }
    }
  }
  return C;
}`
  },
  {
    id: 'on3-py',
    title: 'Matrix Multiplication (Naive)',
    description: 'Three nested loops over n → cubic growth',
    complexity: 'O(n³)',
    language: 'python',
    code: `def multiply(A, B):
    n = len(A)
    C = [[0] * n for _ in range(n)]
    for i in range(n):
        for j in range(n):
            for k in range(n):
                C[i][j] += A[i][k] * B[k][j]
    return C`
  },
  {
    id: 'on3-java',
    title: '3-Sum Brute Force',
    description: 'Enumerates all i<j<k triples → O(n³)',
    complexity: 'O(n³)',
    language: 'java',
    code: `import java.util.ArrayList;
import java.util.List;

public class ThreeSum {
    public static List<List<Integer>> threeSum(int[] nums) {
        List<List<Integer>> res = new ArrayList<>();
        int n = nums.length;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                for (int k = j + 1; k < n; k++) {
                    if (nums[i] + nums[j] + nums[k] == 0) {
                        res.add(List.of(nums[i], nums[j], nums[k]));
                    }
                }
            }
        }
        return res;
    }
}`
  },
  {
    id: 'on3-cpp',
    title: 'All-Pairs Shortest Paths (Floyd)',
    description: 'Triple nested relax: for each k, i, j → O(n³)',
    complexity: 'O(n³)',
    language: 'cpp',
    code: `#include <vector>
#include <climits>
using namespace std;

void floydWarshall(vector<vector<int>>& dist) {
  int n = dist.size();
  for (int k = 0; k < n; k++)
    for (int i = 0; i < n; i++)
      for (int j = 0; j < n; j++)
        if (dist[i][k] != INT_MAX && dist[k][j] != INT_MAX)
          dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]);
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
  'O(√n)',
  'O(n)',
  'O(n log n)',
  'O(n²)',
  'O(n³)',
  'O(2ⁿ)',
];

export const LANGUAGES = [
  { id: 'all', label: 'All' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'java', label: 'Java' },
  { id: 'cpp', label: 'C++' },
];
