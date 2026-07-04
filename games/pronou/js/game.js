/**
 * Game Module
 * 
 * Main game controller that initializes all modules and manages game flow
 */

const Game = {
  /**
   * Initialize the game
   */
  init() {
    console.log('[Game] Initializing Pronunciation Test...');
    
    // Initialize all modules
    Audio.init();
    Data.init();
    Speech.init();
    Score.init();
    UI.init();
    
    // Setup UI callbacks
    UI.onMicrophoneClick = () => this.handleMicrophoneClick();
    UI.onNextQuestion = () => this.nextQuestion();
    
    // Render grade selection
    UI.renderGradeSelection();
    
    // Update menu stats
    UI.updateMenuStats();
    
    // Track page view
    Analytics.trackEvent('pronou_page_view');
    
    console.log('[Game] Pronunciation Test initialized successfully');
  },

  /**
   * Handle microphone button click
   */
  async handleMicrophoneClick() {
    await UI.handleMicrophoneClick();
  },

  /**
   * Move to next question
   */
  nextQuestion() {
    // This is handled by UI._hideFeedback()
    console.log('[Game] Moving to next question');
  },

  /**
   * Start a new game with specific options
   * @param {Object} options - Game options
   */
  startNewGame(options = {}) {
    console.log('[Game] Starting new game with options:', options);
    
    // Reset score for new game
    Score.resetGame();
    
    // Start data session
    Data.startSession(options);
    
    // Show game screen
    UI.showScreen('game');
    
    // Load first question
    UI._loadQuestion();
    
    // Track event
    Analytics.trackEvent('pronou_new_game', options);
  },

  /**
   * Resume previous game
   */
  resumeGame() {
    console.log('[Game] Resuming game...');
    
    // Check if there's an active session
    if (Data.sessionQuestions.length > 0 && !Data.isSessionComplete()) {
      UI.showScreen('game');
      UI._loadQuestion();
    } else {
      // No active session, start new game
      this.startNewGame();
    }
  },

  /**
   * End current game session
   */
  endGame() {
    console.log('[Game] Ending game session');
    
    // Log final stats
    const stats = Score.getStatistics();
    Analytics.trackEvent('pronou_game_end', {
      level: stats.level,
      xp: stats.xp,
      accuracy: stats.accuracy
    });
    
    // Show menu
    UI.showScreen('menu');
    UI.updateMenuStats();
  },

  /**
   * Get game status
   * @returns {Object} Game status
   */
  getStatus() {
    return {
      hasActiveSession: Data.sessionQuestions.length > 0 && !Data.isSessionComplete(),
      currentQuestion: Data.getCurrentQuestionNumber(),
      totalQuestions: Data.getTotalQuestions(),
      score: Score.getStatistics()
    };
  }
};

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Game.init());
} else {
  Game.init();
}

// Export for use in other modules
window.Game = Game;