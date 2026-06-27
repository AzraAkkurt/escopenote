import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Card } from '@renderer/components/ui';

interface Props {
  children: ReactNode;
  onError?: (error: Error) => void;
  fallbackTitle?: string;
  fallbackDescription?: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[ErrorBoundary]', error, info.componentStack);
    this.props.onError?.(error);
  }

  private handleRetry = (): void => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div className="app-bootstrap app-bootstrap--error">
          <Card>
            <h1 className="page-header__title">
              {this.props.fallbackTitle ?? 'Something went wrong'}
            </h1>
            <p className="page-header__description">
              {this.props.fallbackDescription ?? this.state.error.message}
            </p>
            <Button variant="primary" onClick={this.handleRetry}>
              Try again
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
