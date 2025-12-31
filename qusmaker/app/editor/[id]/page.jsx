"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Eye, Download, Edit2, Check, X, ScanLine } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import QuestionForm from "@/components/editor/question-form";
import PreviewModal from "@/components/editor/preview-modal";
import OCRModal from "@/components/editor/ocr-modal";
import { generatePDF } from "@/lib/pdf-export";
import { usePaper } from "@/context/paper-context";
import { saveImage, getImage, deleteImage } from "@/lib/storage";

export default function EditorPage() {
  const router = useRouter();
  const { currentPaper } = usePaper();
  const [showScllList, setShowScllList] = useState(false);
  const addMenuRef = useRef(null);
  
  // Get paper ID for localStorage key
  const paperId = currentPaper?.id || 'default';
  const storageKey = `question-paper-${paperId}`;
  
  // Initialize with Group A by default and load from localStorage
  const initializeQuestions = () => {
    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && Array.isArray(parsed) && parsed.length > 0) {
            // Load images from IndexedDB asynchronously
            Promise.all(
              parsed.map(async (q) => {
                if (q.images && q.images.length > 0) {
                  const loadedImages = await Promise.all(
                    q.images.map(async (img) => {
                      if (img.id && !img.src) {
                        // Load from IndexedDB
                        const imageData = await getImage(img.id);
                        return imageData ? { ...img, src: imageData } : img;
                      }
                      return img;
                    })
                  );
                  return { ...q, images: loadedImages };
                }
                return q;
              })
            ).then(questionsWithImages => {
              setQuestions(questionsWithImages);
            });
            
            return parsed; // Return temporarily without images
          }
        } catch (e) {
          console.error('Failed to parse saved questions:', e);
        }
      }
    }
    
    // Fallback to existing or default
    const existingQuestions = currentPaper?.questions || [];
    if (existingQuestions.length === 0 || existingQuestions[0]?.type !== 'group') {
      return [{
        id: Math.random(),
        type: "group",
        groupName: "Group A",
        message: "",
        marks: "",
      }, ...existingQuestions];
    }
    return existingQuestions;
  };
  
  const [questions, setQuestions] = useState(initializeQuestions);
  
  // Save to localStorage whenever questions change
  useEffect(() => {
    const saveQuestions = async () => {
      if (typeof window !== 'undefined' && questions.length > 0) {
        try {
          // Create a copy of questions without image data (only store image IDs)
          const questionsToSave = questions.map(q => {
            if (q.images && q.images.length > 0) {
              // Save images to IndexedDB and keep only IDs in localStorage
              const imagePromises = q.images.map(async (img) => {
                if (img.src && img.src.startsWith('data:')) {
                  // Save to IndexedDB
                  await saveImage(img.id, img.src);
                  return { id: img.id, alt: img.alt }; // Only store ID
                }
                return img;
              });
              
              return Promise.all(imagePromises).then(images => ({
                ...q,
                images
              }));
            }
            return q;
          });
          
          const resolvedQuestions = await Promise.all(questionsToSave);
          localStorage.setItem(storageKey, JSON.stringify(resolvedQuestions));
        } catch (error) {
          console.error('Failed to save questions:', error);
          alert('Failed to save data. Storage quota may be exceeded.');
        }
      }
    };
    
    saveQuestions();
  }, [questions, storageKey]);
  const [editingId, setEditingId] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [paperFormat, setPaperFormat] = useState("A4");
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showMCQDialog, setShowMCQDialog] = useState(false);
  const [showQuestionsDialog, setShowQuestionsDialog] = useState(false);
  const [showOCRModal, setShowOCRModal] = useState(false);
  const [mcqConfig, setMcqConfig] = useState({ numQuestions: 1, marksEach: 1 });
  const [questionConfig, setQuestionConfig] = useState({ numQuestions: 1, marks: 1 });
  const [currentGroupForAdd, setCurrentGroupForAdd] = useState(null);
  const [renamingGroupId, setRenamingGroupId] = useState(null);
  const [renamingGroupValue, setRenamingGroupValue] = useState("");
  
  const getUsedGroupLetters = () => {
    return questions
      .filter(q => q.type === 'group')
      .map(q => {
        const match = q.groupName?.match(/Group\s+([A-Z])/);
        return match ? match[1] : null;
      })
      .filter(Boolean);
  };
  
  const getNextGroupLetter = () => {
    const usedLetters = getUsedGroupLetters();
    for (let i = 0; i < 26; i++) {
      const letter = String.fromCharCode(65 + i);
      if (!usedLetters.includes(letter)) {
        return letter;
      }
    }
    return 'Z';
  };
  
  const [draggedIndex, setDraggedIndex] = useState(null);

  // Header information state with localStorage
  const initializeHeaderInfo = () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(`header-info-${paperId}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error('Failed to parse saved header info:', e);
        }
      }
    }
    return {
      className: currentPaper?.className || "",
      subject: currentPaper?.subject || "",
      schoolName: currentPaper?.schoolName || "School Name",
      location: currentPaper?.location || "Location",
      year: currentPaper?.year || new Date().getFullYear(),
      fullMarks: currentPaper?.fullMarks || 100,
      examHours: currentPaper?.examHours || "2hrs",
    };
  };
  
  const [headerInfo, setHeaderInfo] = useState(initializeHeaderInfo);
  
  // Save header info to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(`header-info-${paperId}`, JSON.stringify(headerInfo));
    }
  }, [headerInfo, paperId]);
  
  // Close add menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (addMenuRef.current && !addMenuRef.current.contains(event.target) && showAddMenu) {
        setShowAddMenu(false);
        setCurrentGroupForAdd(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddMenu]);

  if (!currentPaper) {
    return (
      <main className="min-h-screen bg-linear-to-br from-background via-background to-secondary/5 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              No question paper selected
            </p>
            <Button onClick={() => router.push("/dashboard")}>
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const schoolList = [
    {
      name: "SHREE SINGHADEVI SECONDARY SCHOOL",
      location: "Kanepokhari-5, Jahada, Morang",
    },
    {
      name: "MOUNT VIEW ACADEMY",
      location: "Biratnagar, Morang",
    },
    {
      name: "EVEREST MODEL SCHOOL",
      location: "Itahari, Sunsari",
    },
    {
      name: "HIRAMANI SECONDARY SCHOOL",
      location: "Dharan, Sunsari",
    },
  ];

  const handleAddQuestion = () => {
    setShowAddMenu(true);
    setCurrentGroupForAdd(null);
  };
  
  const handleAddQuestionToGroup = (groupName) => {
    setShowAddMenu(true);
    setCurrentGroupForAdd(groupName);
  };

  const handleRenameGroup = (groupId, currentName) => {
    setRenamingGroupId(groupId);
    setRenamingGroupValue(currentName);
  };

  const handleConfirmRename = (groupId) => {
    if (renamingGroupValue.trim()) {
      setQuestions(
        questions.map((q) =>
          q.id === groupId ? { ...q, groupName: renamingGroupValue } : q
        )
      );
    }
    setRenamingGroupId(null);
    setRenamingGroupValue("");
  };

  const handleNewGroup = () => {
    const nextGroupLetter = getNextGroupLetter();
    const newGroupName = `Group ${nextGroupLetter}`;
    
    const newGroup = {
      id: Math.random(),
      type: "group",
      groupName: newGroupName,
      message: "",
      marks: "",
    };
    setQuestions([...questions, newGroup]);
    setShowAddMenu(false);
  };

  const handleAddMCQ = () => {
    setShowAddMenu(false);
    setShowMCQDialog(true);
  };

  const handleAddQuestions = () => {
    setShowAddMenu(false);
    setShowQuestionsDialog(true);
  };

  const handleAddQusWithSubQus = () => {
    const newQuestion = {
      id: Math.random(),
      type: "qusWithSubQus",
      question: "",
      subQuestions: [],
      marks: 1,
      images: [],
      shapes: [],
    };
    
    if (currentGroupForAdd) {
      const groupIndex = questions.findIndex(q => q.type === 'group' && q.groupName === currentGroupForAdd);
      // Find the next group or end of array
      let insertIndex = questions.length;
      for (let i = groupIndex + 1; i < questions.length; i++) {
        if (questions[i].type === 'group') {
          insertIndex = i;
          break;
        }
      }
      const newQuestions = [...questions];
      newQuestions.splice(insertIndex, 0, newQuestion);
      setQuestions(newQuestions);
    } else {
      setQuestions([...questions, newQuestion]);
    }
    setShowAddMenu(false);
    setCurrentGroupForAdd(null);
  };

  const handleConfirmMCQ = () => {
    const newMCQs = [];
    for (let i = 0; i < mcqConfig.numQuestions; i++) {
      newMCQs.push({
        id: Math.random(),
        type: "mcq",
        question: "",
        options: ["", "", "", ""],
        correctAnswer: 0,
        marks: mcqConfig.marksEach,
        images: [],
        shapes: [],
      });
    }
    
    if (currentGroupForAdd) {
      const groupIndex = questions.findIndex(q => q.type === 'group' && q.groupName === currentGroupForAdd);
      // Find the next group or end of array
      let insertIndex = questions.length;
      for (let i = groupIndex + 1; i < questions.length; i++) {
        if (questions[i].type === 'group') {
          insertIndex = i;
          break;
        }
      }
      const newQuestions = [...questions];
      newQuestions.splice(insertIndex, 0, ...newMCQs);
      setQuestions(newQuestions);
    } else {
      setQuestions([...questions, ...newMCQs]);
    }
    
    setShowMCQDialog(false);
    setMcqConfig({ numQuestions: 1, marksEach: 1 });
    setCurrentGroupForAdd(null);
  };

  const handleConfirmQuestions = () => {
    const newQuestions = [];
    for (let i = 0; i < questionConfig.numQuestions; i++) {
      newQuestions.push({
        id: Math.random(),
        type: "question",
        question: "",
        marks: questionConfig.marks,
        images: [],
        shapes: [],
      });
    }
    
    if (currentGroupForAdd) {
      const groupIndex = questions.findIndex(q => q.type === 'group' && q.groupName === currentGroupForAdd);
      // Find the next group or end of array
      let insertIndex = questions.length;
      for (let i = groupIndex + 1; i < questions.length; i++) {
        if (questions[i].type === 'group') {
          insertIndex = i;
          break;
        }
      }
      const allQuestions = [...questions];
      allQuestions.splice(insertIndex, 0, ...newQuestions);
      setQuestions(allQuestions);
    } else {
      setQuestions([...questions, ...newQuestions]);
    }
    
    setShowQuestionsDialog(false);
    setQuestionConfig({ numQuestions: 1, marks: 1 });
    setCurrentGroupForAdd(null);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newQuestions = [...questions];
    const draggedItem = newQuestions[draggedIndex];
    const dropItem = newQuestions[dropIndex];
    
    // Don't allow dragging groups
    if (draggedItem.type === 'group') {
      setDraggedIndex(null);
      return;
    }
    
    // Find which group each item belongs to
    const findGroupForIndex = (idx) => {
      for (let i = idx; i >= 0; i--) {
        if (newQuestions[i].type === 'group') {
          return newQuestions[i].groupName;
        }
      }
      return null;
    };
    
    const draggedGroup = findGroupForIndex(draggedIndex);
    const dropGroup = findGroupForIndex(dropIndex);
    
    // Prevent dragging between different groups
    if (draggedGroup !== dropGroup) {
      alert('Cannot drag question to another group');
      setDraggedIndex(null);
      return;
    }
    
    newQuestions.splice(draggedIndex, 1);
    
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex;
    newQuestions.splice(insertIndex, 0, draggedItem);
    
    setQuestions(newQuestions);
    setDraggedIndex(null);
  };

  const handleUpdateQuestion = (id, updatedQuestion) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, ...updatedQuestion } : q))
    );
    setEditingId(null);
  };

  const handleDeleteQuestion = (id) => {
    const questionToDelete = questions.find(q => q.id === id);
    
    if (questionToDelete?.type === 'group' && questionToDelete?.groupName === 'Group A') {
      alert('Group A cannot be deleted!');
      return;
    }
    
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleOCRParsed = (parsedData) => {
    // Handle both single question (legacy) and multiple questions (new)
    const questionsToAdd = Array.isArray(parsedData) ? parsedData : [parsedData];
    
    // Find the current group to add questions to
    let targetGroupIndex = -1;
    for (let i = questions.length - 1; i >= 0; i--) {
      if (questions[i].type === 'group') {
        targetGroupIndex = i;
        break;
      }
    }
    
    // Create new questions from OCR parsed data
    const newQuestions = questionsToAdd.map((data, index) => ({
      id: Date.now() + index,
      type: data.type || 'mcq',
      question: data.question || '',
      marks: data.marks || 1,
      options: data.type === 'mcq' ? (data.options || []) : [],
      answer: '',
      subQuestions: data.subQuestions || [],
      imageId: data.imageId || null,
      groupName: data.groupName, // Store group info
      questionNumber: data.questionNumber, // Store original question number
    }));

    // Insert new questions after the target group
    if (targetGroupIndex !== -1) {
      const updatedQuestions = [...questions];
      updatedQuestions.splice(targetGroupIndex + 1, 0, ...newQuestions);
      setQuestions(updatedQuestions);
    } else {
      // No group found, append to end
      setQuestions([...questions, ...newQuestions]);
    }
    
    // Set editing to the first new question so user can review/edit
    if (newQuestions.length > 0) {
      setEditingId(newQuestions[0].id);
    }
  };

  const handleExportPDF = async (filename) => {
    try {
      setIsExporting(true);
      // Get latest data from localStorage to ensure we're exporting current state
      const savedQuestions = localStorage.getItem(storageKey);
      const savedHeader = localStorage.getItem(`header-info-${paperId}`);
      
      const questionsToExport = savedQuestions ? JSON.parse(savedQuestions) : questions;
      const headerToExport = savedHeader ? JSON.parse(savedHeader) : headerInfo;
      
      await generatePDF(
        { ...currentPaper, ...headerToExport }, 
        questionsToExport,
        filename
      );
      setShowPreview(false);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-secondary/5">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-2xl font-bold text-foreground ">
                {headerInfo.subject} - {headerInfo.className} -{" "}
                {currentPaper.term}
              </h2>

              <p className="text-sm text-muted-foreground">Question Paper</p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div className="flex items-center gap-2 mr-2">
              <span className="text-sm text-muted-foreground">Format:</span>
              <Select value={paperFormat} onValueChange={setPaperFormat}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A4">A4</SelectItem>
                  <SelectItem value="A4/2">A4/2</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowOCRModal(true)}
              className="gap-2"
            >
              <ScanLine className="w-4 h-4" />
              Scan Question
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(true)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={() => setShowPreview(true)}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? "Exporting..." : "Export PDF"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Editable Header Section */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="absolute -top-2.5 right-0 border"
                onClick={() => setIsEditingHeader(!isEditingHeader)}
              >
                {isEditingHeader ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Save
                  </>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit Header
                  </>
                )}
              </Button>

              <div>
                {isEditingHeader ? (
                  <>
                    <label className="text-sm text-muted-foreground">
                      School Name: <br />
                    </label>
                    
                    <Input
                      placeholder="School Name"
                      value={headerInfo.schoolName}
                      onChange={(e) => {
                        const inputValue = e.target.value;
                        setHeaderInfo({
                          ...headerInfo,
                          schoolName: inputValue,
                        });
                        setShowScllList(true);
                        
                        const matchedSchool = schoolList.find(
                          (school) =>
                            school.name.toLowerCase() === inputValue.toLowerCase()
                        );
                        if (matchedSchool) {
                          setHeaderInfo({
                            ...headerInfo,
                            schoolName: matchedSchool.name,
                            location: matchedSchool.location,
                          });
                        }
                      }}
                      onFocus={() => setShowScllList(true)}
                      className="text-center font-bold w-[70%]"
                    />
                    {showScllList && (
                      <div className="absolute z-10 w-[70%] mt-1 bg-background border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {schoolList
                          .filter((school) =>
                            school.name
                              .toLowerCase()
                              .includes(headerInfo.schoolName.toLowerCase())
                          )
                          .map((school, idx) => (
                            <div
                              key={idx}
                              onClick={() => {
                                setHeaderInfo({
                                  ...headerInfo,
                                  schoolName: school.name,
                                  location: school.location,
                                });
                                setShowScllList(false);
                              }}
                              className="px-4 py-2 hover:bg-secondary cursor-pointer text-sm border-b last:border-b-0"
                            >
                              <div className="font-medium text-foreground">
                                {school.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {school.location}
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                ) : (
                  <h2 className="text-xl text-center font-bold text-foreground">
                    {headerInfo.schoolName}
                  </h2>
                )}
              </div>

              <div className="grid grid-cols-3 gap-6 items-start">
                <div className="space-y-2">
                  {isEditingHeader ? (
                    <>
                      <label className="text-sm text-muted-foreground">
                        Class
                      </label>
                      <Input
                        placeholder="Class"
                        value={headerInfo.className}
                        onChange={(e) =>
                          setHeaderInfo({
                            ...headerInfo,
                            className: e.target.value,
                          })
                        }
                        className="text-sm"
                      />
                      <label className="text-sm text-muted-foreground">
                        Subject
                      </label>
                      <Input
                        placeholder="Subject"
                        value={headerInfo.subject}
                        onChange={(e) =>
                          setHeaderInfo({
                            ...headerInfo,
                            subject: e.target.value,
                          })
                        }
                        className="text-sm"
                      />
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Class:{" "}
                        <span className="font-medium text-foreground">
                          {headerInfo.className}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Subject:{" "}
                        <span className="font-medium text-foreground">
                          {headerInfo.subject}
                        </span>
                      </p>
                    </>
                  )}
                </div>

                <div className="text-center space-y-1">
                  {isEditingHeader ? (
                    <>
                      <label className="text-sm text-muted-foreground">
                        Location & Year:
                      </label>
                      <div className="flex items-center justify-center gap-1">
                        <Input
                          placeholder="Location"
                          value={headerInfo.location}
                          onChange={(e) =>
                            setHeaderInfo({
                              ...headerInfo,
                              location: e.target.value,
                            })
                          }
                          className="text-center text-sm flex-1"
                        />
                        <span className="text-sm">,</span>
                        <Input
                          placeholder="Year"
                          value={headerInfo.year}
                          onChange={(e) =>
                            setHeaderInfo({
                              ...headerInfo,
                              year: e.target.value,
                            })
                          }
                          className="text-center text-sm w-20"
                          type="number"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        {headerInfo.location}, {headerInfo.year}
                      </p>
                    </>
                  )}
                </div>

                <div className="space-y-2 text-right">
                  {isEditingHeader ? (
                    <>
                      <label className="text-sm text-muted-foreground">
                        Full Marks:
                      </label>
                      <Input
                        placeholder="Full Marks"
                        value={headerInfo.fullMarks}
                        onChange={(e) =>
                          setHeaderInfo({
                            ...headerInfo,
                            fullMarks: e.target.value,
                          })
                        }
                        className="text-sm text-right"
                        type="number"
                      />
                      <label className="text-sm text-muted-foreground">
                        Exam Hours:
                      </label>
                      <Input
                        placeholder="Exam Hours"
                        value={headerInfo.examHours}
                        onChange={(e) =>
                          setHeaderInfo({
                            ...headerInfo,
                            examHours: e.target.value,
                          })
                        }
                        className="text-sm text-right"
                      />
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Full Marks:{" "}
                        <span className="font-medium text-foreground">
                          {headerInfo.fullMarks}
                        </span>
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Exam Hrs:{" "}
                        <span className="font-medium text-foreground">
                          {headerInfo.examHours}
                        </span>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions List */}
        <div className="space-y-2 mb-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-foreground">Questions</h2>
          </div>

          {questions.length === 1 && questions[0].type === 'group' ? (
            <div>
              <Card className="border border-border">
                <CardContent className="py-12 text-center space-y-4">
                  <p className="text-lg text-muted-foreground">
                    No questions added yet. Click "Add Question" below to get started!
                  </p>
                  <div ref={addMenuRef} className="relative inline-block">
                    <Button
                      onClick={() => handleAddQuestionToGroup('Group A')}
                      variant="default"
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Add Question
                    </Button>
                    
                    {showAddMenu && currentGroupForAdd === 'Group A' && (
                      <div className="absolute left-1/2 transform -translate-x-1/2 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg z-20">
                        <div className="py-1">
                          <button
                            onClick={handleNewGroup}
                            className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-foreground font-medium"
                          >
                            New Group
                          </button>
                          <div className="border-t my-1"></div>
                          <button
                            onClick={handleAddMCQ}
                            className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-foreground"
                          >
                            MCQ
                          </button>
                          <button
                            onClick={handleAddQuestions}
                            className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-foreground"
                          >
                            Questions
                          </button>
                          <button
                            onClick={handleAddQusWithSubQus}
                            className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-foreground"
                          >
                            Qus with SubQus
                          </button>
                          <button
                            onClick={() => {
                              setShowAddMenu(false);
                              setCurrentGroupForAdd(null);
                            }}
                            className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-muted-foreground border-t"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            (() => {
              let currentGroupName = null;
              let questionNumberInGroup = 0;
              
              return questions.map((question, index) => {
                if (question.type === 'group') {
                  currentGroupName = question.groupName;
                  questionNumberInGroup = 0;
                  
                  const isLastItem = index === questions.length - 1;
                  const nextIsGroup = !isLastItem && questions[index + 1]?.type === 'group';
                  const showAddButton = isLastItem || nextIsGroup;
                  
                  return (
                    <div key={question.id}>
                      <QuestionForm
                        question={question}
                        index={questionNumberInGroup}
                        onUpdate={handleUpdateQuestion}
                        onDelete={handleDeleteQuestion}
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onRenameGroup={handleRenameGroup}
                        isRenamingGroup={renamingGroupId === question.id}
                        renamingValue={renamingGroupValue}
                        setRenamingValue={setRenamingGroupValue}
                        onConfirmRename={() => handleConfirmRename(question.id)}
                      />
                      <div ref={addMenuRef} className="flex justify-center my-2">
                        <div className="relative">
                          <Button
                            onClick={() => handleAddQuestionToGroup(question.groupName)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Question
                          </Button>
                          
                          {showAddMenu && currentGroupForAdd === question.groupName && (
                            <div className="absolute left-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg z-20">
                              <div className="py-1">
                                <button
                                  onClick={handleNewGroup}
                                  className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-foreground font-medium"
                                >
                                  New Group
                                </button>
                                <div className="border-t my-1"></div>
                                <button
                                  onClick={handleAddMCQ}
                                  className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-foreground"
                                >
                                  MCQ
                                </button>
                                <button
                                  onClick={handleAddQuestions}
                                  className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-foreground"
                                >
                                  Questions
                                </button>
                                <button
                                  onClick={handleAddQusWithSubQus}
                                  className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-foreground"
                                >
                                  Qus with SubQus
                                </button>
                                <button
                                  onClick={() => setShowAddMenu(false)}
                                  className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-muted-foreground border-t"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                
                questionNumberInGroup++;
                const currentIndex = questionNumberInGroup;
                
                const isLastItem = index === questions.length - 1;
                const nextIsGroup = !isLastItem && questions[index + 1]?.type === 'group';
                const showAddButton = isLastItem || nextIsGroup;
                
                return (
                  <div key={question.id}>
                    <QuestionForm
                      question={question}
                      index={currentIndex}
                      onUpdate={handleUpdateQuestion}
                      onDelete={handleDeleteQuestion}
                      onDragStart={handleDragStart}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                    />
                    {showAddButton && currentGroupName && (
                      <div ref={addMenuRef} className="flex justify-center my-2">
                        <div className="relative">
                          <Button
                            onClick={() => handleAddQuestionToGroup(currentGroupName)}
                            variant="outline"
                            size="sm"
                            className="gap-2"
                          >
                            <Plus className="w-4 h-4" />
                            Add Question
                          </Button>
                          
                          {showAddMenu && currentGroupForAdd === currentGroupName && (
                            <div className="absolute left-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg z-20">
                              <div className="py-1">
                                <button
                                  onClick={handleNewGroup}
                                  className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-foreground font-medium"
                                >
                                  New Group
                                </button>
                                <div className="border-t my-1"></div>
                                <button
                                  onClick={handleAddMCQ}
                                  className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-foreground"
                                >
                                  MCQ
                                </button>
                                <button
                                  onClick={handleAddQuestions}
                                  className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-foreground"
                                >
                                  Questions
                                </button>
                                <button
                                  onClick={handleAddQusWithSubQus}
                                  className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-foreground"
                                >
                                  Qus with SubQus
                                </button>
                                <button
                                  onClick={() => setShowAddMenu(false)}
                                  className="w-full text-left px-4 py-2 hover:bg-secondary text-sm text-muted-foreground border-t"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()
          )}
        </div>
      </div>

      <PreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        paperData={currentPaper}
        headerInfo={headerInfo}
        paperFormat={paperFormat}
        questions={questions}
        onExport={handleExportPDF}
        isExporting={isExporting}
      />

      <OCRModal
        open={showOCRModal}
        onOpenChange={setShowOCRModal}
        onQuestionParsed={handleOCRParsed}
      />

      <Dialog open={showMCQDialog} onOpenChange={setShowMCQDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add MCQ Questions</DialogTitle>
            <DialogDescription>
              Configure the number of MCQ questions and marks for each
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">No. of Questions</label>
              <Input
                type="number"
                min="1"
                value={mcqConfig.numQuestions}
                onChange={(e) =>
                  setMcqConfig({ ...mcqConfig, numQuestions: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Marks for each question</label>
              <Input
                type="number"
                min="1"
                value={mcqConfig.marksEach}
                onChange={(e) =>
                  setMcqConfig({ ...mcqConfig, marksEach: parseInt(e.target.value) || 1 })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMCQDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmMCQ}>Add MCQs</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showQuestionsDialog} onOpenChange={setShowQuestionsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Questions</DialogTitle>
            <DialogDescription>
              Configure the number of questions and marks
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">No. of Questions</label>
              <Input
                type="number"
                min="1"
                value={questionConfig.numQuestions}
                onChange={(e) =>
                  setQuestionConfig({ ...questionConfig, numQuestions: parseInt(e.target.value) || 1 })
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Marks</label>
              <Input
                type="number"
                min="1"
                value={questionConfig.marks}
                onChange={(e) =>
                  setQuestionConfig({ ...questionConfig, marks: parseInt(e.target.value) || 1 })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuestionsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmQuestions}>Add Questions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
