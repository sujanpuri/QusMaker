'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export default function AdminPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState([])
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null })
  const [promoteDialog, setPromoteDialog] = useState({ open: false, user: null, action: null })

  // Redirect to dashboard since authentication has been removed
  useEffect(() => {
    router.push('/dashboard')
  }, [router])

  // Fetch users
  useEffect(() => {
    if (isAdmin && activeTab === 'users') {
      fetchUsers()
    }
  }, [isAdmin, activeTab])

  // Fetch activities
  useEffect(() => {
    if (isAdmin && activeTab === 'activities') {
      fetchActivities()
    }
  }, [isAdmin, activeTab])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/users')
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchActivities = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/activities')
      const data = await response.json()
      setActivities(data.activities || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deleteDialog.user) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: deleteDialog.user.email }),
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh users list
        fetchUsers()
        setDeleteDialog({ open: false, user: null })
      } else {
        alert(data.error || 'Failed to delete user')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Failed to delete user')
    }
  }

  const handlePromoteUser = async () => {
    if (!promoteDialog.user) return

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: promoteDialog.user.email,
          name: promoteDialog.user.name,
          action: promoteDialog.action
        }),
      })

      const data = await response.json()

      if (response.ok) {
        // Refresh users list
        fetchUsers()
        setPromoteDialog({ open: false, user: null, action: null })
      } else {
        alert(data.error || `Failed to ${promoteDialog.action} user`)
      }
    } catch (error) {
      console.error(`Error ${promoteDialog.action}ing user:`, error)
      alert(`Failed to ${promoteDialog.action} user`)
    }
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background via-background to-secondary/5">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Checking permissions...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage users and monitor activities</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'users'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('activities')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'activities'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Activities ({activities.length})
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage user accounts and admin privileges</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading users...</p>
                </div>
              ) : users.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No users found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">User</th>
                        <th className="text-left py-3 px-4">Email</th>
                        <th className="text-left py-3 px-4">Provider</th>
                        <th className="text-left py-3 px-4">Last Login</th>
                        <th className="text-left py-3 px-4">Role</th>
                        <th className="text-right py-3 px-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user._id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {user.image ? (
                                <img 
                                  src={user.image} 
                                  alt={user.name} 
                                  className="rounded-full border-2 border-primary/20 object-cover w-10 h-10"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center">
                                  <User className="w-5 h-5 text-primary" />
                                </div>
                              )}
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">{user.email}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary">
                              {user.provider || 'google'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {formatDate(user.lastLogin)}
                          </td>
                          <td className="py-3 px-4">
                            {user.isAdmin ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                                Admin
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary">
                                User
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex justify-end gap-2">
                              {user.isAdmin ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setPromoteDialog({ 
                                    open: true, 
                                    user, 
                                    action: 'demote' 
                                  })}
                                  disabled={user.email === session?.user?.email}
                                >
                                  Demote
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setPromoteDialog({ 
                                    open: true, 
                                    user, 
                                    action: 'promote' 
                                  })}
                                >
                                  Make Admin
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteDialog({ open: true, user })}
                                disabled={user.email === session?.user?.email}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activities Tab */}
        {activeTab === 'activities' && (
          <Card>
            <CardHeader>
              <CardTitle>User Activities</CardTitle>
              <CardDescription>Monitor all user actions across the platform</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading activities...</p>
                </div>
              ) : activities.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No activities found</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">User</th>
                        <th className="text-left py-3 px-4">Action</th>
                        <th className="text-left py-3 px-4">File Name</th>
                        <th className="text-left py-3 px-4">Type</th>
                        <th className="text-left py-3 px-4">Time</th>
                        <th className="text-left py-3 px-4">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activities.map((activity) => (
                        <tr key={activity._id} className="border-b hover:bg-muted/50 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {activity.userImage ? (
                                <img 
                                  src={activity.userImage} 
                                  alt={activity.userName} 
                                  className="rounded-full border-2 border-primary/20 object-cover w-8 h-8 shrink-0"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full border-2 border-primary/20 bg-primary/10 flex items-center justify-center shrink-0">
                                  <User className="w-4 h-4 text-primary" />
                                </div>
                              )}
                              <div>
                                <div className="font-medium">{activity.userName}</div>
                                <div className="text-sm text-muted-foreground">{activity.userEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              activity.action === 'created' 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                            }`}>
                              {activity.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-sm">{activity.fileName}</td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary">
                              {activity.fileType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {formatDate(activity.timestamp)}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground max-w-md truncate">
                            {activity.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Delete User Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, user: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the user <strong>{deleteDialog.user?.name}</strong> ({deleteDialog.user?.email}).
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Promote/Demote Dialog */}
      <AlertDialog open={promoteDialog.open} onOpenChange={(open) => setPromoteDialog({ open, user: null, action: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {promoteDialog.action === 'promote' ? 'Promote to Admin' : 'Demote from Admin'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {promoteDialog.action === 'promote' ? (
                <>
                  Are you sure you want to promote <strong>{promoteDialog.user?.name}</strong> to admin?
                  They will have full access to all admin features.
                </>
              ) : (
                <>
                  Are you sure you want to remove admin privileges from <strong>{promoteDialog.user?.name}</strong>?
                  They will become a regular user.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePromoteUser}>
              {promoteDialog.action === 'promote' ? 'Promote' : 'Demote'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
