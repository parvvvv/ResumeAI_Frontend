import React from 'react';
import { motion } from 'framer-motion';

const TypingIndicator = () => {
  return (
    <div className="chatbot-typing">
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.div
          key={i}
          className="chatbot-typing-dot"
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay }}
        />
      ))}
    </div>
  );
};

export default TypingIndicator;
