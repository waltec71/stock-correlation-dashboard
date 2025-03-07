// src/App.js

import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import CorrelationMatrix from './components/CorrelationMatrix';
import StockCorrelationGraph from './components/StockCorrelationGraph';
import StockSearch from './components/StockSearch';
import { Container, Row, Col, Card } from 'react-bootstrap';
import './App.css';

function App() {
  // Define the shared stock state at the App level
  const [allStocks, setAllStocks] = useState(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'F']);
  const [selectedStocks, setSelectedStocks] = useState(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'F']);

  // Get correlation cutoff from URL params
  const getCorrelationCutoff = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const cutoff = parseFloat(urlParams.get('cutoff'));
      return !isNaN(cutoff) ? cutoff : 0.6; // Default to 0.6 if not specified
    }
    return 0.6;
  };

  return (
    <div className="App">
      <Container fluid>
        <h1 className="my-4">Stock Correlation Network</h1>
        
        <Row>
          <Col md={3}>
            <Card className="mb-4">
              <Card.Body>
                <StockSearch 
                  allStocks={allStocks}
                  setAllStocks={setAllStocks}
                  selectedStocks={selectedStocks}
                  setSelectedStocks={setSelectedStocks}
                  onStockAdded={(ticker, updatedStocks) => {
                    // Additional logic could be added here if needed
                    console.log(`Stock ${ticker} added, now we have ${updatedStocks.length} stocks`);
                  }}
                />
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={9}>
            <Card className="mb-4">
              <Card.Body>
                <StockCorrelationGraph 
                  correlationCutoff={getCorrelationCutoff()} 
                  allStocks={allStocks}
                  selectedStocks={selectedStocks}
                />
              </Card.Body>
            </Card>
            
            <Card>
              <Card.Body>
                <CorrelationMatrix 
                  allStocks={allStocks}
                  setAllStocks={setAllStocks}
                  selectedStocks={selectedStocks}
                  setSelectedStocks={setSelectedStocks}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
      
      <footer className="App-footer">
        <p>waltec71 will never steer you wrong</p>
      </footer>
    </div>
  );
}

export default App;
