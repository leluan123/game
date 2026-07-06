/**
 * Utils Module
 * 
 * Handles:
 * 1. String similarity algorithms (Levenshtein Distance, Jaro-Winkler)
 * 2. Text normalization
 * 3. General utility functions
 */

const Utils = {
  /**
   * Calculate Levenshtein Distance between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} The edit distance
   */
  levenshteinDistance(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    
    // Create a matrix of size (m+1) x (n+1)
    const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
    
    // Initialize base cases
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    
    // Fill the matrix
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (str1[i - 1] === str2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = 1 + Math.min(
            dp[i - 1][j],      // deletion
            dp[i][j - 1],      // insertion
            dp[i - 1][j - 1]   // substitution
          );
        }
      }
    }
    
    return dp[m][n];
  },

  /**
   * Calculate Jaro-Winkler similarity between two strings
   * @param {string} str1 - First string
   * @param {string} str2 - Second string
   * @returns {number} Similarity score between 0 and 1
   */
  jaroWinklerSimilarity(str1, str2) {
    if (str1 === str2) return 1.0;
    
    const m = str1.length;
    const n = str2.length;
    
    if (m === 0 || n === 0) return 0.0;
    
    const matchDistance = Math.floor(Math.max(m, n) / 2) - 1;
    
    const str1Matches = Array(m).fill(false);
    const str2Matches = Array(n).fill(false);
    
    let matches = 0;
    let transpositions = 0;
    
    // Find matches
    for (let i = 0; i < m; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, n);
      
      for (let j = start; j < end; j++) {
        if (str2Matches[j] || str1[i] !== str2[j]) continue;
        str1Matches[i] = true;
        str2Matches[j] = true;
        matches++;
        break;
      }
    }
    
    if (matches === 0) return 0.0;
    
    // Find transpositions
    let k = 0;
    for (let i = 0; i < m; i++) {
      if (!str1Matches[i]) continue;
      while (!str2Matches[k]) k++;
      if (str1[i] !== str2[k]) transpositions++;
      k++;
    }
    
    const jaro = (matches / m + matches / n + (matches - transpositions / 2) / matches) / 3;
    
    // Calculate common prefix (up to 4 characters)
    let prefix = 0;
    for (let i = 0; i < Math.min(4, m, n); i++) {
      if (str1[i] === str2[i]) prefix++;
      else break;
    }
    
    // Jaro-Winkler formula
    const winkler = jaro + prefix * 0.1 * (1 - jaro);
    
    return winkler;
  },

  /**
   * Calculate similarity score using multiple algorithms
   * @param {string} spoken - The spoken text
   * @param {string} correct - The correct text
   * @returns {Object} { levenshtein, jaroWinkler, combined, accuracy }
   */
  calculateSimilarity(spoken, correct) {
    const normalizedSpoken = this.normalizeText(spoken);
    const normalizedCorrect = this.normalizeText(correct);
    
    const levenshtein = this.levenshteinDistance(normalizedSpoken, normalizedCorrect);
    const maxLength = Math.max(normalizedSpoken.length, normalizedCorrect.length);
    const levenshteinScore = maxLength === 0 ? 1 : 1 - (levenshtein / maxLength);
    
    const jaroWinkler = this.jaroWinklerSimilarity(normalizedSpoken, normalizedCorrect);
    
    // Combined score (weighted average)
    const combined = (levenshteinScore * 0.4 + jaroWinkler * 0.6);
    
    // Convert to percentage
    const accuracy = Math.round(combined * 100);
    
    return {
      levenshtein: Math.round(levenshteinScore * 100),
      jaroWinkler: Math.round(jaroWinkler * 100),
      combined: accuracy,
      accuracy: accuracy
    };
  },

  /**
   * Normalize text for comparison
   * @param {string} text - Text to normalize
   * @returns {string} Normalized text
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s]/g, '')  // Remove punctuation
      .replace(/\s+/g, ' ');     // Normalize whitespace
  },

  /**
   * Check if spoken text matches the correct answer
   * @param {string} spoken - The spoken text
   * @param {string} correct - The correct answer
   * @param {number} threshold - Minimum similarity threshold (0-100)
   * @returns {boolean} True if match
   */
  isMatch(spoken, correct, threshold = 70) {
    const similarity = this.calculateSimilarity(spoken, correct);
    return similarity.accuracy >= threshold;
  },

  /**
   * Calculate pronunciation score based on phoneme matching
   * @param {string} spoken - The spoken text
   * @param {string} correct - The correct text
   * @param {Array} phonemes - Expected phonemes
   * @returns {number} Score 0-100
   */
  calculatePronunciationScore(spoken, correct, phonemes) {
    // Base score from text similarity
    const similarity = this.calculateSimilarity(spoken, correct);
    const baseScore = similarity.accuracy;
    
    // If perfect match, give high score
    if (baseScore >= 95) return 100;
    
    // If good match, calculate phoneme-based score
    if (baseScore >= 70) {
      // Simplified phoneme matching (in real implementation, would use phoneme recognition)
      const phonemeMatchRate = this.estimatePhonemeMatch(spoken, correct);
      return Math.round((baseScore * 0.6 + phonemeMatchRate * 0.4));
    }
    
    return baseScore;
  },

  /**
   * Estimate phoneme match rate (simplified version)
   * @param {string} spoken - Spoken text
   * @param {string} correct - Correct text
   * @returns {number} Score 0-100
   */
  estimatePhonemeMatch(spoken, correct) {
    const normalizedSpoken = this.normalizeText(spoken);
    const normalizedCorrect = this.normalizeText(correct);
    
    // Character-level comparison as proxy for phoneme matching
    let matches = 0;
    const minLength = Math.min(normalizedSpoken.length, normalizedCorrect.length);
    
    for (let i = 0; i < minLength; i++) {
      if (normalizedSpoken[i] === normalizedCorrect[i]) {
        matches++;
      }
    }
    
    return minLength === 0 ? 0 : Math.round((matches / normalizedCorrect.length) * 100);
  },

  /**
   * Calculate fluency score based on speech timing
   * @param {number} duration - Speech duration in seconds
   * @param {number} expectedDuration - Expected duration in seconds
   * @returns {number} Score 0-100
   */
  calculateFluencyScore(duration, expectedDuration) {
    if (duration === 0) return 0;
    
    // Ideal speaking rate: ~1.5x expected duration (allows for natural pauses)
    const idealDuration = expectedDuration * 1.5;
    const ratio = duration / idealDuration;
    
    // Score based on how close to ideal duration
    if (ratio >= 0.5 && ratio <= 2.0) {
      // Within acceptable range
      const optimalRatio = 1.0;
      const deviation = Math.abs(ratio - optimalRatio);
      return Math.round((1 - deviation) * 100);
    }
    
    // Too fast or too slow
    return Math.max(0, 50 - Math.abs(ratio - 1) * 50);
  },

  /**
   * Calculate overall score
   * @param {number} accuracy - Accuracy score (0-100)
   * @param {number} pronunciation - Pronunciation score (0-100)
   * @param {number} fluency - Fluency score (0-100)
   * @returns {number} Overall score (0-100)
   */
  calculateOverallScore(accuracy, pronunciation, fluency) {
    // Weighted average: accuracy most important, then pronunciation, then fluency
    return Math.round(accuracy * 0.5 + pronunciation * 0.3 + fluency * 0.2);
  },

  /**
   * Get score rating text
   * @param {number} score - Score (0-100)
   * @returns {string} Rating text
   */
  getScoreRating(score) {
    if (score >= 95) return 'Perfect! 🌟';
    if (score >= 85) return 'Excellent! 🎉';
    if (score >= 75) return 'Great! 👏';
    if (score >= 65) return 'Good! 👍';
    if (score >= 55) return 'Not bad! 😊';
    if (score >= 45) return 'Keep trying! 💪';
    return 'Try again! 📚';
  },

  /**
   * Shuffle array (Fisher-Yates algorithm)
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /**
   * Format time in seconds to MM:SS
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time
   */
  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * Debounce function
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in ms
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Clamp a number between min and max
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum value
   * @param {number} max - Maximum value
   * @returns {number} Clamped value
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }
};

// Export for use in other modules
window.Utils = Utils;