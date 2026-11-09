import { Component, type ErrorInfo, type ReactNode } from 'react'
import './Fallback.css'

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="eb-wrap">
          <div className="eb-card">
            <div className="eb-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 20h20L12 2z"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinejoin="round"
                />
                <path d="M12 9v5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                <circle cx="12" cy="17" r="0.75" fill="currentColor" />
              </svg>
            </div>
            <div className="eb-body">
              <p className="eb-title">Something went wrong</p>
              <p className="eb-detail">{this.state.error.message}</p>
            </div>
            <button
              className="eb-reload"
              onClick={() => window.location.reload()}
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
