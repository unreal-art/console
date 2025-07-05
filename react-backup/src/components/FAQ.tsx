
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOpenWidget } from "@/hooks/useOpenWidget";

const FAQ = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const { openWidget } = useOpenWidget();

  const faqs = [
    {
      question: "How does on-chain billing work?",
      answer: "Every API call is settled on-chain using smart contracts. You pay 1 $UNREAL token per inference, with all transactions recorded immutably on the blockchain. This provides complete transparency and eliminates hidden fees or surprise charges."
    },
    {
      question: "Is the API really OpenAI-compatible?",
      answer: "Yes, our API is 100% compatible with OpenAI's API specification. You can use existing OpenAI SDKs and simply change the base URL. No code changes required for models like GPT-4, GPT-3.5, and others."
    },
    {
      question: "What security measures do you have in place?",
      answer: "We implement enterprise-grade security including end-to-end encryption, secure key management, SOC2 Type II compliance, regular security audits, and blockchain-level transaction security. Your data and API keys are never stored in plain text."
    },
    {
      question: "How do I get started?",
      answer: "Simply connect your Web3 wallet (MetaMask, WalletConnect, etc.), register your business by signing an EIP-712 payload, and generate your API key. The entire process takes less than 2 minutes."
    },
    {
      question: "What happens if I run out of $UNREAL tokens?",
      answer: "API calls will be temporarily suspended until you top up your account. You can easily purchase more $UNREAL tokens through our dashboard using various cryptocurrencies or traditional payment methods."
    },
    {
      question: "Do you offer enterprise support?",
      answer: "Yes, we offer dedicated enterprise support including custom SLAs, priority support channels, volume discounts, custom billing arrangements, and dedicated account management for large-scale deployments."
    },
    {
      question: "Can I use this for production applications?",
      answer: "Absolutely. Our infrastructure is designed for production workloads with 99.9% uptime SLA, global edge computing, auto-scaling, and enterprise-grade security. Many businesses are already running production applications on our platform."
    },
    {
      question: "What's your roadmap?",
      answer: "We're launching with API access in July 2025, followed by AI agent hosting, advanced analytics dashboard, multi-model support, and integration with major blockchain networks. Check our roadmap for detailed timelines."
    }
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleJoinDiscord = () => {
    window.open('https://discord.gg/VzPQBKJ5EK', '_blank');
  };

  const handleTelegramChat = () => {
    window.open('https://t.me/ideomind', '_blank');
  };

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold mb-6">Frequently Asked Questions</h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Get answers to common questions about Unreal AI's platform, security, and integration.
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-colors">
                  <CardContent className="p-0">
                    <button
                      onClick={() => toggleFAQ(index)}
                      className="w-full text-left p-6 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-white pr-4">
                        {faq.question}
                      </h3>
                      <motion.div
                        animate={{ rotate: openIndex === index ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex-shrink-0"
                      >
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      </motion.div>
                    </button>
                    
                    <AnimatePresence>
                      {openIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="px-6 pb-6 text-slate-300 leading-relaxed">
                            {faq.answer}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Contact Support */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="mt-12 text-center"
          >
            <Card className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border-blue-500/30">
              <CardContent className="p-8">
                <MessageCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-4">Still have questions?</h3>
                <p className="text-slate-300 mb-6">
                  Our support team is here to help you get started with Unreal AI.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={openWidget}
                  >
                    Contact Support
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-slate-600 hover:bg-slate-800"
                    onClick={handleJoinDiscord}
                  >
                    Join Discord
                  </Button>
                  <Button 
                    variant="outline" 
                    className="border-slate-600 hover:bg-slate-800"
                    onClick={handleTelegramChat}
                  >
                    Telegram Chat
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
