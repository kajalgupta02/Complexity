import { stripCommentsAndStrings } from './tokenizer';
import { detectLoops } from './loopDetector';

const testCode = `function countPairs(n) {
  let pairs = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      pairs++;
    }
  }
  return pairs;
}`;

const cleaned = stripCommentsAndStrings(testCode);
console.log('Cleaned source:', JSON.stringify(cleaned, null, 2));
const loops = detectLoops(cleaned);
console.log('Found loops:', loops);
