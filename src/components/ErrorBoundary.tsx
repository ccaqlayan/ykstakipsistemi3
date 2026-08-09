import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-center">
          <div className="bg-slate-900/80 backdrop-blur-md p-8 rounded-3xl border border-rose-500/30 max-w-lg shadow-2xl">
            <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-500/30">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Oops! Something went wrong.</h1>
            <p className="text-slate-400 text-sm mb-6">
              We encountered a critical error while loading this page. 
              {this.state.error && (
                <span className="block mt-2 font-mono text-xs text-rose-400/80 bg-rose-500/10 p-2 rounded">
                  {this.state.error.message}
                </span>
              )}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-600/20"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Page</span>
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
