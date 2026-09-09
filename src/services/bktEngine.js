/**
 * Bayesian Knowledge Tracing (BKT) & Item Response Theory (IRT) Engine
 * Implements standard cognitive mastery formulations for SmartEdu OS.
 */

export const BKT_DEFAULTS = {
  pL0: 0.20, // Prior probability of knowing concept
  pT: 0.15,  // Probability of learning transition during practice
  pG: 0.18,  // Guess probability (student guesses correctly without mastery)
  pS: 0.08   // Slip probability (student slips despite knowing)
};

/**
 * Updates mastery probability after an observed attempt using Bayesian update
 * @param {number} currentPL - Current P(L_t) mastery probability [0, 1]
 * @param {boolean} isCorrect - Whether student answer was correct
 * @param {number} confidence - Student confidence rating [0: low, 1: med, 2: high]
 * @param {object} params - BKT parameters (pT, pG, pS)
 * @returns {object} updated mastery probability and diagnostics
 */
export function updateBKT(currentPL, isCorrect, confidence = 1, params = BKT_DEFAULTS) {
  const { pT, pG, pS } = { ...BKT_DEFAULTS, ...params };
  
  // Adjust slip and guess based on student self-reported confidence
  let effectiveGuess = pG;
  let effectiveSlip = pS;
  
  if (confidence === 2) { // High confidence
    effectiveGuess = 0.05; // Less likely to be a random lucky guess
    effectiveSlip = 0.04;  // An error here is a genuine misconception, not a slip
  } else if (confidence === 0) { // Low confidence
    effectiveGuess = 0.35; // Much higher chance of lucky guess
    effectiveSlip = 0.15;  // Higher chance of uncertainty causing slip
  }

  let pLObs;
  if (isCorrect) {
    const numerator = currentPL * (1 - effectiveSlip);
    const denominator = (currentPL * (1 - effectiveSlip)) + ((1 - currentPL) * effectiveGuess);
    pLObs = denominator > 0 ? numerator / denominator : currentPL;
  } else {
    const numerator = currentPL * effectiveSlip;
    const denominator = (currentPL * effectiveSlip) + ((1 - currentPL) * (1 - effectiveGuess));
    pLObs = denominator > 0 ? numerator / denominator : currentPL;
  }

  // Next step transition P(L_t+1) = P(L_t | Obs) + (1 - P(L_t | Obs)) * P(T)
  const nextPL = pLObs + (1 - pLObs) * pT;
  const clampedPL = Math.max(0.01, Math.min(0.99, nextPL));

  // Determine cognitive state
  let status = 'IN_PROGRESS';
  if (clampedPL >= 0.85) status = 'MASTERED';
  else if (clampedPL < 0.45) status = 'WEAK';

  // Misconception detection flag
  const isMisconception = !isCorrect && confidence === 2;

  return {
    previousMastery: Math.round(currentPL * 100),
    newMastery: Math.round(clampedPL * 100),
    newPL: clampedPL,
    status,
    isMisconception,
    cognitiveDelta: Math.round((clampedPL - currentPL) * 100)
  };
}

/**
 * 2-Parameter Logistic (2PL) Item Response Theory probability
 * P(theta) = 1 / (1 + exp(-a * (theta - b)))
 * @param {number} theta - Learner ability [-3.0, +3.0]
 * @param {number} b - Question difficulty [-3.0, +3.0]
 * @param {number} a - Question discrimination [0.5, 2.5]
 */
export function calculate2PLProbability(theta, b, a = 1.2) {
  const exponent = -a * (theta - b);
  return 1 / (1 + Math.exp(exponent));
}

/**
 * Updates student latent ability theta based on response
 */
export function updateTheta(currentTheta, isCorrect, b, a = 1.2) {
  const expectedP = calculate2PLProbability(currentTheta, b, a);
  const actualScore = isCorrect ? 1.0 : 0.0;
  const stepSize = 0.35;
  const newTheta = currentTheta + stepSize * (actualScore - expectedP);
  return Math.max(-3.0, Math.min(3.0, parseFloat(newTheta.toFixed(2))));
}

/**
 * Spaced Repetition Next Review Interval (SuperMemo SM-2 adaptation)
 * @param {number} currentIntervalDays 
 * @param {number} repetitionCount 
 * @param {number} qualityScore - [0 to 5]
 * @param {number} easeFactor - Default 2.5
 */
export function calculateNextReview(currentIntervalDays, repetitionCount, qualityScore, easeFactor = 2.5) {
  let nextInterval;
  let nextRepetition = repetitionCount;
  let nextEase = easeFactor + (0.1 - (5 - qualityScore) * (0.08 + (5 - qualityScore) * 0.02));
  nextEase = Math.max(1.3, nextEase);

  if (qualityScore < 3) {
    nextRepetition = 0;
    nextInterval = 1;
  } else {
    if (repetitionCount === 0) nextInterval = 1;
    else if (repetitionCount === 1) nextInterval = 3;
    else nextInterval = Math.round(currentIntervalDays * nextEase);
    nextRepetition += 1;
  }

  return {
    nextIntervalDays: nextInterval,
    nextRepetition,
    easeFactor: parseFloat(nextEase.toFixed(2))
  };
}
