import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import clientPromise from '@/lib/mongodb'
import { authOptions } from '../../auth/[...nextauth]/route'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ isAdmin: false }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db('QusMaker')
    const adminsCollection = db.collection('admin')

    // Check if user is admin
    const admin = await adminsCollection.findOne({ 
      email: session.user.email 
    })

    return NextResponse.json({ 
      isAdmin: !!admin,
      user: session.user 
    })

  } catch (error) {
    console.error('Error checking admin status:', error)
    return NextResponse.json(
      { isAdmin: false, error: 'Failed to check admin status' },
      { status: 500 }
    )
  }
}
