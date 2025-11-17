'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
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
import TermSelect from './term-select'
import { usePaper } from '@/context/paper-context'

const DEFAULT_TERMS = ['1st Term', '2nd Term', '3rd Term', 'Final Term']

export default function CreatePaperModal({ open, onOpenChange }) {
  const router = useRouter()
  const { setCurrentPaper } = usePaper()
  const { data: session } = useSession()
  
  const [formData, setFormData] = useState({
    subject: '',
    className: '',
    term: '',
  })
  
  const [terms, setTerms] = useState(DEFAULT_TERMS)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleTermChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      term: value,
    }))
  }

  const handleTermsChange = (updatedTerms) => {
    setTerms(updatedTerms)
  }

  const handleCreate = async () => {
    if (formData.subject.trim() && formData.className.trim() && formData.term) {
      // Create paper data without saving to backend
      const paperData = {
        id: Date.now(),
        subject: formData.subject.trim(),
        className: formData.className.trim(),
        term: formData.term,
        questions: [],
        createdAt: new Date().toISOString().split('T')[0],
        year: new Date().getFullYear(),
      }

      setCurrentPaper(paperData)
      
      // Log activity to database
      if (session?.user) {
        try {
          const fileName = `${paperData.subject}_${paperData.className}_${paperData.term}`.replace(/\s+/g, '_')
          
          console.log('Logging activity for new paper:', { fileName, session: session.user.email })
          
          const response = await fetch('/api/activity', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: 'created',
              fileName: fileName,
              fileType: 'new',
            }),
          })
          
          const result = await response.json()
          console.log('Activity API response:', result)
          
          if (!response.ok) {
            console.error('Activity logging failed:', result)
          }
        } catch (activityError) {
          console.error('Failed to log activity:', activityError)
          // Don't block the creation if activity logging fails
        }
      } else {
        console.log('No session available for activity logging')
      }
      
      // Reset form and close modal
      setFormData({ subject: '', className: '', term: '' })
      onOpenChange(false)
      
      // Navigate to editor page
      router.push(`/editor/${paperData.id}`)
    }
  }

  const isFormValid = formData.subject.trim() && formData.className.trim() && formData.term

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Question Paper</DialogTitle>
          <DialogDescription>
            Fill in the details of your question paper
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Subject Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Subject Name</label>
            <Input
              name="subject"
              placeholder="e.g., Mathematics"
              value={formData.subject}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && isFormValid && handleCreate()}
            />
          </div>

          {/* Class Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Class Name</label>
            <Input
              name="className"
              placeholder="e.g., Class 10A"
              value={formData.className}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && isFormValid && handleCreate()}
            />
          </div>

          {/* Term Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Exam Term</label>
            <TermSelect
              terms={terms}
              selectedTerm={formData.term}
              onTermChange={handleTermChange}
              onTermsChange={handleTermsChange}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!isFormValid}>
            Create Paper
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
