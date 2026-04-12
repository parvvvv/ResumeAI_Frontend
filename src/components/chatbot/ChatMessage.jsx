import React from 'react';
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

const ChatMessage = ({ message }) => {
  const isBot = message.role === 'bot';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`chatbot-msg-row ${isBot ? 'chatbot-msg-row--bot' : 'chatbot-msg-row--user'}`}
    >
      <div className={`chatbot-msg-inner ${isBot ? '' : 'chatbot-msg-inner--user'}`}>
        {/* Avatar */}
        <div className={`chatbot-msg-avatar ${isBot ? 'chatbot-msg-avatar--bot' : 'chatbot-msg-avatar--user'}`}>
          {isBot ? <Bot size={15} /> : <User size={15} />}
        </div>

        {/* Bubble */}
        <div className={`chatbot-bubble ${isBot ? 'chatbot-bubble--bot' : 'chatbot-bubble--user'}`}>
          <span className="chatbot-bubble-text">{message.content}</span>
          {message.timestamp && (
            <span className="chatbot-bubble-time">{message.timestamp}</span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
