"use client"

import { motion } from "framer-motion"

const logos = [
  "Baker McKenzie",
  "Clifford Chance",
  "Latham & Watkins",
  "Skadden",
  "Freshfields",
  "Allen & Overy",
  "DLA Piper",
  "White & Case",
]

export function LogosSection() {
  return (
    <section className="py-20 bg-muted/30 border-y border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center text-sm text-muted-foreground mb-10"
        >
          <span className="font-medium text-foreground">Trusted by leading law firms</span> around the world
        </motion.p>

        <div className="relative overflow-hidden">
          <div className="flex gap-12 animate-scroll">
            {[...logos, ...logos].map((logo, i) => (
              <motion.div
                key={`${logo}-${i}`}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: (i % logos.length) * 0.1 }}
                className="flex-shrink-0"
              >
                <span className="text-xl font-semibold text-muted-foreground/50 whitespace-nowrap tracking-tight">
                  {logo}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
      `}</style>
    </section>
  )
}
