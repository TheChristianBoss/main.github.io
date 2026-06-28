import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("ATS tool crashed:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="ats-card ats-error-card">
          <h2 className="ats-title">Something went wrong</h2>
          <p className="ats-muted">
            The checker hit an unexpected browser error. Your files are processed locally, so try refreshing the page and reloading the resume.
          </p>
          <pre className="parse-preview">{this.state.error?.message || String(this.state.error)}</pre>
          <button className="ats-btn" onClick={() => window.location.reload()}>Reload ATS Checker</button>
        </div>
      );
    }

    return this.props.children;
  }
}
