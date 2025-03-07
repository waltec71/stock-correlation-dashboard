import React, { useState, useEffect } from 'react';
import { Table, Spinner, Alert } from 'react-bootstrap';
import './CorrelationMatrix.css';
import { getCorrelations, getStockMetrics } from '../services/api.js';

const CorrelationMatrix = ({ allStocks, setAllStocks, selectedStocks, setSelectedStocks }) => {
  const [matrix, setMatrix] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCell, setSelectedCell] = useState(null);
  const [stockMetrics, setStockMetrics] = useState({});
  const [error, setError] = useState(null);

  // Initialize the matrix when the component mounts or when selectedStocks changes
  useEffect(() => {
    if (selectedStocks.length > 0) {
      fetchCorrelationData(selectedStocks);
      fetchAllStockMetrics(selectedStocks);
    } else {
      setMatrix([]);
      setLoading(false);
    }
  }, [selectedStocks]);

  // Fetch beta and returns data for stocks
  const fetchAllStockMetrics = async (stocksList) => {
    const metricsObj = {};
    
    try {
      for (const ticker of stocksList) {
        // Only fetch metrics we don't already have
        if (!stockMetrics[ticker]) {
          const metrics = await getStockMetrics(ticker);
          metricsObj[ticker] = metrics;
        } else {
          metricsObj[ticker] = stockMetrics[ticker];
        }
      }
      
      setStockMetrics(metricsObj);
    } catch (error) {
      console.error('Failed to fetch stock metrics:', error);
      // Continue without metrics if there's an error
    }
  };

  // This function fetches real correlation data from the API
  const fetchCorrelationData = async (currentStocks) => {
    setLoading(true);
    setError(null);
    
    try {
      const stockCount = currentStocks.length;
      
      // Handle special case for a matrix with a single stock
      if (stockCount === 1) {
        // For a single stock, we just need a 1×1 matrix with value 1.0 (correlation with self)
        setMatrix([[1.0]]);
        setLoading(false);
        return;
      }
      
      const newMatrix = Array(stockCount).fill().map(() => Array(stockCount).fill(null));
      
      // Fill diagonal with 1.0 (correlation with self)
      for (let i = 0; i < stockCount; i++) {
        newMatrix[i][i] = 1.0;
      }
    
      // Convert stocks to a comma-separated string for API call
      const stockString = currentStocks.join(",");
      // Fetch correlations for all stocks
      const correlationData = await getCorrelations(stockString, stockString);
      
      // Create a mapping of stock names to their indices in the matrix
      const stockIndexMap = {};
      currentStocks.forEach((stock, index) => {
        stockIndexMap[stock] = index;
      });

      // Iterate through API response and populate the matrix
      correlationData.forEach(({ ticker, compared_ticker, data }) => {
        if (stockIndexMap[ticker] !== undefined && stockIndexMap[compared_ticker] !== undefined) {
          const i = stockIndexMap[ticker];
          const j = stockIndexMap[compared_ticker];

          // Set correlation value and ensure matrix symmetry
          newMatrix[i][j] = data;
          newMatrix[j][i] = data;
        }
      });
      
      setMatrix(newMatrix);
    } catch (error) {
      console.error('Failed to fetch correlation data:', error);
      setError('Failed to fetch correlation data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStock = (index) => {
    const stockToRemove = selectedStocks[index];
    
    // Remove from selected stocks
    setSelectedStocks(selectedStocks.filter(stock => stock !== stockToRemove));
    
    // Also remove from all stocks
    setAllStocks(allStocks.filter(stock => stock !== stockToRemove));
    
    // Remove from metrics
    setStockMetrics(prev => {
      const newMetrics = {...prev};
      delete newMetrics[stockToRemove];
      return newMetrics;
    });
    
    // Clear selected cell if it involved the removed stock
    if (selectedCell && 
        (selectedStocks[index] === selectedCell.stockA || 
         selectedStocks[index] === selectedCell.stockB)) {
      setSelectedCell(null);
    }
  };

  const getColorForCorrelation = (value) => {
    if (value === null || value === undefined) return '#f8f9fa';
    
    // Scale from red (negative correlation) to white (no correlation) to green (positive correlation)
    if (value > 0) {
      // White to green
      const intensity = Math.round(value * 255);
      return `rgb(${255 - intensity}, 255, ${255 - intensity})`;
    } else {
      // White to red
      const intensity = Math.round(-value * 255);
      return `rgb(255, ${255 - intensity}, ${255 - intensity})`;
    }
  };

  const handleCellClick = (rowIndex, colIndex) => {
    if (rowIndex === colIndex) return; // Don't select diagonal cells
    
    setSelectedCell({
      stockA: selectedStocks[rowIndex],
      stockB: selectedStocks[colIndex],
      correlation: matrix[rowIndex][colIndex]
    });
  };

  // Safety check for rendering
  if (loading || !matrix || matrix.length === 0 || matrix.length !== selectedStocks.length) {
    return (
      <div className="correlation-matrix-container">
        <h2>Stock Correlation Matrix</h2>
        
        {selectedStocks.length === 0 ? (
          <Alert variant="info">Add stocks to see their correlations</Alert>
        ) : (
          <div className="text-center my-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="correlation-matrix-container">
      <h2>Stock Correlation Matrix</h2>
      <p>The following matrix shows pairwise correlation coefficients calculated using 5 years of weekly stock return data.</p>
      
      <div className="table-responsive">
        <Table bordered hover className="correlation-table">
          <thead>
            <tr>
              <th></th>
              {selectedStocks.map((stock, index) => (
                <th key={index} className="stock-header">
                  {stock}
                  <button 
                    className="remove-stock-btn"
                    onClick={() => handleRemoveStock(index)}
                  >
                    ×
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {selectedStocks.map((rowStock, rowIndex) => (
              <tr key={rowIndex}>
                <th className="stock-header">{rowStock}</th>
                {selectedStocks.map((colStock, colIndex) => {
                  // Double check we have valid data
                  const cellValue = matrix[rowIndex] && matrix[rowIndex][colIndex] !== undefined
                    ? matrix[rowIndex][colIndex]
                    : null;
                  
                  return (
                    <td
                      key={colIndex}
                      onClick={() => cellValue !== null && handleCellClick(rowIndex, colIndex)}
                      style={{
                        backgroundColor: getColorForCorrelation(cellValue),
                        cursor: rowIndex !== colIndex && cellValue !== null ? 'pointer' : 'default'
                      }}
                      className={selectedCell && 
                        selectedCell.stockA === selectedStocks[rowIndex] && 
                        selectedCell.stockB === selectedStocks[colIndex] ? 
                        'selected-cell' : ''}
                    >
                      {cellValue !== null ? cellValue.toFixed(2) : 'N/A'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
      
      {selectedStocks.length === 1 && (
        <Alert variant="info" className="mt-3">
          Add more stocks to see correlation values. A single stock always has a correlation of 1.0 with itself.
        </Alert>
      )}
      
      {selectedCell && (
        <div className="correlation-details mt-4 p-3 border rounded">
          <h3>Correlation Details</h3>
          <p><strong>{selectedCell.stockA}</strong> and <strong>{selectedCell.stockB}</strong> have a correlation of <strong>{selectedCell.correlation.toFixed(4)}</strong></p>
          <p className="mt-3">
            {selectedCell.correlation > 0.7 ? 
              'These stocks are highly positively correlated and tend to move together.' : 
              selectedCell.correlation < -0.7 ? 
                'These stocks are highly negatively correlated and tend to move in opposite directions.' : 
                selectedCell.correlation > 0.3 ? 
                  'These stocks have a moderate positive correlation.' : 
                  selectedCell.correlation < -0.3 ? 
                    'These stocks have a moderate negative correlation.' : 
                    'These stocks have little to no correlation.'}
          </p>
          {/* Stock metrics section */}
          <div className="stock-metrics mt-3">
            <div className="d-flex flex-wrap gap-4">
              <div className="metrics-card p-3 border rounded">
                <h5>{selectedCell.stockA}</h5>
                {stockMetrics[selectedCell.stockA] ? (
                  <div>
                    <p><strong>Beta:</strong> {stockMetrics[selectedCell.stockA].beta}</p>
                    <p><strong>Returns:</strong> {stockMetrics[selectedCell.stockA].returns}%</p>
                  </div>
                ) : (
                  <p className="text-muted">Loading metrics...</p>
                )}
              </div>
              
              <div className="metrics-card p-3 border rounded">
                <h5>{selectedCell.stockB}</h5>
                {stockMetrics[selectedCell.stockB] ? (
                  <div>
                    <p><strong>Beta:</strong> {stockMetrics[selectedCell.stockB].beta}</p>
                    <p><strong>Returns:</strong> {stockMetrics[selectedCell.stockB].returns}%</p>
                  </div>
                ) : (
                  <p className="text-muted">Loading metrics...</p>
                )}
              </div>
            </div>
          </div>
          <br />
          <p style={{ textAlign: 'left' }}>Returns measured from Jan 2020 - Jan 2025.</p>
          <p style={{ textAlign: 'left' }}>Beta is a measure of a stock's historical volatility in comparison with the S&P 500. Stocks with a beta above 1 tend to be more volatile than the index, while stocks with lower betas tend to be less volatile.</p>

        </div>
      )}
    </div>
  );
};

export default CorrelationMatrix;