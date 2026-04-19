import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  const [isPinned, setIsPinned] = useState(false);
  const [isLeft, setIsLeft] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef(null);
  const fabRef = useRef(null);
  const dragStartRef = useRef({ x: 0, y: 0, fabLeft: 0, fabTop: 0 });
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

  // --- Native pointer drag for FAB ---
  const handlePointerDown = useCallback((e) => {
    if (!fabRef.current) return;
    e.preventDefault();
    const rect = fabRef.current.getBoundingClientRect();
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      fabLeft: rect.left,
      fabTop: rect.top,
    };
    setIsDragging(false);
    fabRef.current.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!fabRef.current || !fabRef.current.hasPointerCapture(e.pointerId)) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    // Only start dragging after 5px threshold to not block clicks
    if (!isDragging && (Math.abs(dx) > 5 || Math.abs(dy) > 5)) {
      setIsDragging(true);
    }
    if (isDragging || Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      const newLeft = dragStartRef.current.fabLeft + dx;
      const newTop = dragStartRef.current.fabTop + dy;
      fabRef.current.style.position = 'fixed';
      fabRef.current.style.left = `${newLeft}px`;
      fabRef.current.style.top = `${newTop}px`;
      fabRef.current.style.right = 'auto';
      fabRef.current.style.bottom = 'auto';
    }
  }, [isDragging]);

  const handlePointerUp = useCallback((e) => {
    if (!fabRef.current) return;
    fabRef.current.releasePointerCapture(e.pointerId);

    if (!isDragging) return; // It was a click, not a drag

    const screenW = window.innerWidth;
    const fabCenterX = e.clientX;
    const goLeft = fabCenterX < screenW / 2;
    setIsLeft(goLeft);

    // Reset inline styles so CSS classes take over
    fabRef.current.style.left = '';
    fabRef.current.style.top = '';
    fabRef.current.style.right = '';
    fabRef.current.style.bottom = '';
    fabRef.current.style.position = '';

    // Mobile: collapse to pinpoint if dragged off the edge
    if (isMobile) {
      if ((goLeft && fabCenterX < 40) || (!goLeft && fabCenterX > screenW - 40)) {
        setIsPinned(true);
      }
    }

    setIsDragging(false);
  }, [isDragging, isMobile]);

  const handleFabClick = useCallback(() => {
    if (!isDragging) {
      setIsOpen(true);
    }
  }, [isDragging]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Never set isPinned on close — always show the FAB
  }, []);

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

  return (
    <>
      {/* Floating Toggle Button or Pinpoint */}
      <AnimatePresence>
        {!isOpen && !isPinned && (
          <motion.button
            ref={fabRef}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className={`chatbot-fab ${isLeft ? 'is-left' : ''}`}
            aria-label="Open Assistant"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onClick={handleFabClick}
            style={{ touchAction: 'none' }}
          >
            <MessageCircle size={26} />
          </motion.button>
        )}
        {!isOpen && isPinned && (
          <motion.button
            initial={{ x: isLeft ? -30 : 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: isLeft ? -30 : 30, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setIsOpen(true);
              setIsPinned(false);
            }}
            className={`chatbot-pinpoint ${isLeft ? 'is-left' : ''}`}
            aria-label="Open Assistant"
          >
            <div className="chatbot-pinpoint-bar" />
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
                onClick={handleClose}
                className="chatbot-backdrop"
              />
            )}

            <motion.div
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`chatbot-panel${isMobile ? ' chatbot-panel--mobile' : ''} ${isLeft ? 'is-left' : ''}`}
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
                    onClick={handleClose}
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
