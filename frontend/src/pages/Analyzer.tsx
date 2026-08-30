import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { useAnalyzerWorker } from '@/hooks/useAnalyzerWorker';
import { CodeEditor } from '@/components/analyzer/CodeEditor';
import { AnalysisResults } from '@/components/analyzer/AnalysisResults';
import { SEO } from '@/components/SEO';
import { INTERVIEW_PROBLEMS, type InterviewProblem } from '@/data/interviewProblems';
import LZString from 'lz-string';
import {
  type AnalysisResult,
  type SupportedLanguage,
} from '@/lib/analyzer';

const STARTER_CODE: Record<SupportedLanguage, string> = {
  javascript: `// Two Sum — O(n) Time, O(n) Space
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (seen.has(diff)) {
      return [seen.get(diff), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
  typescript: `function twoSum(nums: number[], target: number): number[] {
  const map = new Map<number, number>();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
  python: `def two_sum(nums: list[int], target: int) -> list[int]:
    # O(n) time, O(n) space hash map approach
    seen = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in seen:
            return [seen[diff], i]
        seen[num] = i
    return []`,
  java: `import java.util.HashMap;

public class Solution {
    public int[] twoSum(int[] nums, int target) {
        HashMap<Integer, Integer> map = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (map.containsKey(complement)) {
                return new int[] { map.get(complement), i };
            }
            map.put(nums[i], i);
        }
        return new int[0];
    }
}`,
  cpp: `#include <vector>
#include <unordered_map>

class Solution {
public:
    std::vector<int> twoSum(std::vector<int>& nums, int target) {
        std::unordered_map<int, int> seen;
        for (int i = 0; i < nums.size(); i++) {
            int diff = target - nums[i];
            if (seen.count(diff)) {
                return {seen[diff], i};
            }
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
  c: `#include <stdio.h>
#include <stdlib.h>

int* twoSum(int* nums, int numsSize, int target, int* returnSize) {
    *returnSize = 2;
    int* result = (int*)malloc(2 * sizeof(int));
    for (int i = 0; i < numsSize; i++) {
        for (int j = i + 1; j < numsSize; j++) {
            if (nums[i] + nums[j] == target) {
                result[0] = i;
                result[1] = j;
                return result;
            }
        }
    }
    *returnSize = 0;
    return NULL;
}`,
  csharp: `using System.Collections.Generic;

public class Solution {
    public int[] TwoSum(int[] nums, int target) {
        var map = new Dictionary<int, int>();
        for (int i = 0; i < nums.Length; i++) {
            int diff = target - nums[i];
            if (map.ContainsKey(diff)) {
                return new int[] { map[diff], i };
            }
            map[nums[i]] = i;
        }
        return new int[0];
    }
}`,
  go: `package main

func twoSum(nums []int, target int) []int {
    seen := make(map[int]int)
    for i, num := range nums {
        diff := target - num
        if idx, ok := seen[diff]; ok {
            return []int{idx, i}
        }
        seen[num] = i
    }
    return nil
}`,
  rust: `use std::collections::HashMap;

pub fn two_sum(nums: Vec<i32>, target: i32) -> Vec<i32> {
    let mut seen = HashMap::new();
    for (i, &num) in nums.iter().enumerate() {
        let diff = target - num;
        if let Some(&idx) = seen.get(&diff) {
            return vec![idx as i32, i as i32];
        }
        seen.insert(num, i);
    }
    vec![]
}`,
  swift: `class Solution {
    func twoSum(_ nums: [Int], _ target: Int) -> [Int] {
        var map = [Int: Int]()
        for (i, num) in nums.enumerated() {
            let diff = target - num
            if let idx = map[diff] {
                return [idx, i]
            }
            map[num] = i
        }
        return []
    }
}`,
  kotlin: `class Solution {
    fun twoSum(nums: IntArray, target: Int): IntArray {
        val map = HashMap<Int, Int>()
        for (i in nums.indices) {
            val diff = target - nums[i]
            if (map.containsKey(diff)) {
                return intArrayOf(map[diff]!!, i)
            }
            map[nums[i]] = i
        }
        return intArrayOf()
    }
}`,
  php: `<?php
function twoSum(array $nums, int $target): array {
    $seen = [];
    foreach ($nums as $i => $num) {
        $diff = $target - $num;
        if (array_key_exists($diff, $seen)) {
            return [$seen[$diff], $i];
        }
        $seen[$num] = $i;
    }
    return [];
}`,
  ruby: `def two_sum(nums, target)
  seen = {}
  nums.each_with_index do |num, i|
    diff = target - num
    return [seen[diff], i] if seen.key?(diff)
    seen[num] = i
  end
  []
end`,
};

export const Analyzer: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();
  const { saveAnalysis, recordAnalysisHistory } = useAuth();
  const { analyze, isAnalyzing } = useAnalyzerWorker();

  const [language, setLanguage] = useState<SupportedLanguage>('java');
  const [code, setCode] = useState<string>(STARTER_CODE.java);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [selectedProblem, setSelectedProblem] = useState<InterviewProblem | null>(null);

  // Handle URL queries on mount (e.g. ?code=...&lang=...&problem=...)
  useEffect(() => {
    const codeParam = searchParams.get('code');
    const langParam = searchParams.get('lang') as SupportedLanguage;
    const problemParam = searchParams.get('problem');

    if (langParam && STARTER_CODE[langParam]) {
      setLanguage(langParam);
    }
    if (codeParam) {
      setCode(codeParam);
    }
    if (problemParam) {
      const p = INTERVIEW_PROBLEMS.find((prob) => prob.id === problemParam);
      if (p) {
        setSelectedProblem(p);
      }
    }
  }, [searchParams]);

  // Handle switching language
  const handleLanguageChange = (newLang: SupportedLanguage) => {
    setLanguage(newLang);
    // If editor has starter code or empty, update to that language's template
    if (!code.trim() || Object.values(STARTER_CODE).includes(code)) {
      setCode(STARTER_CODE[newLang] || '');
    }
    setResult(null);
  };

  // Trigger analysis
  const handleAnalyze = async () => {
    if (!code.trim()) {
      addToast('warning', 'Please enter some code to analyze.');
      return;
    }

    try {
      const res = await analyze(code, language);
      setResult(res);

      // Record to history in AuthContext
      recordAnalysisHistory({
        summary: selectedProblem ? selectedProblem.title : `${language.toUpperCase()} Analysis`,
        code,
        language,
        timeComplexity: res.timeComplexity,
        spaceComplexity:
          typeof res.spaceComplexity === 'string'
            ? res.spaceComplexity
            : res.spaceComplexity?.class || 'O(1)',
        linkedProblemId: selectedProblem?.id,
      });

      addToast('success', 'Analysis completed successfully!');
    } catch (err: any) {
      addToast('warning', err.message || 'Analysis failed.');
    }
  };

  // Save to dashboard
  const handleSaveToDashboard = () => {
    if (!result) return;
    saveAnalysis({
      title: selectedProblem ? selectedProblem.title : `${language.toUpperCase()} Analysis`,
      code,
      language,
      timeComplexity: result.timeComplexity,
      spaceComplexity:
        typeof result.spaceComplexity === 'string'
          ? result.spaceComplexity
          : result.spaceComplexity?.class || 'O(1)',
      tags: selectedProblem ? [selectedProblem.category, selectedProblem.list] : [language],
      isFavorite: false,
      linkedProblemId: selectedProblem?.id,
    });
    addToast('success', 'Saved snippet to your Dashboard!');
  };

  // Share via compressed URL
  const handleShare = () => {
    const payload = JSON.stringify({ code, language });
    const compressed = LZString.compressToEncodedURIComponent(payload);
    const shareUrl = `${window.location.origin}/share?data=${compressed}`;
    navigator.clipboard.writeText(shareUrl);
    addToast('success', 'Share link copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#090d16] text-gray-900 dark:text-gray-100 transition-colors py-6 px-4 sm:px-6">
      <SEO
        title="Big-O Complexity Analyzer"
        description="Instant Big-O time and space complexity analyzer for 13 programming languages. Connect your solutions to Blind 75 & NeetCode 150 problems."
        canonical="/analyzer"
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Main 2-Column Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Fixed / Sticky Code Editor (Does not scroll out of view when scrolling explanation) */}
          <div className="lg:col-span-7 lg:sticky lg:top-20 lg:h-[calc(100vh-105px)] lg:self-start flex flex-col">
            <CodeEditor
              code={code}
              onChange={setCode}
              language={language}
              onLanguageChange={handleLanguageChange}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
          </div>

          {/* Right Column: Analysis Results / Explanation (Scrolls down independently) */}
          <div className="lg:col-span-5 space-y-6 pb-12">
            {result ? (
              <AnalysisResults
                result={result}
                linkedProblem={selectedProblem}
                onSaveToDashboard={handleSaveToDashboard}
                onShare={handleShare}
              />
            ) : (
              /* Welcoming Empty State */
              <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-[#111726] border border-gray-200 dark:border-gray-800 shadow-sm space-y-5 min-h-[460px] flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-cyan-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-3xl shadow-sm border border-indigo-500/20">
                  ⚡
                </div>

                <div className="space-y-2 max-w-sm">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                    Code Complexity Results
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    Select your programming language, enter or paste code into the editor, and click <strong className="text-gray-800 dark:text-gray-200">⚡ Analyze</strong>.
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800/80 w-full max-w-xs text-[11px] text-gray-400">
                  🔒 100% Client-Side Static Analysis · 13 Languages
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analyzer;
