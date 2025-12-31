'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { processImage, processOCRText, getExtractionSummary } from '@/lib/ocr-service'
import { saveImage } from '@/lib/storage'

export default function OCRModal({ open, onOpenChange, onQuestionParsed }) {
  const [step, setStep] = useState('select') // select, camera, processing, preview, summary
  const [capturedImage, setCapturedImage] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrResult, setOcrResult] = useState(null)
  const [extractedQuestions, setExtractedQuestions] = useState(null)
  const [extractionSummary, setExtractionSummary] = useState('')
  const [error, setError] = useState(null)
  
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  const fileInputRef = useRef(null)

  // Cleanup camera stream when modal closes
  useEffect(() => {
    if (!open) {
      stopCamera()
      resetState()
    }
  }, [open])

  const resetState = () => {
    setStep('select')
    setCapturedImage(null)
    setImageFile(null)
    setOcrProgress(0)
    setOcrResult(null)
    setExtractedQuestions(null)
    setExtractionSummary('')
    setError(null)
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  const startCamera = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera on mobile
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setStep('camera')
    } catch (err) {
      console.error('Camera error:', err)
      setError('Unable to access camera. Please use upload option.')
    }
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      
      canvas.toBlob((blob) => {
        const file = new File([blob], 'captured-image.jpg', { type: 'image/jpeg' })
        setImageFile(file)
        setCapturedImage(canvas.toDataURL('image/jpeg'))
        stopCamera()
        processOCR(file)
      }, 'image/jpeg', 0.95)
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setCapturedImage(e.target.result)
        processOCR(file)
      }
      reader.readAsDataURL(file)
    }
  }

  const processOCR = async (file) => {
    setStep('processing')
    setError(null)
    setOcrProgress(0)

    try {
      // Process image with OCR
      const result = await processImage(file, (progress) => {
        setOcrProgress(Math.round(progress * 100))
      })

      if (!result.success) {
        throw new Error(result.error || 'OCR processing failed')
      }

      setOcrResult(result)

      // Extract ALL questions from OCR text using new post-processing
      const extraction = processOCRText(result.text)
      
      if (!extraction.success) {
        throw new Error(extraction.error || 'Could not extract questions from image')
      }

      if (extraction.totalQuestions === 0) {
        throw new Error('No questions detected in the image. Please ensure the image contains clear question text.')
      }

      // Generate summary for user confirmation
      const summary = getExtractionSummary(extraction)
      
      setExtractedQuestions(extraction)
      setExtractionSummary(summary)
      setStep('summary')
      
    } catch (err) {
      console.error('❌ OCR Modal Error:', err);
      
      let errorMsg = err.message || 'Failed to process image. Please try again.';
      
      // Add helpful debugging info
      if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
        errorMsg = 'API Key not found. Please create a .env.local file with NEXT_PUBLIC_GEMINI_API_KEY';
      }
      
      setError(errorMsg);
      setStep('select')
    }
  }

  const handleConfirm = async () => {
    if (extractedQuestions && imageFile) {
      try {
        // Save image to IndexedDB
        const imageId = Date.now()
        await saveImage(imageId, imageFile)
        
        // Convert all extracted questions to editor format and pass to parent
        const allQuestions = []
        extractedQuestions.groups.forEach(group => {
          group.questions.forEach(q => {
            allQuestions.push({
              type: q.questionType,
              question: q.questionText,
              marks: q.marks || 1,
              options: q.options || [],
              subQuestions: q.subQuestions || [],
              imageId: imageId,
              groupName: group.groupName,
              questionNumber: q.questionNumber
            })
          })
        })
        
        // Pass all questions to parent (it should handle adding multiple questions)
        onQuestionParsed(allQuestions)
        
        onOpenChange(false)
        resetState()
      } catch (err) {
        console.error('Error saving image:', err)
        setError('Failed to save image. Please try again.')
      }
    }
  }

  const handleRetry = () => {
    resetState()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Scan Question</DialogTitle>
          <DialogDescription>
            Capture or upload a photo of a question to automatically extract and parse it
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
              <details className="mt-2">
                <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">Show technical details</summary>
                <div className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded text-xs font-mono">
                  <p>Check browser console (F12) for detailed error logs</p>
                  <p className="mt-1">API Key: {process.env.NEXT_PUBLIC_GEMINI_API_KEY ? '✓ Configured' : '✗ Not configured'}</p>
                </div>
              </details>
            </div>
          </div>
        )}

        {/* Step 1: Select method */}
        {step === 'select' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
            <button
              onClick={startCamera}
              className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Camera className="w-12 h-12 text-primary" />
              <div>
                <h3 className="font-semibold text-lg">Take Photo</h3>
                <p className="text-sm text-muted-foreground">Use your camera to capture</p>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-4 p-8 border-2 border-dashed rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
            >
              <Upload className="w-12 h-12 text-primary" />
              <div>
                <h3 className="font-semibold text-lg">Upload Photo</h3>
                <p className="text-sm text-muted-foreground">Choose from your device</p>
              </div>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Step 2: Camera view */}
        {step === 'camera' && (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex gap-3 justify-center">
              <Button onClick={capturePhoto} size="lg">
                <Camera className="w-5 h-5 mr-2" />
                Capture Photo
              </Button>
              <Button onClick={() => { stopCamera(); setStep('select'); }} variant="outline" size="lg">
                Cancel
              </Button>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}

        {/* Step 3: Processing */}
        {step === 'processing' && (
          <div className="py-12 space-y-6">
            {capturedImage && (
              <div className="flex justify-center">
                <img src={capturedImage} alt="Captured" className="max-w-md max-h-64 object-contain rounded-lg" />
              </div>
            )}
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <div>
                <p className="font-semibold text-lg">Processing Image...</p>
                <p className="text-sm text-muted-foreground">Extracting text with Gemini AI</p>
              </div>
              <div className="max-w-xs mx-auto">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${ocrProgress}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground mt-2">{ocrProgress}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Summary - Show ALL extracted questions */}
        {step === 'summary' && extractedQuestions && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Image */}
              <div className="space-y-2">
                <h3 className="font-semibold">Original Image</h3>
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <img src={capturedImage} alt="Scanned question" className="w-full h-auto" />
                </div>
              </div>

              {/* Extraction Summary */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Extracted Questions</h3>
                  <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                    ✓ {extractedQuestions.totalQuestions} Question{extractedQuestions.totalQuestions !== 1 ? 's' : ''} Found
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-secondary/50 max-h-96 overflow-y-auto">
                  <pre className="text-sm whitespace-pre-wrap font-mono">{extractionSummary}</pre>
                </div>

                {ocrResult && ocrResult.confidence < 90 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Note:</strong> Please review the extracted questions carefully to ensure accuracy.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Question List */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Question Details</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto border rounded-lg p-4">
                {extractedQuestions.groups.map((group, groupIdx) => (
                  <div key={groupIdx} className="space-y-3">
                    {extractedQuestions.groups.length > 1 && (
                      <div className="font-semibold text-primary border-b pb-2">
                        📂 {group.groupName}
                      </div>
                    )}
                    {group.questions.map((q, qIdx) => (
                      <div key={qIdx} className="bg-secondary/30 rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="font-medium">
                            Q{q.questionNumber}: {q.questionType === 'mcq' ? '☑️ MCQ' : 
                                                   q.questionType === 'short_question' ? '📝 Short Answer' :
                                                   q.questionType === 'long_question' ? '📄 Long Answer' :
                                                   '📋 Sub-Questions'}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {q.marks} mark{q.marks !== 1 ? 's' : ''}
                          </div>
                        </div>
                        <p className="text-sm">{q.questionText}</p>
                        
                        {q.questionType === 'mcq' && q.options && q.options.length > 0 && (
                          <div className="pl-4 space-y-1 text-sm">
                            {q.options.map((opt, optIdx) => (
                              opt && <div key={optIdx}>({String.fromCharCode(97 + optIdx)}) {opt}</div>
                            ))}
                          </div>
                        )}
                        
                        {q.subQuestions && q.subQuestions.length > 0 && (
                          <div className="pl-4 space-y-1 text-sm">
                            {q.subQuestions.map((sub, subIdx) => (
                              <div key={subIdx}>({sub.subQuestionId}) {sub.subQuestionText}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button onClick={handleRetry} variant="outline">
                Retake / Reupload
              </Button>
              <Button onClick={handleConfirm} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Confirm - Add All {extractedQuestions.totalQuestions} Question{extractedQuestions.totalQuestions !== 1 ? 's' : ''} to Editor
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
