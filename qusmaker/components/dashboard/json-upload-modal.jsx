'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Upload, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { usePaper } from '@/context/paper-context'
import { validateQuestionPaperFormat, transformImportedData } from '@/lib/validate-json-format'

export default function JsonUploadModal({ open, onOpenChange }) {
  const router = useRouter()
  const { setCurrentPaper } = usePaper()
  const { data: session } = useSession()
  const fileInputRef = useRef(null)
  
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [fileData, setFileData] = useState(null)

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setIsLoading(true)

    // Check file type
    if (!file.name.endsWith('.json')) {
      setError('Only JSON files are supported')
      setIsLoading(false)
      return
    }

    // Read and parse the file
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        
        // Validate the format
        const validation = validateQuestionPaperFormat(data)
        
        if (!validation.valid) {
          setError(validation.error)
          setIsLoading(false)
          return
        }

        // Format is valid
        setFileData(data)
        setUploadedFileName(file.name)
        setError('')
      } catch (parseError) {
        setError('Invalid JSON file. Please check the file format.')
      } finally {
        setIsLoading(false)
      }
    }

    reader.onerror = () => {
      setError('Failed to read the file')
      setIsLoading(false)
    }

    reader.readAsText(file)
  }

  const handleImport = async () => {
    if (!fileData) return

    try {
      const paperData = transformImportedData(fileData)
      setCurrentPaper(paperData)
      
      // Log activity to database
      if (session?.user) {
        try {
          const fileName = `${paperData.subject}_${paperData.className}_${paperData.term || 'Paper'}`.replace(/\s+/g, '_')
          
          console.log('Logging activity:', { fileName, session: session.user.email })
          
          const response = await fetch('/api/activity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'imported',
              fileName: fileName,
              fileType: 'json',
            }),
          })
          
          const result = await response.json()
          console.log('Activity API response:', result)
          
          if (!response.ok) {
            console.error('Activity logging failed:', result)
          }
        } catch (activityError) {
          console.error('Failed to log activity:', activityError)
          // Don't block the import if activity logging fails
        }
      } else {
        console.log('No session available for activity logging')
      }
      
      // Reset state and close
      setFileData(null)
      setUploadedFileName('')
      setError('')
      onOpenChange(false)
      
      // Navigate to editor
      router.push(`/editor/${paperData.id}`)
    } catch (err) {
      setError('Failed to import the question paper')
    }
  }

  const handleReset = () => {
    setFileData(null)
    setUploadedFileName('')
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Question Paper</DialogTitle>
          <DialogDescription>
            Upload a JSON file to import an existing question paper
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!fileData ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
            >
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Click to upload JSON file</p>
              <p className="text-xs text-muted-foreground mt-1">or drag and drop</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                disabled={isLoading}
                className="hidden"
              />
            </div>
          ) : (
            <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-green-600 mt-1">✓</div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">File validated successfully</p>
                  <p className="text-xs text-muted-foreground mt-1">{uploadedFileName}</p>
                  <div className="text-xs text-muted-foreground mt-2 space-y-1">
                    <p><strong>Subject:</strong> {fileData.subject}</p>
                    <p><strong>Class:</strong> {fileData.className}</p>
                    <p><strong>Term:</strong> {fileData.term}</p>
                    <p><strong>Questions:</strong> {fileData.questions.length}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {fileData && (
            <Button variant="outline" onClick={handleReset}>
              Choose Different File
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {fileData && (
            <Button onClick={handleImport} disabled={isLoading}>
              Import & Open
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
