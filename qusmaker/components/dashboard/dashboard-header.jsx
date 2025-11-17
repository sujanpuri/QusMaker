'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { LogOut, Shield, User } from 'lucide-react'
import Image from 'next/image'

export default function DashboardHeader() {
  const { data: session } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      if (session?.user) {
        try {
          const response = await fetch('/api/admin/check')
          const data = await response.json()
          setIsAdmin(data.isAdmin)
        } catch (error) {
          console.error('Error checking admin status:', error)
        }
      }
    }
    checkAdmin()
  }, [session])

  const handleSignOut = () => {
    signOut({ callbackUrl: '/' })
  }

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">QM</span>
          </div>
          <span className="font-bold text-xl text-foreground">Qus-Maker</span>
        </Link>
        
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link href="/admin">
              <Button variant="outline" size="sm" className="gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden md:inline">Admin Panel</span>
              </Button>
            </Link>
          )}
          
          {session?.user && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-secondary/10 border border-secondary/20">
              <div className="text-right hidden md:block">
                <p className="text-sm font-semibold text-foreground leading-tight">{session.user.name}</p>
                <p className="text-xs text-muted-foreground">{session.user.email}</p>
              </div>
              <div className="relative">
                {session.user.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'User'} 
                    className="rounded-full border-2 border-primary/30 object-cover w-10 h-10"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full border-2 border-primary/30 bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
            </div>
          )}
          
          <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
