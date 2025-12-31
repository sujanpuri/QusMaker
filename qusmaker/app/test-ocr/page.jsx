'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function TestOCRPage() {
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  const testAPIKey = async () => {
    setLoading(true)
    setResult(null)

    try {
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

      console.log('🔍 Testing API Configuration...')
      console.log('API Key from env:', apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT FOUND')

      // Test 1: Check if API key exists
      if (!apiKey) {
        setResult({
          success: false,
          message: '❌ API Key not found in environment variables',
          details: [
            'Create a .env.local file in the root directory',
            'Add: NEXT_PUBLIC_GEMINI_API_KEY=your_actual_key_here',
            'Restart your development server'
          ]
        })
        return
      }

      // Test 2: Try to initialize Gemini
      const { GoogleGenerativeAI } = await import('@google/generative-ai')
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

      console.log('✅ Gemini initialized successfully')

      // Test 3: Make a simple API call
      const result = await model.generateContent('Say hello in one word')
      const response = await result.response
      const text = response.text()

      console.log('✅ API call successful:', text)

      setResult({
        success: true,
        message: '✅ API Key is working correctly!',
        details: [
          `API Key: ${apiKey.substring(0, 10)}...${apiKey.slice(-4)}`,
          `Test response: ${text}`,
          'Your OCR feature should work now'
        ]
      })
    } catch (error) {
      console.error('❌ Test failed:', error)

      let errorDetails = []
      
      if (error.message?.includes('API key')) {
        errorDetails = [
          'Invalid API key format or authentication failed',
          'Go to https://makersuite.google.com/app/apikey',
          'Generate a new API key',
          'Update your .env.local file',
          'Restart the dev server'
        ]
      } else if (error.message?.includes('429') || error.message?.includes('quota')) {
        errorDetails = [
          'API quota exceeded',
          'Check your usage at https://console.cloud.google.com',
          'You may need to enable billing or wait for quota reset'
        ]
      } else {
        errorDetails = [
          `Error: ${error.message}`,
          'Check browser console for full error details'
        ]
      }

      setResult({
        success: false,
        message: '❌ API Test Failed',
        details: errorDetails,
        error: error.message
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold">OCR API Test</h1>
          <p className="text-muted-foreground mt-2">
            Test your Gemini API key configuration
          </p>
        </div>

        <div className="border rounded-lg p-6 space-y-4">
          <Button 
            onClick={testAPIKey} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Testing...' : 'Test API Key'}
          </Button>

          {result && (
            <div className={`p-4 rounded-lg border ${
              result.success 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <h3 className={`font-semibold text-lg mb-2 ${
                result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                {result.message}
              </h3>
              <ul className="space-y-1 text-sm">
                {result.details.map((detail, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>
              {result.error && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium">Technical Details</summary>
                  <pre className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded text-xs overflow-auto">
                    {result.error}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        <div className="space-y-3 text-sm">
          <h3 className="font-semibold">How to set up your API key:</h3>
          <ol className="space-y-2 list-decimal list-inside">
            <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank" className="text-primary hover:underline">Google AI Studio</a></li>
            <li>Click "Create API Key"</li>
            <li>Copy your API key</li>
            <li>Create a file named <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> in your project root</li>
            <li>Add this line: <code className="bg-muted px-1 py-0.5 rounded">NEXT_PUBLIC_GEMINI_API_KEY=your_key_here</code></li>
            <li>Restart your development server</li>
          </ol>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm mb-2">Current Environment:</h3>
          <div className="bg-muted p-3 rounded text-xs font-mono">
            <p>API Key Status: {process.env.NEXT_PUBLIC_GEMINI_API_KEY ? '✅ Configured' : '❌ Not Found'}</p>
            {process.env.NEXT_PUBLIC_GEMINI_API_KEY && (
              <p className="mt-1">Key Preview: {process.env.NEXT_PUBLIC_GEMINI_API_KEY.substring(0, 10)}...{process.env.NEXT_PUBLIC_GEMINI_API_KEY.slice(-4)}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
