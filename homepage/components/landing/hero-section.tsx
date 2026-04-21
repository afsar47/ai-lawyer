"use client"

import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Play, FileText, Scale, Gavel, BookOpen, ShieldCheck, Scroll } from "lucide-react"

type PaperConfig = {
  icon: typeof FileText
  title: string
  lines: number
  // scattered position (vw / vh-ish units in %)
  initialX: number
  initialY: number
  initialRotate: number
  // final target when converging (near center)
  targetX: number
  targetY: number
  targetRotate: number
  z: number
}

const PAPERS: PaperConfig[] = [
  { icon: FileText, title: "Contract_v2.pdf", lines: 6, initialX: -42, initialY: -18, initialRotate: -14, targetX: -4, targetY: -2, targetRotate: -6, z: 1 },
  { icon: Scale, title: "Case_Brief.docx", lines: 5, initialX: 38, initialY: -22, initialRotate: 12, targetX: 3, targetY: -3, targetRotate: 4, z: 2 },
  { icon: Gavel, title: "Motion_Filing.pdf", lines: 7, initialX: -48, initialY: 20, initialRotate: -8, targetX: -2, targetY: 1, targetRotate: -2, z: 3 },
  { icon: BookOpen, title: "Discovery.pdf", lines: 5, initialX: 44, initialY: 24, initialRotate: 16, targetX: 4, targetY: 2, targetRotate: 6, z: 4 },
  { icon: ShieldCheck, title: "NDA_Draft.docx", lines: 6, initialX: 0, initialY: -32, initialRotate: -6, targetX: 0, targetY: -4, targetRotate: 0, z: 5 },
  { icon: Scroll, title: "Settlement.pdf", lines: 6, initialX: 0, initialY: 30, initialRotate: 10, targetX: 0, targetY: 3, targetRotate: 2, z: 6 },
]

function PaperCard({
  config,
  progress,
}: {
  config: PaperConfig
  progress: MotionValue<number>
}) {
  const Icon = config.icon

  // 0 - 0.30 : scattered -> converge to center (stack)
  // 0.30 - 0.45: stacked, begin merging (scale down, fade)
  // 0.45 - 1.0 : invisible (dashboard + hero take over)
  const x = useTransform(progress, [0, 0.3, 0.45], [config.initialX, config.targetX, config.targetX])
  const y = useTransform(progress, [0, 0.3, 0.45], [config.initialY, config.targetY, config.targetY])
  const rotate = useTransform(progress, [0, 0.3, 0.45], [config.initialRotate, config.targetRotate, 0])
  const scale = useTransform(progress, [0, 0.2, 0.35, 0.48], [0.85, 1, 0.95, 0.6])
  const opacity = useTransform(progress, [0, 0.35, 0.45], [1, 1, 0])

  return (
    <motion.div
      style={{
        x: useTransform(x, (v) => `${v}vw`),
        y: useTransform(y, (v) => `${v}vh`),
        rotate,
        scale,
        opacity,
        zIndex: config.z,
      }}
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 md:w-64"
    >
      <div className="rounded-lg bg-card border border-border shadow-2xl p-4 aspect-[3/4] flex flex-col">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-foreground" />
          </div>
          <span className="text-xs font-medium text-foreground truncate">{config.title}</span>
        </div>
        <div className="flex-1 flex flex-col gap-2 pt-3">
          {Array.from({ length: config.lines }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full bg-muted"
              style={{ width: `${60 + ((i * 17) % 35)}%` }}
            />
          ))}
          <div className="h-1.5 rounded-full bg-foreground/40 w-1/3 mt-2" />
        </div>
      </div>
    </motion.div>
  )
}

export function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [finalStage, setFinalStage] = useState(false)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const shouldShowFinal = latest >= 0.36
    setFinalStage((prev) => (prev === shouldShowFinal ? prev : shouldShowFinal))
  })

  // Sync on mount/resize so hard refresh and restored scroll positions start in the right stage.
  useEffect(() => {
    const syncStage = () => {
      setFinalStage(scrollYProgress.get() >= 0.36)
    }

    syncStage()
    const rafId = requestAnimationFrame(syncStage)
    window.addEventListener("resize", syncStage)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener("resize", syncStage)
    }
  }, [scrollYProgress])

  // Background wash darkens slightly as papers gather
  const bgOpacity = useTransform(scrollYProgress, [0, 0.35, 0.75, 1], [0, 0.35, 0.2, 0.1])
  const cinematicEase: [number, number, number, number] = [0.22, 1, 0.36, 1]

  return (
    <section
      ref={containerRef}
      aria-label="Hero"
      className="relative"
      style={{ height: "230vh" }}
    >
      {/* Sticky stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* Ambient background */}
        <motion.div
          style={{ opacity: bgOpacity }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,theme(colors.muted)_0%,transparent_70%)]"
          aria-hidden
        />

        {/* Papers */}
        <motion.div
          initial={false}
          animate={{ opacity: finalStage ? 0 : 1 }}
          transition={{ duration: 0.38, ease: cinematicEase }}
          className="absolute inset-0 pointer-events-none"
        >
          {PAPERS.map((p, i) => (
            <PaperCard key={i} config={p} progress={scrollYProgress} />
          ))}
        </motion.div>

        {/* Final-stage wash to cleanly reveal the hero lockup */}
        <motion.div
          initial={false}
          animate={{ opacity: finalStage ? 1 : 0 }}
          transition={{ duration: 0.4, delay: finalStage ? 0.06 : 0, ease: cinematicEase }}
          className="absolute inset-0 bg-background z-[15]"
          aria-hidden
        />

        {/* Hero copy overlay (revealed at the end) */}
        <motion.div
          initial={false}
          animate={{ opacity: finalStage ? 1 : 0, y: finalStage ? 0 : 20, scale: finalStage ? 1 : 0.99 }}
          transition={{ duration: 0.46, delay: finalStage ? 0.1 : 0, ease: cinematicEase }}
          className="absolute inset-x-0 top-0 h-screen flex flex-col items-center justify-center px-6 z-20 pointer-events-none"
        >
          <div className="pointer-events-auto text-center max-w-4xl">
            <motion.div
              initial={false}
              animate={{ opacity: finalStage ? 1 : 0, y: finalStage ? 0 : 10 }}
              transition={{ duration: 0.36, delay: finalStage ? 0.14 : 0, ease: cinematicEase }}
              className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-4 py-1.5 text-sm font-medium text-muted-foreground mb-8 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-foreground opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-foreground" />
              </span>
              Introducing LexAI 2.0
            </motion.div>

            <motion.h1
              initial={false}
              animate={{ opacity: finalStage ? 1 : 0, y: finalStage ? 0 : 12 }}
              transition={{ duration: 0.42, delay: finalStage ? 0.2 : 0, ease: cinematicEase }}
              className="text-5xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-foreground text-balance leading-[1.05]"
            >
              Legal intelligence
              <br />
              <span className="text-muted-foreground">redefined</span>
            </motion.h1>

            <motion.p
              initial={false}
              animate={{ opacity: finalStage ? 1 : 0, y: finalStage ? 0 : 10 }}
              transition={{ duration: 0.38, delay: finalStage ? 0.28 : 0, ease: cinematicEase }}
              className="mt-8 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed text-pretty"
            >
              Transform your legal practice with AI-powered document analysis, contract review, and case management that works at the speed of thought.
            </motion.p>

            <motion.div
              initial={false}
              animate={{ opacity: finalStage ? 1 : 0, y: finalStage ? 0 : 10 }}
              transition={{ duration: 0.36, delay: finalStage ? 0.34 : 0, ease: cinematicEase }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Button size="lg" className="rounded-full px-8 h-12 text-base">
                Start free trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="ghost" size="lg" className="rounded-full h-12 text-base">
                <Play className="mr-2 h-4 w-4 fill-current" />
                Watch demo
              </Button>
            </motion.div>

            <motion.p
              initial={false}
              animate={{ opacity: finalStage ? 1 : 0, y: finalStage ? 0 : 8 }}
              transition={{ duration: 0.34, delay: finalStage ? 0.4 : 0, ease: cinematicEase }}
              className="mt-8 text-sm md:text-base text-muted-foreground"
            >
              Trusted by 500+ law firms worldwide
            </motion.p>
          </div>
        </motion.div>

        {/* Scroll hint (fades out once user scrolls) */}
        <motion.div
          style={{
            opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0]),
          }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground z-30"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-1.5"
          >
            <div className="w-1.5 h-2.5 rounded-full bg-muted-foreground/50" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
