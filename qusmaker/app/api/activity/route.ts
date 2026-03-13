import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { action, fileName, fileType } = body

    if (!action || !fileName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Connect to MongoDB
    const client = await clientPromise
    const db = client.db('QusMaker')
    const activitiesCollection = db.collection('activities')

    // Get current timestamp
    const now = new Date()
    const time = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      hour12: false 
    })

    // Create activity record
    const activity = {
      action, // 'imported' or 'created'
      fileName,
      fileType: fileType || 'json',
      timestamp: now,
      time,
      description: `User ${action} the file "${fileName}" at ${time}`,
    }

    // Save to database
    console.log('Inserting activity to database:', activity)
    const result = await activitiesCollection.insertOne(activity)
    return NextResponse.json({ 
      success: true, 
      message: 'Activity logged successfully' 
    })

  } catch (error) {
    console.error('Error logging activity:', error)
    return NextResponse.json(
      { error: 'Failed to log activity' },
      { status: 500 }
    )
  }
}
