import { isProfane } from '../lib/profanity.js';

console.log("Testing 'i need lonk of porn':", isProfane("i need lonk of porn"));
console.log("Testing 'porn':", isProfane("porn"));
console.log("Testing 'sex':", isProfane("sex"));
console.log("Testing 'f u c k':", isProfane("f u c k"));
console.log("Testing 'clean word':", isProfane("clean"));
