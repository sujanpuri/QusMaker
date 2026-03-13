import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

// GET all users
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db('QusMaker')
    const usersCollection = db.collection('users')
    const adminsCollection = db.collection('admin')

    const users = await usersCollection.find({}).toArray()
    const admins = await adminsCollection.find({}).toArray()
    const adminEmails = new Set(admins.map((admin: any) => admin.email))

    const usersWithAdminFlag = users.map((user: any) => ({
      ...user,
      isAdmin: adminEmails.has(user.email)
    }))

    return NextResponse.json({ users: usersWithAdminFlag })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

// DELETE a user
export async function DELETE(req: Request) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('QusMaker')
    const usersCollection = db.collection('users')

    const result = await usersCollection.deleteOne({ email })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}

// POST to promote/demote user
export async function POST(req: Request) {
  try {
    const { email, name, action } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db('QusMaker')
    const adminsCollection = db.collection('admin')
    const usersCollection = db.collection('users')

    if (action === 'promote') {
      const user = await usersCollection.findOne({ email })
      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }

      const existingAdmin = await adminsCollection.findOne({ email })
      if (existingAdmin) {
        return NextResponse.json({ error: 'User is already an admin' }, { status: 400 })
      }

      await adminsCollection.insertOne({
        name: name || user.name,
        email,
        image: user.image,
        promotedAt: new Date(),
      })

      return NextResponse.json({ success: true, message: 'User promoted to admin successfully' })

    } else if (action === 'demote') {
      const result = await adminsCollection.deleteOne({ email })

      if (result.deletedCount === 0) {
        return NextResponse.json({ error: 'User is not an admin' }, { status: 404 })
      }

      return NextResponse.json({ success: true, message: 'Admin demoted successfully' })
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error managing admin status:', error)
    return NextResponse.json({ error: 'Failed to manage admin status' }, { status: 500 })
  }
}
