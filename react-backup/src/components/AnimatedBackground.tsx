
import React from 'react';
import { motion } from 'framer-motion';

const AnimatedBackground = () => {
  // Generate random positions for nodes
  const nodes = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    delay: Math.random() * 2
  }));

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 opacity-90" />
      
      {/* Neural network nodes */}
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="nodeGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.2" />
          </radialGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Connection lines */}
        {nodes.slice(0, 20).map((node, i) => {
          const nextNode = nodes[(i + 1) % 20];
          return (
            <motion.line
              key={`line-${i}`}
              x1={`${node.x}%`}
              y1={`${node.y}%`}
              x2={`${nextNode.x}%`}
              y2={`${nextNode.y}%`}
              stroke="url(#nodeGradient)"
              strokeWidth="1"
              opacity="0.3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{
                duration: 3,
                delay: node.delay,
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
            />
          );
        })}

        {/* Animated nodes */}
        {nodes.map((node) => (
          <motion.circle
            key={node.id}
            cx={`${node.x}%`}
            cy={`${node.y}%`}
            r={node.size}
            fill="url(#nodeGradient)"
            filter="url(#glow)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              delay: node.delay,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}

        {/* Floating $UNREAL tokens */}
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.g
            key={`token-${i}`}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: "-20%", opacity: [0, 1, 0] }}
            transition={{
              duration: 8,
              delay: i * 2,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <circle
              cx={`${20 + i * 10}%`}
              cy="50%"
              r="3"
              fill="#fbbf24"
              filter="url(#glow)"
            />
            <text
              x={`${20 + i * 10}%`}
              y="50%"
              textAnchor="middle"
              dy="0.3em"
              fontSize="8"
              fill="#fbbf24"
              fontWeight="bold"
            >
              $U
            </text>
          </motion.g>
        ))}
      </svg>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 4,
              delay: Math.random() * 4,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default AnimatedBackground;
