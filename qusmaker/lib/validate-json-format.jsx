// Validates if a JSON file matches the Qus-Maker question paper format
export function validateQuestionPaperFormat(data) {
  // Check if data is an object
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'Invalid JSON format' }
  }

  // Check if it's the exported format (has paperData and questions)
  let paperData = data.paperData || data
  let questions = data.questions || []
  
  // If paperData exists separately, use it
  if (data.paperData && data.questions) {
    paperData = data.paperData
    questions = data.questions
  }

  // Check required paper metadata fields (matching exported format)
  const requiredFields = ['subject', 'className']
  for (const field of requiredFields) {
    if (!paperData[field]) {
      return { valid: false, error: `Missing required field: ${field}` }
    }
  }

  // Check if questions array exists and is valid
  if (!Array.isArray(questions)) {
    return { valid: false, error: 'Questions must be an array' }
  }

  // Validate each question
  for (let i = 0; i < questions.length; i++) {
    const question = questions[i]
    
    // Skip validation for group headers
    if (question.type === 'group') {
      if (!question.groupName || typeof question.groupName !== 'string') {
        return { valid: false, error: `Question ${i + 1}: Group must have a groupName` }
      }
      continue
    }
    
    // All non-group questions need a question text
    if (!question.question || typeof question.question !== 'string') {
      return { valid: false, error: `Question ${i + 1}: Missing or invalid question text` }
    }
    
    // MCQ specific validation
    if (question.type === 'mcq') {
      if (!Array.isArray(question.options) || question.options.length < 2) {
        return { valid: false, error: `Question ${i + 1}: MCQ must have at least 2 options` }
      }
    }
    
    // Question with sub-questions validation
    if (question.type === 'qusWithSubQus') {
      if (!Array.isArray(question.subQuestions) || question.subQuestions.length === 0) {
        return { valid: false, error: `Question ${i + 1}: Question with sub-questions must have at least one sub-question` }
      }
      
      for (let j = 0; j < question.subQuestions.length; j++) {
        const subQ = question.subQuestions[j]
        if (!subQ.question || typeof subQ.question !== 'string') {
          return { valid: false, error: `Question ${i + 1}, sub-question ${j + 1}: Missing question text` }
        }
      }
      continue
    }
  }

  return { valid: true, error: null }
}

// Transforms imported JSON into the internal format
export function transformImportedData(data) {
  // Handle both old and new export formats
  let paperData = data.paperData || data
  let questions = data.questions || []
  
  return {
    id: Date.now(),
    subject: paperData.subject,
    className: paperData.className,
    term: paperData.term || '',
    schoolName: paperData.schoolName || 'School Name',
    location: paperData.location || 'Location',
    year: paperData.year || new Date().getFullYear(),
    fullMarks: paperData.fullMarks || 100,
    examHours: paperData.examHours || paperData.time || '2hrs',
    questions: questions.map((q) => ({
      id: Math.random(),
      ...q,
    })),
    createdAt: new Date().toISOString().split('T')[0],
  }
}
