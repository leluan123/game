/**
 * Speech Module
 * 
 * Handles:
 * 1. Speech Recognition (Web Speech API - SpeechRecognition)
 * 2. Speech Synthesis (Text-to-Speech)
 * 3. Microphone permission management
 */

const Speech = {
  /** Speech recognition instance */
  recognition: null,
  
  /** Whether speech recognition is supported */
  isSupported: false,
  
  /** Whether currently listening */
  isListening: false,
  
  /** Current speech result */
  currentResult: null,
  
  /** Speech synthesis instance */
  synthesis: window.speechSynthesis,
  
  /** Available voices */
  voices: [],
  
  /** Callbacks */
  onResult: null,
  onEnd: null,
  onError: null,
  onStart: null,

  /**
   * Initialize speech module
   */
  init() {
    // Check for Speech Recognition support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.isSupported = true;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-US';
      this.recognition.maxAlternatives = 5;
      
      this._setupRecognitionEvents();
      console.log('[Speech] Speech Recognition supported');
    } else {
      console.warn('[Speech] Speech Recognition not supported');
      this.isSupported = false;
    }
    
    // Load voices for synthesis
    this._loadVoices();
    
    if (this.synthesis.onvoiceschanged !== undefined) {
      this.synthesis.onvoiceschanged = () => this._loadVoices();
    }
  },

  /**
   * Setup recognition event handlers
   */
  _setupRecognitionEvents() {
    if (!this.recognition) return;
    
    this.recognition.onstart = () => {
      this.isListening = true;
      console.log('[Speech] Recognition started');
      if (this.onStart) this.onStart();
    };
    
    this.recognition.onresult = (event) => {
      const results = event.results;
      const lastResult = results[results.length - 1];
      
      // Get all alternatives
      const alternatives = [];
      for (let i = 0; i < lastResult.length; i++) {
        alternatives.push({
          transcript: lastResult[i].transcript,
          confidence: lastResult[i].confidence
        });
      }
      
      this.currentResult = {
        transcript: lastResult[0].transcript,
        confidence: lastResult[0].confidence,
        alternatives: alternatives
      };
      
      console.log('[Speech] Recognition result:', this.currentResult);
      
      if (this.onResult) {
        this.onResult(this.currentResult);
      }
    };
    
    this.recognition.onerror = (event) => {
      console.error('[Speech] Recognition error:', event.error);
      this.isListening = false;
      
      if (this.onError) {
        this.onError(event.error);
      }
    };
    
    this.recognition.onend = () => {
      this.isListening = false;
      console.log('[Speech] Recognition ended');
      
      if (this.onEnd) {
        this.onEnd();
      }
    };
  },

  /**
   * Load available voices for speech synthesis
   */
  _loadVoices() {
    this.voices = this.synthesis.getVoices();
    console.log(`[Speech] Loaded ${this.voices.length} voices`);
  },

  /**
   * Start listening for speech
   * @returns {Promise<Object>} Speech recognition result
   */
  startListening() {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('Speech recognition not supported'));
        return;
      }
      
      if (this.isListening) {
        reject(new Error('Already listening'));
        return;
      }
      
      // Set up one-time callbacks
      this.onResult = (result) => {
        resolve(result);
      };
      
      this.onError = (error) => {
        reject(new Error(error));
      };
      
      this.onEnd = () => {
        // If no result was received, reject
        if (!this.currentResult) {
          reject(new Error('No speech detected'));
        }
      };
      
      try {
        this.recognition.start();
      } catch (error) {
        reject(error);
      }
    });
  },

  /** Flag indicating user manually stopped */
  _manuallyStopped: false,

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      this._manuallyStopped = true;
      this.recognition.stop();
    }
  },

  /**
   * Speak text using speech synthesis
   * @param {string} text - Text to speak
   * @param {Object} options - Speech options
   */
  speak(text, options = {}) {
    if (!this.synthesis) {
      console.warn('[Speech] Speech synthesis not supported');
      return;
    }
    
    // Cancel any ongoing speech
    this.synthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice
    const voiceOptions = {
      rate: options.rate || 0.9,      // Slightly slower for learning
      pitch: options.pitch || 1.0,
      volume: options.volume || 1.0,
      lang: options.lang || 'en-US'
    };
    
    Object.assign(utterance, voiceOptions);
    
    // Try to find an English voice
    const englishVoice = this.voices.find(voice => 
      voice.lang.startsWith('en') && voice.name.includes('Google')
    ) || this.voices.find(voice => 
      voice.lang.startsWith('en')
    );
    
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    // Event handlers
    utterance.onstart = () => {
      console.log('[Speech] Speaking:', text);
    };
    
    utterance.onend = () => {
      console.log('[Speech] Finished speaking');
    };
    
    utterance.onerror = (event) => {
      console.error('[Speech] Speech error:', event.error);
    };
    
    this.synthesis.speak(utterance);
  },

  /**
   * Stop speaking
   */
  stopSpeaking() {
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  },

  /**
   * Check if microphone permission is granted
   * @returns {Promise<string>} Permission status
   */
  async checkMicrophonePermission() {
    try {
      const result = await navigator.permissions.query({ name: 'microphone' });
      return result.state; // 'granted', 'denied', or 'prompt'
    } catch (error) {
      // Fallback for browsers that don't support permissions API
      return 'prompt';
    }
  },

  /**
   * Request microphone permission
   * @returns {Promise<boolean>} True if granted
   */
  async requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('[Speech] Microphone permission denied:', error);
      return false;
    }
  },

  /**
   * Get best match from recognition alternatives
   * @param {string} correctAnswer - The correct answer
   * @param {Array} alternatives - Array of {transcript, confidence}
   * @returns {Object} Best match with score
   */
  getBestMatch(correctAnswer, alternatives) {
    if (!alternatives || alternatives.length === 0) {
      return {
        transcript: '',
        score: 0,
        isMatch: false
      };
    }
    
    // Find the best match based on similarity
    let bestMatch = alternatives[0];
    let bestScore = 0;
    
    for (const alt of alternatives) {
      const similarity = Utils.calculateSimilarity(alt.transcript, correctAnswer);
      if (similarity.accuracy > bestScore) {
        bestScore = similarity.accuracy;
        bestMatch = alt;
      }
    }
    
    return {
      transcript: bestMatch.transcript,
      confidence: bestMatch.confidence,
      score: bestScore,
      isMatch: bestScore >= 70
    };
  },

  /**
   * Check if speech recognition is available
   * @returns {boolean} True if supported
   */
  isAvailable() {
    return this.isSupported;
  },

  /**
   * Get microphone status message
   * @returns {string} Status message
   */
  getMicrophoneStatus() {
    if (!this.isSupported) {
      return 'Speech recognition not supported in this browser';
    }
    
    if (this.isListening) {
      return 'Listening...';
    }
    
    return 'Ready to listen';
  }
};

// Export for use in other modules
window.Speech = Speech;