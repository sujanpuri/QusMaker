# Quick Start Guide: OCR Post-Processing Integration

## For Frontend Developers

### Step 1: Import Functions
```javascript
import { 
  processImage,      // OCR processing
  processOCRText,    // Question extraction
  getExtractionSummary  // User-friendly summary
} from '@/lib/ocr-service';
```

### Step 2: Process Image & Extract Questions
```javascript
// In your component or API route
async function handleImageUpload(imageFile) {
  try {
    // Step 1: OCR
    setStatus("Processing image...");
    const ocrResult = await processImage(imageFile, (progress) => {
      setProgress(progress * 50); // 0-50%
    });
    
    if (!ocrResult.success) {
      throw new Error(ocrResult.error);
    }
    
    // Step 2: Extract questions
    setStatus("Extracting questions...");
    setProgress(60);
    
    const extraction = processOCRText(ocrResult.text);
    
    if (!extraction.success) {
      throw new Error(extraction.error);
    }
    
    setProgress(80);
    
    // Step 3: Show summary to user
    const summary = getExtractionSummary(extraction);
    setProgress(100);
    
    return {
      ocrText: ocrResult.text,
      extraction: extraction,
      summary: summary
    };
    
  } catch (error) {
    console.error("Error:", error);
    setError(error.message);
  }
}
```

### Step 3: Display Summary for Confirmation
```javascript
// Show user what was extracted
function ExtractionSummary({ extraction, summary, onConfirm, onCancel }) {
  return (
    <div className="extraction-summary">
      <h3>Extracted Questions</h3>
      <pre className="summary-text">{summary}</pre>
      
      <div className="stats">
        <p>Total Questions: {extraction.totalQuestions}</p>
        <p>Groups: {extraction.groups.length}</p>
      </div>
      
      <div className="actions">
        <button onClick={() => onConfirm(extraction)}>
          ✅ Load into Editor
        </button>
        <button onClick={onCancel}>
          ❌ Cancel & Re-scan
        </button>
      </div>
    </div>
  );
}
```

### Step 4: Load into Editor
```javascript
function loadQuestionsIntoEditor(extraction) {
  // Convert to your editor's format
  const editorQuestions = [];
  
  extraction.groups.forEach(group => {
    group.questions.forEach(q => {
      editorQuestions.push({
        id: generateId(),
        number: q.questionNumber,
        type: q.questionType,
        text: q.questionText,
        marks: q.marks,
        options: q.options,
        subQuestions: q.subQuestions,
        groupName: group.groupName,
        // Add defaults
        answer: "",
        explanation: "",
        tags: [],
        difficulty: "medium"
      });
    });
  });
  
  // Update your state/context
  setQuestions(editorQuestions);
  
  // Navigate to editor
  router.push('/editor');
}
```

## For React Components

### Complete Component Example
```javascript
'use client';

import { useState } from 'react';
import { processImage, processOCRText, getExtractionSummary } from '@/lib/ocr-service';

export default function OCRUploadModal() {
  const [stage, setStage] = useState('upload'); // upload, processing, summary, editor
  const [progress, setProgress] = useState(0);
  const [extraction, setExtraction] = useState(null);
  const [summary, setSummary] = useState('');
  const [error, setError] = useState(null);
  
  async function handleFileSelect(file) {
    setStage('processing');
    setError(null);
    
    try {
      // OCR
      const ocrResult = await processImage(file, (p) => setProgress(p * 50));
      
      if (!ocrResult.success) {
        throw new Error(ocrResult.error);
      }
      
      // Extract
      setProgress(60);
      const result = processOCRText(ocrResult.text);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Summary
      setProgress(80);
      const sum = getExtractionSummary(result);
      
      setExtraction(result);
      setSummary(sum);
      setProgress(100);
      setStage('summary');
      
    } catch (err) {
      setError(err.message);
      setStage('upload');
    }
  }
  
  function handleConfirm() {
    // Load into editor
    loadIntoEditor(extraction);
    setStage('editor');
  }
  
  return (
    <div className="ocr-modal">
      {stage === 'upload' && (
        <FileUpload onSelect={handleFileSelect} />
      )}
      
      {stage === 'processing' && (
        <ProgressBar value={progress} />
      )}
      
      {stage === 'summary' && (
        <div>
          <h3>Review Extracted Questions</h3>
          <pre>{summary}</pre>
          <button onClick={handleConfirm}>Load into Editor</button>
          <button onClick={() => setStage('upload')}>Cancel</button>
        </div>
      )}
      
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

## For API Routes

### Example API Endpoint
```javascript
// app/api/ocr/process/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { processImage, processOCRText } from '@/lib/ocr-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }
    
    // Process OCR
    const ocrResult = await processImage(file);
    
    if (!ocrResult.success) {
      return NextResponse.json(
        { error: ocrResult.error },
        { status: 500 }
      );
    }
    
    // Extract questions
    const extraction = processOCRText(ocrResult.text);
    
    if (!extraction.success) {
      return NextResponse.json(
        { error: extraction.error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      ocrText: ocrResult.text,
      extraction: extraction,
      totalQuestions: extraction.totalQuestions
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
```

### Call from Frontend
```javascript
async function uploadAndProcess(file) {
  const formData = new FormData();
  formData.append('image', file);
  
  const response = await fetch('/api/ocr/process', {
    method: 'POST',
    body: formData
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error);
  }
  
  return data.extraction;
}
```

## Testing

### Test with Example Data
```javascript
import { processOCRText, getExtractionSummary, EXAMPLE_OCR_TEXTS } from '@/lib/ocr-usage-example';

// Test with simple exam
const result = processOCRText(EXAMPLE_OCR_TEXTS.simple);
console.log(getExtractionSummary(result));

// Test with groups
const result2 = processOCRText(EXAMPLE_OCR_TEXTS.withGroups);
console.log(getExtractionSummary(result2));
```

### Run All Examples
```javascript
import { runExamples } from '@/lib/ocr-usage-example';
runExamples();
```

## Common Patterns

### Pattern 1: Modal Workflow
```
Upload Image → Process → Show Summary → Confirm → Load Editor
```

### Pattern 2: Direct Processing
```
Upload Image → Process → Auto-load into Editor
```

### Pattern 3: Batch Processing
```
Upload Multiple Images → Process All → Show Combined Summary → Confirm → Load All
```

## Data Flow Diagram

```
┌─────────────┐
│ Image File  │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  processImage() │  ← Gemini OCR
└──────┬──────────┘
       │ OCR Text
       ▼
┌──────────────────┐
│ processOCRText() │  ← Extract Questions
└──────┬───────────┘
       │ Extraction Result
       ├──────────────┐
       ▼              ▼
┌─────────────┐  ┌─────────────────────┐
│   Summary   │  │  Editor Data Format │
└─────────────┘  └──────────┬──────────┘
                            │
                            ▼
                  ┌─────────────────┐
                  │ Question Editor │
                  └─────────────────┘
```

## Question Type Handling

```javascript
function renderQuestion(question) {
  switch (question.questionType) {
    case 'mcq':
      return <MCQEditor question={question} />;
      
    case 'short_question':
      return <ShortAnswerEditor question={question} />;
      
    case 'long_question':
      return <LongAnswerEditor question={question} />;
      
    case 'question_with_subquestions':
      return <SubQuestionEditor question={question} />;
      
    default:
      return <GenericEditor question={question} />;
  }
}
```

## Tips

1. **Always show summary before loading into editor** - Let users verify extraction accuracy
2. **Preserve original OCR text** - Useful for debugging and manual correction
3. **Handle empty results gracefully** - Show helpful message if no questions found
4. **Provide progress feedback** - Use progress callbacks for better UX
5. **Test with various exam formats** - Use provided examples to verify compatibility

## Need Help?

- See full documentation: [OCR_POST_PROCESSING.md](./OCR_POST_PROCESSING.md)
- See usage examples: [ocr-usage-example.js](./ocr-usage-example.js)
- Check source code: [ocr-service.js](./ocr-service.js)
