import Link from 'next/link'

export default function DashboardHeader() {
  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 bg-linear-to-br from-primary to-secondary rounded-lg flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-sm">QM</span>
          </div>
          <span className="font-bold text-xl text-foreground">Qus-Maker</span>
        </Link>
      </div>
    </header>
  )
}
