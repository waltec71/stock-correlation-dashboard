// src/components/StockSearch.js

import React, { useState } from 'react';
import { Form, Button, Alert, Spinner } from 'react-bootstrap';
import { getValidation } from '../services/api.js';
import './StockSearch.css';

const StockSearch = ({ 
  onStockAdded,
  allStocks = [], 
  setAllStocks,
  selectedStocks, 
  setSelectedStocks
}) => {
  const [newStock, setNewStock] = useState('');
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState(null);

  const handleAddStock = async (e) => {
    e.preventDefault();
    
    if (!newStock) return;
    
    const ticker = newStock.toUpperCase();
    
    // Check if ticker already exists in the list
    if (allStocks.includes(ticker)) {
      setError(`${ticker} is already in your list`);
      return;
    }
    
    setValidating(true);
    setError(null);
    
    try {
      // Validate the ticker before adding
      const isValid = await getValidation(ticker);
      
      if (isValid) {
        // Update all stocks list
        const updatedAllStocks = [...allStocks, ticker];
        setAllStocks(updatedAllStocks);
        
        // Add to selected stocks as well
        setSelectedStocks([...selectedStocks, ticker]);
        
        // Call the parent callback (can be used for additional actions)
        if (onStockAdded) {
          onStockAdded(ticker, updatedAllStocks);
        }
        
        setNewStock('');
      } else {
        setError(`${ticker} is not a valid stock ticker`);
      }
    } catch (error) {
      console.error('Error validating stock ticker:', error);
      setError('Error validating stock ticker. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  // Toggle stock selection
  const toggleStock = (ticker) => {
    if (selectedStocks.includes(ticker)) {
      setSelectedStocks(selectedStocks.filter(stock => stock !== ticker));
    } else {
      setSelectedStocks([...selectedStocks, ticker]);
    }
  };

  // Select/Deselect all stocks
  const toggleAllStocks = () => {
    if (selectedStocks.length === allStocks.length) {
      setSelectedStocks([]);
    } else {
      setSelectedStocks([...allStocks]);
    }
  };

  return (
    <div className="stock-search-container">
      <h3 className="section-title">Stock Selection</h3>
      
      <Form onSubmit={handleAddStock} className="mb-3 d-flex">
        <Form.Control
          type="text"
          placeholder="Add stock ticker (e.g., NFLX)"
          value={newStock}
          onChange={(e) => setNewStock(e.target.value.toUpperCase())}
          className="me-2"
          disabled={validating}
        />
        <Button type="submit" variant="primary" disabled={validating || !newStock}>
          {validating ? <Spinner size="sm" animation="border" /> : 'Add'}
        </Button>
      </Form>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {allStocks.length > 0 && (
        <>
          <div className="mb-2 mt-3">
            <Button 
              onClick={toggleAllStocks}
              variant="outline-secondary"
              size="sm"
              className="me-2"
            >
              {selectedStocks.length === allStocks.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>
          
          <div className="stock-checkbox-container">
            {allStocks.map(ticker => (
              <div key={ticker} className="stock-checkbox-item">
                <input 
                  id={`stock-${ticker}`}
                  type="checkbox" 
                  checked={selectedStocks.includes(ticker)} 
                  onChange={() => toggleStock(ticker)} 
                />
                <label htmlFor={`stock-${ticker}`}>{ticker}</label>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default StockSearch;