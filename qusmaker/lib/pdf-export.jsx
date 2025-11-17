'use client'

import jsPDF from 'jspdf'
import { getImage } from './storage'

export async function generatePDF(paperData, questions, customFilename = null) {
  // Load all images from IndexedDB first
  const loadedImages = {}
  for (const question of questions) {
    if (question.images && question.images.length > 0) {
      for (const img of question.images) {
        if (img.id && !img.src) {
          const imageData = await getImage(img.id)
          if (imageData) {
            loadedImages[img.id] = imageData
          }
        } else if (img.src) {
          loadedImages[img.id] = img.src
        }
      }
    }
  }

  // Create new PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  const maxWidth = pageWidth - 2 * margin
  let yPosition = margin

  // Header Section - School Name
  doc.setFontSize(14)
  doc.setFont(undefined, 'bold')
  const schoolName = paperData?.schoolName || 'School Name'
  const schoolWidth = doc.getTextWidth(schoolName)
  doc.text(schoolName, (pageWidth - schoolWidth) / 2, yPosition)
  yPosition += 6

  doc.setFontSize(10)
  doc.setFont(undefined, 'normal')
  const location = paperData?.location || 'Location'
  const locationWidth = doc.getTextWidth(location)
  doc.text(location, (pageWidth - locationWidth) / 2, yPosition)
  yPosition += 8

  // Three-column header (Class/Subject, Year, Marks/Time)
  const startY = yPosition
  doc.setFontSize(10)
  
  // Left column
  doc.setFont(undefined, 'bold')
  doc.text('Class:', margin, yPosition)
  doc.setFont(undefined, 'normal')
  doc.text(paperData?.className || 'N/A', margin + 12, yPosition)
  yPosition += 4
  doc.setFont(undefined, 'bold')
  doc.text('Subject:', margin, yPosition)
  doc.setFont(undefined, 'normal')
  doc.text(paperData?.subject || 'N/A', margin + 15, yPosition)
  
  // Center column (Year)
  yPosition = startY
  const yearText = String(paperData?.year || new Date().getFullYear())
  const yearWidth = doc.getTextWidth(yearText)
  doc.text(yearText, (pageWidth - yearWidth) / 2, yPosition)
  
  // Right column
  yPosition = startY
  doc.setFont(undefined, 'bold')
  const fullMarksLabel = 'Full Marks:'
  const fullMarksValue = String(paperData?.fullMarks || 100)
  doc.text(fullMarksLabel, pageWidth - margin - 30, yPosition)
  doc.setFont(undefined, 'normal')
  doc.text(fullMarksValue, pageWidth - margin - 5, yPosition, { align: 'right' })
  yPosition += 4
  doc.setFont(undefined, 'bold')
  const timeLabel = 'Time:'
  const timeValue = paperData?.examHours || '2hrs'
  doc.text(timeLabel, pageWidth - margin - 30, yPosition)
  doc.setFont(undefined, 'normal')
  doc.text(timeValue, pageWidth - margin - 5, yPosition, { align: 'right' })
  
  yPosition = startY + 8
  
  // Divider
  doc.setDrawColor(200)
  doc.line(margin, yPosition, pageWidth - margin, yPosition)
  yPosition += 8

  // Questions Section
  doc.setFontSize(11)
  let groupQuestionNumbers = {}

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i]
    
    // Handle Group headers
    if (question.type === 'group') {
      // Check if we're near the bottom of the page (less than 25mm remaining)
      // If so, move group header to next page to avoid orphan header
      if (yPosition > pageHeight - 25) {
        doc.addPage()
        yPosition = margin
      }
      
      groupQuestionNumbers[question.groupName] = 0
      yPosition += 3
      
      // Group name (centered) with marks on right
      doc.setFont(undefined, 'bold')
      doc.setFontSize(12)
      const groupName = question.groupName || ''
      const groupWidth = doc.getTextWidth(groupName)
      doc.text(groupName, (pageWidth - groupWidth) / 2, yPosition)
      
      // Group marks on the right
      if (question.marks) {
        doc.text(`[${question.marks}]`, pageWidth - margin - 5, yPosition, { align: 'right' })
      }
      yPosition += 5
      
      // Group message (centered, italic)
      if (question.message) {
        doc.setFont(undefined, 'italic')
        doc.setFontSize(9)
        doc.setTextColor(100)
        const messageWidth = doc.getTextWidth(question.message)
        doc.text(question.message, (pageWidth - messageWidth) / 2, yPosition)
        doc.setTextColor(0)
        yPosition += 4
      }
      
      yPosition += 3
      doc.setFontSize(11)
      continue
    }

    // Find current group
    let currentGroup = 'Group A'
    for (let j = i - 1; j >= 0; j--) {
      if (questions[j].type === 'group') {
        currentGroup = questions[j].groupName
        break
      }
    }

    // Increment question number for this group
    groupQuestionNumbers[currentGroup] = (groupQuestionNumbers[currentGroup] || 0) + 1
    const questionNum = groupQuestionNumbers[currentGroup]

    // Check if we need a new page for regular questions
    if (yPosition > pageHeight - 30) {
      doc.addPage()
      yPosition = margin
    }

    // Question text
    doc.setFont(undefined, 'bold')
    const questionText = `${questionNum}. ${question.question || ''}`
    const questionLines = doc.splitTextToSize(questionText, maxWidth - 10)
    
    questionLines.forEach((line) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage()
        yPosition = margin
      }
      doc.text(line, margin + 5, yPosition)
      yPosition += 5
    })

    // Marks
    doc.setFont(undefined, 'normal')
    doc.setFontSize(9)
    doc.setTextColor(100)
    const marks = typeof question.marks === 'string' ? parseInt(question.marks) || 0 : question.marks || 0
    doc.text(`(${marks} marks)`, pageWidth - margin - 18, yPosition - 5)
    doc.setTextColor(0)
    doc.setFontSize(11)

    // Handle MCQ options
    if (question.type === 'mcq' && question.options && question.options.length > 0) {
      doc.setFont(undefined, 'normal')
      yPosition += 2
      
      // Render options in 2 columns: a. b. on first line, c. d. on second line
      for (let i = 0; i < question.options.length; i += 2) {
        if (yPosition > pageHeight - 15) {
          doc.addPage()
          yPosition = margin
        }
        
        const option1Label = String.fromCharCode(97 + i) // a, c, e...
        const option1Text = `${option1Label}. ${question.options[i]}`
        doc.text(option1Text, margin + 15, yPosition)
        
        if (i + 1 < question.options.length) {
          const option2Label = String.fromCharCode(97 + i + 1) // b, d, f...
          const option2Text = `${option2Label}. ${question.options[i + 1]}`
          const midPoint = pageWidth / 2
          doc.text(option2Text, midPoint, yPosition)
        }
        
        yPosition += 5
      }
    }

    // Handle Sub-questions
    if (question.type === 'qusWithSubQus' && question.subQuestions && question.subQuestions.length > 0) {
      doc.setFont(undefined, 'normal')
      yPosition += 2
      question.subQuestions.forEach((subQ, subIndex) => {
        if (yPosition > pageHeight - 15) {
          doc.addPage()
          yPosition = margin
        }
        const subLabel = String.fromCharCode(97 + subIndex)
        const subText = `${subLabel}) ${subQ.question || ''}`
        doc.text(subText, margin + 15, yPosition)
        yPosition += 5
      })
    }

    // Add images
    if (question.images && question.images.length > 0) {
      yPosition += 3
      for (const img of question.images) {
        const imgSrc = loadedImages[img.id] || img.src
        if (imgSrc) {
          try {
            // Check if we need a new page
            if (yPosition > pageHeight - 50) {
              doc.addPage()
              yPosition = margin
            }
            
            const imgWidth = 40 // max width in mm
            const imgHeight = 30 // max height in mm
            doc.addImage(imgSrc, 'JPEG', margin + 15, yPosition, imgWidth, imgHeight)
            yPosition += imgHeight + 3
          } catch (err) {
            console.error('Failed to add image to PDF:', err)
          }
        }
      }
    }

    yPosition += 4
  }

  // Add "The End" at the bottom
  if (yPosition > pageHeight - 20) {
    doc.addPage()
    yPosition = margin
  }
  yPosition += 8
  doc.setFont(undefined, 'bold')
  doc.setFontSize(12)
  const endText = 'The End'
  const endWidth = doc.getTextWidth(endText)
  doc.text(endText, (pageWidth - endWidth) / 2, yPosition)

  // Generate filename
  let filename = customFilename
  if (!filename) {
    const { year, subject, className, term } = paperData || {}
    filename = `${year || new Date().getFullYear()}_${subject || 'Paper'}_${className || 'Class'}_${term || 'Term'}`
      .replace(/\s+/g, '_')
      .toLowerCase()
  }

  // Save the PDF
  doc.save(`${filename}.pdf`)
  
  // Also save JSON file
  const jsonData = {
    paperData,
    questions,
    exportDate: new Date().toISOString()
  }
  const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' })
  const jsonUrl = URL.createObjectURL(jsonBlob)
  const jsonLink = document.createElement('a')
  jsonLink.href = jsonUrl
  jsonLink.download = `${filename}.json`
  document.body.appendChild(jsonLink)
  jsonLink.click()
  document.body.removeChild(jsonLink)
  URL.revokeObjectURL(jsonUrl)
}
