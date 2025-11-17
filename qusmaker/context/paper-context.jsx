'use client'

import { createContext, useContext, useState } from 'react'

const PaperContext = createContext()

export function PaperProvider({ children }) {
  const [currentPaper, setCurrentPaper] = useState(null)

  const value = {
    currentPaper,
    setCurrentPaper,
    clearPaper: () => setCurrentPaper(null),
  }

  return (
    <PaperContext.Provider value={value}>
      {children}
    </PaperContext.Provider>
  )
}

export function usePaper() {
  const context = useContext(PaperContext)
  if (!context) {
    throw new Error('usePaper must be used within PaperProvider')
  }
  return context
}
