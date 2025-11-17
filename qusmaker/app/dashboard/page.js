'use client'

import { useState } from 'react'
import { Plus, BookOpen, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import DashboardHeader from '@/components/dashboard/dashboard-header'
import CreatePaperModal from '@/components/dashboard/create-paper-modal'
import JsonUploadModal from '@/components/dashboard/json-upload-modal'

export default function DashboardPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/5">
      <DashboardHeader />

      <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[calc(100vh-80px)]">
        <div className="text-center space-y-8 max-w-2xl w-full">
          <div className="space-y-4">
            <div className="flex justify-center">
              <div className="p-6 bg-primary/10 rounded-full">
                <BookOpen className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-foreground">Qus-Maker</h1>
            <p className="text-lg text-muted-foreground">Create and manage your question papers with ease</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-primary/20 hover:border-primary/40 transition-colors cursor-pointer" onClick={() => setShowCreateModal(true)}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-lg">
                    <Plus className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-xl text-foreground">Create New Question Paper</h2>
                    <p className="text-sm text-muted-foreground mt-2">Start creating a new question paper from scratch</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-secondary/20 hover:border-secondary/40 transition-colors cursor-pointer" onClick={() => setShowUploadModal(true)}>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-4 bg-secondary/10 rounded-lg">
                    <Upload className="w-8 h-8 text-secondary" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-xl text-foreground">Import Question Paper</h2>
                    <p className="text-sm text-muted-foreground mt-2">Upload a JSON file to import and edit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <CreatePaperModal open={showCreateModal} onOpenChange={setShowCreateModal} />
      <JsonUploadModal open={showUploadModal} onOpenChange={setShowUploadModal} />
    </main>
  )
}
