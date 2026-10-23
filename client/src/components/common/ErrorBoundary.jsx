import React from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ProjAxis React ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  componentDidUpdate(prevProps) {
    if (this.props.resetKey !== prevProps.resetKey && this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="d-flex align-items-center justify-content-center min-vh-100 p-4" style={{ backgroundColor: 'var(--color-page-bg)' }}>
          <div className="pa-card text-center p-4 p-md-5 border shadow-sm" style={{ maxWidth: '520px' }}>
            <div
              className="d-inline-flex p-3 rounded-circle mb-3"
              style={{ backgroundColor: 'var(--color-light-blue)', color: 'var(--color-error)' }}
            >
              <AlertTriangle size={36} />
            </div>
            <h4 className="fw-bold text-dark mb-2">Display Error Encountered</h4>
            <p className="text-muted small mb-4">
              An unexpected error occurred while loading this view. You can reload the view or return safely to your role dashboard.
            </p>

            {this.state.error && (
              <div className="p-3 bg-light rounded border text-start small font-monospace text-danger mb-4 text-break">
                {this.state.error.toString()}
              </div>
            )}

            <div className="d-flex justify-content-center gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary d-flex align-items-center gap-2"
                onClick={this.handleReset}
              >
                <RotateCcw size={16} /> Reload Page
              </button>
              <button
                type="button"
                className="btn btn-primary d-flex align-items-center gap-2"
                onClick={this.handleGoHome}
              >
                <Home size={16} /> Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
