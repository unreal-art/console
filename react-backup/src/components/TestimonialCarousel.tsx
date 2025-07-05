
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TestimonialCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = [
    {
      quote: "Unreal AI's on-chain billing gives us complete transparency that we've never had with traditional AI providers. The integration was seamless.",
      author: "Sarah Chen",
      title: "CTO at DeepTech Labs",
      company: "DeepTech Labs",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b734?w=150&h=150&fit=crop&crop=face",
      logo: "🧬"
    },
    {
      quote: "The 1:1 token pricing model is genius. No more surprise bills or complex pricing tiers. Just simple, predictable costs for our AI workloads.",
      author: "Marcus Rodriguez", 
      title: "Lead Developer at BuildBot",
      company: "BuildBot",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      logo: "🤖"
    },
    {
      quote: "We migrated from OpenAI to Unreal in one afternoon. Zero code changes, better pricing, and blockchain transparency. It's a no-brainer.",
      author: "Elena Vasquez",
      title: "Founder & CEO at DataFlow",
      company: "DataFlow",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      logo: "📊"
    },
    {
      quote: "The enterprise security features and SOC2 compliance made our legal team happy, while the developer experience made our engineers happy.",
      author: "James Park",
      title: "VP Engineering at FinanceAI",
      company: "FinanceAI",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      logo: "💰"
    }
  ];

  const companies = [
    { name: "Soonami", logo: "🌊" },
    { name: "Neoma Ventures", logo: "🚀" },
    { name: "Token2049", logo: "🎯" },
    { name: "DecenterAI", logo: "🔗" },
    { name: "BlockTech", logo: "⚡" },
    { name: "CryptoBuilders", logo: "🔨" }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);

    return () => clearInterval(timer);
  }, [testimonials.length]);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-6">
        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-6">Trusted by Builders Worldwide</h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Join thousands of developers and businesses who've made the switch to transparent, on-chain AI infrastructure.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto relative">
          <Card className="bg-slate-900/50 border-slate-700 min-h-[300px]">
            <CardContent className="p-8 md:p-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                  className="text-center"
                >
                  <Quote className="w-12 h-12 text-blue-500 mx-auto mb-6 opacity-50" />
                  
                  <blockquote className="text-xl md:text-2xl text-slate-200 mb-8 leading-relaxed">
                    "{testimonials[currentIndex].quote}"
                  </blockquote>

                  <div className="flex items-center justify-center space-x-4">
                    <img
                      src={testimonials[currentIndex].avatar}
                      alt={testimonials[currentIndex].author}
                      className="w-16 h-16 rounded-full border-2 border-slate-600"
                    />
                    <div className="text-left">
                      <div className="font-semibold text-lg text-white">
                        {testimonials[currentIndex].author}
                      </div>
                      <div className="text-slate-400">
                        {testimonials[currentIndex].title}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-2xl">{testimonials[currentIndex].logo}</span>
                        <span className="text-blue-400 font-medium">
                          {testimonials[currentIndex].company}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <Button
            variant="outline"
            size="icon"
            onClick={prevTestimonial}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-slate-800 border-slate-600 hover:bg-slate-700"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Button
            variant="outline"
            size="icon"
            onClick={nextTestimonial}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-slate-800 border-slate-600 hover:bg-slate-700"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          {/* Pagination Dots */}
          <div className="flex justify-center space-x-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-blue-500 w-8' 
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Company Logos */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-20"
        >
          <div className="text-center mb-8">
            <p className="text-slate-400 text-lg">Mentioned by</p>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {companies.map((company, index) => (
              <motion.div
                key={company.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.1, opacity: 1 }}
                className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <span className="text-2xl">{company.logo}</span>
                <span className="font-medium">{company.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Security Badges */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="flex flex-wrap justify-center gap-4">
            <Badge className="bg-green-800/30 text-green-400 border-green-600 px-4 py-2">
              🔒 Audited Smart Contracts
            </Badge>
            <Badge className="bg-blue-800/30 text-blue-400 border-blue-600 px-4 py-2">
              🛡️ SOC2 Type II Compliant
            </Badge>
            <Badge className="bg-purple-800/30 text-purple-400 border-purple-600 px-4 py-2">
              ⚡ 99.9% Uptime SLA
            </Badge>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialCarousel;
