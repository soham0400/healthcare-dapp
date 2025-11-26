import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Menu, X, Home } from 'lucide-react';
import { ROLE_NAMES } from '../../config/constants';

const Header = ({ account, userRole, userData, disconnect }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleDisconnect = () => {
    disconnect();
    navigate('/register');
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-2xl font-bold text-blue-600 hover:text-blue-700">
              Healthcare DApp
            </Link>
            <Link 
              to="/" 
              className="hidden md:flex items-center text-gray-600 hover:text-blue-600 transition"
            >
              <Home className="w-5 h-5" />
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">
                {userData?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500">{ROLE_NAMES[userRole]}</p>
            </div>
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-2 rounded-lg">
              {account?.slice(0, 6)}...{account?.slice(-4)}
            </div>
            <button
              onClick={handleDisconnect}
              className="text-red-600 hover:text-red-800 transition"
              title="Disconnect Wallet"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 py-4 px-4">
          <div className="space-y-3">
            <Link 
              to="/" 
              className="flex items-center gap-2 text-gray-700 hover:text-blue-600"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
            <div className="border-t border-gray-200 pt-3 space-y-2">
              <p className="text-sm font-medium text-gray-700">{userData?.name || 'User'}</p>
              <p className="text-xs text-gray-500">{ROLE_NAMES[userRole]}</p>
              <p className="text-xs text-gray-500">
                {account?.slice(0, 10)}...{account?.slice(-8)}
              </p>
              <button
                onClick={() => {
                  handleDisconnect();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left text-red-600 hover:text-red-800 flex items-center gap-2 mt-2"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;