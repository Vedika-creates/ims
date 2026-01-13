import React from 'react'

const Test = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          React App is Working!
        </h1>
        <p className="text-gray-600">
          If you can see this, React and Tailwind CSS are working correctly.
        </p>
        <div className="mt-4 space-y-2">
          <div className="text-green-600">✅ React: Working</div>
          <div className="text-green-600">✅ Tailwind CSS: Working</div>
          <div className="text-green-600">✅ Vite Dev Server: Working</div>
        </div>
      </div>
    </div>
  )
}

export default Test
