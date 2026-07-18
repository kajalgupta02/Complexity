import { detectLoops } from './loopDetector';

const source = `for (let i = 0; i < n; i++) {
  for (let j = 0; j < n; j++) {
  }
}`;

console.log('Source:', source);
const loops = detectLoops(source);
console.log('Found loops:', loops);
