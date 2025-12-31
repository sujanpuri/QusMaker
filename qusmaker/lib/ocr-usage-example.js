/**
 * Example usage of OCR post-processing functions
 * 
 * This file demonstrates how to use the new processOCRText function
 * to extract all questions from exam paper images
 */

import { processImage, processOCRText, getExtractionSummary } from './ocr-service';

/**
 * Complete workflow: Image → OCR → Question Extraction → Editor
 */
export async function processExamPaperImage(imageFile, onProgress = null) {
  try {
    // Step 1: Process image with OCR
    console.log("📸 Step 1: Processing image with OCR...");
    const ocrResult = await processImage(imageFile, (progress) => {
      if (onProgress) onProgress({ stage: 'ocr', progress: progress * 0.5 });
    });
    
    if (!ocrResult.success) {
      throw new Error(`OCR failed: ${ocrResult.error}`);
    }
    
    console.log("✅ OCR completed successfully");
    console.log(`📝 Extracted text length: ${ocrResult.text.length} characters`);
    
    // Step 2: Post-process OCR text to extract all questions
    console.log("🔍 Step 2: Extracting questions from OCR text...");
    if (onProgress) onProgress({ stage: 'extraction', progress: 0.5 });
    
    const extractionResult = processOCRText(ocrResult.text);
    
    if (!extractionResult.success) {
      throw new Error(`Question extraction failed: ${extractionResult.error}`);
    }
    
    console.log("✅ Question extraction completed");
    
    // Step 3: Generate summary for user confirmation
    console.log("📋 Step 3: Generating extraction summary...");
    const summary = getExtractionSummary(extractionResult);
    console.log("\n" + summary);
    
    if (onProgress) onProgress({ stage: 'complete', progress: 1.0 });
    
    // Return structured data ready for editor
    return {
      success: true,
      ocrText: ocrResult.text,
      ocrConfidence: ocrResult.confidence,
      extraction: extractionResult,
      summary: summary,
      editorData: convertToEditorFormat(extractionResult)
    };
    
  } catch (error) {
    console.error("❌ Error processing exam paper:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Convert extraction result to editor-compatible format
 */
function convertToEditorFormat(extractionResult) {
  const editorData = {
    totalQuestions: extractionResult.totalQuestions,
    groups: []
  };
  
  extractionResult.groups.forEach(group => {
    const editorGroup = {
      groupName: group.groupName,
      groupType: group.groupType,
      questions: []
    };
    
    group.questions.forEach(question => {
      const editorQuestion = {
        id: `q-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        number: question.questionNumber,
        type: question.questionType,
        text: question.questionText,
        marks: question.marks || 1,
        options: question.options || [],
        subQuestions: question.subQuestions || [],
        // Additional fields for editor
        answer: "",
        explanation: "",
        tags: [],
        difficulty: "medium"
      };
      
      editorGroup.questions.push(editorQuestion);
    });
    
    editorData.groups.push(editorGroup);
  });
  
  return editorData;
}

/**
 * Example: Process multiple exam paper images in batch
 */
export async function processBatchExamPapers(imageFiles) {
  const results = [];
  
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i];
    console.log(`\n📄 Processing ${i + 1}/${imageFiles.length}: ${file.name}`);
    
    const result = await processExamPaperImage(file, (progress) => {
      console.log(`   Progress: ${Math.round(progress.progress * 100)}% (${progress.stage})`);
    });
    
    results.push({
      fileName: file.name,
      ...result
    });
  }
  
  return results;
}

/**
 * Example: Direct OCR text processing (if you already have OCR text)
 */
export function processExistingOCRText(ocrText) {
  console.log("🔍 Processing existing OCR text...");
  
  const extractionResult = processOCRText(ocrText);
  
  if (!extractionResult.success) {
    console.error("❌ Extraction failed:", extractionResult.error);
    return null;
  }
  
  const summary = getExtractionSummary(extractionResult);
  console.log("\n" + summary);
  
  return {
    extraction: extractionResult,
    summary: summary,
    editorData: convertToEditorFormat(extractionResult)
  };
}

// Example OCR text samples for testing
export const EXAMPLE_OCR_TEXTS = {
  // Simple exam with no groups
  simple: `
Mathematics Mid-Term Exam
Date: 15/01/2024
Time: 2 hours
Total Marks: 50

Q1. What is the square root of 144? (2 marks)

Q2. Solve the equation: 2x + 5 = 15 (3 marks)

Q3. Calculate the area of a circle with radius 7 cm. (5 marks)
  `,
  
  // Exam with groups
  withGroups: `
Science Final Exam
Class: 10th Grade

Group A - Multiple Choice Questions (1 mark each)

Q1. What is the chemical symbol for water?
(a) H2O
(b) CO2
(c) O2
(d) N2

Q2. Which planet is closest to the Sun?
(a) Venus
(b) Earth
(c) Mercury
(d) Mars

Group B - Short Answer Questions (3 marks each)

Q1. Define photosynthesis.

Q2. Explain Newton's first law of motion.

Group C - Long Answer Questions (5 marks each)

Q1. Describe the process of cellular respiration in detail.
  `,
  
  // Exam with sub-questions
  withSubQuestions: `
English Literature Exam

Q1. Read the following passage and answer the questions: (10 marks)
[Passage text here...]

(a) What is the main theme of the passage?
(b) Identify two literary devices used by the author.
(c) Explain the significance of the title.

Q2. Write an essay on one of the following topics: (15 marks)
(a) The impact of technology on modern education
(b) Environmental conservation and its importance
(c) The role of youth in nation building
  `,
  
  // Mixed question types
  mixed: `
General Knowledge Test

Section A

Q1. Who was the first President of the United States? (2 marks)

Q2. Which of the following is NOT a primary color?
(a) Red
(b) Green
(c) Blue
(d) Yellow

Section B

Q3. Answer the following: (6 marks)
(a) What is the capital of France?
(b) Name the largest ocean on Earth.
(c) Who wrote "Romeo and Juliet"?

Q4. Explain the concept of democracy in your own words. (10 marks)
  `
};

/**
 * Test the OCR post-processing with example texts
 */
export function runExamples() {
  console.log("=".repeat(60));
  console.log("🧪 Testing OCR Post-Processing with Examples");
  console.log("=".repeat(60));
  
  Object.keys(EXAMPLE_OCR_TEXTS).forEach(exampleName => {
    console.log(`\n\n${"=".repeat(60)}`);
    console.log(`📝 Example: ${exampleName}`);
    console.log("=".repeat(60));
    
    const result = processExistingOCRText(EXAMPLE_OCR_TEXTS[exampleName]);
    
    if (result) {
      console.log("\n📊 Detailed Results:");
      console.log(JSON.stringify(result.extraction, null, 2));
    }
  });
}
