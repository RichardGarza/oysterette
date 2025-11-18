'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect, useCallback, useRef } from 'react';

interface GoogleSignInButtonProps {
  text?: string;
  variant?: 'default' | 'outline';
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (notification?: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

export default function GoogleSignInButton({ 
  text = 'Continue with Google',
  variant = 'default'
}: GoogleSignInButtonProps) {
  const router = useRouter();
  const { googleLogin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isReady, setIsReady] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const renderedRef = useRef(false);

  const handleCredentialResponse = useCallback(async (response: { credential: string }) => {
    try {
      setLoading(true);
      setError('');
      
      // Send ID token to backend
      await googleLogin(response.credential);
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Google sign-in failed');
      setLoading(false);
    }
  }, [googleLogin, router]);

  // Use Google Identity Services with renderButton (more reliable than prompt)
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      setError('Google Client ID not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local');
      return;
    }

    if (typeof window === 'undefined') return;
    if (!buttonRef.current) return;
    if (renderedRef.current) return;

    const initializeAndRender = () => {
      if (!window.google?.accounts?.id) return;
      if (renderedRef.current) return;
      if (!buttonRef.current) return;

      try {
        // Initialize Google Identity Services
        if (!initializedRef.current) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleCredentialResponse,
          });
          initializedRef.current = true;
        }

        // Render the button
        if (buttonRef.current && !renderedRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'signin_with',
            width: '100%',
          });
          renderedRef.current = true;
          setIsReady(true);
        }
      } catch (err) {
        console.error('Google render error:', err);
        setError('Failed to initialize Google Sign-In');
      }
    };

    // Check if already loaded
    if (window.google?.accounts?.id) {
      initializeAndRender();
      return;
    }

    // Check if script is already in the document
    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existingScript) {
      // Wait for it to load
      const checkGoogle = setInterval(() => {
        if (window.google?.accounts?.id) {
          initializeAndRender();
          clearInterval(checkGoogle);
        }
      }, 100);
      
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkGoogle);
        if (!isReady) {
          setError('Google Sign-In took too long to load. Please refresh the page.');
        }
      }, 5000);
      
      return () => clearInterval(checkGoogle);
    }

    // Load Google Identity Services script
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Small delay to ensure Google is fully ready
      setTimeout(() => {
        initializeAndRender();
      }, 100);
    };

    script.onerror = () => {
      setError('Failed to load Google Sign-In. Please check your internet connection.');
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [handleCredentialResponse, isReady]);

  return (
    <div>
      {loading && (
        <div className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg bg-gray-100 dark:bg-[#243447]">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#FF6B35]"></div>
          <span className="text-gray-700 dark:text-gray-300">Signing in...</span>
        </div>
      )}
      {!loading && (
        <div 
          ref={buttonRef}
          className={!isReady ? 'opacity-50 pointer-events-none' : ''}
        />
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
      )}
    </div>
  );
}

