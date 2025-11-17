'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ChevronDown, Plus, Edit2, Trash2, Check, X } from 'lucide-react'

export default function TermSelect({ terms, selectedTerm, onTermChange, onTermsChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const [editingTerm, setEditingTerm] = useState(null)
  const [editValue, setEditValue] = useState('')
  const [newTerm, setNewTerm] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)

  const handleEditStart = (term) => {
    setEditingTerm(term)
    setEditValue(term)
  }

  const handleEditSave = (oldTerm) => {
    if (editValue.trim() && editValue !== oldTerm) {
      const updatedTerms = terms.map((t) => (t === oldTerm ? editValue.trim() : t))
      onTermsChange(updatedTerms)
      if (selectedTerm === oldTerm) {
        onTermChange(editValue.trim())
      }
    }
    setEditingTerm(null)
    setEditValue('')
  }

  const handleRemoveTerm = (termToRemove) => {
    const updatedTerms = terms.filter((t) => t !== termToRemove)
    onTermsChange(updatedTerms)
    if (selectedTerm === termToRemove) {
      onTermChange('')
    }
  }

  const handleAddNewTerm = () => {
    if (newTerm.trim() && !terms.includes(newTerm.trim())) {
      const updatedTerms = [...terms, newTerm.trim()]
      onTermsChange(updatedTerms)
      onTermChange(newTerm.trim())
      setNewTerm('')
      setIsAddingNew(false)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button className="w-full px-3 py-2 text-left border border-input rounded-md bg-background hover:bg-accent transition-colors flex items-center justify-between">
          <span className={selectedTerm ? 'text-foreground' : 'text-muted-foreground'}>
            {selectedTerm || 'Select a term'}
          </span>
          <ChevronDown size={18} className="text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64 p-2">
        {/* Existing Terms List */}
        <div className="space-y-1">
          {terms.map((term) =>
            editingTerm === term ? (
              // Edit Mode
              <div key={term} className="flex gap-2 p-2 bg-secondary/50 rounded">
                <Input
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="Edit term"
                  className="h-8 text-sm"
                  autoFocus
                />
                <button
                  onClick={() => handleEditSave(term)}
                  className="p-1 hover:bg-background rounded transition-colors"
                  title="Save"
                >
                  <Check size={16} className="text-green-600" />
                </button>
                <button
                  onClick={() => setEditingTerm(null)}
                  className="p-1 hover:bg-background rounded transition-colors"
                  title="Cancel"
                >
                  <X size={16} className="text-muted-foreground" />
                </button>
              </div>
            ) : (
              // View Mode
              <div
                key={term}
                className={`group flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                  selectedTerm === term
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-secondary'
                }`}
              >
                <span
                  onClick={() => {
                    onTermChange(term)
                    setIsOpen(false)
                  }}
                  className="flex-1"
                >
                  {term}
                </span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditStart(term)}
                    className="p-1 hover:bg-background rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleRemoveTerm(term)}
                    className="p-1 hover:bg-background rounded transition-colors"
                    title="Remove"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          )}
        </div>

        <div className="border-t my-2"></div>

        {/* Add New Term */}
        {isAddingNew ? (
          <div className="flex gap-2 p-2">
            <Input
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="New term name"
              className="h-8 text-sm"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') handleAddNewTerm()
              }}
            />
            <button
              onClick={handleAddNewTerm}
              disabled={!newTerm.trim()}
              className="p-1 hover:bg-background rounded transition-colors disabled:opacity-50"
              title="Add"
            >
              <Check size={16} className="text-green-600" />
            </button>
            <button
              onClick={() => {
                setIsAddingNew(false)
                setNewTerm('')
              }}
              className="p-1 hover:bg-background rounded transition-colors"
              title="Cancel"
            >
              <X size={16} className="text-muted-foreground" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAddingNew(true)}
            className="w-full flex items-center gap-2 p-2 text-sm hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-foreground"
          >
            <Plus size={16} />
            Add New Term
          </button>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
