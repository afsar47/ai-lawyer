"use client"

import { motion } from "framer-motion"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"

const plans = [
  {
    name: "Starter",
    price: "$99",
    period: "per user/month",
    description: "Perfect for solo practitioners and small teams getting started.",
    features: [
      "Up to 500 documents/month",
      "Basic AI contract analysis",
      "Document search",
      "Email support",
      "1 user included",
    ],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Professional",
    price: "$249",
    period: "per user/month",
    description: "For growing firms that need advanced features and collaboration.",
    features: [
      "Unlimited documents",
      "Advanced AI analysis",
      "Custom AI training",
      "Team collaboration",
      "Priority support",
      "API access",
      "Custom workflows",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact sales",
    description: "For large organizations with complex requirements.",
    features: [
      "Everything in Professional",
      "Dedicated account manager",
      "Custom integrations",
      "On-premise deployment",
      "SLA guarantees",
      "Security audit reports",
      "Training & onboarding",
    ],
    cta: "Contact sales",
    highlighted: false,
  },
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-32 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-balance">
            Simple, transparent pricing
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Start with a 14-day free trial. No credit card required.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={`relative rounded-2xl p-8 ${
                plan.highlighted
                  ? "bg-foreground text-background border-2 border-foreground"
                  : "bg-card border border-border"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="bg-background text-foreground text-sm font-medium px-4 py-1 rounded-full">
                    Most popular
                  </span>
                </div>
              )}

              <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className={`text-sm ml-2 ${plan.highlighted ? "text-background/70" : "text-muted-foreground"}`}>
                  {plan.period}
                </span>
              </div>
              <p className={`mb-6 ${plan.highlighted ? "text-background/70" : "text-muted-foreground"}`}>
                {plan.description}
              </p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className={`h-5 w-5 flex-shrink-0 ${plan.highlighted ? "text-background" : "text-foreground"}`} />
                    <span className={plan.highlighted ? "text-background/90" : "text-muted-foreground"}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full rounded-full ${
                  plan.highlighted
                    ? "bg-background text-foreground hover:bg-background/90"
                    : ""
                }`}
                variant={plan.highlighted ? "default" : "outline"}
              >
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
