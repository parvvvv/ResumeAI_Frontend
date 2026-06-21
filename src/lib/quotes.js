export const STUDY_QUOTES = [
  "The expert in anything was once a beginner.",
  "Small daily improvements are the key to staggering long-term results.",
  "You're not behind. You're building.",
  "Consistency is what transforms average into excellence.",
  "Don't stop when you're tired. Stop when you're done.",
  "Focus on being productive instead of busy.",
  "What you do today can improve all your tomorrows.",
  "Success is the sum of small efforts, repeated day in and day out.",
  "Amateurs sit and wait for inspiration, the rest of us just get up and go to work.",
  "If it doesn't challenge you, it won't change you.",
  "Progress, not perfection.",
  "The only bad workout is the one that didn't happen.",
  "Doubt kills more dreams than failure ever will.",
  "Your future is created by what you do today, not tomorrow.",
  "A year from now you may wish you had started today.",
  "Action is the foundational key to all success.",
  "Start where you are. Use what you have. Do what you can.",
  "Don't watch the clock; do what it does. Keep going.",
  "It does not matter how slowly you go as long as you do not stop.",
  "Everything you've ever wanted is on the other side of fear."
];

export function getDailyQuote() {
  const dayOfYear = Math.floor(
    (new Date() - new Date(new Date().getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24
  );
  return STUDY_QUOTES[dayOfYear % STUDY_QUOTES.length];
}
