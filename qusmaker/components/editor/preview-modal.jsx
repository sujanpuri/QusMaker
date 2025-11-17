'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Download, Loader } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { getImage } from '@/lib/storage'

export default function PreviewModal({
  open,
  onOpenChange,
  paperData,
  headerInfo,
  paperFormat,
  questions,
  onExport,
  isExporting,
}) {
  const [customFilename, setCustomFilename] = useState('')
  const [showFilenameInput, setShowFilenameInput] = useState(false)
  const [loadedImages, setLoadedImages] = useState({})

  // Load images from IndexedDB when modal opens
  useEffect(() => {
    if (open) {
      const loadAllImages = async () => {
        const imageMap = {}
        for (const question of questions) {
          if (question.images && question.images.length > 0) {
            for (const img of question.images) {
              if (img.id && !img.src) {
                const imageData = await getImage(img.id)
                if (imageData) {
                  imageMap[img.id] = imageData
                }
              } else if (img.src) {
                imageMap[img.id] = img.src
              }
            }
          }
        }
        setLoadedImages(imageMap)
      }
      loadAllImages()
    }
  }, [open, questions])

  const generateDefaultFilename = () => {
    if (!paperData) return 'question-paper'
    const { year, subject, className, term } = paperData
    return `${year}_${subject}_${className}_${term}`.replace(/\s+/g, '_').toLowerCase()
  }

  const defaultFilename = generateDefaultFilename()

  const getPreviewDimensions = () => {
    // A4 = 210mm x 297mm, at 96 DPI = ~794px x ~1122px
    return {
      width: '794px',
      maxWidth: '794px',
      pageHeight: 'auto',
    }
  }

  const dimensions = getPreviewDimensions()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Question Paper Preview (A4 Size)</DialogTitle>
          <DialogDescription>
            Preview how your question paper will look when printed
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center overflow-auto bg-secondary/20 p-4 rounded-lg">
          <div
            style={{
              width: dimensions.width,
              maxWidth: dimensions.maxWidth,
              backgroundColor: 'white',
              padding: '30px',
              boxShadow: '0 0 20px rgba(0,0,0,0.1)',
              fontFamily: 'serif',
              fontSize: '14px',
              lineHeight: '1.5',
            }}
          >
            {/* Header with 3-column layout */}
            <div style={{ marginBottom: '16px' }}>
              {/* School Name */}
              <div style={{ textAlign: 'center', marginBottom: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                  {headerInfo?.schoolName || 'School Name'}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {headerInfo?.location || 'Location'}
                </div>
              </div>

              {/* Main Header Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '16px',
                  marginBottom: '12px',
                  fontSize: '13px',
                }}
              >
                {/* Left */}
                <div>
                  <div style={{ marginBottom: '2px' }}>
                    <strong>Class:</strong> {headerInfo?.className || 'N/A'}
                  </div>
                  <div>
                    <strong>Subject:</strong> {headerInfo?.subject || 'N/A'}
                  </div>
                </div>

                {/* Center */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: '2px' }}>
                    {headerInfo?.year || new Date().getFullYear()}
                  </div>
                </div>

                {/* Right */}
                <div style={{ textAlign: 'right' }}>
                  <div style={{ marginBottom: '2px' }}>
                    <strong>Full Marks:</strong> {headerInfo?.fullMarks || 100}
                  </div>
                  <div>
                    <strong>Time:</strong> {headerInfo?.examHours || '2hrs'}
                  </div>
                </div>
              </div>

              <hr style={{ margin: '12px 0', borderColor: '#ddd' }} />

              {/* Additional Info */}
              <div style={{ fontSize: '12px', textAlign: 'center', color: '#666' }}>
                Total Questions: {questions.filter(q => q.type !== 'group').length} | Total
                Marks:{' '}
                {questions.reduce((sum, q) => {
                  if (q.type === 'group') return sum
                  if (q.type === 'qusWithSubQus' && q.subQuestions) {
                    return sum + q.subQuestions.reduce((subSum, subQ) => {
                      const marks = typeof subQ.marks === 'string' ? parseInt(subQ.marks) || 0 : subQ.marks || 0
                      return subSum + marks
                    }, 0)
                  }
                  const marks = typeof q.marks === 'string' ? parseInt(q.marks) || 0 : q.marks || 0
                  return sum + marks
                }, 0)}
              </div>
            </div>

            {/* Questions */}
            <div style={{ fontSize: '14px' }}>
              {(() => {
                let groupQuestionNumbers = {}

                return questions.map((question, index) => {
                  // Group header
                  if (question.type === 'group') {
                    groupQuestionNumbers[question.groupName] = 0
                    return (
                      <div
                        key={question.id}
                        style={{
                          marginTop: '16px',
                          marginBottom: '12px',
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <div style={{ flex: 1 }}></div>
                          <div style={{
                            fontWeight: 'bold',
                            fontSize: '15px',
                            textAlign: 'center',
                            flex: 1
                          }}>
                            {question.groupName}
                          </div>
                          <div style={{
                            textAlign: 'right',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            flex: 1
                          }}>
                            {question.marks ? `[${question.marks}]` : ''}
                          </div>
                        </div>
                        {question.message && (
                          <div style={{
                            textAlign: 'center',
                            fontSize: '12px',
                            fontStyle: 'italic',
                            color: '#666',
                            marginBottom: '8px'
                          }}>
                            {question.message}
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Find current group
                  let currentGroup = 'Group A'
                  for (let i = index - 1; i >= 0; i--) {
                    if (questions[i].type === 'group') {
                      currentGroup = questions[i].groupName
                      break
                    }
                  }

                  // Increment question number for this group
                  groupQuestionNumbers[currentGroup] = (groupQuestionNumbers[currentGroup] || 0) + 1
                  const questionNum = groupQuestionNumbers[currentGroup]

                  // MCQ
                  if (question.type === 'mcq') {
                    return (
                      <div key={question.id} style={{ marginBottom: '10px' }}>
                        <div style={{ marginBottom: '4px' }}>
                          <strong>
                            {questionNum}. {question.question}
                          </strong>{' '}
                          ({question.marks} marks)
                        </div>
                        {question.options && question.options.length > 0 && (
                          <div style={{ marginLeft: '16px' }}>
                            {(() => {
                              const rows = []
                              for (let i = 0; i < question.options.length; i += 2) {
                                rows.push(
                                  <div key={i} style={{ display: 'flex', gap: '40px', marginBottom: '4px' }}>
                                    <span>
                                      {String.fromCharCode(97 + i)}. {question.options[i]}
                                    </span>
                                    {i + 1 < question.options.length && (
                                      <span>
                                        {String.fromCharCode(97 + i + 1)}. {question.options[i + 1]}
                                      </span>
                                    )}
                                  </div>
                                )
                              }
                              return rows
                            })()}
                          </div>
                        )}
                        {question.images && question.images.length > 0 && (
                          <div style={{ marginLeft: '16px', marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {question.images.map((img) => (
                              <img
                                key={img.id}
                                src={loadedImages[img.id] || img.src}
                                alt={img.alt || ''}
                                style={{ maxHeight: '100px', border: '1px solid #ddd', borderRadius: '4px' }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Question with Sub-Questions
                  if (question.type === 'qusWithSubQus') {
                    return (
                      <div key={question.id} style={{ marginBottom: '10px' }}>
                        <div style={{ marginBottom: '4px' }}>
                          <strong>
                            {questionNum}. {question.question}
                          </strong>{' '}
                          ({question.marks} marks)
                        </div>
                        {question.subQuestions && question.subQuestions.length > 0 && (
                          <div style={{ marginLeft: '16px', lineHeight: '1.6' }}>
                            {question.subQuestions.map((subQ, subIndex) => (
                              <div key={subIndex}>
                                {String.fromCharCode(97 + subIndex)}) {subQ.question || ''}
                              </div>
                            ))}
                          </div>
                        )}
                        {question.images && question.images.length > 0 && (
                          <div style={{ marginLeft: '16px', marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {question.images.map((img) => (
                              <img
                                key={img.id}
                                src={loadedImages[img.id] || img.src}
                                alt={img.alt || ''}
                                style={{ maxHeight: '100px', border: '1px solid #ddd', borderRadius: '4px' }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Simple Question
                  if (question.type === 'question') {
                    return (
                      <div key={question.id} style={{ marginBottom: '10px' }}>
                        <div style={{ marginBottom: '4px' }}>
                          <strong>
                            {questionNum}. {question.question}
                          </strong>{' '}
                          ({question.marks} marks)
                        </div>
                        {question.images && question.images.length > 0 && (
                          <div style={{ marginLeft: '16px', marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {question.images.map((img) => (
                              <img
                                key={img.id}
                                src={loadedImages[img.id] || img.src}
                                alt={img.alt || ''}
                                style={{ maxHeight: '100px', border: '1px solid #ddd', borderRadius: '4px' }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  }

                  return null
                })
              })()}
              
              {/* The End */}
              <div style={{
                textAlign: 'center',
                marginTop: '24px',
                paddingTop: '16px',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                The End
              </div>
            </div>
          </div>
        </div>

        {/* Filename Input */}
        <div className="border-t pt-4 space-y-2">
          <label className="text-sm font-medium">Export Filename (optional)</label>
          {!showFilenameInput ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{defaultFilename}.pdf</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilenameInput(true)}
              >
                Edit
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={customFilename}
                onChange={(e) => setCustomFilename(e.target.value)}
                className="flex-1"
                autoFocus
                placeholder={defaultFilename}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setShowFilenameInput(false)
                  setCustomFilename('')
                }}
              >
                Reset
              </Button>
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Default: {defaultFilename}.pdf
          </p>
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md">
            <p className="text-sm text-blue-900 dark:text-blue-100 font-medium mb-1">
              📥 Important: JSON Backup
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Both PDF and JSON files will be downloaded. Keep the JSON file safe for future use - you can import it later to restore this question paper.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Close
          </Button>
          <Button
            onClick={() => onExport(customFilename || defaultFilename)}
            disabled={isExporting || questions.length === 0}
          >
            {isExporting ? (
              <>
                <Loader className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export as PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
