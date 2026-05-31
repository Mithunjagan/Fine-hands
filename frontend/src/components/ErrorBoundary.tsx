import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  expanded: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    expanded: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null, expanded: false };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, expanded: false });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-gray-950 p-6">
          <div className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-gray-900/50 p-8 shadow-2xl backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-4 text-red-400">
              <div className="rounded-full bg-red-500/20 p-3">
                <AlertCircle className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
            </div>
            
            <p className="mb-8 text-gray-400">
              An unexpected error occurred in the application. You can try refreshing the page or restarting the component.
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={this.handleRetry}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition-all hover:bg-blue-500 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
              >
                <RefreshCw className="h-5 w-5 transition-transform group-hover:rotate-180" />
                Try Again
              </button>

              {this.state.error && (
                <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-950">
                  <button
                    onClick={() => this.setState(s => ({ expanded: !s.expanded }))}
                    className="flex w-full items-center justify-between p-4 text-sm font-medium text-gray-400 hover:text-gray-300"
                  >
                    <span>View Error Details</span>
                    {this.state.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  
                  {this.state.expanded && (
                    <div className="border-t border-gray-800 bg-black/50 p-4">
                      <pre className="overflow-auto whitespace-pre-wrap text-xs text-red-400 font-mono">
                        {this.state.error.toString()}
                        {'\n\n'}
                        {this.state.errorInfo?.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
