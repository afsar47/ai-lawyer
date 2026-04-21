"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import { FileText, Search, Shield, Zap, MessageSquare, BarChart3 } from "lucide-react"

export function ProductShowcase() {
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], [100, -100])
  const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0.9, 1, 1, 0.9])

  return (
    <section id="product" ref={containerRef} className="relative py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          style={{ opacity, scale }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance">
            One platform.
            <br />
            <span className="text-muted-foreground">Infinite possibilities.</span>
          </h2>
        </motion.div>

        {/* Product Frame Animation */}
        <motion.div
          style={{ y }}
          className="relative"
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Browser frame */}
            <div className="rounded-2xl bg-card border border-border shadow-2xl overflow-hidden">
              {/* Browser bar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b border-border">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4">
                  <div className="bg-background rounded-lg px-4 py-1.5 text-sm text-muted-foreground text-center max-w-md mx-auto">
                    app.lexai.com/dashboard
                  </div>
                </div>
              </div>

              {/* Dashboard Preview */}
              <div className="p-6 bg-background min-h-[500px]">
                <div className="grid grid-cols-12 gap-6">
                  {/* Sidebar */}
                  <div className="col-span-3 space-y-4">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                      <FileText className="h-5 w-5" />
                      <span className="font-medium">Documents</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
                      <Search className="h-5 w-5" />
                      <span>Search</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
                      <MessageSquare className="h-5 w-5" />
                      <span>AI Chat</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
                      <BarChart3 className="h-5 w-5" />
                      <span>Analytics</span>
                    </div>
                  </div>

                  {/* Main content */}
                  <div className="col-span-9 space-y-6">
                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-4">
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        viewport={{ once: true }}
                        className="p-4 rounded-xl bg-muted/50 border border-border"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Processing</span>
                        </div>
                        <p className="text-2xl font-semibold">2,847</p>
                        <p className="text-xs text-muted-foreground">Documents this month</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        viewport={{ once: true }}
                        className="p-4 rounded-xl bg-muted/50 border border-border"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Compliance</span>
                        </div>
                        <p className="text-2xl font-semibold">99.8%</p>
                        <p className="text-xs text-muted-foreground">Accuracy rate</p>
                      </motion.div>

                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        viewport={{ once: true }}
                        className="p-4 rounded-xl bg-muted/50 border border-border"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Contracts</span>
                        </div>
                        <p className="text-2xl font-semibold">156</p>
                        <p className="text-xs text-muted-foreground">Active reviews</p>
                      </motion.div>
                    </div>

                    {/* Document list */}
                    <div className="rounded-xl border border-border overflow-hidden">
                      <div className="p-4 border-b border-border bg-muted/30">
                        <h3 className="font-medium">Recent Documents</h3>
                      </div>
                      <div className="divide-y divide-border">
                        {[
                          { name: "Merger Agreement - Acme Corp", status: "Reviewing", risk: "Low" },
                          { name: "NDA - TechStart Inc", status: "Complete", risk: "None" },
                          { name: "Employment Contract - J. Smith", status: "AI Analysis", risk: "Medium" },
                        ].map((doc, i) => (
                          <motion.div
                            key={doc.name}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * i }}
                            viewport={{ once: true }}
                            className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <span className="font-medium">{doc.name}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-muted-foreground">{doc.status}</span>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                doc.risk === "None" ? "bg-green-100 text-green-700" :
                                doc.risk === "Low" ? "bg-blue-100 text-blue-700" :
                                "bg-yellow-100 text-yellow-700"
                              }`}>
                                {doc.risk} Risk
                              </span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
