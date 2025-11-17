import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import clientPromise from '@/lib/mongodb'
import { authOptions } from '../auth/[...nextauth]/route'

export async function POST(req: Request) {
  console.log('Activity API called')
  
  try {
    // Get the session
    const session = await getServerSession(authOptions)
    
    console.log('Session in activity API:', session?.user?.email || 'No session')
    
    if (!session || !session.user) {
      console.log('Unauthorized: No session')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { action, fileName, fileType } = body
    
    console.log('Activity data:', { action, fileName, fileType })

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
      userName: session.user.name || 'Unknown User',
      userEmail: session.user.email,
      userImage: session.user.image || null,
      action, // 'imported' or 'created'
      fileName,
      fileType: fileType || 'json',
      timestamp: now,
      time,
      description: `${session.user.name || 'User'} ${action} the file "${fileName}" at ${time}`,
    }

    // Save to database
    console.log('Inserting activity to database:', activity)
    const result = await activitiesCollection.insertOne(activity)
    console.log('Activity inserted with ID:', result.insertedId)

    console.log('Activity logged:', activity.description)

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
