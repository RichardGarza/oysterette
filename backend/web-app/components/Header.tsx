'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Image from 'next/image';

export default function Header() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const sunIcon = '☀️';
  const moonIcon = '🌙';

  return (
    <header className="sticky top-0 z-50 bg-[#3498db] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/top-bar-logo.png"
              alt="Oysterette"
              width={150}
              height={40}
              className="object-contain"
              priority
            />
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className="text-white hover:text-gray-100 transition-colors px-3 py-2 rounded-md"
            >
              Home
            </Link>
            <Link
              href="/oysters"
              className="text-white hover:text-gray-100 transition-colors px-3 py-2 rounded-md"
            >
              Browse Oysters
            </Link>
            {isAuthenticated ? (
              <>
                <Link
                  href="/favorites"
                  className="text-white hover:text-gray-100 transition-colors px-3 py-2 rounded-md"
                >
                  Favorites
                </Link>
                <Link
                  href="/friends"
                  className="text-white hover:text-gray-100 transition-colors px-3 py-2 rounded-md"
                >
                  Friends
                </Link>
                <Link
                  href="/profile"
                  className="text-white hover:text-gray-100 transition-colors px-3 py-2 rounded-md"
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="text-white hover:text-gray-100 transition-colors px-3 py-2 rounded-md"
                >
                  Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white hover:text-gray-100 transition-colors px-3 py-2 rounded-md"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-white hover:text-gray-100 transition-colors px-3 py-2 rounded-md"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-[#FF6B35] hover:bg-[#e55a2b] text-white px-4 py-2 rounded-md transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button className="md:hidden text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="text-white hover:text-gray-100 p-2 rounded-full transition-colors ml-2"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? sunIcon : moonIcon}
          </button>
        </div>
      </div>
    </header>
  );
}

