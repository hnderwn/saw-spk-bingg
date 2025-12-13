import React from 'react'

const Timer = ({ timeLeft, isActive }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  const getTimeColor = () => {
    if (timeLeft <= 300) return 'text-red-600' // 5 minutes
    if (timeLeft <= 600) return 'text-orange-600' // 10 minutes
    return 'text-gray-700'
  }
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <div className="text-center">
        <div className="text-sm font-medium text-gray-500 mb-1">
          Sisa Waktu
        </div>
        <div className={`text-3xl font-bold ${getTimeColor()}`}>
          {formatTime(timeLeft)}
        </div>
        {isActive && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-1000 ${
                  timeLeft <= 300 ? 'bg-red-500' : 
                  timeLeft <= 600 ? 'bg-orange-500' : 'bg-green-500'
                }`}
                style={{ 
                  width: `${(timeLeft / 3600) * 100}%` 
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Timer
