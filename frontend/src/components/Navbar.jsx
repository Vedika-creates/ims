import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Package, LogOut, User, ChevronDown, Box, ShoppingCart, BarChart3, Settings, Truck, FileText, ArrowRight } from 'lucide-react'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [openDropdown, setOpenDropdown] = useState(null)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: <Package className="w-4 h-4" />
    },
    {
      name: 'Items',
      path: '/items',
      icon: <Box className="w-4 h-4" />
    },
    {
      name: 'Warehouses',
      path: '/warehouses',
      icon: <Truck className="w-4 h-4" />
    },
    {
      name: 'Transfers',
      path: '/transfer-orders',
      icon: <ArrowRight className="w-4 h-4" />
    },
    {
      name: 'Purchasing',
      path: '/purchasing',
      icon: <ShoppingCart className="w-4 h-4" />,
      dropdown: [
        { name: 'Suppliers', path: '/suppliers' },
        { name: 'Purchase Orders', path: '/purchasing/orders' },
        { name: 'Purchase Requisitions', path: '/purchasing/requisitions' },
        { name: 'Goods Receipt Notes', path: '/grn' }
      ]
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: <BarChart3 className="w-4 h-4" />,
      dropdown: [
        { name: 'Reports Dashboard', path: '/reports' },
        { name: 'Stock Valuation', path: '/reports/stock-valuation' },
        { name: 'ABC Analysis', path: '/reports/abc-analysis' },
        { name: 'Analytics', path: '/analytics' }
      ]
    },
    {
      name: 'Admin',
      path: '/users',
      icon: <Settings className="w-4 h-4" />
    }
  ]

  return (
    <nav className="bg-white shadow-md border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Package className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">IMS</span>
            </Link>
          </div>

          <div className="flex items-center space-x-1">
            {user ? (
              <>
                {navItems.map((item) => (
                  <div key={item.name} className="relative">
                    {item.dropdown ? (
                      <div>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === item.name ? null : item.name)}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive(item.path)
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                          }`}
                        >
                          {item.icon}
                          <span>{item.name}</span>
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        {openDropdown === item.name && (
                          <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                            <div className="py-1">
                              {item.dropdown.map((subItem) => (
                                <Link
                                  key={subItem.name}
                                  to={subItem.path}
                                  onClick={() => setOpenDropdown(null)}
                                  className={`block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 ${
                                    location.pathname === subItem.path ? 'bg-primary-50 text-primary-700' : ''
                                  }`}
                                >
                                  {subItem.name}
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link
                        to={item.path}
                        className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive(item.path)
                            ? 'bg-primary-100 text-primary-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                      >
                        {item.icon}
                        <span>{item.name}</span>
                      </Link>
                    )}
                  </div>
                ))}
                
                <div className="flex items-center space-x-2 text-sm text-gray-600 ml-4 pl-4 border-l border-gray-300">
                  <User className="w-4 h-4" />
                  <span>{user.name || user.email}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="btn btn-primary"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
