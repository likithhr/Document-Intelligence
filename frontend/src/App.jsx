import { useState, useEffect, useRef, useCallback, useMemo } from 'react'

/* =========================================================================
   services/api.js — Inline API service for the Spring Boot backend
   ========================================================================= */
const API = {
  baseURL: '/api',

  async _request(path, options = {}) {
    const res = await fetch(`${this.baseURL}${path}`, options)
    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(text || `Request failed: ${res.status}`)
    }
    const ct = res.headers.get('content-type') || ''
    return ct.includes('application/json') ? res.json() : res.text()
  },

  uploadDocument(file, onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const formData = new FormData()
      formData.append('file', file)
      xhr.open('POST', `${this.baseURL}/documents/upload`)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try { resolve(JSON.parse(xhr.responseText)) } catch { resolve(xhr.responseText) }
        } else reject(new Error(xhr.responseText || `Upload failed: ${xhr.status}`))
      }
      xhr.onerror = () => reject(new Error('Network error during upload'))
      xhr.send(formData)
    })
  },

  listDocuments: () => API._request('/documents'),
  getDocument: (id) => API._request(`/documents/${id}`),
  askQuestion: (id, question) =>
    API._request(`/qna/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    }),
}

/* =========================================================================
   Hooks
   ========================================================================= */
function useInView(options = {}) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold: 0.15, ...options }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return [ref, inView]
}

function useScrollY() {
  const [y, setY] = useState(0)
  useEffect(() => {
    const onScroll = () => setY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  return y
}

/* =========================================================================
   Icons (inline SVG — no external library)
   ========================================================================= */
const Icon = {
  Upload: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>),
  Cloud: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>),
  Scan: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="7" y1="12" x2="17" y2="12"/></svg>),
  Sparkles: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/></svg>),
  Message: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  Bolt: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>),
  Shield: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>),
  Github: (p) => (<svg {...p} viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2.1c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.2 1.77 1.2 1.03 1.77 2.7 1.26 3.36.97.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.18-3.1-.12-.29-.51-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.21-1.49 3.18-1.18 3.18-1.18.62 1.59.23 2.77.11 3.06.74.81 1.18 1.84 1.18 3.1 0 4.42-2.69 5.4-5.25 5.69.41.36.78 1.07.78 2.16v3.2c0 .31.21.67.8.55C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5z"/></svg>),
  ArrowRight: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>),
  Check: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>),
  X: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  Send: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
  File: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>),
  Cpu: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="15" x2="23" y2="15"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="15" x2="4" y2="15"/></svg>),
  Brain: (p) => (<svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a4 4 0 0 0-4 4v0a4 4 0 0 0-4 4v0a4 4 0 0 0 0 8v0a4 4 0 0 0 4 4v0a4 4 0 0 0 4-4"/><path d="M12 2a4 4 0 0 1 4 4v0a4 4 0 0 1 4 4v0a4 4 0 0 1 0 8v0a4 4 0 0 1-4 4v0a4 4 0 0 1-4-4"/></svg>),
  Play: (p) => (<svg {...p} viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>),
}

/* =========================================================================
   Background — animated gradient + particles
   ========================================================================= */
function AnimatedBackground() {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let w, h, raf
    const particles = []
    const resize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)
    const count = Math.min(60, Math.floor((w * h) / 25000))
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        hue: Math.random() < 0.5 ? 210 : 190,
      })
    }
    const tick = () => {
      ctx.clearRect(0, 0, w, h)
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 90%, 65%, 0.6)`
        ctx.fill()
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - d / 120)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }
      raf = requestAnimationFrame(tick)
    }
    tick()
    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(raf)
    }
  }, [])
  return (
    <>
      <div className="fixed inset-0 -z-20 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900" />
      <div className="fixed inset-0 -z-20 opacity-30 bg-grid" />
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 -left-1/4 w-1/2 h-1/2 rounded-full bg-blue-600/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-0 -right-1/4 w-1/2 h-1/2 rounded-full bg-purple-600/20 blur-[120px] animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 rounded-full bg-cyan-500/10 blur-[120px] animate-pulse-slow" />
      </div>
      <canvas ref={canvasRef} className="fixed inset-0 -z-10 pointer-events-none" />
    </>
  )
}

/* =========================================================================
   Toast notifications
   ========================================================================= */
function ToastContainer({ toasts, onDismiss }) {
  return (
    <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`glass-strong rounded-xl px-4 py-3 shadow-2xl flex items-start gap-3 animate-fade-in-up border-l-4 ${
            t.type === 'success' ? 'border-emerald-400' :
            t.type === 'error' ? 'border-rose-400' :
            'border-blue-400'
          }`}
        >
          <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${
            t.type === 'success' ? 'bg-emerald-500/20 text-emerald-300' :
            t.type === 'error' ? 'bg-rose-500/20 text-rose-300' :
            'bg-blue-500/20 text-blue-300'
          }`}>
            {t.type === 'success' ? <Icon.Check className="w-3 h-3" /> :
             t.type === 'error' ? <Icon.X className="w-3 h-3" /> :
             <Icon.Bolt className="w-3 h-3" />}
          </div>
          <div className="flex-1 text-sm text-slate-100">{t.message}</div>
          <button onClick={() => onDismiss(t.id)} className="text-slate-400 hover:text-white">
            <Icon.X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

/* =========================================================================
   Navigation
   ========================================================================= */
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  const links = [
    { href: '#how-it-works', label: 'How it works' },
    { href: '#features', label: 'Features' },
    { href: '#tech', label: 'Tech' },
    { href: '#demo', label: 'Demo' },
    { href: '#architecture', label: 'Architecture' },
  ]
  return (
    <header className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${
      scrolled ? 'bg-navy-900/80 backdrop-blur-xl border-b border-white/5' : ''
    }`}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
            <Icon.Brain className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-white text-lg">DocIntel</span>
        </a>
        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm text-slate-300 hover:text-white relative group">
              {l.label}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-cyan-400 group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </nav>
        <a href="#demo" className="hidden md:inline-flex btn-primary text-sm px-4 py-2">
          Try It Now
        </a>
        <button className="md:hidden text-white" onClick={() => setOpen(!open)} aria-label="Menu">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></> :
            <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>}
          </svg>
        </button>
      </div>
      {open && (
        <div className="md:hidden glass-strong border-t border-white/5">
          <div className="px-6 py-4 flex flex-col gap-3">
            {links.map((l) => (
              <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-slate-200 hover:text-white py-2">{l.label}</a>
            ))}
            <a href="#demo" onClick={() => setOpen(false)} className="btn-primary text-sm text-center">Try It Now</a>
          </div>
        </div>
      )}
    </header>
  )
}

/* =========================================================================
   HeroSection
   ========================================================================= */
function HeroSection() {
  const scrollY = useScrollY()
  return (
    <section id="top" className="relative min-h-screen flex items-center pt-24 pb-20 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 w-full grid lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-8" style={{ transform: `translateY(${scrollY * 0.1}px)` }}>
          <div className="inline-flex items-center gap-2 glass px-4 py-1.5 rounded-full text-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300">Final Year Engineering Project · 2026</span>
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.05] tracking-tight">
            <span className="block text-white">Documents,</span>
            <span className="block gradient-text">Decoded by AI.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-300/90 max-w-xl leading-relaxed">
            Upload any PDF — our cloud-native pipeline extracts, summarizes, and answers
            questions about your document in seconds. Powered by AWS Bedrock, Textract & Spring Boot.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#demo" className="btn-primary">
              <Icon.Play className="w-4 h-4 mr-2" />
              Try It Now
            </a>
            <a href="https://github.com/likithhr/Document-Intelligence" target="_blank" rel="noreferrer" className="btn-ghost">
              <Icon.Github className="w-4 h-4 mr-2" />
              View on GitHub
              <Icon.ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </div>
          <div className="flex items-center gap-6 pt-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Icon.Check className="w-4 h-4 text-emerald-400" />
              <span>Real-time processing</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon.Check className="w-4 h-4 text-emerald-400" />
              <span>Cloud native</span>
            </div>
            <div className="flex items-center gap-2">
              <Icon.Check className="w-4 h-4 text-emerald-400" />
              <span>Open source</span>
            </div>
          </div>
        </div>

        {/* Floating document cards */}
        <div className="relative h-[500px] hidden lg:block">
          <div className="absolute inset-0">
            {[
              { top: '5%', left: '10%', rotate: -8, anim: 'animate-float-slow', tag: 'AI Summary', color: 'from-blue-500 to-cyan-400' },
              { top: '15%', left: '55%', rotate: 6, anim: 'animate-float-medium', tag: 'Q&A', color: 'from-purple-500 to-pink-500' },
              { top: '45%', left: '5%', rotate: 4, anim: 'animate-float-fast', tag: 'OCR', color: 'from-emerald-500 to-teal-400' },
              { top: '55%', left: '50%', rotate: -5, anim: 'animate-float-slow', tag: 'Bedrock', color: 'from-amber-500 to-orange-500' },
              { top: '75%', left: '25%', rotate: 8, anim: 'animate-float-medium', tag: 'S3', color: 'from-rose-500 to-red-500' },
            ].map((c, i) => (
              <div
                key={i}
                className={`absolute glass-strong rounded-2xl p-5 w-56 shadow-2xl ${c.anim}`}
                style={{ top: c.top, left: c.left, transform: `rotate(${c.rotate}deg)` }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Icon.File className="w-4 h-4 text-cyan-300" />
                  </div>
                  <div className="flex-1">
                    <div className="h-2 w-24 bg-slate-700/50 rounded" />
                    <div className="h-1.5 w-16 bg-slate-800/50 rounded mt-1.5" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <div className="h-1.5 w-full bg-slate-700/40 rounded" />
                  <div className="h-1.5 w-5/6 bg-slate-700/40 rounded" />
                  <div className="h-1.5 w-4/6 bg-slate-700/40 rounded" />
                </div>
                <div className={`mt-3 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full text-white bg-gradient-to-r ${c.color}`}>
                  <Icon.Sparkles className="w-3 h-3" />
                  {c.tag}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 text-xs animate-pulse">
        <span>Scroll to explore</span>
        <div className="w-5 h-8 rounded-full border border-slate-500/50 flex items-start justify-center p-1">
          <div className="w-1 h-2 bg-cyan-400 rounded-full animate-bounce" />
        </div>
      </div>
    </section>
  )
}

/* =========================================================================
   HowItWorks
   ========================================================================= */
function HowItWorks() {
  const [ref, inView] = useInView()
  const steps = [
    { icon: Icon.Upload, title: 'Upload', desc: 'Drop a PDF into the secure uploader — streamed straight to AWS S3.', color: 'from-blue-500 to-cyan-400' },
    { icon: Icon.Cloud, title: 'Store & Queue', desc: 'S3 holds the file and SQS dispatches a worker for async processing.', color: 'from-cyan-500 to-teal-400' },
    { icon: Icon.Scan, title: 'Extract', desc: 'Amazon Textract performs OCR — pulling text, tables, and structure.', color: 'from-emerald-500 to-green-400' },
    { icon: Icon.Sparkles, title: 'Summarize', desc: 'AWS Bedrock (Claude) condenses the document into crisp bullet points.', color: 'from-purple-500 to-pink-500' },
    { icon: Icon.Message, title: 'Ask Questions', desc: 'Chat with the document in natural language — answers grounded in the source.', color: 'from-amber-500 to-orange-500' },
  ]
  return (
    <section id="how-it-works" ref={ref} className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="Pipeline"
          title="How It Works"
          subtitle="From PDF upload to AI-powered insights in five seamless steps."
        />
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 relative">
          {/* Connecting line for desktop */}
          <div className="hidden lg:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-blue-500/20 via-cyan-400/40 to-purple-500/20" />
          {steps.map((s, i) => (
            <div
              key={s.title}
              className={`relative group ${inView ? 'animate-fade-in-up' : 'opacity-0'}`}
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <div className="glass rounded-2xl p-6 h-full hover:-translate-y-2 hover:border-cyan-400/30 transition-all duration-500">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>
                  <s.icon className="w-7 h-7 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-slate-500">STEP {i + 1}</span>
                  <h3 className="text-lg font-bold text-white">{s.title}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden lg:flex absolute -right-3 top-12 z-10 w-6 h-6 rounded-full bg-cyan-400 items-center justify-center shadow-lg shadow-cyan-400/50 animate-pulse">
                  <Icon.ArrowRight className="w-3 h-3 text-navy-900" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* =========================================================================
   FeaturesSection
   ========================================================================= */
function FeaturesSection() {
  const [ref, inView] = useInView()
  const features = [
    { icon: Icon.Cloud, title: 'Cloud Native Architecture', desc: 'Built entirely on AWS — S3, SQS, Textract, Bedrock — auto-scaling and resilient.', color: 'from-blue-500 to-cyan-400' },
    { icon: Icon.Sparkles, title: 'AI Summarization', desc: 'Claude on Bedrock condenses long PDFs into clean, scannable bullet points.', color: 'from-purple-500 to-pink-500' },
    { icon: Icon.Message, title: 'Natural Language Q&A', desc: 'Ask anything in plain English — answers cite the document content.', color: 'from-amber-500 to-orange-500' },
    { icon: Icon.Bolt, title: 'Async Processing', desc: 'SQS workers handle extraction in the background — uploads return instantly.', color: 'from-yellow-400 to-amber-500' },
    { icon: Icon.Scan, title: 'OCR Extraction', desc: 'Amazon Textract reads scanned and native PDFs with high-fidelity structure.', color: 'from-emerald-500 to-teal-400' },
    { icon: Icon.Shield, title: 'Secure Storage', desc: 'Files live in encrypted S3 buckets — only your app can fetch them back.', color: 'from-rose-500 to-red-500' },
  ]
  return (
    <section id="features" ref={ref} className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="Capabilities"
          title="Built for the Modern Document"
          subtitle="Six powerful features, one elegant platform."
        />
        <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div
              key={f.title}
              className={`group relative glass rounded-2xl p-7 hover:-translate-y-2 transition-all duration-500 overflow-hidden ${
                inView ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${f.color}`} style={{ opacity: 0 }} />
              <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${f.color} opacity-10 blur-2xl group-hover:opacity-30 transition-opacity duration-500`} />
              <div className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500`}>
                <f.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="relative text-xl font-bold text-white mb-2">{f.title}</h3>
              <p className="relative text-slate-400 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* =========================================================================
   TechStack
   ========================================================================= */
function TechStack() {
  const [ref, inView] = useInView()
  const techs = [
    { name: 'Java', logo: '☕', color: 'from-orange-500 to-red-500' },
    { name: 'Spring Boot', logo: '🍃', color: 'from-green-500 to-emerald-500' },
    { name: 'React', logo: '⚛️', color: 'from-cyan-400 to-blue-500' },
    { name: 'AWS S3', logo: '🪣', color: 'from-amber-500 to-orange-500' },
    { name: 'AWS Textract', logo: '📄', color: 'from-blue-500 to-indigo-500' },
    { name: 'AWS Bedrock', logo: '🧠', color: 'from-purple-500 to-pink-500' },
    { name: 'PostgreSQL', logo: '🐘', color: 'from-blue-600 to-blue-400' },
    { name: 'Docker', logo: '🐳', color: 'from-sky-500 to-cyan-500' },
    { name: 'AWS SQS', logo: '📨', color: 'from-yellow-500 to-amber-500' },
  ]
  return (
    <section id="tech" ref={ref} className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="Under the Hood"
          title="Powered by Best-in-Class Tech"
          subtitle="Production-grade stack, end to end."
        />
        <div className="mt-16 grid grid-cols-3 md:grid-cols-3 lg:grid-cols-9 gap-4">
          {techs.map((t, i) => (
            <div
              key={t.name}
              className={`group glass rounded-2xl p-5 flex flex-col items-center gap-2 hover:-translate-y-2 hover:scale-105 transition-all duration-300 cursor-pointer ${
                inView ? 'animate-fade-in-up' : 'opacity-0'
              }`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`text-4xl group-hover:scale-125 transition-transform duration-500`}>
                {t.logo}
              </div>
              <div className="text-xs font-semibold text-slate-300 text-center">{t.name}</div>
              <div className={`h-0.5 w-0 group-hover:w-full bg-gradient-to-r ${t.color} transition-all duration-500 rounded-full`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* =========================================================================
   LiveDemo
   ========================================================================= */
function StatusBadge({ status }) {
  const config = {
    UPLOADED:   { bg: 'bg-slate-500/20',  text: 'text-slate-300',   border: 'border-slate-400/30',  label: 'Uploaded'   },
    PROCESSING: { bg: 'bg-amber-500/20',  text: 'text-amber-300',   border: 'border-amber-400/40',  label: 'Processing' },
    DONE:       { bg: 'bg-emerald-500/20',text: 'text-emerald-300', border: 'border-emerald-400/40',label: 'Done'       },
    FAILED:     { bg: 'bg-rose-500/20',   text: 'text-rose-300',    border: 'border-rose-400/40',   label: 'Failed'     },
  }[status] || { bg: 'bg-slate-500/20', text: 'text-slate-300', border: 'border-slate-400/30', label: status }

  const isProcessing = status === 'PROCESSING'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
      {isProcessing && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
      {!isProcessing && status === 'DONE' && <Icon.Check className="w-3 h-3" />}
      {!isProcessing && status === 'FAILED' && <Icon.X className="w-3 h-3" />}
      {config.label}
    </span>
  )
}

function ChatBubble({ role, text, loading }) {
  const isUser = role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        isUser
          ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-br-sm'
          : 'glass-strong text-slate-100 rounded-bl-sm'
      }`}>
        {loading ? (
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '120ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '240ms' }} />
          </div>
        ) : (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{text}</p>
        )}
      </div>
    </div>
  )
}

function LiveDemo({ onToast }) {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [documents, setDocuments] = useState([])
  const [docsLoading, setDocsLoading] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [selected, setSelected] = useState(null)
  const [question, setQuestion] = useState('')
  const [chat, setChat] = useState([])
  const [asking, setAsking] = useState(false)
  const fileInputRef = useRef(null)
  const chatRef = useRef(null)

  // Fetch documents initially
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        setDocsLoading(true)
        const data = await API.listDocuments()
        if (!cancelled) setDocuments(Array.isArray(data) ? data : [])
      } catch (e) {
        if (!cancelled) onToast('error', `Failed to load documents: ${e.message}`)
      } finally {
        if (!cancelled) setDocsLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  // Status polling — refresh every 3s, only if something is processing
  useEffect(() => {
    const hasProcessing = documents.some((d) => d.status === 'PROCESSING' || d.status === 'UPLOADED')
    if (!hasProcessing) return
    const id = setInterval(async () => {
      try {
        const data = await API.listDocuments()
        const list = Array.isArray(data) ? data : []
        setDocuments(list)
        if (selectedId) {
          const fresh = list.find((d) => d.id === selectedId)
          if (fresh && (fresh.status === 'DONE' || fresh.status === 'FAILED')) {
            const detail = await API.getDocument(selectedId)
            setSelected(detail)
          }
        }
      } catch {/* silent during polling */}
    }, 3000)
    return () => clearInterval(id)
  }, [documents, selectedId])

  // Load detail when selected
  useEffect(() => {
    if (!selectedId) { setSelected(null); return }
    let cancelled = false
    const load = async () => {
      try {
        const data = await API.getDocument(selectedId)
        if (!cancelled) {
          setSelected(data)
          setChat([])
        }
      } catch (e) {
        if (!cancelled) onToast('error', `Failed to load document: ${e.message}`)
      }
    }
    load()
    return () => { cancelled = true }
  }, [selectedId])

  // Auto-scroll chat
  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [chat, asking])

  const handleFiles = useCallback((files) => {
    const f = files?.[0]
    if (!f) return
    if (f.type !== 'application/pdf' && !f.name.toLowerCase().endsWith('.pdf')) {
      onToast('error', 'Please upload a PDF file')
      return
    }
    setFile(f)
  }, [onToast])

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true); setUploadProgress(0)
    try {
      const result = await API.uploadDocument(file, setUploadProgress)
      onToast('success', `Uploaded "${file.name}"`)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      const data = await API.listDocuments()
      setDocuments(Array.isArray(data) ? data : [])
      const newId = result?.id
      if (newId) setSelectedId(newId)
    } catch (e) {
      onToast('error', `Upload failed: ${e.message}`)
    } finally {
      setUploading(false)
    }
  }

  const handleAsk = async (e) => {
    e.preventDefault()
    if (!question.trim() || !selectedId || asking) return
    const q = question.trim()
    setQuestion('')
    setChat((c) => [...c, { role: 'user', text: q }])
    setAsking(true)
    try {
      const res = await API.askQuestion(selectedId, q)
      const answer = res?.answer ?? res?.response ?? JSON.stringify(res)
      setChat((c) => [...c, { role: 'assistant', text: answer }])
    } catch (err) {
      setChat((c) => [...c, { role: 'assistant', text: `⚠️ ${err.message}` }])
    } finally {
      setAsking(false)
    }
  }

  const summaryBullets = useMemo(() => {
    if (!selected?.summary) return []
    return selected.summary
      .split(/\n|(?:^|\s)[•\-\*]\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length < 500)
  }, [selected])

  return (
    <section id="demo" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="Live Demo"
          title="Try It Right Now"
          subtitle="Upload a PDF — watch the pipeline extract, summarize, and answer in real time."
        />
        <div className="mt-12 grid lg:grid-cols-12 gap-6">
          {/* Upload + document list */}
          <div className="lg:col-span-5 space-y-6">
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative glass-strong rounded-2xl p-8 text-center cursor-pointer border-2 border-dashed transition-all duration-300 ${
                dragOver ? 'border-cyan-400 bg-cyan-400/5 scale-[1.02]' : 'border-slate-700 hover:border-slate-500'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
                  <Icon.Upload className="w-8 h-8 text-white" />
                </div>
                {file ? (
                  <>
                    <div className="text-white font-semibold">{file.name}</div>
                    <div className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</div>
                  </>
                ) : (
                  <>
                    <div className="text-white font-semibold">Drop a PDF here or click to browse</div>
                    <div className="text-xs text-slate-400">Max one file · PDF only</div>
                  </>
                )}
              </div>
              {file && !uploading && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleUpload() }}
                  className="mt-4 btn-primary w-full"
                >
                  <Icon.Upload className="w-4 h-4 mr-2" />
                  Upload to Pipeline
                </button>
              )}
              {uploading && (
                <div className="mt-4">
                  <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                  </div>
                  <div className="text-xs text-slate-400 mt-2">Uploading… {uploadProgress}%</div>
                </div>
              )}
            </div>

            <div className="glass-strong rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-white">Your Documents</h3>
                <span className="text-xs text-slate-400">{documents.length} total</span>
              </div>
              {docsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (<div key={i} className="h-16 skeleton" />))}
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  No documents yet — upload one to get started.
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                  {documents.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setSelectedId(d.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                        selectedId === d.id
                          ? 'bg-blue-500/10 border-blue-400/40'
                          : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon.File className="w-4 h-4 text-cyan-300" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white truncate">{d.filename || d.name || `Document ${d.id}`}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <StatusBadge status={d.status} />
                            {d.createdAt && <span className="text-xs text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-7 space-y-6">
            {!selectedId ? (
              <div className="glass-strong rounded-2xl p-12 text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mx-auto mb-4">
                  <Icon.Cpu className="w-10 h-10 text-cyan-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Select a document</h3>
                <p className="text-slate-400 text-sm">Pick a document from the list to see its summary and chat with it.</p>
              </div>
            ) : (
              <>
                <div className="glass-strong rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-white truncate">{selected?.filename || `Document #${selectedId}`}</h3>
                      {selected?.status && <div className="mt-2"><StatusBadge status={selected.status} /></div>}
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <Icon.Sparkles className="w-4 h-4 text-purple-300" />
                    AI Summary
                  </h4>
                  {selected?.status === 'PROCESSING' || selected?.status === 'UPLOADED' ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4].map((i) => (<div key={i} className="h-3 skeleton" style={{ width: `${[100, 90, 75, 60][i-1]}%` }} />))}
                    </div>
                  ) : selected?.status === 'FAILED' ? (
                    <div className="text-rose-300 text-sm">Processing failed. Try uploading again.</div>
                  ) : selected?.summary ? (
                    <ul className="space-y-2">
                      {summaryBullets.map((b, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-slate-500 text-sm">No summary available.</div>
                  )}
                </div>

                <div className="glass-strong rounded-2xl p-6">
                  <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                    <Icon.Message className="w-4 h-4 text-cyan-300" />
                    Ask the Document
                  </h4>
                  <div ref={chatRef} className="space-y-3 mb-4 max-h-[400px] overflow-y-auto pr-1 min-h-[120px]">
                    {chat.length === 0 && (
                      <div className="text-center py-6 text-slate-500 text-sm">
                        Ask anything — answers are grounded in the document.
                      </div>
                    )}
                    {chat.map((m, i) => <ChatBubble key={i} role={m.role} text={m.text} />)}
                    {asking && <ChatBubble role="assistant" loading />}
                  </div>
                  <form onSubmit={handleAsk} className="flex gap-2">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder={selected?.status === 'DONE' ? 'What is this document about?' : 'Waiting for document to finish…'}
                      disabled={selected?.status !== 'DONE' || asking}
                      className="flex-1 bg-navy-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!question.trim() || selected?.status !== 'DONE' || asking}
                      className="btn-primary px-4 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                    >
                      <Icon.Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

/* =========================================================================
   Architecture
   ========================================================================= */
function Architecture() {
  const [ref, inView] = useInView()
  return (
    <section id="architecture" ref={ref} className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <SectionHeader
          eyebrow="System Design"
          title="Architecture"
          subtitle="A clear view of the entire pipeline — from browser to bedrock."
        />
        <div className={`mt-12 glass-strong rounded-3xl p-6 md:p-10 ${inView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <svg viewBox="0 0 900 540" className="w-full h-auto" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="g-blue" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#3b82f6"/><stop offset="100%" stopColor="#06b6d4"/>
              </linearGradient>
              <linearGradient id="g-purple" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#8b5cf6"/><stop offset="100%" stopColor="#ec4899"/>
              </linearGradient>
              <linearGradient id="g-amber" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f59e0b"/><stop offset="100%" stopColor="#ef4444"/>
              </linearGradient>
              <linearGradient id="g-green" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981"/><stop offset="100%" stopColor="#06b6d4"/>
              </linearGradient>
              <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/>
              </marker>
            </defs>
            {/* Layer backgrounds */}
            <rect x="20" y="30"  width="860" height="80"  rx="12" fill="rgba(59,130,246,0.06)"  stroke="rgba(59,130,246,0.25)"/>
            <rect x="20" y="130" width="860" height="80"  rx="12" fill="rgba(6,182,212,0.06)"   stroke="rgba(6,182,212,0.25)"/>
            <rect x="20" y="230" width="860" height="80"  rx="12" fill="rgba(139,92,246,0.06)"  stroke="rgba(139,92,246,0.25)"/>
            <rect x="20" y="330" width="860" height="80"  rx="12" fill="rgba(245,158,11,0.06)"  stroke="rgba(245,158,11,0.25)"/>
            <rect x="20" y="430" width="860" height="80"  rx="12" fill="rgba(16,185,129,0.06)"  stroke="rgba(16,185,129,0.25)"/>

            {/* Layer labels */}
            <text x="40" y="55"  fill="#60a5fa" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">CLIENT</text>
            <text x="40" y="155" fill="#22d3ee" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">API LAYER</text>
            <text x="40" y="255" fill="#a78bfa" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">MESSAGING</text>
            <text x="40" y="355" fill="#fbbf24" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">AI / OCR</text>
            <text x="40" y="455" fill="#34d399" fontSize="11" fontWeight="700" fontFamily="Inter, sans-serif">STORAGE</text>

            {/* Boxes */}
            {/* Client */}
            <g>
              <rect x="120" y="65" width="200" height="40" rx="8" fill="url(#g-blue)" opacity="0.85"/>
              <text x="220" y="90" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="Inter, sans-serif">React + Tailwind UI</text>
              <rect x="380" y="65" width="180" height="40" rx="8" fill="rgba(59,130,246,0.25)" stroke="rgba(59,130,246,0.5)"/>
              <text x="470" y="90" textAnchor="middle" fill="#cbd5e1" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">REST Client (fetch)</text>
              <rect x="620" y="65" width="220" height="40" rx="8" fill="rgba(6,182,212,0.25)" stroke="rgba(6,182,212,0.5)"/>
              <text x="730" y="90" textAnchor="middle" fill="#cbd5e1" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">Drag &amp; Drop Upload</text>
            </g>
            {/* API */}
            <g>
              <rect x="250" y="165" width="180" height="40" rx="8" fill="url(#g-purple)" opacity="0.85"/>
              <text x="340" y="190" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="Inter, sans-serif">Spring Boot API</text>
              <rect x="470" y="165" width="180" height="40" rx="8" fill="rgba(139,92,246,0.25)" stroke="rgba(139,92,246,0.5)"/>
              <text x="560" y="190" textAnchor="middle" fill="#cbd5e1" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">Document Controller</text>
              <rect x="690" y="165" width="150" height="40" rx="8" fill="rgba(139,92,246,0.25)" stroke="rgba(139,92,246,0.5)"/>
              <text x="765" y="190" textAnchor="middle" fill="#cbd5e1" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">Q&amp;A Service</text>
            </g>
            {/* Messaging */}
            <g>
              <rect x="350" y="265" width="200" height="40" rx="8" fill="url(#g-amber)" opacity="0.85"/>
              <text x="450" y="290" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="Inter, sans-serif">AWS SQS Queue</text>
              <rect x="580" y="265" width="240" height="40" rx="8" fill="rgba(245,158,11,0.25)" stroke="rgba(245,158,11,0.5)"/>
              <text x="700" y="290" textAnchor="middle" fill="#cbd5e1" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">Async Worker Pool</text>
            </g>
            {/* AI */}
            <g>
              <rect x="180" y="365" width="200" height="40" rx="8" fill="url(#g-purple)" opacity="0.85"/>
              <text x="280" y="390" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="Inter, sans-serif">Amazon Textract</text>
              <rect x="420" y="365" width="220" height="40" rx="8" fill="url(#g-blue)" opacity="0.85"/>
              <text x="530" y="390" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="Inter, sans-serif">AWS Bedrock (Claude)</text>
              <rect x="680" y="365" width="180" height="40" rx="8" fill="rgba(139,92,246,0.25)" stroke="rgba(139,92,246,0.5)"/>
              <text x="770" y="390" textAnchor="middle" fill="#cbd5e1" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">Summarize / Q&amp;A</text>
            </g>
            {/* Storage */}
            <g>
              <rect x="180" y="465" width="220" height="40" rx="8" fill="url(#g-amber)" opacity="0.85"/>
              <text x="290" y="490" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="Inter, sans-serif">AWS S3 Bucket</text>
              <rect x="440" y="465" width="200" height="40" rx="8" fill="url(#g-green)" opacity="0.85"/>
              <text x="540" y="490" textAnchor="middle" fill="white" fontSize="14" fontWeight="700" fontFamily="Inter, sans-serif">PostgreSQL</text>
              <rect x="680" y="465" width="180" height="40" rx="8" fill="rgba(16,185,129,0.25)" stroke="rgba(16,185,129,0.5)"/>
              <text x="770" y="490" textAnchor="middle" fill="#cbd5e1" fontSize="13" fontWeight="600" fontFamily="Inter, sans-serif">Metadata Store</text>
            </g>

            {/* Arrows */}
            <g stroke="#64748b" strokeWidth="1.5" fill="none" markerEnd="url(#arrow)">
              <path d="M 340 105 L 340 165" />
              <path d="M 560 105 L 560 165" />
              <path d="M 560 205 L 450 265" />
              <path d="M 560 205 L 700 265" />
              <path d="M 700 305 L 700 365" />
              <path d="M 450 305 L 280 365" />
              <path d="M 450 305 L 530 365" />
              <path d="M 280 405 L 290 465" />
              <path d="M 530 405 L 540 465" />
            </g>
          </svg>
        </div>
      </div>
    </section>
  )
}

/* =========================================================================
   Footer
   ========================================================================= */
function Footer() {
  return (
    <footer className="relative border-t border-white/5 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Icon.Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-white text-lg">DocIntel</span>
            </div>
            <p className="text-sm text-slate-400 max-w-xs">
              AI-Powered Document Intelligence Platform — upload, extract, summarize, and chat with any PDF.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Tech Stack</h4>
            <div className="flex flex-wrap gap-2">
              {['Java', 'Spring Boot', 'React', 'Tailwind', 'AWS S3', 'Textract', 'Bedrock', 'PostgreSQL', 'Docker', 'SQS'].map((t) => (
                <span key={t} className="text-xs px-2.5 py-1 rounded-full glass text-slate-300">{t}</span>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white mb-3">Project</h4>
            <p className="text-sm text-slate-400">Final Year Engineering Project</p>
            <p className="text-sm text-slate-400 mt-1">Built by <span className="text-cyan-300 font-semibold">Likith H R</span></p>
            <p className="text-xs text-slate-500 mt-1">Information Technology · 2026</p>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-xs text-slate-500">© 2026 DocIntel. All rights reserved.</p>
          <p className="text-xs text-slate-500">Made with React, Spring Boot &amp; AWS</p>
        </div>
      </div>
    </footer>
  )
}

/* =========================================================================
   Section header
   ========================================================================= */
function SectionHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <div className="inline-flex items-center gap-2 glass px-3 py-1 rounded-full text-xs font-semibold text-cyan-300 uppercase tracking-wider mb-4">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        {eyebrow}
      </div>
      <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
        {title.split(' ').map((w, i) => (
          <span key={i} className={i === title.split(' ').length - 1 ? 'gradient-text' : ''}>{w}{' '}</span>
        ))}
      </h2>
      {subtitle && <p className="mt-4 text-slate-400 text-lg">{subtitle}</p>}
    </div>
  )
}

/* =========================================================================
   App
   ========================================================================= */
export default function App() {
  const [toasts, setToasts] = useState([])
  const addToast = useCallback((type, message) => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, type, message }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])
  const dismissToast = useCallback((id) => {
    setToasts((t) => t.filter((x) => x.id !== id))
  }, [])

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <AnimatedBackground />
      <Navbar />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <main>
        <HeroSection />
        <HowItWorks />
        <FeaturesSection />
        <TechStack />
        <LiveDemo onToast={addToast} />
        <Architecture />
      </main>
      <Footer />
    </div>
  )
}
