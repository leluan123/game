/**
 * Google Apps Script - Game English Analytics Logger
 * 
 * IMPORTANT: After updating this code, go to Deploy → Manage Deployments
 * → Edit → Deploy to get a new URL.
 * 
 * CORS is handled by doOptions() function below.
 */

// ============================================================
// CONFIGURATION
// ============================================================

/** Sheet names */
const SHEET_RAW = 'Raw Data';
const SHEET_SUMMARY = 'Summary';
const SHEET_DEVICES = 'Devices';

// ============================================================
// WEB APP ENTRY POINTS
// ============================================================

/**
 * Handle GET requests (for testing).
 */
function doGet(e) {
  return HtmlService.createHtmlOutput(`
    <h1>📊 Game English Analytics Logger</h1>
    <p>Status: ✅ Running</p>
    <p>Send POST requests with JSON payload to log data.</p>
  `)
  .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Handle OPTIONS preflight requests for CORS.
 */
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.JSON)
    .setHeader('Access-Control-Allow-Origin', '*')
    .setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    .setHeader('Access-Control-Allow-Headers', 'Content-Type')
    .setHeader('Access-Control-Max-Age', '86400');
}

/**
 * Handle POST requests - Receives game analytics from the client.
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    logToRawSheet(data);
    updateDeviceSheet(data);
    updateSummarySheet(data);
    
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', message: 'Data logged successfully' }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  } catch (err) {
    console.error('Error processing request:', err.message);
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader('Access-Control-Allow-Origin', '*');
  }
}

// ============================================================
// RAW DATA LOGGING
// ============================================================

function logToRawSheet(data) {
  const sheet = getOrCreateSheet(SHEET_RAW);
  
  if (sheet.getLastRow() === 0) {
    const headers = [
      'Timestamp', 'Device ID', 'Game ID', 'XP Earned', 
      'Play Time (s)', 'Level', 'Accuracy (%)', 
      'Boss Defeated', 'Total Questions', 'Total Correct'
    ];
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  
  sheet.appendRow([
    data.timestamp || new Date().toISOString(),
    data.deviceId || 'unknown',
    data.gameId || 'unknown',
    data.xp || 0,
    data.playTime || 0,
    data.level || 0,
    data.accuracy || 0,
    data.bossDefeated || 0,
    data.totalQuestions || 0,
    data.totalCorrect || 0
  ]);
}

// ============================================================
// DEVICE TRACKING
// ============================================================

function updateDeviceSheet(data) {
  const sheet = getOrCreateSheet(SHEET_DEVICES);
  const deviceId = data.deviceId || 'unknown';
  const timestamp = data.timestamp || new Date().toISOString();
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Device ID', 'First Seen', 'Last Seen', 'Total Sessions']);
    sheet.setFrozenRows(1);
  }
  
  const existingData = sheet.getDataRange().getValues();
  let found = false;
  
  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][0] === deviceId) {
      const lastSeen = new Date(timestamp);
      const currentSessions = (existingData[i][3] || 0) + 1;
      sheet.getRange(i + 1, 3).setValue(lastSeen);
      sheet.getRange(i + 1, 4).setValue(currentSessions);
      found = true;
      break;
    }
  }
  
  if (!found) {
    sheet.appendRow([deviceId, new Date(timestamp), new Date(timestamp), 1]);
  }
}

// ============================================================
// SUMMARY
// ============================================================

function updateSummarySheet(data) {
  const sheet = getOrCreateSheet(SHEET_SUMMARY);
  const today = (data.timestamp || new Date().toISOString()).substring(0, 10);
  
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Date', 'Game ID', 'Total Sessions', 'Total XP', 
      'Total Play Time (s)', 'Avg Accuracy (%)', 'Bosses Defeated'
    ]);
    sheet.setFrozenRows(1);
  }
  
  const existingData = sheet.getDataRange().getValues();
  let found = false;
  
  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][0] === today && existingData[i][1] === data.gameId) {
      const currentRow = i + 1;
      sheet.getRange(currentRow, 3).setValue((existingData[i][2] || 0) + 1);
      sheet.getRange(currentRow, 4).setValue((existingData[i][3] || 0) + (data.xp || 0));
      sheet.getRange(currentRow, 5).setValue((existingData[i][4] || 0) + (data.playTime || 0));
      const oldSessions = existingData[i][2] || 0;
      const oldAccuracy = existingData[i][5] || 0;
      const newSessions = oldSessions + 1;
      const newAvg = Math.round(((oldAccuracy * oldSessions) + (data.accuracy || 0)) / newSessions);
      sheet.getRange(currentRow, 6).setValue(newAvg);
      sheet.getRange(currentRow, 7).setValue((existingData[i][6] || 0) + (data.bossDefeated || 0));
      found = true;
      break;
    }
  }
  
  if (!found) {
    sheet.appendRow([
      today, data.gameId || 'unknown', 1, data.xp || 0, 
      data.playTime || 0, data.accuracy || 0, data.bossDefeated || 0
    ]);
  }
}

// ============================================================
// UTILITY
// ============================================================

function getOrCreateSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  return sheet;
}