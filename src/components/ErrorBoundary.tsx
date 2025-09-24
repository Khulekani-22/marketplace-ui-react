import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(p){ super(p); this.state = { error: null }; }
  static getDerivedStateFromError(error){ return { error }; }
  componentDidCatch(error, info){ console.error("UI Error:", error, info); }
  render(){
    if (this.state.error) {
      return (
        <div className="container p-4">
          <h2>Something went wrong</h2>
          <pre className="bg-light p-3 rounded" style={{whiteSpace:"pre-wrap"}}>
            {String(this.state.error?.message || this.state.error)}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
