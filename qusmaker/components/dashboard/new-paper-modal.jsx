'use client'

import { useState } from 'react'
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

export default function NewPaperModal({ open, onOpenChange, onCreate }) {
  const [paperName, setPaperName] = useState('')

  const handleCreate = () => {
    if (paperName.trim()) {
      onCreate(paperName)
      setPaperName('')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Question Paper</DialogTitle>
          <DialogDescription>
            Enter a name for your new question paper. You can add questions after creation.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Input
            placeholder="e.g., Mathematics Mid-term Exam"
            value={paperName}
            onChange={(e) => setPaperName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!paperName.trim()}>
            Create Paper
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
