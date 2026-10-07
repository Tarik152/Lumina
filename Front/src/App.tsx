import React, { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import './App.css'

/* ── Floating-dots canvas background ───────────────────── */
function DotsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let W = 0, H = 0
    const DOT_COUNT = 55

    interface Dot {
      x: number; y: number
      vx: number; vy: number
      r: number; alpha: number
    }

    let dots: Dot[] = []

    function resize() {
      W = canvas!.width  = canvas!.offsetWidth
      H = canvas!.height = canvas!.offsetHeight
    }

    function initDots() {
      dots = Array.from({ length: DOT_COUNT }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.4 + 0.15,
      }))
    }

    let raf = 0
    function draw() {
      ctx.clearRect(0, 0, W, H)
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[i].x - dots[j].x
          const dy = dots[i].y - dots[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 130) {
            ctx.beginPath()
            ctx.strokeStyle = `rgba(100,180,150,${0.12 * (1 - dist / 130)})`
            ctx.lineWidth = 1
            ctx.moveTo(dots[i].x, dots[i].y)
            ctx.lineTo(dots[j].x, dots[j].y)
            ctx.stroke()
          }
        }
      }
      for (const d of dots) {
        ctx.beginPath()
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(80,160,130,${d.alpha})`
        ctx.fill()
        d.x += d.vx
        d.y += d.vy
        if (d.x < -10) d.x = W + 10
        if (d.x > W + 10) d.x = -10
        if (d.y < -10) d.y = H + 10
        if (d.y > H + 10) d.y = -10
      }
      raf = requestAnimationFrame(draw)
    }

    resize()
    initDots()
    draw()

    const ro = new ResizeObserver(() => { resize(); initDots() })
    ro.observe(canvas)

    return () => { cancelAnimationFrame(raf); ro.disconnect() }
  }, [])

  return <canvas ref={canvasRef} className="dots-canvas" aria-hidden="true" />
}

/* ── Scroll-parallax hook ───────────────────────────────── */
function useParallax(factor = 0.18) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onScroll = () => {
      el.style.transform = `translateY(${window.scrollY * factor}px)`
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [factor])
  return ref
}

/* ── Blur chips when they scroll into the blurred zone ───── */
function useChipBlur(refs: React.RefObject<HTMLDivElement | null>[], sectionId: string) {
  useEffect(() => {
    const section = document.getElementById(sectionId)
    if (!section) return
    const onScroll = () => {
      const inBlurZone = section.getBoundingClientRect().top < window.innerHeight * 0.85
      refs.forEach(r => r.current?.classList.toggle('is-blurred', inBlurZone))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [refs, sectionId])
}

/* ── Data ────────────────────────────────────────────────── */
const tags = ['Source-grounded answers', 'Quiz generation', 'Web research mode', 'PDF summaries', 'Image analysis']

const features = [
  { icon: '📄', title: 'PDF Analysis',    desc: 'Upload any PDF — get instant summaries, key extractions, and page-level explanations.', color: '#3ecf8e' },
  { icon: '❓', title: 'Ask Anything',    desc: 'Ask questions about your docs or search the web. Get precise, cited answers.',            color: '#f59e0b' },
  { icon: '🖼', title: 'Image & Video',   desc: 'Attach images or videos. The AI extracts text, explains diagrams and visual content.',    color: '#8b5cf6' },
  { icon: '✏️', title: 'Quiz Generator',  desc: 'Turn any material into practice quizzes, exam questions, and flashcards instantly.',     color: '#ef4444' },
]

const stats = [
  { n: '10×',  l: 'Faster revision' },
  { n: '98%',  l: 'Answer accuracy' },
  { n: '50+',  l: 'File formats' },
  { n: '3 sec',l: 'Avg. response time' },
]

const usecases = [
  { emoji: '🎓', title: 'Students',      desc: 'Summarise entire textbook chapters in seconds. Generate practice exams before test day.' },
  { emoji: '🔬', title: 'Researchers',   desc: 'Extract key findings from papers, cross-reference sources, and ask follow-up questions.' },
  { emoji: '💼', title: 'Professionals', desc: 'Digest long reports instantly. Get cited answers without reading 80-page documents.' },
  { emoji: '👩‍🏫', title: 'Teachers',     desc: 'Create quizzes, fill-in-the-blank exercises, and lesson recaps from your own material.' },
]

/* ── App ─────────────────────────────────────────────────── */
export default function App() {
  const heroCardRef = useParallax(-0.10)
  const floatLeft1  = useParallax(0.30)
  const floatLeft2  = useParallax(0.45)
  const floatRight1 = useParallax(0.25)

  useChipBlur([floatLeft1, floatLeft2, floatRight1], 'features')

  return (
    <div className="lp-root">

      {/* ── Background blobs (sit behind everything, visible through blur) ── */}
      <div className="lp-bg-blobs" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
        <div className="blob blob-4" />
        <div className="blob blob-5" />
      </div>

      {/* ── Dot canvas ── */}
      <DotsCanvas />

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav-inner">
          <span className="lp-logo">
            <span className="lp-logo-icon">L</span>
            Lumina<span className="lp-logo-ai">AI</span>
          </span>
          <div className="lp-nav-links">
            <a href="#features">Features</a>
            <a href="#usecases">Who it's for</a>
            <a href="#how">How it works</a>
          </div>
          <div className="lp-nav-ctas">
            <a href="#start" className="lp-link-cta">See demo</a>
            <Link to="/dashboard" className="lp-btn-nav">Start free</Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero" id="start">

        <div ref={floatLeft1} className="lp-float lp-float-pdf">
          <span className="lp-badge-pdf">PDF</span>
          <div className="lp-float-lines"><span /><span /><span /></div>
        </div>
        <div ref={floatLeft2} className="lp-float lp-float-web">
          <span className="lp-badge-web">Web</span>
          <div className="lp-float-lines"><span /><span /></div>
        </div>
        <div ref={floatRight1} className="lp-float lp-float-video">
          <span className="lp-badge-video">Video</span>
          <div className="lp-float-lines"><span /><span /></div>
        </div>

        <div className="lp-hero-left">
          <p className="lp-hero-label">PDFS · PHOTOS · VIDEOS · WEB ANSWERS — ONE STUDY SPACE</p>
          <h1 className="lp-hero-title">Lumina<br />AI</h1>
          <p className="lp-hero-sub">
            Upload your materials, ask anything, and turn messy notes into clear
            summaries, explanations, quizzes, and exam-ready practice.
          </p>
          <div className="lp-hero-actions">
            <Link to="/dashboard" className="lp-btn-primary">Start learning →</Link>
            <a href="#features" className="lp-btn-outline">+ Explore features</a>
          </div>
          <div className="lp-tags">
            {tags.map(t => <span className="lp-tag" key={t}>{t}</span>)}
          </div>
        </div>

        <div ref={heroCardRef} className="lp-hero-right">
          <div className="lp-demo-card">
            <div className="lp-demo-bar">
              <span className="lp-dot red" /><span className="lp-dot yellow" /><span className="lp-dot green" />
            </div>
            <div className="lp-demo-files">
              <div className="lp-demo-file">
                <strong>Biology Chapter 8.pdf</strong>
                <span>42 pages indexed</span>
              </div>
              <div className="lp-demo-file">
                <strong>Lab microscope photo</strong>
                <span>Image analysis ready</span>
              </div>
            </div>
            <div className="lp-demo-query">
              Explain photosynthesis like I am preparing for finals, then quiz me.
            </div>
            <div className="lp-demo-answer">
              <span className="lp-answer-star">✦</span>
              <div>
                Photosynthesis converts light energy into glucose using chlorophyll.
                Found on <span className="lp-src-tag">p.12</span> of your PDF.
                <div className="lp-demo-quiz-inline">
                  <p className="lp-quiz-label">QUICK QUIZ</p>
                  <p className="lp-quiz-q">What role does chlorophyll play?</p>
                  <div className="lp-quiz-choices">
                    <span className="lp-choice-correct">Absorbs light ✓</span>
                    <span>Stores glucose</span>
                    <span>Splits carbon</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="lp-demo-query lp-demo-query-follow">
              wait — does caffeine affect any of this? asking for a friend 😅
            </div>
            <div className="lp-demo-answer">
              <span className="lp-answer-star">✦</span>
              <div>
                Caffeine doesn't directly affect photosynthesis — that's a plant process.
                But it does block adenosine in <em>your</em> brain, keeping you alert while you study it.
                Want a quick breakdown of how that works?
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <div className="lp-stats-bar">
        {stats.map(s => (
          <div className="lp-stat" key={s.l}>
            <span className="lp-stat-n">{s.n}</span>
            <span className="lp-stat-l">{s.l}</span>
          </div>
        ))}
      </div>

      {/* ── Features ── */}
      <section className="lp-section" id="features">
        <p className="lp-section-label">WHAT IT CAN DO</p>
        <h2 className="lp-section-title">Everything you need to learn faster</h2>
        <div className="lp-features-grid">
          {features.map(f => (
            <div className="lp-feat-card" key={f.title} style={{ '--feat-color': f.color } as React.CSSProperties}>
              <div className="lp-feat-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Use-cases ── */}
      <section className="lp-section lp-section-light" id="usecases">
        <p className="lp-section-label">WHO IT'S FOR</p>
        <h2 className="lp-section-title">Built for anyone who reads to learn</h2>
        <div className="lp-usecases-grid">
          {usecases.map(u => (
            <div className="lp-usecase-card" key={u.title}>
              <span className="lp-usecase-emoji">{u.emoji}</span>
              <h3>{u.title}</h3>
              <p>{u.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="lp-section" id="how">
        <p className="lp-section-label">SIMPLE BY DESIGN</p>
        <h2 className="lp-section-title">Upload. Ask anything. That's it.</h2>
        <div className="lp-steps">
          {[
            { n: '01', t: 'Upload your material', s: 'PDF, image, video — drop it in.' },
            { n: '02', t: 'Just start talking',   s: 'No menus, no modes. Ask whatever comes to mind.' },
            { n: '03', t: 'Keep going',           s: 'Follow up, go off-topic, come back — the AI keeps up.' },
          ].map((st, i, arr) => (
            <div className="lp-step" key={st.n}>
              <div className="lp-step-num">{st.n}</div>
              <strong>{st.t}</strong>
              <p>{st.s}</p>
              {i < arr.length - 1 && <span className="lp-step-arrow">→</span>}
            </div>
          ))}
        </div>

        {/* Free-form multi-turn conversation demo */}
        <div className="lp-inline-demo">
          <div className="lp-inline-msg lp-inline-user">
            Summarise chapter 4 for me.
          </div>
          <div className="lp-inline-msg lp-inline-ai">
            <span className="lp-answer-star">✦</span>
            <div><strong>Chapter 4 — Mitosis:</strong> Cell division in 4 phases: prophase, metaphase, anaphase, telophase…</div>
          </div>
          <div className="lp-inline-msg lp-inline-user">
            ok actually — will this be on the exam or should I focus on meiosis?
          </div>
          <div className="lp-inline-msg lp-inline-ai">
            <span className="lp-answer-star">✦</span>
            <div>Based on your syllabus PDF, mitosis is mentioned twice and meiosis has a full dedicated chapter — I'd prioritise meiosis. Want a comparison table?</div>
          </div>
          <div className="lp-inline-msg lp-inline-user">
            yes, and also explain the diagram on page 34 of my notes
          </div>
          <div className="lp-inline-msg lp-inline-ai">
            <span className="lp-answer-star">✦</span>
            <div>
              That diagram shows crossing-over during prophase I of meiosis. The X-shaped structure is a <em>chiasma</em> — where chromosomes exchange genetic material.
              <div className="lp-inline-chips">
                <span>Mitosis vs Meiosis table →</span>
                <span>Quiz me on meiosis</span>
                <span>Explain chiasma more</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Context strip ── */}
      <section className="lp-section lp-section-light" id="context">
        <p className="lp-section-label">ALWAYS IN CONTEXT</p>
        <h2 className="lp-section-title">It remembers everything you uploaded</h2>
        <p className="lp-context-sub">
          Every answer is grounded in <em>your</em> files. Switch topics mid-conversation,
          reference a diagram from page 47, or ask something completely off-script —
          Lumina stays anchored to your material the whole time.
        </p>
        <div className="lp-context-grid">
          {[
            { icon: '🗂', t: 'Your files, always open',    d: 'PDFs, photos and videos you upload stay in context for the whole session.' },
            { icon: '🔗', t: 'Cross-source answers',       d: 'Ask something that spans your PDF and a web source — Lumina connects them.' },
            { icon: '💬', t: 'Conversation memory',        d: 'Reference what you said three messages ago. It knows what you meant.' },
            { icon: '🌐', t: 'Live web when needed',       d: 'If your files don\'t have the answer, Lumina searches the web and tells you where it came from.' },
          ].map(c => (
            <div className="lp-context-card" key={c.t}>
              <span className="lp-context-icon">{c.icon}</span>
              <div>
                <strong>{c.t}</strong>
                <p>{c.d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="lp-cta">
        <p className="lp-section-label">GET STARTED TODAY</p>
        <h2>Ready to study smarter?</h2>
        <p>No account needed. Just upload and start.</p>
        <Link to="/dashboard" className="lp-btn-primary lp-btn-lg">Launch Lumina AI →</Link>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <span className="lp-logo">
          <span className="lp-logo-icon">L</span>
          Lumina<span className="lp-logo-ai">AI</span>
        </span>
        <span className="lp-footer-copy">© 2025 LuminaAI. All rights reserved.</span>
      </footer>

    </div>
  )
}
