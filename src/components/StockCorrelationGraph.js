import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import './StockCorrelationGraph.css';
import { getCorrelations } from '../services/api.js';

const StockCorrelationGraph = ({ correlationCutoff = 0.5, allStocks, selectedStocks }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
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
        const stock_correlations = await getCorrelations(stockList, stockList);
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

  // Process the correlation data into nodes and links
  const processCorrelationData = (data, selectedStocks, cutoff) => {
    const nodes = selectedStocks.map(ticker => ({
      id: ticker,
      name: ticker,
      val: 1
    }));
    
    const links = [];

    // Extract valid links based on correlation cutoff
    data.forEach(item => {
      const source = item.ticker;
      const target = item.compared_ticker;
      const correlation = item.data;
      
      // Only include links between different stocks (avoid self-connections)
      // and only if both stocks are in the selected list
      if (source !== target && 
          selectedStocks.includes(source) && 
          selectedStocks.includes(target)) {
        
        // Only add links for correlations that meet the cutoff threshold
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
              color: correlation < 0 ? 'rgba(255,0,0,0.6)' : 'rgba(0,128,0,0.6)',
              // Set link width based on correlation strength (not too thick)
              width: Math.abs(correlation) * 1.5
            });
          }
        }
      }
    });

    return { nodes, links };
  };

  // Color nodes a consistent blue
  const nodeColor = () => '#3498db';
  
  // When the component mounts, configure the force simulation
  useEffect(() => {
    if (fgRef.current && graphData.nodes.length > 0) {
      // Increase repulsion between nodes to prevent clustering
      const chargeForce = fgRef.current.d3Force('charge');
      if (chargeForce) {
        chargeForce.strength(-120);
      }
      
      // Instead of collision force, we'll use stronger repulsion and more distance
      // Adjust the link distance to keep nodes more separated
      const linkForce = fgRef.current.d3Force('link');
      if (linkForce) {
        linkForce.distance(80); // Keep nodes at a good distance
      }
      
      // Perform initial zoom-to-fit with a delay to ensure proper rendering
      setTimeout(() => {
        if (fgRef.current) {
          fgRef.current.zoomToFit(400);
        }
      }, 500);
    }
  }, [graphData.nodes.length]);

  // Disable automatic zoom after user interaction
  const [userInteracted, setUserInteracted] = useState(false);
  
  const handleNodeDrag = () => {
    setUserInteracted(true);
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
        <p className="mt-2 text-muted">
          Only connections with correlation magnitude ≥ {correlationCutoff} are shown.
          Green lines indicate positive correlation, red lines indicate negative correlation.
        </p>
      </div>
      
      <div className="graph-container" ref={graphContainerRef}>
        {loading ? (
          <div className="loading-indicator">
            <div className="loading-spinner"></div>
            Loading correlation data...
          </div>
        ) : selectedStocks.length === 0 ? (
          <div className="no-data-message">
            Please select at least one stock to display the correlation graph
          </div>
        ) : (
          <ForceGraph2D
            ref={fgRef}
            graphData={graphData}
            nodeRelSize={6}     // Increased node size for better visibility
            nodeLabel="name"
            nodeColor={nodeColor}
            linkWidth="width"
            linkColor="color"
            linkCurvature={0.1}  // Slight curve for visibility
            cooldownTicks={100}
            onNodeDrag={handleNodeDrag}
            
            // Custom node rendering with proper size
            nodeCanvasObject={(node, ctx, globalScale) => {
              const label = node.id;
              const fontSize = 12/globalScale;
              ctx.font = `${fontSize}px 'Segoe UI', sans-serif`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);
            
              // Draw node with better size
              ctx.fillStyle = nodeColor(node);
              ctx.beginPath();
              ctx.arc(node.x, node.y, 6, 0, 2 * Math.PI, false);  // Increased size to match nodeRelSize
              ctx.fill();
            
              // Draw text background with a slight offset to avoid overlap with the node
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.fillRect(
                node.x - bckgDimensions[0] / 2,
                node.y - bckgDimensions[1] / 2 - 12, // Place the label above the node
                bckgDimensions[0],
                bckgDimensions[1]
              );
            
              // Draw text
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#2c3e50';
              ctx.fillText(label, node.x, node.y - 12); // Position text in the background
            }}
            
            // Custom link labels with improved appearance
            linkCanvasObjectMode={() => 'after'}
            linkCanvasObject={(link, ctx, globalScale) => {
              // Only draw labels if we have valid source and target
              if (!link.source || !link.target || 
                  typeof link.source.x !== 'number' || 
                  typeof link.target.x !== 'number') return;
              
              // Calculate position for the label (midpoint of the link)
              const x = link.source.x + (link.target.x - link.source.x) * 0.5;
              const y = link.source.y + (link.target.y - link.source.y) * 0.5;
              
              // Adjust font size based on zoom level - keep it smaller
              const fontSize = 10 / globalScale;
              
              // Format the correlation value with 2 decimal places
              const correlation = typeof link.value === 'number' ? 
                link.value.toFixed(2) : link.value;
              
              // Draw label with subtle background
              ctx.font = `${fontSize}px Arial`;
              const textWidth = ctx.measureText(correlation).width;
              const padding = fontSize * 0.3;
              const bgWidth = textWidth + padding * 2;
              const bgHeight = fontSize + padding;
              
              // Draw background with subtle appearance
              ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
              ctx.fillRect(
                x - bgWidth / 2,
                y - bgHeight / 2,
                bgWidth,
                bgHeight
              );
              
              // Draw correlation value
              ctx.fillStyle = link.value < 0 ? '#d63031' : '#27ae60';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(correlation, x, y);
            }}
            
            // Only zoom to fit on initial render, not after user interaction
            onEngineStop={() => {
              if (fgRef.current && !userInteracted) {
                fgRef.current.zoomToFit(400, 50);
              }
            }}
          />
        )}
      </div>
      
      <div className="mt-3 text-muted">
        <p><small>Drag nodes to adjust the layout. Drag the background to pan, scroll to zoom.</small></p>
      </div>
    </div>
  );
};

export default StockCorrelationGraph;