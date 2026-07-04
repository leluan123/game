/**
 * Data Module
 * 
 * Handles:
 * 1. Loading pronunciation questions from embedded data
 * 2. Filtering and selecting questions by grade/unit/difficulty
 * 3. Managing question state
 */

const Data = {
  /** All pronunciation questions (embedded from Data.txt) */
  questions: [],
  
  /** Current question index */
  currentIndex: 0,
  answeredIds: [],
  
  /** Current question */
  currentQuestion: null,
  
  /** Questions for current session */
  sessionQuestions: [],
  
  /** Total questions per session */
  QUESTIONS_PER_SESSION: 50,

  /**
   * Initialize data - load questions from embedded JSON
   */
  init() {
    try {
      // Load the embedded data
      this.questions = PRONUNCIATION_DATA;
      console.log(`[Data] Loaded ${this.questions.length} questions`);
    } catch (error) {
      console.error('[Data] Failed to load questions:', error);
      this.questions = [];
    }
  },

  /**
   * Get all available grades
   * @returns {Array} Array of grade numbers
   */
  getAvailableGrades() {
    const grades = new Set(this.questions.map(q => q.grade));
    return Array.from(grades).sort((a, b) => a - b);
  },

  /**
   * Get units for a specific grade
   * @param {number} grade - Grade number
   * @returns {Array} Array of {unit, topic, count}
   */
  getUnitsForGrade(grade) {
    const gradeQuestions = this.questions.filter(q => q.grade === grade);
    const unitMap = new Map();
    
    gradeQuestions.forEach(q => {
      const key = `${q.unit}-${q.topic}`;
      if (!unitMap.has(key)) {
        unitMap.set(key, {
          unit: q.unit,
          topic: q.topic,
          count: 0
        });
      }
      unitMap.get(key).count++;
    });
    
    return Array.from(unitMap.values()).sort((a, b) => a.unit - b.unit);
  },

  /**
   * Get difficulty levels
   * @returns {Array} Array of difficulty objects
   */
  getDifficulties() {
    return [
      { id: 1, name: 'Easy', color: '#4caf50' },
      { id: 2, name: 'Medium', color: '#ff9800' },
      { id: 3, name: 'Hard', color: '#f44336' }
    ];
  },

  /**
   * Filter questions by criteria
   * @param {Object} criteria - Filter criteria
   * @returns {Array} Filtered questions
   */
  filterQuestions(criteria = {}) {
    let filtered = [...this.questions];
    
    if (criteria.grade) {
      filtered = filtered.filter(q => q.grade === criteria.grade);
    }
    
    if (criteria.unit) {
      filtered = filtered.filter(q => q.unit === criteria.unit);
    }
    
    if (criteria.difficulty) {
      filtered = filtered.filter(q => q.difficulty === criteria.difficulty);
    }
    
    if (criteria.topic) {
      filtered = filtered.filter(q => q.topic === criteria.topic);
    }
    
    return filtered;
  },

  /**
   * Start a new game session
   * @param {Object} options - Game options
   */
  startSession(options = {}) {
    const {
      grade = null,
      unit = null,
      difficulty = null,
      count = this.QUESTIONS_PER_SESSION
    } = options;
    
    // Filter questions
    let available = this.filterQuestions({ grade, unit, difficulty }).filter(q => !this.answeredIds.includes(q.id));
    
    if (available.length === 0) {
      console.warn('[Data] No questions available for criteria:', options);
      available = [...this.questions];
    }
    
    // Shuffle and select
    const shuffled = Utils.shuffleArray(available);
    this.sessionQuestions = shuffled.slice(0, Math.min(count, shuffled.length));
    this.currentIndex = 0;
    
    console.log(`[Data] Started session with ${this.sessionQuestions.length} questions`);
  },

  /**
   * Get current question
   * @returns {Object|null} Current question
   */
  markAnswered(id) { if (!this.answeredIds.includes(id)) this.answeredIds.push(id); },
  isAnswered(id) { return this.answeredIds.includes(id); },
  getCurrentQuestion() {
    if (this.currentIndex < this.sessionQuestions.length) {
      return this.sessionQuestions[this.currentIndex];
    }
    return null;
  },

  /**
   * Move to next question
   * @returns {Object|null} Next question
   */
  nextQuestion() {
    this.currentIndex++;
    return this.getCurrentQuestion();
  },

  /**
   * Get question by index
   * @param {number} index - Question index
   * @returns {Object|null} Question
   */
  getQuestionByIndex(index) {
    if (index >= 0 && index < this.sessionQuestions.length) {
      return this.sessionQuestions[index];
    }
    return null;
  },

  /**
   * Get total questions in current session
   * @returns {number} Total questions
   */
  getTotalQuestions() {
    return this.sessionQuestions.length;
  },

  /**
   * Get current question number (1-based)
   * @returns {number} Current question number
   */
  getCurrentQuestionNumber() {
    return this.currentIndex + 1;
  },

  /**
   * Check if session is complete
   * @returns {boolean} True if session complete
   */
  isSessionComplete() {
    return this.currentIndex >= this.sessionQuestions.length;
  },

  /**
   * Get session statistics
   * @returns {Object} Session stats
   */
  getSessionStats() {
    return {
      total: this.sessionQuestions.length,
      current: this.currentIndex,
      remaining: this.sessionQuestions.length - this.currentIndex
    };
  },

  /**
   * Get question statistics
   * @returns {Object} Question stats
   */
  getQuestionStats() {
    const stats = {
      total: this.questions.length,
      byGrade: {},
      byDifficulty: {},
      byRule: {}
    };
    
    this.questions.forEach(q => {
      // By grade
      stats.byGrade[q.grade] = (stats.byGrade[q.grade] || 0) + 1;
      
      // By difficulty
      const diffName = q.difficulty === 1 ? 'Easy' : q.difficulty === 2 ? 'Medium' : 'Hard';
      stats.byDifficulty[diffName] = (stats.byDifficulty[diffName] || 0) + 1;
      
      // By rule
      stats.byRule[q.rule] = (stats.byRule[q.rule] || 0) + 1;
    });
    
    return stats;
  },

  /**
   * Get random question
   * @param {Object} criteria - Filter criteria
   * @returns {Object|null} Random question
   */
  getRandomQuestion(criteria = {}) {
    const filtered = this.filterQuestions(criteria);
    if (filtered.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * filtered.length);
    return filtered[randomIndex];
  }
};

// Export for use in other modules
window.Data = Data;