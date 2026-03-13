import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

// GET all activities
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('QusMaker')
    const activitiesCollection = db.collection('activities')

    // Get all activities sorted by timestamp (newest first)
    const activities = await activitiesCollection
      .find({})
      .sort({ timestamp: -1 })
      .toArray()

    return NextResponse.json({ activities })

  } catch (error) {
    console.error('Error fetching activities:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activities' },
      { status: 500 }
    )
  }
}
