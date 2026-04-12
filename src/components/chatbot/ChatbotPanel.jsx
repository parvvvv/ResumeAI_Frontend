import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Trash2, Bot } from 'lucide-react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import { useToast } from '../../context/ToastContext';

const SUGGESTIONS = [
  "How does the platform work?",
  "How do I upload a resume?",
  "How do I edit or tailor a resume?"
];

const ChatbotPanel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);
  const { addToast } = useToast();

  // Check responsiveness
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initial greeting message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const hour = new Date().getHours();
      let timeOfDay = 'Evening';
      if (hour < 12) timeOfDay = 'Morning';
      else if (hour < 17) timeOfDay = 'Afternoon';

      setMessages([
        {
          id: Date.now().toString(),
          role: 'bot',
          content: `Good ${timeOfDay}.\nI am your assistant. I can guide you through how this platform works and help you navigate features.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [isOpen, messages.length]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  const handleSendMessage = async (query) => {
    if (!query.trim() || isLoading) return;

    const newUserMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });
      const data = await response.json();

      const newBotMsg = {
        id: (Date.now() + 1).toString(),
        role: 'bot',
        content: data.answer || data.response || 'No response received.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, newBotMsg]);
    } catch (error) {
      console.error('Chat API Error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'bot',
          content: 'Sorry, I encountered an error. Please try again later.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
    addToast('Chat history cleared', 'success');
  };

  const panelVariants = {
    hidden: isMobile
      ? { opacity: 0, y: 30, scale: 0.97 }
      : { opacity: 0, y: 20, scale: 0.97 },
    visible: isMobile
      ? { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 26, stiffness: 220 } }
      : { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 28, stiffness: 240 } },
    exit: isMobile
      ? { opacity: 0, y: 20, scale: 0.97, transition: { duration: 0.18 } }
      : { opacity: 0, y: 12, scale: 0.97, transition: { duration: 0.18 } }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="chatbot-fab"
            aria-label="Open Assistant"
          >
            <MessageCircle size={26} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile Backdrop */}
            {isMobile && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsOpen(false)}
                className="chatbot-backdrop"
              />
            )}

            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`chatbot-panel${isMobile ? ' chatbot-panel--mobile' : ''}`}
            >
              {/* Header */}
              <div className="chatbot-header">
                <div className="chatbot-header-left">
                  <div className="chatbot-avatar-wrap">
                    <div className="chatbot-avatar">
                      <MessageCircle size={20} />
                    </div>
                    <span className="chatbot-status-dot" />
                  </div>
                  <div>
                    <div className="chatbot-title">Assistant</div>
                    <div className="chatbot-subtitle">Platform Guide</div>
                  </div>
                </div>
                <div className="chatbot-header-actions">
                  <button 
                    className="chatbot-icon-btn" 
                    onClick={handleClearChat}
                    aria-label="Clear Chat"
                    title="Clear Chat"
                  >
                    <Trash2 size={17} />
                  </button>
                  <button
                    className="chatbot-icon-btn"
                    onClick={() => setIsOpen(false)}
                    aria-label="Close"
                  >
                    <X size={19} />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="chatbot-messages">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}

                {isLoading && (
                  <div className="chatbot-msg-row chatbot-msg-row--bot">
                    <div className="chatbot-msg-inner">
                      <div className="chatbot-msg-avatar chatbot-msg-avatar--bot">
                        <Bot size={16} />
                      </div>
                      <TypingIndicator />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestion Chips */}
              {messages.length <= 2 && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="chatbot-suggestions"
                >
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} className="chatbot-chip" onClick={() => handleSendMessage(s)}>
                      {s}
                    </button>
                  ))}
                </motion.div>
              )}

              {/* Input */}
              <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatbotPanel;
