"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { 
  FileText, 
  Shield, 
  Zap, 
  Users, 
  Globe, 
  BarChart3,
  Cpu,
  Clock,
  Layers
} from "lucide-react"

const features = [
  {
    icon: FileText,
    title: "Contract Analysis",
    description: "AI-powered review that identifies risks, inconsistencies, and key terms automatically.",
  },
  {
    icon: Shield,
    title: "Compliance Monitoring",
    description: "Stay ahead of regulatory changes with real-time compliance tracking and alerts.",
  },
  {
    icon: Zap,
    title: "Instant Processing",
    description: "Process thousands of documents in minutes, not weeks. Scale without limits.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description: "Work together seamlessly with real-time editing, comments, and version control.",
  },
  {
    icon: Globe,
    title: "Multi-Jurisdiction",
    description: "Support for 50+ jurisdictions with localized legal intelligence and terminology.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Gain insights into your practice with detailed reporting and trend analysis.",
  },
  {
    icon: Cpu,
    title: "Custom AI Training",
    description: "Train the AI on your firm&apos;s specific templates, language, and preferences.",
  },
  {
    icon: Clock,
    title: "Time Savings",
    description: "Reduce document review time by up to 80%. Focus on what matters most.",
  },
  {
    icon: Layers,
    title: "Seamless Integration",
    description: "Connect with your existing tools - Microsoft 365, Google Workspace, and more.",
  },
]

export function FeaturesGrid() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [100, -100])

  return (
    <section ref={containerRef} className="py-32 bg-background">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance">
            Everything you need
            <br />
            <span className="text-muted-foreground">to transform your practice</span>
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            A comprehensive suite of AI-powered tools designed specifically for legal professionals.
          </p>
        </motion.div>

        <motion.div style={{ y }} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group p-6 rounded-2xl border border-border bg-card hover:bg-muted/50 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4 group-hover:bg-foreground group-hover:text-background transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
