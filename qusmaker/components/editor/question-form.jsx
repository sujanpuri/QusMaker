'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Trash2, GripVertical, Plus, ImageIcon, Shapes, X, Type, Edit2, Check } from 'lucide-react'
import { saveImage, getImage, deleteImage } from '@/lib/storage'

export default function QuestionForm({
  question,
  index,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onRenameGroup,
  isRenamingGroup,
  renamingValue,
  setRenamingValue,
  onConfirmRename,
}) {
  const [formData, setFormData] = useState(question)
  const [showMediaMenu, setShowMediaMenu] = useState(false)
  const [editingShapeId, setEditingShapeId] = useState(null)
  const [loadedImages, setLoadedImages] = useState({})
  const fileInputRef = useRef(null)

  // Sync formData with question prop changes
  useEffect(() => {
    setFormData(question)
  }, [question])

  // Load images from IndexedDB when component mounts or images change
  useEffect(() => {
    const loadImagesFromDB = async () => {
      if (formData.images && formData.images.length > 0) {
        const imagesToLoad = formData.images.filter(img => img.id && !img.src)
        
        if (imagesToLoad.length > 0) {
          const loaded = {}
          await Promise.all(
            imagesToLoad.map(async (img) => {
              const imageData = await getImage(img.id)
              if (imageData) {
                loaded[img.id] = imageData
              }
            })
          )
          setLoadedImages(prev => ({ ...prev, ...loaded }))
        }
      }
    }
    
    loadImagesFromDB()
  }, [formData.images])

  const handleChange = (field, value) => {
    const newData = { ...formData, [field]: value }
    setFormData(newData)
    onUpdate(question.id, newData)
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = async (event) => {
        const imageId = `img-${Date.now()}-${Math.random()}`
        const base64Data = event.target.result
        
        try {
          // Save to IndexedDB
          await saveImage(imageId, base64Data)
          
          // Store only imageId in question data
          const newImages = [...(formData.images || []), {
            id: imageId,
            src: base64Data, // Keep in memory for immediate display
            alt: file.name
          }]
          handleChange('images', newImages)
        } catch (error) {
          console.error('Failed to save image:', error)
          alert('Failed to save image. Please try again.')
        }
      }
      reader.readAsDataURL(file)
    }
    setShowMediaMenu(false)
  }

  const handleRemoveImage = async (imageId) => {
    try {
      // Delete from IndexedDB
      await deleteImage(imageId)
    } catch (error) {
      console.error('Failed to delete image from IndexedDB:', error)
    }
    
    const newImages = (formData.images || []).filter(img => img.id !== imageId)
    handleChange('images', newImages)
  }

  // Shape handlers
  const handleAddShape = (shapeType) => {
    const newShape = {
      id: Math.random(),
      type: shapeType,
      text: '',
      width: 150,
      height: 100,
    }
    const newShapes = [...(formData.shapes || []), newShape]
    handleChange('shapes', newShapes)
    setShowMediaMenu(false)
  }

  const handleShapeTextChange = (shapeId, text) => {
    const newShapes = (formData.shapes || []).map(shape =>
      shape.id === shapeId ? { ...shape, text } : shape
    )
    handleChange('shapes', newShapes)
  }

  const handleRemoveShape = (shapeId) => {
    const newShapes = (formData.shapes || []).filter(shape => shape.id !== shapeId)
    handleChange('shapes', newShapes)
  }

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options]
    newOptions[index] = value
    handleChange('options', newOptions)
  }

  const handleAddOption = () => {
    const newOptions = [...(formData.options || []), '']
    handleChange('options', newOptions)
  }

  const handleRemoveOption = (index) => {
    const newOptions = formData.options.filter((_, i) => i !== index)
    handleChange('options', newOptions)
  }

  const handleSubQuestionChange = (index, value) => {
    const newSubQuestions = [...(formData.subQuestions || [])]
    newSubQuestions[index] = { ...newSubQuestions[index], question: value }
    handleChange('subQuestions', newSubQuestions)
  }

  const handleSubQuestionMarksChange = (index, value) => {
    const newSubQuestions = [...(formData.subQuestions || [])]
    newSubQuestions[index] = { ...newSubQuestions[index], marks: value }
    handleChange('subQuestions', newSubQuestions)
  }

  const handleAddSubQuestion = () => {
    const newSubQuestions = [...(formData.subQuestions || []), { question: '', marks: '' }]
    handleChange('subQuestions', newSubQuestions)
  }

  const handleRemoveSubQuestion = (index) => {
    const newSubQuestions = formData.subQuestions.filter((_, i) => i !== index)
    handleChange('subQuestions', newSubQuestions)
  }

  // Media Display Component with horizontal layout for 2+ images
  const MediaDisplay = () => {
    const hasMedia = (formData.images?.length > 0) || (formData.shapes?.length > 0)
    if (!hasMedia) return null

    return (
      <div className="border-t pt-2 mt-2 space-y-1">
        {(formData.images || []).length > 0 && (
          <div className={`flex gap-2 flex-wrap`}>
            {(formData.images || []).map((image) => {
              // Use loaded image from IndexedDB if available, otherwise use in-memory src
              const imgSrc = image.src || loadedImages[image.id] || "/placeholder.svg"
              
              return (
                <div key={image.id} className="relative">
                  <img
                    src={imgSrc}
                    alt={image.alt}
                    className="h-24 w-auto border rounded"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveImage(image.id)}
                    className="absolute top-0 right-0 bg-destructive hover:bg-destructive text-white h-6 w-6 p-0"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}

        {/* Shapes */}
        {(formData.shapes || []).length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {(formData.shapes || []).map((shape) => (
              <div key={shape.id} className="relative inline-flex">
                <div
                  onClick={() => setEditingShapeId(shape.id)}
                  className={`cursor-pointer flex items-center justify-center text-center p-1 text-xs ${
                    shape.type === 'circle' ? 'rounded-full' : 'border-2'
                  } bg-secondary`}
                  style={{
                    width: shape.width,
                    height: shape.height,
                  }}
                >
                  {editingShapeId === shape.id ? (
                    <textarea
                      value={shape.text}
                      onChange={(e) => handleShapeTextChange(shape.id, e.target.value)}
                      onBlur={() => setEditingShapeId(null)}
                      autoFocus
                      className="w-full h-full p-1 text-center bg-transparent border-none outline-none resize-none text-xs"
                      placeholder="Type here..."
                    />
                  ) : (
                    <div className="text-xs wrap-break-word">{shape.text || '...'}</div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveShape(shape.id)}
                  className="absolute -top-2 -right-2 bg-destructive hover:bg-destructive text-white h-5 w-5 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Media Button Component
  const MediaButton = () => (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowMediaMenu(!showMediaMenu)}
        className="gap-2 h-8"
      >
        <ImageIcon className="w-4 h-4" />
        Add Media
      </Button>

      {showMediaMenu && (
        <div className="absolute z-10 w-40 mt-1 bg-background border border-border rounded-lg shadow-lg">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full text-left px-4 py-2 hover:bg-secondary text-sm flex items-center gap-2 text-foreground"
          >
            <ImageIcon className="w-4 h-4" />
            Add Image
          </button>
          <button
            onClick={() => handleAddShape('rectangle')}
            className="w-full text-left px-4 py-2 hover:bg-secondary text-sm flex items-center gap-2 text-foreground"
          >
            <Shapes className="w-4 h-4" />
            Rectangle
          </button>
          <button
            onClick={() => handleAddShape('circle')}
            className="w-full text-left px-4 py-2 hover:bg-secondary text-sm flex items-center gap-2 text-foreground"
          >
            <Shapes className="w-4 h-4" />
            Circle
          </button>
          <button
            onClick={() => handleAddShape('triangle')}
            className="w-full text-left px-4 py-2 hover:bg-secondary text-sm flex items-center gap-2 text-foreground"
          >
            <Shapes className="w-4 h-4" />
            Triangle
          </button>
          <button
            onClick={() => setShowMediaMenu(false)}
            className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-muted-foreground border-t"
          >
            Cancel
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />
    </div>
  )

  if (question.type === 'group') {
    const isGroupA = question.groupName === 'Group A'
    
    return (
      <Card
        draggable={!isGroupA}
        onDragStart={(e) => !isGroupA && onDragStart(e, index)}
        onDragOver={onDragOver}
        onDrop={(e) => !isGroupA && onDrop(e, index)}
        className={`mb-1 ${!isGroupA ? 'cursor-move' : ''}`}
      >
        <CardContent className="pt-2 pb-2 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              {!isGroupA && <GripVertical className="w-5 h-5 text-muted-foreground shrink-0" />}
              {isRenamingGroup ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={renamingValue}
                    onChange={(e) => setRenamingValue(e.target.value)}
                    className="font-bold h-8"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onConfirmRename}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <h3 className="text-base font-bold text-foreground">
                  {question.groupName || 'Group A'}
                </h3>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {!isGroupA && !isRenamingGroup && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRenameGroup(question.id, question.groupName)}
                  className="h-8"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
              {!isGroupA && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(question.id)}
                  className="text-destructive hover:text-destructive h-8"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
          
          {/* Message and Marks fields */}
          <div className="flex items-center gap-2 ml-7">
            <Input
              value={formData.message || ''}
              onChange={(e) => handleChange('message', e.target.value)}
              placeholder="Message (e.g., Attempt any 8 questions)"
              className="flex-1 h-8 text-sm"
            />
            <Input
              value={formData.marks || ''}
              onChange={(e) => handleChange('marks', e.target.value)}
              placeholder="Marks (e.g., 5×8=40)"
              className="w-32 h-8 text-sm text-center"
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Render Question with SubQuestions
  if (question.type === 'qusWithSubQus') {
    return (
      <Card
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, index)}
        className="mb-1 cursor-move"
      >
        <CardContent className="pt-2 pb-2 space-y-1">
          {/* Main Question */}
          <div className="flex items-start gap-2">
            <GripVertical className="w-5 h-5 text-muted-foreground mt-1 shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground min-w-fit text-sm">Q{index}.</span>
                <Input
                  value={formData.question}
                  onChange={(e) => handleChange('question', e.target.value)}
                  placeholder="Enter main question"
                  className="flex-1 border-none shadow-none focus-visible:ring-1 h-8 text-sm"
                />
                <Input
                  type="text"
                  value={formData.marks}
                  onChange={(e) => handleChange('marks', e.target.value)}
                  className="w-14 text-center h-8 text-sm"
                  placeholder="M"
                />
              </div>

              {/* Sub Questions */}
              <div className="ml-4 space-y-1 border-l border-secondary pl-2">
                {(formData.subQuestions || []).map((subQ, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className="font-medium text-muted-foreground min-w-fit text-xs">
                      {String.fromCharCode(97 + i)}.
                    </span>
                    <Input
                      value={subQ.question || ''}
                      onChange={(e) => handleSubQuestionChange(i, e.target.value)}
                      placeholder={`Sub Q ${String.fromCharCode(97 + i)}`}
                      className="flex-1 border-none shadow-none focus-visible:ring-1 h-7 text-sm"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSubQuestion(i)}
                      className="text-destructive h-7 w-6 p-0"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddSubQuestion}
                className="ml-4 gap-1 h-7 text-xs"
              >
                <Plus className="w-3 h-3" />
                Add Sub Q
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(question.id)}
              className="text-destructive shrink-0 h-8 w-8 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Media Button */}
          <div className="ml-7 relative">
            <MediaButton />
          </div>

          {/* Media Display */}
          <MediaDisplay />
        </CardContent>
      </Card>
    )
  }

  // Render MCQ
  if (question.type === 'mcq') {
    return (
      <Card
        draggable
        onDragStart={(e) => onDragStart(e, index)}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, index)}
        className="mb-1 cursor-move"
      >
        <CardContent className="pt-2 pb-2 space-y-1">
          {/* Question */}
          <div className="flex items-start gap-2">
            <GripVertical className="w-5 h-5 text-muted-foreground mt-1 shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-foreground min-w-fit text-sm">Q{index}.</span>
                <Input
                  value={formData.question}
                  onChange={(e) => handleChange('question', e.target.value)}
                  placeholder="Enter MCQ question"
                  className="flex-1 border-none shadow-none focus-visible:ring-1 h-8 text-sm"
                />
                <Input
                  type="text"
                  value={formData.marks}
                  onChange={(e) => handleChange('marks', e.target.value)}
                  className="w-14 text-center h-8 text-sm"
                  placeholder="M"
                />
              </div>

              {(formData.options || []).length > 0 && (
                <div className="ml-4 space-y-0">
                  {/* First row: options 0 and 1 */}
                  <div className="flex gap-3">
                    {formData.options.slice(0, 2).map((opt, i) => (
                      <div key={i} className="flex items-center gap-1 flex-1">
                        <span className="font-medium text-muted-foreground min-w-fit text-xs">
                          {i + 1}.
                        </span>
                        <Input
                          value={opt}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          placeholder={`Opt ${i + 1}`}
                          className="flex-1 border-none shadow-none focus-visible:ring-1 h-7 text-sm"
                        />
                        {formData.options.length > 2 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOption(i)}
                            className="text-destructive h-7 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Second row: options 2 and 3 */}
                  {formData.options.length > 2 && (
                    <div className="flex gap-3">
                      {formData.options.slice(2, 4).map((opt, i) => (
                        <div key={i + 2} className="flex items-center gap-1 flex-1">
                          <span className="font-medium text-muted-foreground min-w-fit text-xs">
                            {i + 3}.
                          </span>
                          <Input
                            value={opt}
                            onChange={(e) => handleOptionChange(i + 2, e.target.value)}
                            placeholder={`Opt ${i + 3}`}
                            className="flex-1 border-none shadow-none focus-visible:ring-1 h-7 text-sm"
                          />
                          {formData.options.length > 2 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveOption(i + 2)}
                              className="text-destructive h-7 w-6 p-0"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Additional options beyond 4 */}
                  {formData.options.length > 4 && (
                    <div className="ml-0 space-y-1 mt-1">
                      {formData.options.slice(4).map((opt, i) => (
                        <div key={i + 4} className="flex items-center gap-1">
                          <span className="font-medium text-muted-foreground min-w-fit text-xs">
                            {i + 5}.
                          </span>
                          <Input
                            value={opt}
                            onChange={(e) => handleOptionChange(i + 4, e.target.value)}
                            placeholder={`Opt ${i + 5}`}
                            className="flex-1 border-none shadow-none focus-visible:ring-1 h-7 text-sm"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveOption(i + 4)}
                            className="text-destructive h-7 w-6 p-0"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="ml-4 gap-1 mt-1 h-7 text-xs"
              >
                <Plus className="w-3 h-3" />
                Add Option
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(question.id)}
              className="text-destructive shrink-0 h-8 w-8 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Media Button */}
          <div className="ml-7 relative">
            <MediaButton />
          </div>

          {/* Media Display */}
          <MediaDisplay />
        </CardContent>
      </Card>
    )
  }

  // Render Regular Question
  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={onDragOver}
      onDrop={(e) => onDrop(e, index)}
      className="mb-1 cursor-move"
    >
      <CardContent className="pt-2 pb-2 space-y-1">
        <div className="flex items-start gap-2">
          <GripVertical className="w-5 h-5 text-muted-foreground mt-1 shrink-0" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground min-w-fit text-sm">Q{index}.</span>
              <Input
                value={formData.question}
                onChange={(e) => handleChange('question', e.target.value)}
                placeholder="Enter question"
                className="flex-1 border-none shadow-none focus-visible:ring-1 h-8 text-sm"
              />
              <Input
                type="text"
                value={formData.marks}
                onChange={(e) => handleChange('marks', e.target.value)}
                className="w-14 text-center h-8 text-sm"
                placeholder="M"
              />
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(question.id)}
            className="text-destructive shrink-0 h-8 w-8 p-0"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Media Button */}
        <div className="ml-7 relative">
          <MediaButton />
        </div>

        {/* Media Display */}
        <MediaDisplay />
      </CardContent>
    </Card>
  )
}

