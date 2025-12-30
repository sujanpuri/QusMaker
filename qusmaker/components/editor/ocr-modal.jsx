'use client'

import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, X, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { processImage, parseQuestionFromText } from '@/lib/ocr-service'
import { saveImage } from '@/lib/storage'

export default function OCRModal({ open, onOpenChange, onQuestionParsed }) {
  const [step, setStep] = useState('select') // select, camera, processing, preview
  const [capturedImage, setCapturedImage] = useState(null)
  const [imageFile, setImageFile] = useState(null)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrResult, setOcrResult] = useState(null)
  const [parsedQuestion, setParsedQuestion] = useState(null)
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
    setParsedQuestion(null)
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

      // Parse question from OCR text
      const parsed = parseQuestionFromText(result.text)
      
      if (!parsed) {
        throw new Error('Could not parse question from image')
      }

      setParsedQuestion(parsed)
      setStep('preview')
      
    } catch (err) {
      console.error('OCR error:', err)
      setError(err.message || 'Failed to process image. Please try again.')
      setStep('select')
    }
  }

  const handleConfirm = async () => {
    if (parsedQuestion && imageFile) {
      try {
        // Save image to IndexedDB
        const imageId = Date.now()
        await saveImage(imageId, imageFile)
        
        // Pass parsed question with image ID to parent
        onQuestionParsed({
          ...parsedQuestion,
          imageId: imageId
        })
        
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
            <div>
              <p className="font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80">{error}</p>
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
                <p className="text-sm text-muted-foreground">Extracting text from image</p>
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

        {/* Step 4: Preview */}
        {step === 'preview' && parsedQuestion && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Original Image */}
              <div className="space-y-2">
                <h3 className="font-semibold">Original Image</h3>
                <div className="border rounded-lg overflow-hidden bg-muted">
                  <img src={capturedImage} alt="Scanned question" className="w-full h-auto" />
                </div>
              </div>

              {/* Extracted Data */}
              <div className="space-y-4">
                <h3 className="font-semibold">Extracted Question</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Question Type</label>
                    <p className="mt-1 px-3 py-2 bg-secondary rounded-md capitalize">
                      {parsedQuestion.type === 'mcq' ? 'Multiple Choice (MCQ)' : 'Descriptive'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Question Text</label>
                    <p className="mt-1 px-3 py-2 bg-secondary rounded-md">{parsedQuestion.question}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Marks</label>
                    <p className="mt-1 px-3 py-2 bg-secondary rounded-md">{parsedQuestion.marks}</p>
                  </div>

                  {parsedQuestion.type === 'mcq' && parsedQuestion.options.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Options</label>
                      <div className="mt-1 space-y-2">
                        {parsedQuestion.options.map((option, idx) => (
                          <div key={idx} className="px-3 py-2 bg-secondary rounded-md">
                            <span className="font-medium">{String.fromCharCode(97 + idx)}.</span> {option || '(empty)'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {ocrResult && ocrResult.confidence < 80 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Low Confidence:</strong> OCR accuracy is {Math.round(ocrResult.confidence)}%. Please review the extracted text carefully.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button onClick={handleRetry} variant="outline">
                Retake / Reupload
              </Button>
              <Button onClick={handleConfirm} className="gap-2">
                <CheckCircle className="w-4 h-4" />
                Looks Good - Add to Editor
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
