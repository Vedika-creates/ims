import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { Package, TrendingUp, AlertTriangle, Users } from 'lucide-react'

const Home = () => {
  const { user } = useAuth()

  const features = [
    {
      icon: Package,
      title: 'Inventory Management',
      description: 'Track and manage your inventory with real-time updates',
      color: 'text-blue-600'
    },
    {
      icon: TrendingUp,
      title: 'Reorder Alerts',
      description: 'Automatic notifications when stock levels are low',
      color: 'text-green-600'
    },
    {
      icon: AlertTriangle,
      title: 'Stock Monitoring',
      description: 'Monitor stock levels and prevent shortages',
      color: 'text-yellow-600'
    },
    {
      icon: Users,
      title: 'User Management',
      description: 'Manage user access and permissions',
      color: 'text-purple-600'
    }
  ]

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-gray-900">
          Inventory Management System
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Streamline your inventory operations with our comprehensive management solution
        </p>
        {user ? (
          <Link
            to="/dashboard"
            className="inline-block btn btn-primary text-lg px-8 py-3"
          >
            Go to Dashboard
          </Link>
        ) : (
          <Link
            to="/login"
            className="inline-block btn btn-primary text-lg px-8 py-3"
          >
            Get Started
          </Link>
        )}
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white p-6 rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow"
          >
            <feature.icon className={`w-12 h-12 ${feature.color} mb-4`} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      {/* Stats Section */}
      <div className="bg-white p-8 rounded-lg shadow-md border border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Why Choose Our System?
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">24/7</div>
            <div className="text-gray-600">Real-time Monitoring</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">99.9%</div>
            <div className="text-gray-600">Uptime Guarantee</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-primary-600 mb-2">100+</div>
            <div className="text-gray-600">Happy Customers</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home
