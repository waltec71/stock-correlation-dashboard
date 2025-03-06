// src/App.js

import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import CorrelationMatrix from './components/CorrelationMatrix';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Stock Correlation Dashboard</h1>
      </header>
      <main>
        <CorrelationMatrix />
      </main>
      <footer className="App-footer">
        <p>waltec71 will never steer you wrong</p>
      </footer>
    </div>
  );
}

export default App;
