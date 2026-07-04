/**
 * Score Module
 * 
 * Handles:
 * 1. Calculating scores for pronunciation attempts
 * 2. Managing XP, levels, and progression
 * 3. Tracking statistics (accuracy, combo, etc.)
 */

const Score = {
  /** Current XP */
  xp: 0,
  
  /** Current level */
  level: 1,
  
  /** Current combo count */
  combo: 0,
  
  /** Best combo */
  bestCombo: 0,
  
  /** Total questions answered */
  totalQuestions: 0,
  
  /** Total correct answers */
  totalCorrect: 0,
  
  /** Session hearts (lives) */
  hearts: 0,
  
  /** Maximum hearts */
  maxHearts: 0,
  
  /** XP required for each level */
  XP_PER_LEVEL: 100,
  
  /** XP rewards */
  REWARDS: {
    correct: 10,
    perfect: 15,
    comboBonus: 5,
    levelComplete: 50
  },

  /**
   * Initialize score system
   */
  init() {
    this.loadProgress();
    console.log(`[Score] Initialized - Level: ${this.level}, XP: ${this.xp}`);
  },

  /**
   * Calculate score for a pronunciation attempt
   * @param {Object} result - Speech recognition result
   * @param {Object} question - The question object
   * @returns {Object} Score details
   */
  calculateScore(result, question) {
    const correctWord = question.correct.text;
    const spokenText = result.transcript;
    
    // Calculate similarity
    const similarity = Utils.calculateSimilarity(spokenText, correctWord);
    
    // Calculate pronunciation score
    const phonemes = question.speech?.phonemes || [];
    const pronunciationScore = Utils.calculatePronunciationScore(
      spokenText, 
      correctWord, 
      phonemes
    );
    
    // Calculate fluency (simplified - based on confidence)
    const fluencyScore = Math.round((result.confidence || 0.5) * 100);
    
    // Calculate overall score
    const overallScore = Utils.calculateOverallScore(
      similarity.accuracy,
      pronunciationScore,
      fluencyScore
    );
    
    // Determine if correct (threshold: 70%)
    const isCorrect = similarity.accuracy >= 70;
    
    return {
      isCorrect,
      accuracy: similarity.accuracy,
      pronunciation: pronunciationScore,
      fluency: fluencyScore,
      overall: overallScore,
      spokenText,
      correctText: correctWord,
      correctIPA: question.correct.ipa,
      levenshtein: similarity.levenshtein,
      jaroWinkler: similarity.jaroWinkler,
      rating: Utils.getScoreRating(overallScore)
    };
  },

  /**
   * Process a correct answer
   * @param {Object} scoreResult - Score calculation result
   * @returns {Object} XP earned and level up info
   */
  processCorrectAnswer(scoreResult) {
    this.totalQuestions++;
    this.totalCorrect++;
    
    // Calculate XP
    let xpEarned = this.REWARDS.correct;
    
    // Bonus for perfect score
    if (scoreResult.overall >= 95) {
      xpEarned += this.REWARDS.perfect;
    }
    
    // Add XP
    this.xp += xpEarned;
    
    // Check for level up
    const levelUp = this.checkLevelUp();
    
    this.saveProgress();
    
    return {
      xpEarned,
      combo: this.combo,
      levelUp,
      newLevel: this.level
    };
  },

  /**
   * Process a wrong answer
   */
  processWrongAnswer() {
    this.totalQuestions++;
    
    this.hearts--;
    
    this.saveProgress();
    
    return {
      hearts: this.hearts,
      combo: this.combo,
      gameOver: this.hearts <= 0
    };
  },

  /**
   * Check if player leveled up
   * @returns {boolean} True if leveled up
   */
  checkLevelUp() {
    const xpForCurrentLevel = (this.level - 1) * this.XP_PER_LEVEL;
    const xpForNextLevel = this.level * this.XP_PER_LEVEL;
    
    if (this.xp >= xpForNextLevel) {
      this.level++;
      this.hearts = Math.min(this.hearts + 1, this.maxHearts); // Bonus heart
      console.log(`[Score] Level up! Now level ${this.level}`);
      return true;
    }
    
    return false;
  },

  /**
   * Get accuracy percentage
   * @returns {number} Accuracy percentage
   */
  getAccuracy() {
    if (this.totalQuestions === 0) return 0;
    return Math.round((this.totalCorrect / this.totalQuestions) * 100);
  },

  /**
   * Get XP progress to next level
   * @returns {Object} Progress info
   */
  getLevelProgress() {
    const currentLevelXP = (this.level - 1) * this.XP_PER_LEVEL;
    const nextLevelXP = this.level * this.XP_PER_LEVEL;
    const progress = this.xp - currentLevelXP;
    const required = nextLevelXP - currentLevelXP;
    const percentage = Math.round((progress / required) * 100);
    
    return {
      current: progress,
      required: required,
      percentage: percentage,
      xp: this.xp,
      level: this.level
    };
  },

  /**
   * Reset combo
   */
  resetCombo() {
    this.combo = 0;
  },

  /**
   * Reset game (keep long-term progress)
   */
  resetGame() {
    this.hearts = this.maxHearts;
    this.combo = 0;
    this.saveProgress();
  },

  /**
   * Reset all progress
   */
  resetAllProgress() {
    if (!confirm('Are you sure you want to reset all progress? This cannot be undone.')) {
      return false;
    }
    
    this.xp = 0;
    this.level = 1;
    this.combo = 0;
    this.bestCombo = 0;
    this.totalQuestions = 0;
    this.totalCorrect = 0;
    this.hearts = this.maxHearts;
    
    this.saveProgress();
    console.log('[Score] All progress reset');
    return true;
  },

  /**
   * Save progress to localStorage
   */
  saveProgress() {
    const data = {
      xp: this.xp,
      level: this.level,
      combo: this.bestCombo,
      totalQuestions: this.totalQuestions,
      totalCorrect: this.totalCorrect,
      hearts: this.hearts
    };
    
    localStorage.setItem('pronou_progress', JSON.stringify(data));
  },

  /**
   * Load progress from localStorage
   */
  loadProgress() {
    try {
      const saved = localStorage.getItem('pronou_progress');
      if (saved) {
        const data = JSON.parse(saved);
        this.xp = data.xp || 0;
        this.level = data.level || 1;
        this.bestCombo = data.combo || 0;
        this.totalQuestions = data.totalQuestions || 0;
        this.totalCorrect = data.totalCorrect || 0;
        this.hearts = data.hearts || this.maxHearts;
      }
    } catch (error) {
      console.error('[Score] Failed to load progress:', error);
    }
  },

  /**
   * Get statistics
   * @returns {Object} Statistics object
   */
  getStatistics() {
    return {
      xp: this.xp,
      level: this.level,
      bestCombo: this.bestCombo,
      totalQuestions: this.totalQuestions,
      totalCorrect: this.totalCorrect,
      accuracy: this.getAccuracy(),
      hearts: this.hearts,
      levelProgress: this.getLevelProgress()
    };
  },

  /**
   * Get session summary
   * @param {number} sessionCorrect - Questions correct in session
   * @param {number} sessionTotal - Total questions in session
   * @returns {Object} Session summary
   */
  getSessionSummary(sessionCorrect, sessionTotal) {
    const sessionAccuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0;
    
    return {
      sessionCorrect,
      sessionTotal,
      sessionAccuracy,
      xpEarned: sessionCorrect * this.REWARDS.correct,
      bestCombo: this.bestCombo,
      overallAccuracy: this.getAccuracy()
    };
  }
};

// Export for use in other modules
window.Score = Score;