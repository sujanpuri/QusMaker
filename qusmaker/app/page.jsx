import { Button } from '@/components/ui/button'
import { ArrowRight, Sparkles, Zap, Users, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-linear-to-br from-background via-background to-blue-50 dark:to-slate-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 backdrop-blur-md bg-background/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Qus-Maker</h1>
          </div>
          <Button 
            onClick={() => signIn('google', {callbackUrl: '/dashboard'})} 
            className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20">
                <Zap className="w-4 h-4 text-accent" />
                <span className="text-sm font-medium text-accent">Launch smarter quizzes</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
                <span className="text-pretty">Create Quizzes That Inspire</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-lg">
                Qus-Maker makes it effortless to design, share, and analyze interactive quizzes. Engage your audience with powerful question creation tools built for educators and content creators.
              </p>
            </div>

            {/* CTA Button */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-6 pt-8 text-sm text-muted-foreground">
              <div>✓ No credit card required</div>
              <div>✓ Free forever plan</div>
            </div>
          </div>

          {/* Right Visual - Feature Showcase */}
          <div className="relative h-96 md:h-full">
            <div className="absolute inset-0 rounded-2xl bg-linear-to-br from-primary/20 to-secondary/20 dark:from-primary/10 dark:to-secondary/10 backdrop-blur-sm border border-border/50 overflow-hidden">
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-8">
                  <BarChart3 className="w-12 h-12 text-primary" />
                </div>
                <p className="text-center text-foreground font-semibold mb-4">Powerful Analytics</p>
                <p className="text-center text-sm text-muted-foreground">Track responses, measure engagement, and optimize your quizzes in real-time</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h3 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Why educators love Qus-Maker
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to create engaging quizzes and measure learning outcomes
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="group p-6 rounded-xl border border-border hover:border-primary/40 bg-card hover:bg-card/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Easy Creation</h4>
            <p className="text-muted-foreground">Design professional quizzes in minutes with our intuitive interface and pre-built templates.</p>
          </div>

          {/* Feature 2 */}
          <div className="group p-6 rounded-xl border border-border hover:border-primary/40 bg-card hover:bg-card/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
              <Users className="w-6 h-6 text-secondary" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Share & Collaborate</h4>
            <p className="text-muted-foreground">Distribute your quizzes with a simple link and invite collaborators to build together.</p>
          </div>

          {/* Feature 3 */}
          <div className="group p-6 rounded-xl border border-border hover:border-primary/40 bg-card hover:bg-card/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
              <BarChart3 className="w-6 h-6 text-accent" />
            </div>
            <h4 className="text-lg font-semibold text-foreground mb-2">Real-time Analytics</h4>
            <p className="text-muted-foreground">Get instant insights into response patterns, scores, and student performance metrics.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="rounded-2xl bg-linear-to-r from-primary to-secondary p-12 md:p-16 text-center">
          <h3 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Ready to create amazing quizzes?
          </h3>
          <p className="text-lg text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
            Join educators and creators building engaging learning experiences with Qus-Maker
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="gap-2 bg-primary-foreground hover:bg-primary-foreground/90 text-primary">
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 mt-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Qus-Maker</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Qus-Maker. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
