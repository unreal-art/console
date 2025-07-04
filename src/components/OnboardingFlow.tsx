
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Wallet, FileText, Key, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const OnboardingFlow = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    {
      id: 0,
      title: "Connect Wallet",
      description: "Connect your non-custodial wallet",
      icon: Wallet,
      detail: "MetaMask, WalletConnect, Coinbase Wallet supported"
    },
    {
      id: 1,
      title: "Register Business", 
      description: "Auto-fill wallet address, sign payload",
      icon: FileText,
      detail: "EIP-712 signature for secure registration"
    },
    {
      id: 2,
      title: "Generate API Key",
      description: "One-time display with security warning",
      icon: Key,
      detail: "Copy to clipboard and store securely"
    }
  ];

  const handleStepComplete = (stepId: number) => {
    if (!completedSteps.includes(stepId)) {
      setCompletedSteps([...completedSteps, stepId]);
    }
    if (stepId < steps.length - 1) {
      setCurrentStep(stepId + 1);
    }
  };

  const progressPercentage = ((completedSteps.length) / steps.length) * 100;

  return (
    <section className="py-20 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold mb-6">Get Started in 3 Simple Steps</h2>
          <p className="text-xl text-slate-300 mb-8">
            From wallet connection to API key generation in under 2 minutes
          </p>
        </motion.div>

        {/* Progress Bar */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-2 ${
                  index <= currentStep ? 'text-blue-400' : 'text-slate-500'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    completedSteps.includes(step.id)
                      ? 'bg-blue-600 border-blue-600'
                      : index === currentStep
                      ? 'border-blue-400 bg-slate-800'
                      : 'border-slate-600 bg-slate-900'
                  }`}
                >
                  {completedSteps.includes(step.id) ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                <span className="text-sm font-medium hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
          <Progress value={progressPercentage} className="h-2 mb-8" />
        </div>

        {/* Step Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentStep;
            const isCompleted = completedSteps.includes(step.id);
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card 
                  className={`relative overflow-hidden transition-all duration-300 ${
                    isActive 
                      ? 'bg-gradient-to-br from-blue-900/50 to-purple-900/50 border-blue-500' 
                      : isCompleted
                      ? 'bg-slate-800/50 border-green-500'
                      : 'bg-slate-900/50 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 animate-pulse" />
                  )}
                  
                  <CardContent className="p-6 relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isCompleted 
                          ? 'bg-green-600' 
                          : isActive 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600' 
                          : 'bg-slate-700'
                      }`}>
                        {isCompleted ? (
                          <Check className="w-6 h-6 text-white" />
                        ) : (
                          <Icon className="w-6 h-6 text-white" />
                        )}
                      </div>
                      
                      {isActive && (
                        <motion.div
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="w-3 h-3 bg-blue-500 rounded-full"
                        />
                      )}
                    </div>

                    <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
                    <p className="text-slate-400 mb-4">{step.description}</p>
                    <p className="text-sm text-slate-500 mb-6">{step.detail}</p>

                    {isActive && !isCompleted && (
                      <Button
                        onClick={() => handleStepComplete(step.id)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {step.id === 0 && "Connect Wallet"}
                        {step.id === 1 && "Sign & Register"}
                        {step.id === 2 && "Generate Key"}
                        <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    )}

                    {isCompleted && (
                      <div className="flex items-center text-green-500 text-sm">
                        <Check className="w-4 h-4 mr-2" />
                        Completed
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Demo Video */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="max-w-2xl mx-auto mt-12 text-center"
        >
          <Card className="bg-slate-900/50 border-slate-700 overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 rounded-full w-16 h-16"
                >
                  <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1" />
                </Button>
                <div className="absolute bottom-4 left-4 text-sm text-slate-300">
                  How to integrate Unreal API in 30 seconds
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

export default OnboardingFlow;
