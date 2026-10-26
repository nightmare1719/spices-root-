import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext.js';
import { api } from '../services/api.js';
import { Loader2, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (parent: HTMLElement, options: any) => void;
          prompt: (momentListener?: (notification: any) => void) => void;
          cancel: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface GoogleAuthButtonProps {
  mode?: 'signin' | 'signup' | 'continue' | 'verify';
  onSuccess?: (user: any, isNewUser?: boolean) => void;
  onError?: (errorMessage: string) => void;
  className?: string;
  enableOneTap?: boolean;
  buttonText?: string;
}

const DEFAULT_CLIENT_ID = '252545688197-ls9qktm9jpivldu62sqcncvtv0s0nhmq.apps.googleusercontent.com';

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  mode = 'signin',
  onSuccess,
  onError,
  className = '',
  enableOneTap = false,
  buttonText
}) => {
  const { loginWithGoogle, linkGoogleAccount } = useAuth();
  const buttonContainerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isScriptReady, setIsScriptReady] = useState<boolean>(false);
  const [clientId, setClientId] = useState<string>(
    import.meta.env.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID
  );

  // Fetch Client ID from server if not set
  useEffect(() => {
    let isMounted = true;
    if (!import.meta.env.VITE_GOOGLE_CLIENT_ID) {
      api.getAuthConfig()
        .then((res) => {
          if (isMounted && res.success && res.data?.googleClientId) {
            setClientId(res.data.googleClientId);
          }
        })
        .catch(() => {});
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // Ensure Google Identity Services script is loaded
  useEffect(() => {
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      setIsScriptReady(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
    if (existingScript) {
      const handleLoad = () => setIsScriptReady(true);
      existingScript.addEventListener('load', handleLoad);
      if (window.google?.accounts?.id) setIsScriptReady(true);
      return () => existingScript.removeEventListener('load', handleLoad);
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setIsScriptReady(true);
    script.onerror = () => {
      setErrorMsg('Google Services could not be loaded. Please check your network or ad blocker.');
      onError?.('Google Services could not be loaded.');
    };
    document.head.appendChild(script);
  }, [onError]);

  // Handle Google Credential Response
  const handleCredentialResponse = async (response: any) => {
    if (!response || !response.credential) {
      const err = 'Failed to receive credential token from Google.';
      setErrorMsg(err);
      onError?.(err);
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      if (mode === 'verify') {
        await linkGoogleAccount(response.credential);
        onSuccess?.(null, false);
      } else {
        const result = await loginWithGoogle(response.credential);
        onSuccess?.(result.user, result.isNewUser);
      }
    } catch (err: any) {
      const msg = err.message || 'Google authentication failed';
      setErrorMsg(msg);
      onError?.(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize and Render Google Button
  useEffect(() => {
    if (!isScriptReady || !clientId || !buttonContainerRef.current || !window.google?.accounts?.id) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear any prior rendered iframe before re-rendering
      buttonContainerRef.current.innerHTML = '';

      const textMapping = mode === 'signup' 
        ? 'signup_with' 
        : (mode === 'continue' ? 'continue_with' : 'signin_with');

      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: textMapping,
        shape: 'rectangular',
        logo_alignment: 'left',
        width: buttonContainerRef.current.offsetWidth || 360,
      });

      if (enableOneTap) {
        window.google.accounts.id.prompt();
      }
    } catch (renderErr) {
      console.warn('Google button render exception:', renderErr);
    }
  }, [isScriptReady, clientId, mode, enableOneTap]);

  const defaultDisplayText = mode === 'signup'
    ? 'Sign up with Google'
    : (mode === 'verify' ? 'Verify with Google' : (mode === 'continue' ? 'Continue with Google' : 'Sign in with Google'));

  const label = buttonText || defaultDisplayText;

  return (
    <div className={`w-full flex flex-col items-center gap-2 ${className}`}>
      {/* Official Google Identity Services Render Target */}
      <div 
        ref={buttonContainerRef} 
        className="w-full flex justify-center min-h-[44px] overflow-hidden rounded-xl"
      />

      {/* Fallback / Loading Branded Button if Google GIS is still initializing */}
      {(!isScriptReady || isLoading) && (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => {
            if (window.google?.accounts?.id) {
              window.google.accounts.id.prompt();
            }
          }}
          className="w-full h-11 px-4 bg-white hover:bg-stone-50 border border-stone-300 rounded-xl flex items-center justify-center gap-3 text-stone-700 text-xs sm:text-sm font-semibold transition-all shadow-xs hover:shadow-sm disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 text-[#153E2B] animate-spin" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.67-5.17 3.67-9.15z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.27v3.15C3.3 21.35 7.36 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.27 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.27C.46 8.23 0 10.06 0 12s.46 3.77 1.27 5.39l4-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.3 2.65 1.27 6.61l4 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
              />
            </svg>
          )}
          <span>{isLoading ? 'Verifying with Google...' : label}</span>
        </button>
      )}

      {errorMsg && (
        <div className="w-full bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
    </div>
  );
};
