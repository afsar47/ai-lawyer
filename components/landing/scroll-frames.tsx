"use client"

import { motion, useScroll, useSpring, useTransform } from "framer-motion"
import { useRef } from "react"
import { Brain, Scale, FileSearch, Clock, Lock, Sparkles } from "lucide-react"

const frames = [
  {
    icon: Brain,
    title: "AI-Powered Analysis",
    description: "Our advanced AI understands legal context, identifying key clauses, potential risks, and compliance issues in seconds.",
    visual: "Contract Analysis",
  },
  {
    icon: Scale,
    title: "Intelligent Review",
    description: "Compare contracts against your standards automatically. Get suggestions that align with your firm&apos;s best practices.",
    visual: "Smart Review",
  },
  {
    icon: FileSearch,
    title: "Deep Search",
    description: "Search across all your documents with natural language queries. Find relevant precedents instantly.",
    visual: "Document Search",
  },
  {
    icon: Clock,
    title: "Time Tracking",
    description: "Automatic time capture integrated with document work. Never miss a billable moment again.",
    visual: "Time Management",
  },
  {
    icon: Lock,
    title: "Enterprise Security",
    description: "Bank-grade encryption, SOC 2 compliance, and advanced access controls keep your data protected.",
    visual: "Security Center",
  },
  {
    icon: Sparkles,
    title: "Custom Workflows",
    description: "Build automated workflows that match your practice. From intake to closing, streamline every step.",
    visual: "Workflow Builder",
  },
]

export function ScrollFrames() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  })
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 28,
    mass: 0.25,
  })

  return (
    <section id="features" ref={containerRef} className="relative">
      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex items-center justify-center overflow-hidden bg-foreground">
        <div className="relative w-full max-w-7xl mx-auto px-6 lg:px-8">
          {frames.map((frame, index) => {
            const start = index / frames.length
            const end = (index + 1) / frames.length
            
            return (
              <FrameCard
                key={frame.title}
                frame={frame}
                index={index}
                scrollYProgress={smoothProgress}
                start={start}
                end={end}
              />
            )
          })}
        </div>
      </div>
      {/* Spacer to create scroll distance */}
      <div className="h-[600vh]" />
    </section>
  )
}

function FrameCard({
  frame,
  index,
  scrollYProgress,
  start,
  end,
}: {
  frame: typeof frames[0]
  index: number
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"]
  start: number
  end: number
}) {
  const segment = end - start
  const overlap = segment * 0.22
  const enterStart = Math.max(0, start - overlap)
  const enterEnd = start + segment * 0.2
  const exitStart = end - segment * 0.2
  const exitEnd = Math.min(1, end + overlap)

  const opacity = useTransform(
    scrollYProgress,
    [enterStart, enterEnd, exitStart, exitEnd],
    [0, 1, 1, 0]
  )
  
  const scale = useTransform(
    scrollYProgress,
    [enterStart, enterEnd, exitStart, exitEnd],
    [0.94, 1, 1, 0.96]
  )

  const y = useTransform(
    scrollYProgress,
    [enterStart, enterEnd, exitStart, exitEnd],
    [38, 0, 0, -38]
  )

  const Icon = frame.icon

  return (
    <motion.div
      style={{ opacity, scale, y }}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div className="grid lg:grid-cols-2 gap-12 items-center w-full">
        <div className="text-background">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 text-sm font-medium text-background/60 mb-4"
          >
            <span className="w-8 h-px bg-background/30" />
            Feature {String(index + 1).padStart(2, "0")}
          </motion.div>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-xl bg-background/10 flex items-center justify-center">
              <Icon className="w-6 h-6 text-background" />
            </div>
            <h3 className="text-3xl md:text-4xl font-semibold tracking-tight">
              {frame.title}
            </h3>
          </div>
          
          <p className="text-lg text-background/70 leading-relaxed max-w-lg">
            {frame.description}
          </p>
        </div>

        <div className="relative">
          <div className="aspect-[4/3] rounded-2xl bg-background/5 border border-background/10 overflow-hidden backdrop-blur-sm">
            <div className="p-6 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-background/20" />
                <div className="w-3 h-3 rounded-full bg-background/20" />
                <div className="w-3 h-3 rounded-full bg-background/20" />
              </div>
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Icon className="w-16 h-16 text-background/30 mx-auto mb-4" />
                  <p className="text-background/50 font-medium">{frame.visual}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
