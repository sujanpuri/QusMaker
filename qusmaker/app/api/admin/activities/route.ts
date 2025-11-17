import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import clientPromise from '@/lib/mongodb'
import { authOptions } from '../../auth/[...nextauth]/route'

// Check if user is admin
async function isAdmin(email: string): Promise<boolean> {
  const client = await clientPromise
  const db = client.db('QusMaker')
  const adminsCollection = db.collection('admin')
  const admin = await adminsCollection.findOne({ email })
  return !!admin
}

// GET all activities
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (!(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

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
