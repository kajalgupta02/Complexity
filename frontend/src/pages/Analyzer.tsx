import React, { useState, useEffect, useRef } from 'react';
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
  const [editorWidth, setEditorWidth] = useState(() => {
    const saved = Number(localStorage.getItem('analyzer-editor-width'));
    return Number.isFinite(saved) && saved >= 35 && saved <= 75 ? saved : 58;
  });
  const [isResizing, setIsResizing] = useState(false);
  const workspaceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('analyzer-editor-width', String(editorWidth));
  }, [editorWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (event: PointerEvent) => {
      const workspace = workspaceRef.current;
      if (!workspace) return;
      const bounds = workspace.getBoundingClientRect();
      const nextWidth = ((event.clientX - bounds.left) / bounds.width) * 100;
      setEditorWidth(Math.min(75, Math.max(35, nextWidth)));
    };

    const stopResizing = () => setIsResizing(false);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopResizing);

    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopResizing);
    };
  }, [isResizing]);

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
    } catch (err: unknown) {
      addToast('warning', err instanceof Error ? err.message : 'Analysis failed.');
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
    <div className="page-shell text-text-primary dark:text-text-primary-dark transition-colors">
      <SEO
        title="Big-O Complexity Analyzer"
        description="Instant Big-O time and space complexity analyzer for 13 programming languages. Connect your solutions to Blind 75 & NeetCode 150 problems."
        canonical="/analyzer"
      />

      <div className="max-w-7xl mx-auto space-y-6">
        {/* Main 2-Column Split Layout */}
        <div
          ref={workspaceRef}
          className={`analyzer-workspace grid grid-cols-1 lg:items-start ${isResizing ? 'select-none' : ''}`}
          style={{ '--editor-width': `${editorWidth}%` } as React.CSSProperties}
        >
          {/* Left Column: Fixed / Sticky Code Editor (Does not scroll out of view when scrolling explanation) */}
          <div className="lg:sticky lg:top-20 lg:h-[calc(100vh-105px)] lg:self-start flex flex-col min-w-0">
            <CodeEditor
              code={code}
              onChange={setCode}
              language={language}
              onLanguageChange={handleLanguageChange}
              onAnalyze={handleAnalyze}
              isAnalyzing={isAnalyzing}
            />
          </div>

          <button
            type="button"
            aria-label="Resize analyzer columns"
            aria-valuemin={35}
            aria-valuemax={75}
            aria-valuenow={Math.round(editorWidth)}
            role="separator"
            className="hidden lg:flex h-full min-h-[calc(100vh-105px)] items-center justify-center cursor-col-resize group touch-none"
            onPointerDown={() => setIsResizing(true)}
            onDoubleClick={() => setEditorWidth(58)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') setEditorWidth((width) => Math.max(35, width - 2));
              if (event.key === 'ArrowRight') setEditorWidth((width) => Math.min(75, width + 2));
              if (event.key === 'Home') setEditorWidth(35);
              if (event.key === 'End') setEditorWidth(75);
            }}
          >
            <span className="flex h-16 w-1.5 items-center justify-center rounded-full bg-gray-200 transition-colors group-hover:bg-indigo-400 dark:bg-gray-700 dark:group-hover:bg-indigo-500">
              <span className="h-8 w-0.5 rounded-full bg-gray-400 dark:bg-gray-500" />
            </span>
          </button>

          {/* Right Column: Analysis Results / Explanation (Scrolls down independently) */}
          <div className="space-y-6 pb-12 min-w-0">
            {result ? (
              <AnalysisResults
                result={result}
                linkedProblem={selectedProblem}
                onSaveToDashboard={handleSaveToDashboard}
                onShare={handleShare}
              />
            ) : (
              /* Welcoming Empty State */
              <div className="flex min-h-[460px] flex-col items-center justify-center space-y-6 rounded-[28px] border border-slate-200 bg-white/90 p-8 text-center shadow-[0_12px_40px_rgba(15,23,42,0.06)] backdrop-blur-sm dark:border-slate-800/80 dark:bg-slate-950/70 dark:shadow-[0_18px_44px_rgba(2,6,23,0.42)] sm:p-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-500/12 to-cyan-500/12 text-3xl text-indigo-600 shadow-sm dark:border-indigo-500/20 dark:text-indigo-300">
                  ⚡
                </div>

                <div className="max-w-md space-y-3">
                  <h3 className="text-2xl font-extrabold tracking-[-0.04em] text-slate-900 dark:text-slate-50">
                    Code Complexity Results
                  </h3>
                  <p className="text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-[0.96rem]">
                    Select your language, paste your solution, and click{' '}
                    <span className="font-semibold text-slate-900 dark:text-slate-50">Analyze</span>{' '}
                    to see the time and space complexity explained clearly.
                  </p>
                </div>

                <div className="flex w-full max-w-xs items-center justify-center gap-2 border-t border-slate-200 pt-4 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <span>🔒</span>
                  <span>Static analysis · 13 languages</span>
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
