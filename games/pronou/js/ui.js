/**
 * UI Module
 * 
 * Handles:
 * 1. Screen navigation and transitions
 * 2. Rendering game elements (questions, options, scores)
 * 3. Updating UI based on game state
 * 4. User interactions
 */

const UI = {
  /** Current active screen */
  currentScreen: 'menu',
  
  /** Callbacks */
  onAnswerSelected: null,
  onMicrophoneClick: null,
  onNextQuestion: null,
  onMenuClick: null,

  /**
   * Initialize UI
   */
  init() {
    this._setupEventListeners();
    this._updateUserInfo();
    console.log('[UI] Initialized');
  },

  /**
   * Setup event listeners
   */
  _setupEventListeners() {
    // Menu buttons
    document.getElementById('btn-play')?.addEventListener('click', () => {
      Analytics.trackEvent('pronou_play_click');
      this.startGame();
    });
    
    document.getElementById('btn-grade-select')?.addEventListener('click', () => {
      this.showScreen('grade');
    });
    
    document.getElementById('btn-stats')?.addEventListener('click', () => {
      this.showScreen('stats');
      this.renderStatistics();
    });
    
    document.getElementById('btn-users')?.addEventListener('click', () => {
      this.showScreen('users');
      this.renderUserList();
    });
    
    document.getElementById('btn-back-to-hub')?.addEventListener('click', () => {
      Analytics.logCurrentProgress('pronou');
      window.location.href = '../../index.html';
    });
    
    document.getElementById('btn-user-menu')?.addEventListener('click', () => {
      this.showScreen('users');
      this.renderUserList();
    });
    
    // Grade selection
    document.getElementById('btn-grade-back')?.addEventListener('click', () => {
      this.showScreen('menu');
    });
    
    // Statistics
    document.getElementById('btn-stats-back')?.addEventListener('click', () => {
      this.showScreen('menu');
    });
    
    document.getElementById('btn-reset-stats')?.addEventListener('click', () => {
      if (Score.resetAllProgress()) {
        this.renderStatistics();
        this.updateMenuStats();
      }
    });
    
    // Users
    document.getElementById('btn-users-back')?.addEventListener('click', () => {
      this.showScreen('menu');
    });
    
    document.getElementById('btn-create-user')?.addEventListener('click', () => {
      this._createUser();
    });
    
    // Game screen
    document.getElementById('btn-microphone')?.addEventListener('click', () => {
      if (this.onMicrophoneClick) {
        this.onMicrophoneClick();
      }
    });
    
    document.getElementById('btn-feedback-ok')?.addEventListener('click', () => {
      this._hideFeedback();
      if (this.onNextQuestion) {
        this.onNextQuestion();
      }
    });
    
    // Level complete
    document.getElementById('btn-next-level')?.addEventListener('click', () => {
      this.startGame();
    });
    
    document.getElementById('btn-continue-same-level')?.addEventListener('click', () => {
      this.startGame();
    });
    
    document.getElementById('btn-back-to-menu')?.addEventListener('click', () => {
      this.showScreen('menu');
      this.updateMenuStats();
    });
    
    // Game over
    document.getElementById('btn-retry')?.addEventListener('click', () => {
      Score.resetGame();
      this.startGame();
    });
    
    document.getElementById('btn-gameover-menu')?.addEventListener('click', () => {
      this.showScreen('menu');
      this.updateMenuStats();
    });
  },

  /**
   * Show a specific screen
   * @param {string} screenName - Screen name
   */
  showScreen(screenName) {
    document.querySelectorAll('.screen').forEach(screen => {
      screen.classList.remove('active');
    });
    
    const screenId = `screen-${screenName}`;
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add('active');
      this.currentScreen = screenName;
    }
  },

  /**
   * Start game
   */
  startGame() {
    Analytics.trackEvent('pronou_game_start');
    this.showScreen('game');
    this._startNewSession();
  },

  /**
   * Start new game session
   */
  _startNewSession() {
    Score.resetGame();
    Data.startSession();
    this._loadQuestion();
  },

  /**
   * Load and display current question
   */
  _loadQuestion() {
    const question = Data.getCurrentQuestion();
    if (!question) {
      this._showLevelComplete();
      return;
    }
    
    // Update question display
    document.getElementById('question-grade').textContent = `Grade ${question.grade}`;
    document.getElementById('question-topic').textContent = question.topic;
    document.getElementById('question-text').textContent = question.question;
    document.getElementById('rule-text').textContent = question.rule;
    
    // Update question counter
    document.getElementById('question-num').textContent = Data.getCurrentQuestionNumber();
    document.getElementById('question-total').textContent = Data.getTotalQuestions();
    
    // Render word options
    this._renderWordOptions(question);
    
    
    // Update top bar
    this._updateTopBar();
    
    // Reset microphone button
    this._resetMicrophoneButton();
  },

  /**
   * Render word options
   * @param {Object} question - Question object
   */
  _renderWordOptions(question) {
    const container = document.getElementById('word-options');
    container.innerHTML = '';
    
    question.answers.forEach((answer, index) => {
      const button = document.createElement('button');
      button.className = 'word-option-btn';
      button.dataset.word = answer.text;
      button.dataset.index = index;
      
      button.innerHTML = `
        <div class="word-option-text">${answer.text}</div>
        <div class="word-option-ipa">${answer.ipa}</div>
      `;
      
      button.addEventListener('click', () => {
        this._selectWord(answer.text);
      });
      
      container.appendChild(button);
    });
  },

  /**
   * Select a word
   * @param {string} word - Selected word
   */
  _selectWord(word) {
    // Visual feedback
    document.querySelectorAll('.word-option-btn').forEach(btn => {
      btn.classList.remove('selected');
      if (btn.dataset.word === word) {
        btn.classList.add('selected');
      }
    });
    
    // Speak the word
    Speech.speak(word, { rate: 0.8 });
    
    // Track selection
    Analytics.trackEvent('pronou_word_select', { word });
  },

  /** Flag to track mic permission granted once */
  _micPermissionGranted: false,

  /**
   * Handle microphone button click - toggle record/stop
   */
  
  _highlightWord(spoken,correct){const s=spoken.toLowerCase().trim();const c=correct.toLowerCase().trim();let h="";for(let i=0;i<Math.max(s.length,c.length);i++){h+=s[i]===c[i]?"<span class=\"char-correct\">"+s[i]+"</span>":"<span class=\"char-wrong\">"+s[i]+"</span>";}return h;},async handleMicrophoneClick() {
    // If feedback overlay is visible, block mic click - wait for OK
    const overlay = document.getElementById('feedback-overlay');
    if (overlay.style.display !== 'none' && overlay.style.display !== '') {
      return;
    }
    
    if (!Speech.isAvailable()) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    
    // If already listening, stop and process immediately
    if (Speech.isListening) {
      Audio.playMicStop();
      Speech.stopListening();
      return;
    }
    
    // Request permission once per session
    if (!this._micPermissionGranted) {
      const hasPermission = await Speech.requestMicrophonePermission();
      if (!hasPermission) {
        alert('Microphone permission is required for pronunciation practice.');
        return;
      }
      this._micPermissionGranted = true;
    }
    
    // Update UI to listening state
    Audio.playMicStart();
    this._setMicrophoneListening();
    
    try {
      const result = await Speech.startListening();
      this._handleSpeechResult(result);
    } catch (error) {
      console.error('[UI] Speech recognition error:', error);
      if (error.message !== 'No speech detected') {
        this._setMicrophoneError(error.message);
        setTimeout(() => {
          this._resetMicrophoneButton();
        }, 2000);
      } else {
        this._resetMicrophoneButton();
      }
    }
  },

  /**
   * Handle speech recognition result
   * @param {Object} result - Speech result
   */
  _handleSpeechResult(result) {
    const question = Data.getCurrentQuestion();
    if (!question) return;
    
    // Calculate score
    const scoreResult = Score.calculateScore(result, question);
    
    // Store result data for the popup (will be shown inside _showFeedback)
    this._lastSpeechResult = result;
    this._lastScoreResult = scoreResult;
    
    // Update microphone button to processing
    this._setMicrophoneProcessing();
    
    // Show feedback after a short delay
    setTimeout(() => {
      this._showFeedback(scoreResult, question);
    }, 1000);
  },

  /**
   * Show feedback overlay
   * @param {Object} scoreResult - Score result
   * @param {Object} question - Question
   */
  _showFeedback(scoreResult, question) {
    const overlay = document.getElementById('feedback-overlay');
    const icon = document.getElementById('feedback-icon');
    const text = document.getElementById('feedback-text');
    const detail = document.getElementById('feedback-detail');
    
    // Update speech info in popup
    document.getElementById('result-text').innerHTML = this._highlightWord(scoreResult.spokenText, scoreResult.correctText);
    document.getElementById('correct-word').textContent = scoreResult.correctText || '-';
    document.getElementById('correct-ipa').textContent = scoreResult.correctIPA || '-';
    
    // Update scores
    document.getElementById('score-accuracy').textContent = `${scoreResult.accuracy}%`;
    document.getElementById('score-pronunciation').textContent = `${scoreResult.pronunciation}%`;
    document.getElementById('score-fluency').textContent = `${scoreResult.fluency}%`;
    document.getElementById('score-overall').textContent = `${scoreResult.overall}%`;
    
    // Update explanation
    document.getElementById('explanation-text').textContent = question.explain?.vi || 'Keep practicing!';
    
    this._lastWasWrong = scoreResult.overall < 75;
    document.getElementById('btn-feedback-ok').textContent = scoreResult.isCorrect ? 'Next →' : '🔄 Retry';
    if (scoreResult.isCorrect) {
      // Correct answer
      icon.textContent = '✔';
      text.textContent = 'Correct!';
      text.style.color = 'var(--color-success)';
      
      Audio.playCorrect();
      const result = Score.processCorrectAnswer(scoreResult);
      Data.markAnswered(question.id);
      detail.textContent = `+${result.xpEarned} XP`;
      
      // Show combo if applicable
      if (result.combo >= 3) {
        this._showComboPopup(result.combo);
      }
      
      // Highlight correct word
      this._highlightCorrectWord(question.correct.text);
      
      Analytics.trackEvent('pronou_correct', {
        score: scoreResult.overall,
        combo: result.combo
      });
    } else {
      Audio.playWrong();
      // Wrong answer
      icon.textContent = '✖';
      text.textContent = 'Try Again!';
      text.style.color = 'var(--color-danger)';
      detail.textContent = 'Keep practicing!';
      
      Score.processWrongAnswer();
      
      Analytics.trackEvent('pronou_wrong', {
        spoken: scoreResult.spokenText,
        correct: scoreResult.correctText
      });
    }
    
    // Show overlay
    overlay.style.display = 'flex';
    
    // Update top bar
    this._updateTopBar();
  },

  /**
   * Hide feedback overlay
   */
  _hideFeedback() {
    if (this._lastWasWrong) {
      this._lastWasWrong = false;
      document.getElementById('feedback-overlay').style.display = 'none';
      this._loadQuestion();
      return;
    }
    document.getElementById('feedback-overlay').style.display = 'none';
    
    // Move to next question
    Data.nextQuestion();
    
    // Check if game is over
    if (Data.isSessionComplete()) {
      this._showLevelComplete();
    } else {
      this._loadQuestion();
    }
  },

  /**
   * Show level complete screen
   */
  _showLevelComplete() {
    const sessionCorrect = Score.totalCorrect;
    const sessionTotal = Data.getTotalQuestions();
    const summary = Score.getSessionSummary(sessionCorrect, sessionTotal);
    
    // Update UI
    document.getElementById('level-complete-title').textContent = 
      summary.sessionAccuracy >= 70 ? 'Level Complete!' : 'Session Complete';
    document.getElementById('level-complete-subtitle').textContent = 
      `You got ${summary.sessionCorrect}/${summary.sessionTotal} correct!`;
    
    // Render stats
    const statsContainer = document.getElementById('level-complete-stats');
    statsContainer.innerHTML = `
      <div class="stat-row">
        <span class="stat-label">Accuracy:</span>
        <span class="stat-value">${summary.sessionAccuracy}%</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">XP Earned:</span>
        <span class="stat-value">+${summary.xpEarned} XP</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Best Combo:</span>
        <span class="stat-value">${summary.bestCombo}x</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Overall Accuracy:</span>
        <span class="stat-value">${summary.overallAccuracy}%</span>
      </div>
    `;
    
    // Show level up notification if applicable
    if (Score.level > 1 && Score.getLevelProgress().percentage < 100) {
      document.getElementById('level-complete-next').style.display = 'block';
    } else {
      document.getElementById('level-complete-next').style.display = 'none';
    }
    
    this.showScreen('level-complete');
    
    // Log to analytics
    Analytics.trackEvent('pronou_level_complete', {
      accuracy: summary.sessionAccuracy,
      xpEarned: summary.xpEarned
    });
    
    Analytics.logToSheet({
      gameId: 'pronou',
      xp: summary.xpEarned,
      playTime: 0,
      level: Score.level,
      accuracy: summary.sessionAccuracy,
      bossDefeated: false,
      totalQuestions: sessionTotal,
      totalCorrect: sessionCorrect
    });
  },

  /**
   * Show game over screen
   */
  _showGameOver() {
    const stats = Score.getStatistics();
    
    document.getElementById('gameover-stats').innerHTML = `
      <div class="stat-row">
        <span class="stat-label">Questions Correct:</span>
        <span class="stat-value">${stats.totalCorrect}/${stats.totalQuestions}</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Accuracy:</span>
        <span class="stat-value">${stats.accuracy}%</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Best Combo:</span>
        <span class="stat-value">${stats.bestCombo}x</span>
      </div>
      <div class="stat-row">
        <span class="stat-label">Level:</span>
        <span class="stat-value">${stats.level}</span>
      </div>
    `;
    
    this.showScreen('gameover');
    
    Analytics.trackEvent('pronou_game_over', {
      accuracy: stats.accuracy,
      level: stats.level
    });
  },

  /**
   * Update top bar
   */
  _updateTopBar() {
    // Hearts
    const heartsContainer = document.getElementById('hearts-display');
    heartsContainer.innerHTML = '';
    for (let i = 0; i < Score.maxHearts; i++) {
      const heart = document.createElement('span');
      heart.className = 'heart';
      heart.textContent = i < Score.hearts ? '❤️' : '🖤';
      heartsContainer.appendChild(heart);
    }
    
    // XP
    const levelProgress = Score.getLevelProgress();
    document.getElementById('xp-bar-fill').style.width = `${levelProgress.percentage}%`;
    document.getElementById('xp-text').textContent = `${Score.xp} XP`;
    
    // Level badge
    document.getElementById('game-level-badge').textContent = `Level ${Score.level}`;
    
    // Combo
    const comboDisplay = document.getElementById('combo-display');
    if (Score.combo >= 2) {
      comboDisplay.style.display = 'block';
      document.getElementById('combo-count').textContent = Score.combo;
    } else {
      comboDisplay.style.display = 'none';
    }
  },

  /**
   * Update menu stats
   */
  updateMenuStats() {
    const stats = Score.getStatistics();
    
    document.getElementById('menu-xp').textContent = stats.xp;
    document.getElementById('menu-level').textContent = stats.level;
    document.getElementById('menu-combo').textContent = stats.bestCombo;
    document.getElementById('menu-accuracy').textContent = `${stats.accuracy}%`;
    
    // Render level progress
    this._renderLevelProgress();
  },

  /**
   * Render level progress indicator
   */
  _renderLevelProgress() {
    const container = document.getElementById('level-progress');
    const currentLevel = Score.level;
    
    let html = '';
    for (let i = 1; i <= 5; i++) {
      const isActive = i === currentLevel;
      const isLocked = i > currentLevel;
      html += `<div class="level-dot ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''}">${i}</div>`;
    }
    
    container.innerHTML = html;
  },

  /**
   * Render grade selection
   */
  renderGradeSelection() {
    const container = document.getElementById('grade-container');
    const grades = Data.getAvailableGrades();
    
    const gradeIcons = {
      6: '📚',
      7: '📖',
      8: '📝',
      9: '🎓'
    };
    
    container.innerHTML = grades.map(grade => {
      const units = Data.getUnitsForGrade(grade);
      const questionCount = Data.filterQuestions({ grade }).length;
      
      return `
        <div class="grade-card" data-grade="${grade}">
          <div class="grade-card-icon">${gradeIcons[grade] || '📚'}</div>
          <div class="grade-card-title">Grade ${grade}</div>
          <div class="grade-card-info">${questionCount} questions</div>
        </div>
      `;
    }).join('');
    
    // Add click handlers
    container.querySelectorAll('.grade-card').forEach(card => {
      card.addEventListener('click', () => {
        const grade = parseInt(card.dataset.grade);
        Analytics.trackEvent('pronou_grade_select', { grade });
        Data.startSession({ grade });
        this.startGame();
      });
    });
  },

  /**
   * Render statistics
   */
  renderStatistics() {
    const stats = Score.getStatistics();
    const questionStats = Data.getQuestionStats();
    
    const container = document.getElementById('stats-content');
    
    container.innerHTML = `
      <div class="stat-card">
        <div class="stat-card-title">📊 Overall Statistics</div>
        <div class="stat-row">
          <span class="stat-label">Level:</span>
          <span class="stat-value">${stats.level}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Total XP:</span>
          <span class="stat-value">${stats.xp}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Questions Answered:</span>
          <span class="stat-value">${stats.totalQuestions}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Correct Answers:</span>
          <span class="stat-value">${stats.totalCorrect}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Accuracy:</span>
          <span class="stat-value">${stats.accuracy}%</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">Best Combo:</span>
          <span class="stat-value">${stats.bestCombo}x</span>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-card-title">📚 Question Database</div>
        <div class="stat-row">
          <span class="stat-label">Total Questions:</span>
          <span class="stat-value">${questionStats.total}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">By Difficulty:</span>
          <span class="stat-value">${Object.entries(questionStats.byDifficulty).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>
        </div>
        <div class="stat-row">
          <span class="stat-label">By Rule:</span>
          <span class="stat-value">${Object.entries(questionStats.byRule).map(([k, v]) => `${k}: ${v}`).join(', ')}</span>
        </div>
      </div>
    `;
  },

  /**
   * Render user list
   */
  renderUserList() {
    const users = UserManager.getUsers();
    const currentUser = UserManager.getCurrentUser();
    const list = document.getElementById('users-list');
    
    list.innerHTML = users.map(user => {
      const isActive = user.username === currentUser;
      return `
        <div class="user-card ${isActive ? 'active-user' : ''}" data-username="${user.username}">
          <div class="user-card-avatar">👤</div>
          <div class="user-card-info">
            <div class="user-card-name">${user.displayName}</div>
            <div class="user-card-username">@${user.username}</div>
          </div>
          ${!isActive ? `<button class="btn-delete-user" data-username="${user.username}">🗑️</button>` : ''}
        </div>
      `;
    }).join('');
    
    // Add click handlers
    list.querySelectorAll('.user-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.btn-delete-user')) return;
        const username = card.dataset.username;
        if (username !== currentUser) {
          UserManager.setCurrentUser(username);
          Analytics.trackEvent('pronou_switch_user', { username });
          this._updateUserInfo();
          this.renderUserList();
        }
      });
    });
    
    list.querySelectorAll('.btn-delete-user').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const username = btn.dataset.username;
        if (confirm(`Delete user "${username}"?`)) {
          UserManager.deleteUser(username);
          this.renderUserList();
        }
      });
    });
  },

  /**
   * Update user info display
   */
  _updateUserInfo() {
    const currentUser = UserManager.getCurrentUser();
    const displayName = UserManager.getDisplayName(currentUser);
    document.getElementById('user-name').textContent = displayName;
  },

  /**
   * Create new user
   */
  _createUser() {
    const usernameInput = document.getElementById('input-username');
    const displayNameInput = document.getElementById('input-displayname');
    const username = usernameInput.value.trim().toLowerCase();
    const displayName = displayNameInput.value.trim() || username;
    
    if (!username) {
      alert('Please enter a username');
      return;
    }
    
    if (!UserManager.isValidUsername(username)) {
      alert('Username must be 2-20 characters, letters and numbers only');
      return;
    }
    
    if (!UserManager.createUser(username, displayName)) {
      alert(`User "${username}" already exists`);
      return;
    }
    
    usernameInput.value = '';
    displayNameInput.value = '';
    
    UserManager.setCurrentUser(username);
    Analytics.trackEvent('pronou_create_user', { username });
    this._updateUserInfo();
    this.renderUserList();
  },

  /**
   * Set microphone to listening state
   */
  _setMicrophoneListening() {
    const btn = document.getElementById('btn-microphone');
    btn.classList.add('listening');
    btn.querySelector('.mic-icon').textContent = '⏹️';
    btn.querySelector('.mic-text').textContent = 'Tap to Stop';
    document.getElementById('mic-status').textContent = 'Recording... Tap to stop';
  },

  /**
   * Set microphone to processing state
   */
  _setMicrophoneProcessing() {
    const btn = document.getElementById('btn-microphone');
    btn.classList.remove('listening');
    btn.classList.add('processing');
    btn.querySelector('.mic-icon').textContent = '⏳';
    btn.querySelector('.mic-text').textContent = 'Processing...';
    document.getElementById('mic-status').textContent = 'Analyzing...';
  },

  /**
   * Set microphone to error state
   */
  _setMicrophoneError(message) {
    const btn = document.getElementById('btn-microphone');
    btn.classList.remove('listening', 'processing');
    btn.querySelector('.mic-icon').textContent = '❌';
    btn.querySelector('.mic-text').textContent = 'Error';
    document.getElementById('mic-status').textContent = message || 'Try again';
  },

  /**
   * Reset microphone button
   */
  _resetMicrophoneButton() {
    const btn = document.getElementById('btn-microphone');
    btn.classList.remove('listening', 'processing');
    btn.querySelector('.mic-icon').textContent = '🎤';
    btn.querySelector('.mic-text').textContent = 'Tap to Speak';
    document.getElementById('mic-status').textContent = 'Ready';
  },

  /**
   * Highlight correct word
   * @param {string} correctWord - The correct word
   */
  _highlightCorrectWord(correctWord) {
    document.querySelectorAll('.word-option-btn').forEach(btn => {
      if (btn.dataset.word === correctWord) {
        btn.classList.add('correct');
      } else if (btn.classList.contains('selected')) {
        btn.classList.add('wrong');
      }
    });
  },

  /**
   * Show combo popup
   * @param {number} combo - Combo count
   */
  _showComboPopup(combo) {
    const popup = document.getElementById('combo-popup');
    const text = document.getElementById('combo-popup-text');
    
    let comboText = '🔥 GREAT!';
    if (combo >= 10) comboText = '🔥🔥🔥 AMAZING!';
    else if (combo >= 7) comboText = '🔥🔥 INCREDIBLE!';
    else if (combo >= 5) comboText = '🔥🔥 AWESOME!';
    else if (combo >= 3) comboText = '🔥 GREAT!';
    
    text.textContent = `${comboText} ${combo}x`;
    popup.style.display = 'block';
    
    setTimeout(() => {
      popup.style.display = 'none';
    }, 1500);
  }
};

// Export for use in other modules
window.UI = UI;