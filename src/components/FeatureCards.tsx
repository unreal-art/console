import React from "react"
import { motion } from "framer-motion"
import { Shield, Zap, Globe, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const FeatureCards = () => {
  const features = [
    {
      icon: DollarSign,
      title: "On-chain Billing, Zero Surprises",
      description:
        "Transparent, immutable billing records on the blockchain. Every transaction is verifiable and auditable.",
      gradient: "from-green-500 to-emerald-600",
      details: [
        "Real-time transaction tracking",
        "Immutable billing records",
        "Gas-optimized smart contracts",
        "Multi-chain support",
      ],
    },
    {
      icon: Zap,
      title: "Pay as You Go: $UNREAL",
      description:
        "Simple, predictable on-demand pricing. No hidden fees, no monthly commitments. Just pay for what you use.",
      gradient: "from-yellow-500 to-orange-600",
      details: [
        "No minimum spend requirements",
        "Instant top-up with crypto",
        "Volume discounts available",
        "Enterprise billing options",
      ],
    },
    {
      icon: Shield,
      title: "Enterprise-Grade Security",
      description:
        "Bank-level security with end-to-end encryption, secure key management, and SOC2 compliance.",
      gradient: "from-blue-500 to-cyan-600",
      details: [
        "End-to-end encryption",
        "SOC2 Type II compliant",
        "Secure key management",
        "Regular security audits",
      ],
    },
    {
      icon: Globe,
      title: "Unlimited Scale, Decentralized Compute",
      description:
        "Leverage our global network of GPU clusters for unlimited scaling without infrastructure concerns.",
      gradient: "from-purple-500 to-pink-600",
      details: [
        "Global GPU network",
        "Auto-scaling infrastructure",
        "99.9% uptime SLA",
        "Edge computing support",
      ],
    },
  ]

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-6">Why Choose Unreal AI</h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Built for developers who demand transparency, security, and scale.
            Experience the future of AI infrastructure.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon

            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all duration-300 h-full group">
                  <CardContent className="p-8">
                    <div className="flex items-start space-x-4 mb-6">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-r ${feature.gradient} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-3 group-hover:text-blue-400 transition-colors">
                          {feature.title}
                        </h3>
                        <p className="text-slate-300 leading-relaxed mb-6">
                          {feature.description}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {feature.details.map((detail, detailIndex) => (
                        <motion.div
                          key={detail}
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * detailIndex }}
                          className="flex items-center space-x-3"
                        >
                          <div
                            className={`w-2 h-2 rounded-full bg-gradient-to-r ${feature.gradient}`}
                          />
                          <span className="text-sm text-slate-400">
                            {detail}
                          </span>
                        </motion.div>
                      ))}
                    </div>

                    {/* Hover effect overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 grid md:grid-cols-4 gap-8 max-w-4xl mx-auto"
        >
          {[
            { number: "99.9%", label: "Uptime SLA" },
            { number: "<50ms", label: "Average Latency" },
            { number: "3,500+", label: "Businesses Onboarded" },
            { number: "50M+", label: "API Calls Processed" },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-slate-400 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default FeatureCards
