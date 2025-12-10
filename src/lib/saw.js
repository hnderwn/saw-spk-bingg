/**
 * SAW (Simple Additive Weighting) Algorithm Implementation
 * Used for calculating learning priority based on exam scores
 */

// Default weights for each category (can be adjusted)
export const DEFAULT_WEIGHTS = {
  cloze: 0.30,      // 30% - Highest priority as it's often the most challenging
  grammar: 0.25,    // 25% - Important for language foundation
  reading: 0.25,    // 25% - Critical for comprehension
  vocab: 0.20       // 20% - Foundation but easier to improve
}

// Priority score thresholds for color coding
export const PRIORITY_THRESHOLDS = {
  critical: 0.25,   // Red - Needs immediate attention
  high: 0.20,       // Orange - High priority
  medium: 0.15,     // Yellow - Medium priority
  low: 0.10         // Green - Low priority
}

/**
 * Calculate SAW priority scores for learning recommendations
 * @param {Object} scores - Object with category scores (0-100)
 * @param {Object} weights - Optional custom weights
 * @returns {Array} Sorted array of priority recommendations
 */
export function calculateSAWPriority(scores, weights = DEFAULT_WEIGHTS) {
  // Step 1: Convert scores to cost (100 - score) - lower scores = higher priority
  const costs = {}
  for (const [category, score] of Object.entries(scores)) {
    costs[category] = 100 - (score || 0)
  }
  
  // Step 2: Normalize costs (0-1 scale)
  // Using max possible cost (100) for stability
  const normalized = {}
  for (const [category, cost] of Object.entries(costs)) {
    normalized[category] = cost / 100
  }
  
  // Step 3: Calculate weighted priority scores
  const priorities = []
  for (const [category, normCost] of Object.entries(normalized)) {
    const weight = weights[category] || 0
    const priorityScore = normCost * weight
    
    priorities.push({
      category: formatCategoryName(category),
      categoryKey: category,
      rawScore: scores[category] || 0,
      cost: Math.round(costs[category]),
      normalized: Math.round(normCost * 100) / 100,
      weight: weight,
      priorityScore: Math.round(priorityScore * 1000) / 1000,
      color: getPriorityColor(priorityScore),
      label: getPriorityLabel(priorityScore),
      recommendation: getRecommendation(category, scores[category] || 0)
    })
  }
  
  // Step 4: Sort by priority score (descending - higher score = higher priority)
  return priorities.sort((a, b) => b.priorityScore - a.priorityScore)
}

/**
 * Format category name for display
 */
function formatCategoryName(category) {
  const names = {
    grammar: 'Grammar',
    vocab: 'Vocabulary',
    reading: 'Reading Comprehension',
    cloze: 'Cloze Test'
  }
  return names[category] || category
}

/**
 * Get color based on priority score
 */
function getPriorityColor(score) {
  if (score >= PRIORITY_THRESHOLDS.critical) return '#ef4444' // Red
  if (score >= PRIORITY_THRESHOLDS.high) return '#f97316'    // Orange
  if (score >= PRIORITY_THRESHOLDS.medium) return '#eab308'  // Yellow
  return '#22c55e' // Green
}

/**
 * Get priority label based on score
 */
function getPriorityLabel(score) {
  if (score >= PRIORITY_THRESHOLDS.critical) return 'Critical Priority'
  if (score >= PRIORITY_THRESHOLDS.high) return 'High Priority'
  if (score >= PRIORITY_THRESHOLDS.medium) return 'Medium Priority'
  return 'Low Priority'
}

/**
 * Get learning recommendation based on category and score
 */
function getRecommendation(category, score) {
  const recommendations = {
    grammar: {
      low: 'Focus on basic sentence structure and verb tenses',
      medium: 'Practice complex grammar patterns and conditional sentences',
      high: 'Review advanced grammar concepts and error correction'
    },
    vocab: {
      low: 'Build foundational vocabulary with daily word learning',
      medium: 'Expand vocabulary with context-based learning',
      high: 'Master advanced vocabulary and idiomatic expressions'
    },
    reading: {
      low: 'Start with short texts and build reading speed',
      medium: 'Practice with various text types and improve comprehension',
      high: 'Focus on complex texts and inference skills'
    },
    cloze: {
      low: 'Practice basic context clues and word patterns',
      medium: 'Improve understanding of text coherence and flow',
      high: 'Master advanced cloze techniques and logical reasoning'
    }
  }
  
  const level = score < 50 ? 'low' : score < 75 ? 'medium' : 'high'
  return recommendations[category]?.[level] || 'Continue practicing regularly'
}

/**
 * Calculate category scores from exam answers
 * @param {Array} questions - Array of question objects
 * @param {Object} answers - Object mapping questionId to selected answer
 * @returns {Object} Scores by category
 */
export function calculateCategoryScores(questions, answers) {
  const categoryStats = {
    grammar: { correct: 0, total: 0 },
    vocab: { correct: 0, total: 0 },
    reading: { correct: 0, total: 0 },
    cloze: { correct: 0, total: 0 }
  }
  
  // Count correct answers by category
  questions.forEach(question => {
    // Normalize category to lowercase to match keys
    const category = question.category.toLowerCase()
    if (categoryStats[category]) {
      categoryStats[category].total++
      if (answers[question.id] === question.correct_answer) {
        categoryStats[category].correct++
      }
    }
  })
  
  // Calculate percentages
  const scores = {}
  let totalCorrect = 0
  let totalQuestions = 0
  
  for (const [category, stats] of Object.entries(categoryStats)) {
    if (stats.total > 0) {
      const score = Math.round((stats.correct / stats.total) * 100)
      scores[category] = score
      totalCorrect += stats.correct
      totalQuestions += stats.total
    } else {
      scores[category] = 0
    }
  }
  
  // Calculate total score
  scores.total = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0
  
  return scores
}

/**
 * Test function for SAW algorithm
 */
export function testSAW() {
  const testScores = {
    grammar: 60,
    vocab: 90,
    reading: 70,
    cloze: 50
  }
  
  console.log('Testing SAW Algorithm with scores:', testScores)
  const result = calculateSAWPriority(testScores)
  console.log('SAW Results:', result)
  
  return result
}
