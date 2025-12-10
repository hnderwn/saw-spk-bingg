import React from 'react'
import Card from '../ui/Card'

const QuestionCard = ({ 
  question, 
  questionNumber, 
  totalQuestions, 
  selectedAnswer, 
  onAnswerSelect 
}) => {
  const options = ['A', 'B', 'C', 'D', 'E']
  
  return (
    <Card className="p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-500">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
            {question.category}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(questionNumber / totalQuestions) * 100}%` }}
          />
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 leading-relaxed">
          {question.question_text}
        </h3>
      </div>
      
      <div className="space-y-3">
        {options.map((option) => {
          const optionText = question.options?.[option] || ''
          if (!optionText) return null
          
          return (
            <label
              key={option}
              className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                selectedAnswer === option
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={option}
                checked={selectedAnswer === option}
                onChange={() => onAnswerSelect(option)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
              />
              <div className="ml-3 flex-1">
                <span className="font-medium text-gray-900">{option}.</span>
                <span className="ml-2 text-gray-700">{optionText}</span>
              </div>
            </label>
          )
        })}
      </div>
    </Card>
  )
}

export default QuestionCard