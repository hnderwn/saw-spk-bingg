import { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { db } from '../../lib/supabase'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'

const Questions = () => {
  const { isAdmin } = useAuth()
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [formData, setFormData] = useState({
    category: 'Grammar',
    question_text: '',
    options: { A: '', B: '', C: '', D: '', E: '' },
    correct_answer: 'A'
  })

  const categories = ['Grammar', 'Vocabulary', 'Reading', 'Cloze']
  const options = ['A', 'B', 'C', 'D', 'E']

  useEffect(() => {
    if (!isAdmin()) {
      // Redirect if not admin
      window.location.href = '/siswa/dashboard'
      return
    }
    
    loadQuestions()
  }, [])

  const loadQuestions = async () => {
    try {
      setLoading(true)
      const { data, error } = await db.getQuestions()
      if (error) throw error
      
      setQuestions(data || [])
    } catch (error) {
      console.error('Error loading questions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Validate form
      if (!formData.question_text.trim()) {
        alert('Question text is required')
        return
      }
      
      for (const option of options) {
        if (!formData.options[option]?.trim()) {
          alert(`Option ${option} is required`)
          return
        }
      }

      if (editingQuestion) {
        // Update existing question
        const { error } = await db.updateQuestion(editingQuestion.id, formData)
        if (error) throw error
      } else {
        // Create new question
        const { error } = await db.createQuestion(formData)
        if (error) throw error
      }
      
      // Reset form and reload questions
      resetForm()
      await loadQuestions()
      
    } catch (error) {
      console.error('Error saving question:', error)
      alert('Error saving question. Please try again.')
    }
  }

  const handleEdit = (question) => {
    setEditingQuestion(question)
    setFormData({
      category: question.category,
      question_text: question.question_text,
      options: question.options || { A: '', B: '', C: '', D: '', E: '' },
      correct_answer: question.correct_answer
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return
    }
    
    try {
      const { error } = await db.deleteQuestion(id)
      if (error) throw error
      
      await loadQuestions()
    } catch (error) {
      console.error('Error deleting question:', error)
      alert('Error deleting question. Please try again.')
    }
  }

  const resetForm = () => {
    setShowForm(false)
    setEditingQuestion(null)
    setFormData({
      category: 'Grammar',
      question_text: '',
      options: { A: '', B: '', C: '', D: '', E: '' },
      correct_answer: 'A'
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleOptionChange = (option, value) => {
    setFormData(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [option]: value
      }
    }))
  }

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Access denied. Admin only.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Question Management
              </h1>
              <p className="text-gray-600 mt-1">
                Manage exam questions for all categories
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowForm(true)}
            >
              Add New Question
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {categories.map(category => {
            const categoryQuestions = questions.filter(q => q.category === category)
            return (
              <Card key={category} className="p-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {categoryQuestions.length}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {category}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>

        {/* Questions Table */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                All Questions ({questions.length})
              </h2>
              <div className="flex items-center space-x-4">
                <input
                  type="text"
                  placeholder="Search questions..."
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-600">Loading questions...</div>
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-600 mb-2">No questions found</div>
                <Button
                  variant="primary"
                  onClick={() => setShowForm(true)}
                >
                  Add First Question
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Question
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Answer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {questions.map((question) => (
                      <tr key={question.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {question.question_text}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            {question.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            {question.correct_answer}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEdit(question)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(question.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Question Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingQuestion ? 'Edit Question' : 'Add New Question'}
              </h3>
              
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Text
                    </label>
                    <textarea
                      name="question_text"
                      value={formData.question_text}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter the question text..."
                      required
                    />
                  </div>

                  {/* Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Answer Options
                    </label>
                    <div className="space-y-2">
                      {options.map(option => (
                        <div key={option} className="flex items-center">
                          <span className="w-8 text-center font-medium text-gray-700">
                            {option}.
                          </span>
                          <input
                            type="text"
                            value={formData.options[option] || ''}
                            onChange={(e) => handleOptionChange(option, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Option ${option} text...`}
                            required
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Correct Answer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Correct Answer
                    </label>
                    <select
                      name="correct_answer"
                      value={formData.correct_answer}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      {options.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    type="button"
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    type="submit"
                  >
                    {editingQuestion ? 'Update' : 'Create'} Question
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Questions