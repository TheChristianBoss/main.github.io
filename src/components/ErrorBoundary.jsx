import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rb-app">
          <div className="rb-crash-card">
            <h1>Resume Builder hit a problem.</h1>
            <p>Your browser draft should still be saved locally. Reload the page, or start a new resume if the draft is corrupted.</p>
            <pre>{this.state.error?.message || String(this.state.error)}</pre>
            <div className="rb-crash-actions">
              <button onClick={() => window.location.reload()}>Reload</button>
              <button onClick={() => { localStorage.removeItem('cg_resume_builder_draft_v2'); window.location.reload(); }}>Clear saved draft</button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
