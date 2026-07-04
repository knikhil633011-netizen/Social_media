/**
 * Multi-language profanity filter for Echo Room.
 * Blocks common slurs, swear words, and hate speech in English, Spanish, French, and Hindi/Hinglish.
 * Normalizes text to prevent bypass tricks (e.g. spaces, asterisks, dots, or underscores).
 */

// List of banned word patterns. To catch variations, we check after removing spaces/punctuation.
const BANNED_PATTERNS = [
  // --- English profanities & slurs ---
  /f+u+c+k+/i,
  /s+h+i+t+/i,
  /b+i+t+c+h+/i,
  /a+s+s+h+o+l+e+/i,
  /c+u+n+t+/i,
  /d+i+c+k+/i,
  /b+a+s+t+a+r+d+/i,
  /w+h+o+r+e+/i,
  /s+l+u+t+/i,
  /p+i+s+s+/i,
  /c+o+c+k+s+u+c+k+e+r+/i,
  /m+o+t+h+e+r+f+u+c+k+e+r+/i,
  /f+a+g+g+o+t+/i,
  /n+i+g+g+e+r+/i,
  /r+e+t+a+r+d+/i,
  /p+o+r+n+/i,
  /s+e+x+/i,
  /x+x+x+/i,

  // --- Spanish profanities ---
  /p+u+t+a+/i,
  /p+u+t+o+/i,
  /m+i+e+r+d+a+/i,
  /g+i+l+i+p+o+l+l+a+s+/i,
  /c+a+b+r+o+n+/i,
  /c+o+n+j+o+/i,
  /p+e+n+d+e+j+o+/i,
  /j+o+d+e+r+/i,
  /m+a+r+i+c+o+n+/i,

  // --- French profanities ---
  /m+e+r+d+e+/i,
  /p+u+t+a+i+n+/i,
  /c+o+n+n+a+r+d+/i,
  /c+h+i+e+r+/i,
  /e+n+c+u+l+e+/i,
  /s+a+l+o+p+e+/i,
  /b+a+t+a+r+d+/i,

  // --- Hindi / Hinglish profanities ---
  /c+h+u+t+i+y+a+/i,
  /b+h+e+n+c+h+o+d+/i,
  /b+c+h+o+d+/i,
  /m+a+d+a+r+c+h+o+d+/i,
  /m+c+h+o+d+/i,
  /g+a+n+d+u+/i,
  /l+a+u+d+a+/i,
  /l+o+d+a+/i,
  /k+u+t+t+a+/i,
  /k+a+m+i+n+a+/i,
  /h+a+r+a+m+i+/i,
  /s+a+a+l+a+/i,
  /s+a+l+e+/i,
  /b+h+a+d+w+a+/i,
  /r+a+n+d+i+/i,

  // --- Hindi (Devanagari script) profanities ---
  /च+ू+त+ि+य+ा+/u,
  /ब+ह+न+च+ो+द+/u,
  /भ+न+च+ो+द+/u,
  /म+ा+द+र+च+ो+द+/u,
  /ग+ा+ं+ड+ू+/u,
  /ग+ा+ं+ड+/u,
  /ल+ौ+ड+़+ा+/u,
  /ल+ो+ड+़+ा+/u,
  /ह+र+ा+म+ी+/u,
  /क+ु+त+्+त+ा+/u,
  /स+ा+ल+ा+/u,
  /स+ा+ल+े+/u,
  /भ+ड+व+ा+/u,
  /र+ं+ड+ी+/u,

  // --- Video blocking & Bad video domains ---
  /\bhttps?:\/\/\S+\.(mp4|mov|avi|webm|mkv|3gp|flv|wmv)\b/i,
  /(pornhub|xvideos|xnxx|redtube|youporn|chaturbate|onlyfans|xhamster|spankbang|heavy-r)/i
];

/**
 * Checks if a string contains profane or inappropriate content in any language.
 * @param {string} text - The input text to check
 * @returns {boolean} True if profane, False if clean
 */
export function isProfane(text) {
  if (!text || typeof text !== 'string') return false;

  // 1. Lowercase and normalize accents (e.g. convert "jodér" to "joder")
  let normalized = text.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  // 2. Remove common bypass characters (spaces, periods, underscores, asterisks, common symbols)
  // This collapses "f_u_c_k" or "s h i t" into "fuck" and "shit"
  const collapsed = normalized.replace(/[\s\._\*\-\+\=\(\)\[\]\{\}\:\;\?\,\!\#\@\&\^\%\~]/g, "");

  // 3. Check collapsed string against regex patterns
  for (const pattern of BANNED_PATTERNS) {
    if (pattern.test(collapsed)) {
      return true;
    }
  }

  // 4. Also check word-by-word (just in case they type it inside a longer word that doesn't collapse)
  const words = normalized.split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[\._\*\-\+\=\(\)\[\]\{\}\:\;\?\,\!\#\@\&\^\%\~]/g, "");
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(cleanWord)) {
        return true;
      }
    }
  }

  return false;
}
