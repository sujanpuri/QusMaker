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

// GET all users
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
    const usersCollection = db.collection('users')
    const adminsCollection = db.collection('admin')

    // Get all users
    const users = await usersCollection.find({}).toArray()
    
    // Get all admin emails
    const admins = await adminsCollection.find({}).toArray()
    const adminEmails = new Set(admins.map(admin => admin.email))

    // Add isAdmin flag to each user
    const usersWithAdminFlag = users.map(user => ({
      ...user,
      isAdmin: adminEmails.has(user.email)
    }))

    return NextResponse.json({ users: usersWithAdminFlag })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// DELETE a user
export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (!(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Prevent admin from deleting themselves
    if (email === session.user.email) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('QusMaker')
    const usersCollection = db.collection('users')

    // Delete user
    const result = await usersCollection.deleteOne({ email })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User deleted successfully' 
    })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}

// POST to promote user to admin
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (!(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { email, name, action } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('QusMaker')
    const adminsCollection = db.collection('admin')
    const usersCollection = db.collection('users')

    if (action === 'promote') {
      // Check if user exists
      const user = await usersCollection.findOne({ email })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      // Check if already admin
      const existingAdmin = await adminsCollection.findOne({ email })
      if (existingAdmin) {
        return NextResponse.json({ error: 'User is already an admin' }, { status: 400 })
      }

      // Promote to admin
      await adminsCollection.insertOne({
        name: name || user.name,
        email: email,
        image: user.image,
        googleId: user.googleId,
        provider: user.provider || 'google',
        promotedAt: new Date(),
        promotedBy: session.user.email
      })

      return NextResponse.json({ 
        success: true, 
        message: 'User promoted to admin successfully' 
      })

    } else if (action === 'demote') {
      // Prevent admin from demoting themselves
      if (email === session.user.email) {
        return NextResponse.json({ error: 'Cannot demote yourself' }, { status: 400 })
      }

      // Demote from admin
      const result = await adminsCollection.deleteOne({ email })

      if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'User is not an admin' }, { status: 404 })
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Admin demoted successfully' 
      })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Error managing admin status:', error)
    return NextResponse.json(
      { error: 'Failed to manage admin status' },
      { status: 500 }
    )
  }
}
