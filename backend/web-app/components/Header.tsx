'use client';

import Link from 'next/link';
import Image from 'next/image';
import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 bg-[#3498db] border-b border-[#2980b9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
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

          <nav className="flex items-center space-x-4">
            <Link
              href="/oysters"
              className="text-white hover:text-gray-100 transition-colors"
            >
              Browse
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  href="/profile"
                  className="text-white hover:text-gray-100 transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={logout}
                  className="text-white hover:text-gray-100 transition-colors"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-white hover:text-gray-100 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="bg-white text-[#3498db] px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-[#2980b9] transition-colors text-white"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}

