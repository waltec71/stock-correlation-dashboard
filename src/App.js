// src/App.js

import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import CorrelationMatrix from './components/CorrelationMatrix';
import StockCorrelationGraph from './components/StockCorrelationGraph';
import './App.css';

function App() {
  return (
    <div className="App">
        <h1>Stock Correlation Network</h1>
        <StockCorrelationGraph correlationCutoff={0.6} />
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
