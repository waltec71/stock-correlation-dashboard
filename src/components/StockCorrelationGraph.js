import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import ForceGraph2D from 'react-force-graph-2d';
import './StockCorrelationGraph.css';
import { getCorrelations } from '../services/api.js';

const StockCorrelationGraph = ({ correlationCutoff = 0.5 }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [allStocks, setAllStocks] = useState(['MSFT', 'GOOGL', 'AMZN', 'NVDA', 'AAPL', 'F']); // Default stocks
  const [selectedStocks, setSelectedStocks] = useState(['MSFT', 'GOOGL', 'AMZN', 'NVDA', 'AAPL', 'F']);
  const [newStock, setNewStock] = useState('');
  const [correlationData, setCorrelationData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fgRef = useRef();
  const graphContainerRef = useRef(null);

  // Fetch correlation data when selected stocks change
  useEffect(() => {
    const fetchCorrelationData = async () => {
      if (selectedStocks.length === 0) {
        setGraphData({ nodes: [], links: [] });
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const stockList = selectedStocks.join(',');
        const stock_correlations = getCorrelations(stockList,stockList);
        setCorrelationData(stock_correlations);
        
        // Process the data into graph format
        const graphData = processCorrelationData(stock_correlations, selectedStocks, correlationCutoff);
        setGraphData(graphData);
        
        setLoading(false);
      } catch (err) {
        setError(`Failed to fetch correlation data: ${err.message}`);
        setLoading(false);
        console.error('Error fetching correlation data:', err);
      }
    };

    fetchCorrelationData();
  }, [selectedStocks, correlationCutoff]);

  // Set up node containment boundaries when the graph is ready
  useEffect(() => {
    const setupBoundaries = () => {
      if (fgRef.current && graphContainerRef.current) {
        const boundingRect = graphContainerRef.current.getBoundingClientRect();
        
        // Function to keep nodes within the container boundary
        fgRef.current.d3Force('boundary', (alpha) => {
          if (!fgRef.current || !graphData.nodes) return;
          
          const padding = 30; // Padding from the edge
          const width = boundingRect.width;
          const height = boundingRect.height;
          
          graphData.nodes.forEach(node => {
            // Apply containment forces
            if (node.x < padding) node.x = padding;
            if (node.x > width - padding) node.x = width - padding;
            if (node.y < padding) node.y = padding;
            if (node.y > height - padding) node.y = height - padding;
          });
        });
      }
    };

    setupBoundaries();
    
    // Re-setup boundaries if the window is resized
    window.addEventListener('resize', setupBoundaries);
    return () => window.removeEventListener('resize', setupBoundaries);
  }, [graphData, fgRef, graphContainerRef]);

  // Process the correlation data into nodes and links
  const processCorrelationData = (data, selectedStocks, cutoff) => {
    const stockSet = new Set();
    const links = [];

    // Extract all unique stocks and valid links
    data.forEach(item => {
      const source = item.ticker;
      const target = item.compared_ticker;
      const correlation = item.data;
      
      // Only include stocks that are selected and avoid self-connections
      if (source !== target && selectedStocks.includes(source) && selectedStocks.includes(target)) {
        stockSet.add(source);
        stockSet.add(target);
        
        // Only add links for correlations above the cutoff
        if (Math.abs(correlation) >= cutoff) {
          // Check if this link already exists (to avoid duplicates)
          const existingLink = links.find(link => 
            (link.source === source && link.target === target) || 
            (link.source === target && link.target === source)
          );
          
          if (!existingLink) {
            links.push({
              source,
              target,
              value: correlation,
              // Set link color based on correlation (red for negative, green for positive)
              color: correlation < 0 ? 'rgba(255,0,0,0.5)' : 'rgba(0,128,0,0.5)',
              // Set link width based on correlation strength
              width: Math.abs(correlation) * 3
            });
          }
        }
      }
    });

    // Convert the set of stocks to nodes
    const nodes = Array.from(stockSet).map(ticker => ({
      id: ticker,
      name: ticker,
      val: 1 // You could adjust node size based on market cap, volume, etc.
    }));

    return { nodes, links };
  };

  // Add a new stock
  const addStock = () => {
    if (newStock && !allStocks.includes(newStock.toUpperCase())) {
      const stockSymbol = newStock.toUpperCase();
      setAllStocks([...allStocks, stockSymbol]);
      setSelectedStocks([...selectedStocks, stockSymbol]);
      setNewStock('');
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

  // Color the nodes
  const nodeColor = () => 'rgba(52, 152, 219, 0.8)'; // Updated to match the color scheme

  // Handle form submission for adding new stock
  const handleSubmit = (e) => {
    e.preventDefault();
    addStock();
  };

  return (
    <div className="stock-graph-container">
      {error && <div className="error-message">{error}</div>}
      
      <div className="graph-controls">
        <h3 className="section-title">Correlation Cutoff: <span className="correlation-value">{correlationCutoff}</span></h3>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.05" 
          value={correlationCutoff} 
          onChange={(e) => window.location.href = `?cutoff=${e.target.value}`}
          className="correlation-slider"
        />
        
        <div>
          <h3 className="section-title">Add New Stock</h3>
          <form onSubmit={handleSubmit} className="add-stock-form">
            <input 
              type="text" 
              value={newStock} 
              onChange={(e) => setNewStock(e.target.value)} 
              placeholder="Enter stock symbol" 
              className="stock-input"
            />
            <button type="submit" className="btn btn-primary">Add</button>
          </form>
        </div>
        
        <div>
          <h3 className="section-title">Select Stocks</h3>
          <button 
            onClick={toggleAllStocks}
            className="btn btn-secondary"
          >
            {selectedStocks.length === allStocks.length ? 'Deselect All' : 'Select All'}
          </button>
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
        </div>
      </div>
      
      <div className="graph-container" ref={graphContainerRef}>
        {loading ? (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            Loading correlation data...
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeRelSize={6}
            nodeLabel="name"
            nodeColor={nodeColor}
            linkWidth="width"
            linkColor="color"
            linkDirectionalArrowLength={0}
            linkCurvature={0.25}
            // Keep nodes within container
            onNodeDragEnd={(node) => {
              if (!graphContainerRef.current) return;
              
              const rect = graphContainerRef.current.getBoundingClientRect();
              const padding = 30;
              
              if (node.x < padding) node.x = padding;
              if (node.x > rect.width - padding) node.x = rect.width - padding;
              if (node.y < padding) node.y = padding;
              if (node.y > rect.height - padding) node.y = rect.height - padding;
            }}
            // Add labels to the links (correlation values)
            linkCanvasObjectMode={() => 'after'}
            linkCanvasObject={(link, ctx, globalScale) => {
              const start = link.source;
              const end = link.target;
              
              // Only proceed if source and target are proper objects
              if (!start || !end || typeof start.x !== 'number' || typeof end.x !== 'number') return;
              
              // Get the positions of source and target
              const x = start.x + (end.x - start.x) * 0.5;
              const y = start.y + (end.y - start.y) * 0.5;
              
              // Scale the font based on zoom level
              const fontSize = 12 / globalScale;
              
              // Format the correlation value
              const correlation = typeof link.value === 'number' ? link.value.toFixed(2) : link.value;
              
              // Draw the text
              ctx.font = `${fontSize}px 'Segoe UI', sans-serif`;
              ctx.fillStyle = 'black';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              
              // Background for better readability
              const textWidth = ctx.measureText(correlation).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
              
              ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.fillRect(
                x - bckgDimensions[0] / 2,
                y - bckgDimensions[1] / 2,
                bckgDimensions[0],
                bckgDimensions[1]
              );
              
              // Draw the text
              ctx.fillStyle = 'black';
              ctx.fillText(correlation, x, y);
            }}
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.id;
              const fontSize = 12/globalScale;
              ctx.font = `${fontSize}px 'Segoe UI', sans-serif`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

              // Draw node with slightly larger size
              ctx.fillStyle = nodeColor(node);
              ctx.beginPath();
              ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);
              ctx.fill();

              // Add a subtle shadow
              ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
              ctx.shadowBlur = 5;
              ctx.shadowOffsetX = 2;
              ctx.shadowOffsetY = 2;

              // Draw text background
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.fillRect(
                node.x - bckgDimensions[0] / 2,
                node.y - bckgDimensions[1] / 2,
                bckgDimensions[0],
                bckgDimensions[1]
              );

              // Reset shadow for text
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;

              // Draw text
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#2c3e50';
              ctx.fillText(label, node.x, node.y);
            }}
            cooldownTicks={100}
            onEngineStop={() => fgRef.current.zoomToFit(400)}
          />
        )}
      </div>
    </div>
  );
};

// Use URL parameters to get the correlation cutoff
const StockCorrelationGraphWithParams = () => {
  // Get cutoff from URL query parameter
  const getCorrelationCutoff = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const cutoff = parseFloat(urlParams.get('cutoff'));
      return !isNaN(cutoff) ? cutoff : 0.5; // Default to 0.5 if not specified
    }
    return 0.5;
  };

  return <StockCorrelationGraph correlationCutoff={getCorrelationCutoff()} />;
};

export default StockCorrelationGraphWithParams;