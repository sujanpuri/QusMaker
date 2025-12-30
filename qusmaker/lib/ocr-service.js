import Tesseract from 'tesseract.js';

/**
 * Process an image and extract text using OCR
 * @param {File|Blob|string} image - Image file, blob, or data URL
 * @param {Function} onProgress - Callback for progress updates (0-1)
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function processImage(image, onProgress = null) {
  try {
    const result = await Tesseract.recognize(
      image,
      'eng', // Language: English
      {
        logger: (m) => {
          // Send progress updates
          if (onProgress && m.status === 'recognizing text') {
            onProgress(m.progress);
          }
        },
      }
    );

    return {
      text: result.data.text,
      confidence: result.data.confidence,
      success: true,
    };
  } catch (error) {
    console.error('OCR processing error:', error);
    return {
      text: '',
      confidence: 0,
      success: false,
      error: error.message,
    };
  }
}

/**
 * Detect question type and parse question data from OCR text
 * @param {string} text - Raw OCR text
 * @returns {Object} - Parsed question data
 */
export function parseQuestionFromText(text) {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const lines = text.split('\n').filter(line => line.trim().length > 0);
  
  // Detect question type by looking for MCQ patterns
  const isMCQ = detectMCQPattern(text);
  
  // Extract marks
  const marks = extractMarks(text);
  
  // Extract question text (remove question number and marks notation)
  const questionText = extractQuestionText(text);
  
  if (isMCQ) {
    // Extract MCQ options
    const options = extractMCQOptions(text);
    
    return {
      type: 'mcq',
      question: questionText,
      marks: marks,
      options: options,
      subQuestions: [],
    };
  } else {
    // Descriptive question
    return {
      type: 'descriptive',
      question: questionText,
      marks: marks,
      options: [],
      subQuestions: [],
    };
  }
}

/**
 * Detect if the text contains MCQ pattern
 */
function detectMCQPattern(text) {
  // Common MCQ patterns:
  // (a), (b), (c), (d)
  // a), b), c), d)
  // A., B., C., D.
  // a., b., c., d.
  // (A), (B), (C), (D)
  
  const patterns = [
    /\([a-dA-D]\)/g,           // (a) or (A)
    /[a-dA-D]\)/g,             // a) or A)
    /[a-dA-D]\./g,             // a. or A.
    /\([a-dA-D]\)/g,           // (a) through (d)
  ];
  
  // Check if we have at least 2 option markers (a and b minimum)
  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length >= 2) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extract marks from text patterns like: (5 marks), [3m], 5M, (2)
 */
function extractMarks(text) {
  const patterns = [
    /\((\d+)\s*marks?\)/i,    // (5 marks) or (5 mark)
    /\[(\d+)m\]/i,             // [3m]
    /(\d+)\s*M\b/i,            // 5M
    /\((\d+)\)/,               // (2)
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  
  return 1; // Default marks
}

/**
 * Extract clean question text (remove question numbers and marks notation)
 */
function extractQuestionText(text) {
  let cleanText = text;
  
  // Remove question number patterns: Q1., Q.1, 1., 1), Question 1, etc.
  cleanText = cleanText.replace(/^(Q\.?\s*\d+\.?|Question\s*\d+\.?|\d+\.?\s*[.)])\s*/i, '');
  
  // Remove marks notation
  cleanText = cleanText.replace(/\(?\d+\s*marks?\)?/gi, '');
  cleanText = cleanText.replace(/\[\d+m\]/gi, '');
  cleanText = cleanText.replace(/\d+\s*M\b/gi, '');
  
  // Remove MCQ options from question text
  cleanText = cleanText.replace(/\n\s*[a-dA-D][\).\]]\s*.*/g, '');
  cleanText = cleanText.replace(/\n\s*\([a-dA-D]\)\s*.*/g, '');
  
  return cleanText.trim();
}

/**
 * Extract MCQ options from text
 */
function extractMCQOptions(text) {
  const options = { a: '', b: '', c: '', d: '' };
  
  // Try different option patterns
  const patterns = [
    /\(([a-d])\)\s*([^\n(]+)/gi,      // (a) option text
    /([a-d])\)\s*([^\n(]+)/gi,        // a) option text
    /([a-d])\.\s*([^\n.]+)/gi,        // a. option text
  ];
  
  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length >= 2) {
      matches.forEach(match => {
        const optionLetter = match[1].toLowerCase();
        const optionText = match[2].trim();
        if (options.hasOwnProperty(optionLetter) && optionText) {
          options[optionLetter] = optionText;
        }
      });
      break; // Found options, stop trying other patterns
    }
  }
  
  // Return array format expected by the question form
  return [
    options.a || '',
    options.b || '',
    options.c || '',
    options.d || '',
  ];
}
