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
  document.title = 'Stock Correlations'
  const [allStocks, setAllStocks] = useState(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'F']);
  const [selectedStocks, setSelectedStocks] = useState(['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'F']);
  // Add state for correlation cutoff with default value 0.6
  const [correlationCutoff, setCorrelationCutoff] = useState(0.6);

  return (
    <div className="App">
      <Container fluid>
        <h1 className="my-4">Stock Correlations</h1>
        
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
                  correlationCutoff={correlationCutoff}
                  setCorrelationCutoff={setCorrelationCutoff}
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
        <p>
          <br></br>
        </p>
      </footer>
    </div>
  );
}

export default App;