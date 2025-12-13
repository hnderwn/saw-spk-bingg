/**
 * SAW (Simple Additive Weighting) Algorithm Implementation
 * Used for calculating learning priority based on exam scores
 */

// Default weights for each category (can be adjusted)
export const DEFAULT_WEIGHTS = {
  cloze: 0.30,      // 30% - Prioritas tertinggi karena seringkali paling menantang
  grammar: 0.25,    // 25% - Penting untuk dasar bahasa
  reading: 0.25,    // 25% - Kritis untuk pemahaman
  vocab: 0.20       // 20% - Dasar tapi lebih mudah ditingkatkan
}

// Priority score thresholds for color coding
export const PRIORITY_THRESHOLDS = {
  critical: 0.25,   // Red - Butuh perhatian segera
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
  // Langkah 1: Konversi skor ke biaya (100 - skor) - skor lebih rendah = prioritas lebih tinggi
  const costs = {}
  for (const [category, score] of Object.entries(scores)) {
    costs[category] = 100 - (score || 0)
  }
  
  // Langkah 2: Normalisasi biaya (skala 0-1)
  // Menggunakan biaya maksimal yang mungkin (100) untuk stabilitas
  const normalized = {}
  for (const [category, cost] of Object.entries(costs)) {
    normalized[category] = cost / 100
  }
  
  // Langkah 3: Hitung skor prioritas tertimbang
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
  
  // Langkah 4: Urutkan berdasarkan skor prioritas (menurun - skor lebih tinggi = prioritas lebih tinggi)
  return priorities.sort((a, b) => b.priorityScore - a.priorityScore)
}

/**
 * Format category name for display
 */
function formatCategoryName(category) {
  const names = {
    grammar: 'Tata Bahasa',
    vocab: 'Kosakata',
    reading: 'Pemahaman Bacaan',
    cloze: 'Tes Rumpang'
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
  if (score >= PRIORITY_THRESHOLDS.critical) return 'Prioritas Kritis'
  if (score >= PRIORITY_THRESHOLDS.high) return 'Prioritas Tinggi'
  if (score >= PRIORITY_THRESHOLDS.medium) return 'Prioritas Sedang'
  return 'Prioritas Rendah'
}

/**
 * Get learning recommendation based on category and score
 */
function getRecommendation(category, score) {
  const recommendations = {
    grammar: {
      low: 'Fokus pada struktur kalimat dasar dan tenses kata kerja',
      medium: 'Latih pola tata bahasa kompleks dan kalimat pengandaian',
      high: 'Tinjau konsep tata bahasa lanjutan dan koreksi kesalahan'
    },
    vocab: {
      low: 'Bangun kosakata dasar dengan belajar kata setiap hari',
      medium: 'Perluas kosakata dengan pembelajaran berbasis konteks',
      high: 'Kuasai kosakata lanjutan dan ungkapan idiomatis'
    },
    reading: {
      low: 'Mulai dengan teks pendek dan tingkatkan kecepatan membaca',
      medium: 'Latihan dengan berbagai jenis teks dan tingkatkan pemahaman',
      high: 'Fokus pada teks kompleks dan kemampuan menyimpulkan'
    },
    cloze: {
      low: 'Latih petunjuk konteks dasar dan pola kata',
      medium: 'Tingkatkan pemahaman koherensi dan alur teks',
      high: 'Kuasai teknik rumpang lanjutan dan penalaran logis'
    }
  }
  
  const level = score < 50 ? 'low' : score < 75 ? 'medium' : 'high'
  return recommendations[category]?.[level] || 'Lanjutkan latihan secara teratur'
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
  
  // Hitung jawaban benar berdasarkan kategori
  questions.forEach(question => {
    // Normalisasi kategori ke huruf kecil untuk mencocokkan kunci
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
