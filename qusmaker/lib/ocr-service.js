import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini API
const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Process an image and extract text using Gemini OCR
 * @param {File|Blob|string} image - Image file, blob, or data URL
 * @param {Function} onProgress - Callback for progress updates (0-1)
 * @returns {Promise<{text: string, confidence: number}>}
 */
export async function processImage(image, onProgress = null) {
  try {
    // Validate API key
    if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
      throw new Error(
        "Gemini API key is not configured. Please set NEXT_PUBLIC_GEMINI_API_KEY in your environment variables."
      );
    }

    console.log(
      "🔍 OCR Debug - API Key configured:",
      apiKey ? `${apiKey.substring(0, 10)}...` : "Not set"
    );
    console.log(
      "🔍 OCR Debug - Processing image:",
      image instanceof File ? image.name : "blob/url"
    );

    // Report progress: starting
    if (onProgress) onProgress(0.1);

    // Convert image to base64 if it's a File or Blob
    let imageData;
    if (image instanceof File || image instanceof Blob) {
      imageData = await fileToGenerativePart(image);
    } else if (typeof image === "string") {
      // If it's already a data URL, extract base64 part
      const base64Match = image.match(/^data:image\/\w+;base64,(.+)$/);
      if (base64Match) {
        imageData = {
          inlineData: {
            data: base64Match[1],
            mimeType: image.match(/^data:(image\/\w+);/)[1],
          },
        };
      } else {
        throw new Error("Invalid image format");
      }
    }

    if (onProgress) onProgress(0.3);

    // Use Gemini Flash model with vision capability
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
    });

    const prompt = `Extract all text from this image. Focus on:
1. Question text
2. Question numbers
3. Marks allocation (e.g., "5 marks", "[3m]", "2M")
4. Multiple choice options (if present)
5. Any mathematical equations or special notation

Format the output as plain text, preserving the structure and layout as much as possible.`;

    if (onProgress) onProgress(0.5);

    console.log("🔍 OCR Debug - Calling Gemini API...");

    // Generate content
    const result = await model.generateContent([prompt, imageData]);
    const response = await result.response;
    const text = response.text();

    console.log("✅ OCR Debug - Gemini API response received");
    console.log("📝 OCR Debug - Extracted text length:", text.length);
    console.log(
      "📝 OCR Debug - Extracted text preview:",
      text.substring(0, 200)
    );

    if (onProgress) onProgress(1.0);

    // Gemini doesn't provide confidence scores like Tesseract
    // We'll use a high confidence value since Gemini is generally very accurate
    return {
      text: text,
      confidence: 95, // High confidence for Gemini
      success: true,
    };
  } catch (error) {
    console.error("❌ Gemini OCR processing error:", error);
    console.error("❌ Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    // Provide helpful error messages
    let errorMessage = error.message || "Failed to process image with Gemini";

    if (error.message?.includes("API key") || error.message?.includes("401")) {
      errorMessage =
        "Invalid API key. Please check your NEXT_PUBLIC_GEMINI_API_KEY in environment variables.";
    } else if (
      error.message?.includes("quota") ||
      error.message?.includes("429")
    ) {
      errorMessage =
        "API quota exceeded. Please check your Gemini API usage limits.";
    } else if (
      error.message?.includes("network") ||
      error.message?.includes("fetch")
    ) {
      errorMessage = "Network error. Please check your internet connection.";
    }

    return {
      text: "",
      confidence: 0,
      success: false,
      error: errorMessage,
      errorDetails: error.message,
    };
  }
}

/**
 * Convert File/Blob to Gemini-compatible format
 */
async function fileToGenerativePart(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = reader.result.split(",")[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Get a summary of extracted questions for user confirmation
 * @param {Object} extractionResult - Result from processOCRText
 * @returns {string} - Human-readable summary
 */
export function getExtractionSummary(extractionResult) {
  if (!extractionResult.success) {
    return `❌ Extraction failed: ${extractionResult.error}`;
  }
  
  let summary = `✅ Successfully extracted ${extractionResult.totalQuestions} question(s)\n\n`;
  
  extractionResult.groups.forEach((group, groupIndex) => {
    summary += `📂 ${group.groupName} (${group.questions.length} questions)\n`;
    
    group.questions.forEach((q, qIndex) => {
      const typeEmoji = {
        'mcq': '☑️',
        'short_question': '📝',
        'long_question': '📄',
        'question_with_subquestions': '📋'
      }[q.questionType] || '❓';
      
      summary += `   ${typeEmoji} Q${q.questionNumber}: ${q.questionType}`;
      
      if (q.marks) {
        summary += ` (${q.marks} marks)`;
      }
      
      if (q.subQuestions && q.subQuestions.length > 0) {
        summary += ` [${q.subQuestions.length} sub-questions]`;
      }
      
      if (q.options && q.options.length > 0 && q.options[0]) {
        summary += ` [${q.options.filter(o => o).length} options]`;
      }
      
      // Preview first 50 chars of question
      const preview = q.questionText.substring(0, 50).replace(/\n/g, " ");
      summary += `\n      "${preview}${q.questionText.length > 50 ? '...' : ''}"\n`;
    });
    
    if (groupIndex < extractionResult.groups.length - 1) {
      summary += '\n';
    }
  });
  
  return summary;
}

/**
 * Detect question type and parse question data from OCR text
 * @deprecated Use processOCRText() for extracting all questions from exam papers
 * @param {string} text - Raw OCR text
 * @returns {Object} - Parsed question data
 */
export function parseQuestionFromText(text) {
  if (!text || text.trim().length === 0) {
    return null;
  }

  const lines = text.split("\n").filter((line) => line.trim().length > 0);

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
      type: "mcq",
      question: questionText,
      marks: marks,
      options: options,
      subQuestions: [],
    };
  } else {
    // Descriptive question
    return {
      type: "descriptive",
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
    /\([a-dA-D]\)/g, // (a) or (A)
    /[a-dA-D]\)/g, // a) or A)
    /[a-dA-D]\./g, // a. or A.
    /\([a-dA-D]\)/g, // (a) through (d)
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
    /\((\d+)\s*marks?\)/i, // (5 marks) or (5 mark)
    /\[(\d+)m\]/i, // [3m]
    /(\d+)\s*M\b/i, // 5M
    /\((\d+)\)/, // (2)
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
  cleanText = cleanText.replace(
    /^(Q\.?\s*\d+\.?|Question\s*\d+\.?|\d+\.?\s*[.)])\s*/i,
    ""
  );

  // Remove marks notation
  cleanText = cleanText.replace(/\(?\d+\s*marks?\)?/gi, "");
  cleanText = cleanText.replace(/\[\d+m\]/gi, "");
  cleanText = cleanText.replace(/\d+\s*M\b/gi, "");

  // Remove MCQ options from question text
  cleanText = cleanText.replace(/\n\s*[a-dA-D][\).\]]\s*.*/g, "");
  cleanText = cleanText.replace(/\n\s*\([a-dA-D]\)\s*.*/g, "");

  return cleanText.trim();
}

/**
 * Extract MCQ options from text
 */
function extractMCQOptions(text) {
  const options = { a: "", b: "", c: "", d: "" };

  // Try different option patterns
  const patterns = [
    /\(([a-d])\)\s*([^\n(]+)/gi, // (a) option text
    /([a-d])\)\s*([^\n(]+)/gi, // a) option text
    /([a-d])\.\s*([^\n.]+)/gi, // a. option text
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length >= 2) {
      matches.forEach((match) => {
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
  return [options.a || "", options.b || "", options.c || "", options.d || ""];
}

/**
 * Post-process OCR text to extract ALL questions with complete structure
 * 
 * This function:
 * - Ignores non-question metadata (page numbers, dates, time, subject, marks info, instructions, headers, footers)
 * - Detects question groups (Group A/B/C, Section A/B/C)
 * - Extracts ALL individual questions with proper numbering
 * - Classifies question types (mcq, short_question, long_question, question_with_subquestions)
 * - Preserves exact question count from source
 * - Returns editor-ready structured output
 * 
 * @param {string} ocrText - Raw OCR text output from image
 * @returns {Object} - Structured question data with groups and questions
 */
export function processOCRText(ocrText) {
  if (!ocrText || ocrText.trim().length === 0) {
    return {
      success: false,
      error: "No text provided",
      groups: [],
      totalQuestions: 0
    };
  }

  try {
    console.log("📋 Starting OCR post-processing...");
    
    // Step 1: Clean and filter out metadata
    const cleanedText = removeMetadata(ocrText);
    console.log("✅ Metadata removed");
    
    // Step 2: Split into lines for processing
    const lines = cleanedText.split("\n").map(line => line.trim()).filter(line => line.length > 0);
    
    // Step 3: Detect groups and extract questions
    const result = extractGroupsAndQuestions(lines);
    
    console.log(`✅ Extraction complete: ${result.totalQuestions} questions in ${result.groups.length} group(s)`);
    
    return {
      success: true,
      groups: result.groups,
      totalQuestions: result.totalQuestions,
      metadata: {
        processedAt: new Date().toISOString(),
        sourceLength: ocrText.length,
        cleanedLength: cleanedText.length
      }
    };
  } catch (error) {
    console.error("❌ OCR post-processing error:", error);
    return {
      success: false,
      error: error.message,
      groups: [],
      totalQuestions: 0
    };
  }
}

/**
 * Remove non-question metadata from OCR text
 */
function removeMetadata(text) {
  let cleaned = text;
  
  // Remove common metadata patterns
  const metadataPatterns = [
    // Page numbers
    /Page\s+\d+\s*of\s*\d+/gi,
    /Page\s+\d+/gi,
    /\[\s*\d+\s*\]/g, // [1], [2]
    
    // Dates and time
    /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g,
    /\d{1,2}:\d{2}\s*(AM|PM|am|pm)?/g,
    /Date:\s*[^\n]+/gi,
    /Time:\s*[^\n]+/gi,
    /Duration:\s*[^\n]+/gi,
    
    // Subject and exam info
    /Subject:\s*[^\n]+/gi,
    /Course:\s*[^\n]+/gi,
    /Class:\s*[^\n]+/gi,
    /Grade:\s*[^\n]+/gi,
    /Exam:\s*[^\n]+/gi,
    /Test:\s*[^\n]+/gi,
    /Semester:\s*[^\n]+/gi,
    /Roll\s*No\.?:\s*[^\n]+/gi,
    /Student\s*Name:\s*[^\n]+/gi,
    
    // Total marks info
    /Total\s*Marks?:\s*\d+/gi,
    /Maximum\s*Marks?:\s*\d+/gi,
    /Full\s*Marks?:\s*\d+/gi,
    
    // Instructions headers
    /Instructions?:/gi,
    /General\s*Instructions?/gi,
    /Note:/gi,
    /Important:/gi,
    /Read\s*carefully/gi,
    /Answer\s*all\s*questions?/gi,
    /Attempt\s*all\s*questions?/gi,
    
    // Watermarks and footers
    /©\s*\d{4}/g,
    /All\s*rights\s*reserved/gi,
    /Confidential/gi,
    /Internal\s*Use\s*Only/gi,
    
    // Multiple consecutive line breaks (preserve paragraph structure)
    /\n{4,}/g,
  ];
  
  metadataPatterns.forEach(pattern => {
    if (pattern.toString().includes("\\n{")) {
      cleaned = cleaned.replace(pattern, "\n\n");
    } else {
      cleaned = cleaned.replace(pattern, "");
    }
  });
  
  // Remove isolated numbers that might be page numbers
  cleaned = cleaned.replace(/^\s*\d+\s*$/gm, "");
  
  return cleaned.trim();
}

/**
 * Extract groups and all questions from cleaned text lines
 */
function extractGroupsAndQuestions(lines) {
  const groups = [];
  let currentGroup = null;
  let currentQuestionLines = [];
  let currentQuestionNumber = 0;
  let totalQuestions = 0;
  let i = 0;
  
  // Helper to finalize current question
  const finalizeCurrentQuestion = () => {
    if (currentQuestionLines.length > 0 && currentGroup) {
      const questionText = currentQuestionLines.join("\n").trim();
      if (questionText.length > 0) {
        const question = parseCompleteQuestion(questionText, currentQuestionNumber);
        if (question) {
          currentGroup.questions.push(question);
          totalQuestions++;
        }
      }
      currentQuestionLines = [];
    }
  };
  
  while (i < lines.length) {
    const line = lines[i];
    
    // Check if this line is a group header
    const groupMatch = detectGroupHeader(line);
    if (groupMatch) {
      // Finalize previous question before starting new group
      finalizeCurrentQuestion();
      
      // Create new group
      currentGroup = {
        groupName: groupMatch.name,
        groupType: groupMatch.type,
        questions: []
      };
      groups.push(currentGroup);
      currentQuestionNumber = 0; // Reset question numbering for new group
      
      console.log(`📂 Detected group: ${groupMatch.name}`);
      i++;
      continue;
    }
    
    // Check if this line starts a new question
    const questionMatch = detectQuestionStart(line);
    if (questionMatch) {
      // Finalize previous question
      finalizeCurrentQuestion();
      
      // Ensure we have a default group if none exists
      if (!currentGroup) {
        currentGroup = {
          groupName: "All Questions",
          groupType: "default",
          questions: []
        };
        groups.push(currentGroup);
      }
      
      // Start new question
      currentQuestionNumber = questionMatch.number;
      currentQuestionLines = [line];
      
      i++;
      continue;
    }
    
    // If we're inside a question, add this line to it
    if (currentQuestionLines.length > 0) {
      currentQuestionLines.push(line);
    }
    
    i++;
  }
  
  // Finalize last question
  finalizeCurrentQuestion();
  
  return { groups, totalQuestions };
}

/**
 * Detect if a line is a group header (Group A, Section B, etc.)
 */
function detectGroupHeader(line) {
  const patterns = [
    /^(Group\s*([A-Z]))/i,
    /^(Section\s*([A-Z]))/i,
    /^(Part\s*([A-Z]))/i,
    /^(Category\s*([A-Z]))/i,
    /^(Group\s*([IVX]+))/i,  // Roman numerals
    /^(Section\s*([IVX]+))/i,
    /^(Part\s*(\d+))/i,
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      return {
        name: match[1].trim(),
        type: match[0].split(/\s+/)[0].toLowerCase(), // 'group', 'section', etc.
        identifier: match[2]
      };
    }
  }
  
  return null;
}

/**
 * Detect if a line starts a new question
 */
function detectQuestionStart(line) {
  const patterns = [
    /^Q\.?\s*(\d+)[\.\):\s]/i,      // Q1., Q.1, Q1:, Q 1
    /^Question\s*(\d+)[\.\):\s]/i,  // Question 1., Question 1:
    /^(\d+)[\.\)]\s+/,               // 1., 1)
    /^\((\d+)\)\s+/,                 // (1)
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      return {
        number: parseInt(match[1], 10),
        raw: match[0]
      };
    }
  }
  
  return null;
}

/**
 * Parse a complete question text and determine its type
 */
function parseCompleteQuestion(text, questionNumber) {
  if (!text || text.trim().length === 0) {
    return null;
  }
  
  // Detect question type
  const hasMCQOptions = detectMCQPattern(text);
  const hasSubQuestions = detectSubQuestions(text);
  const marks = extractMarks(text);
  
  // Build base question object
  const question = {
    questionNumber: questionNumber,
    questionText: "",
    questionType: "",
    marks: marks,
    options: [],
    subQuestions: []
  };
  
  // Determine question type and extract content
  if (hasMCQOptions) {
    question.questionType = "mcq";
    question.questionText = extractQuestionText(text);
    question.options = extractMCQOptions(text);
  } else if (hasSubQuestions) {
    question.questionType = "question_with_subquestions";
    const parsed = extractMainQuestionAndSubs(text);
    question.questionText = parsed.mainQuestion;
    question.subQuestions = parsed.subQuestions;
  } else {
    // Determine if short or long based on text length
    const cleanText = extractQuestionText(text);
    question.questionText = cleanText;
    
    // Short questions are typically < 100 characters
    if (cleanText.length < 100) {
      question.questionType = "short_question";
    } else {
      question.questionType = "long_question";
    }
  }
  
  return question;
}

/**
 * Detect if text contains sub-questions like (a), (b), (i), (ii)
 */
function detectSubQuestions(text) {
  const subQuestionPatterns = [
    /\n\s*\(([a-z])\)/gi,           // (a), (b), (c)
    /\n\s*\(([ivx]+)\)/gi,          // (i), (ii), (iii)
    /\n\s*([a-z])\)\s+/gi,          // a), b), c)
    /\n\s*([ivx]+)\)\s+/gi,         // i), ii), iii)
  ];
  
  for (const pattern of subQuestionPatterns) {
    const matches = text.match(pattern);
    if (matches && matches.length >= 2) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extract main question and sub-questions
 */
function extractMainQuestionAndSubs(text) {
  const lines = text.split("\n");
  let mainQuestion = "";
  const subQuestions = [];
  let currentSubQuestion = null;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check if this line starts a sub-question
    const subMatch = line.match(/^\(([a-z]|[ivx]+)\)\s*(.+)/i) || 
                     line.match(/^([a-z]|[ivx]+)\)\s*(.+)/i);
    
    if (subMatch) {
      // Save previous sub-question if exists
      if (currentSubQuestion) {
        subQuestions.push(currentSubQuestion);
      }
      
      // Start new sub-question
      currentSubQuestion = {
        subQuestionId: subMatch[1],
        subQuestionText: subMatch[2] || line
      };
    } else if (currentSubQuestion) {
      // Continue current sub-question
      currentSubQuestion.subQuestionText += " " + line;
    } else {
      // Part of main question
      mainQuestion += (mainQuestion ? " " : "") + line;
    }
  }
  
  // Save last sub-question
  if (currentSubQuestion) {
    subQuestions.push(currentSubQuestion);
  }
  
  // Clean main question text
  mainQuestion = extractQuestionText(mainQuestion);
  
  return {
    mainQuestion,
    subQuestions
  };
}
