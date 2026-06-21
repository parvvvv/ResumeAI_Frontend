import { useState } from 'react';
import { useStudyPlan } from '../../context/StudyPlanContext';
import { HiOutlineSparkles, HiOutlineClipboardCopy, HiX } from 'react-icons/hi';
import { motion, AnimatePresence } from 'framer-motion';

export default function ResumeBulletsGenerator({ weekNumber, completedTaskCount, totalTaskCount }) {
  const { activePlan, generateResumeBullets } = useStudyPlan();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const existingBullets = activePlan?.generatedBullets?.[`week_${weekNumber}`];
  const weekComplete = totalTaskCount > 0 && completedTaskCount >= totalTaskCount;

  if (dismissed) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      await generateResumeBullets(activePlan.id, weekNumber);
    } catch (err) {
      setError(err.message || 'Failed to generate bullets.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (bullet, index) => {
    try {
      await navigator.clipboard.writeText(bullet);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // clipboard not available
    }
  };

  // Only unlock when the entire week is completed
  if (!weekComplete) {
    return (
      <div className="bullets-gen">
        <HiOutlineSparkles size={24} className="bullets-gen-icon" />
        <h4>Resume Bullets Generator</h4>
        <p>Complete all {totalTaskCount} tasks this week to unlock AI-generated resume bullets you can actually defend in an interview.</p>
      </div>
    );
  }

  return (
    <div className="bullets-gen has-bullets">
      <div className="bullets-gen-header">
        <div className="bullets-gen-header-copy">
          <h4><HiOutlineSparkles /> Resume Value Unlocked</h4>
          <p>Based on the {completedTaskCount} tasks you completed this week, here is what you can add to your resume:</p>
        </div>
        
        <div className="flex items-center gap-2">
          {!existingBullets && (
            <button 
              className="btn btn-primary btn-sm"
              onClick={handleGenerate}
              disabled={isGenerating || completedTaskCount === 0}
            >
              {isGenerating ? 'Generating...' : 'Generate Bullets'}
            </button>
          )}
          <button className="bullets-gen-dismiss" onClick={() => setDismissed(true)} aria-label="Dismiss">
            <HiX size={18} />
          </button>
        </div>
      </div>

      {error && <div className="bullets-gen-error">{error}</div>}

      {existingBullets && (
        <div className="bullets-gen-list">
          {existingBullets.map((bullet, i) => (
            <motion.div 
              key={`bullet-${weekNumber}-${i}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bullets-gen-item"
            >
              <div className="bullets-gen-dot" />
              <p className="bullets-gen-bullet">{bullet}</p>
              <button 
                className="bullets-gen-copy-btn"
                onClick={() => handleCopy(bullet, i)}
                title={copiedIndex === i ? 'Copied!' : 'Copy to clipboard'}
              >
                {copiedIndex === i ? <span style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Copied!</span> : <HiOutlineClipboardCopy size={18} />}
              </button>
            </motion.div>
          ))}
          
          <div className="flex justify-end mt-4">
            <button 
              className="btn btn-outline btn-sm"
              onClick={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? 'Regenerating...' : 'Regenerate'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
