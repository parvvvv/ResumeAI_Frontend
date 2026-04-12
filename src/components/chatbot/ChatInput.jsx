import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';

const ChatInput = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef(null);

  // Focus input when not loading
  useEffect(() => {
    if (!isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isLoading]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
      if (textareaRef.current) {
        textareaRef.current.style.height = '42px';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = '42px';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="chatbot-input-area">
      <div className="chatbot-input-wrap">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask about features, workflows, or usage..."
          disabled={isLoading}
          className="chatbot-textarea"
          rows={1}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="chatbot-send-btn"
          aria-label="Send message"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};

export default ChatInput;
