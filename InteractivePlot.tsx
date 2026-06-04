/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { irisDataset, featureMetadata, speciesMetadata } from '../data/irisDataset';
import { IrisFeature, IrisSample, ClassificationResult } from '../types';
import { HelpCircle, Layers, ZoomIn, Info } from 'lucide-react';

interface InteractivePlotProps {
  input: {
    sepalLength: number;
    sepalWidth: number;
    petalLength: number;
    petalWidth: number;
  };
  onInputChange: (feature: IrisFeature, value: number) => void;
  result: ClassificationResult | null;
}

export const InteractivePlot: React.FC<InteractivePlotProps> = ({
  input,
  onInputChange,
  result,
}) => {
  const [xAxis, setXAxis] = useState<IrisFeature>('petalLength');
  const [yAxis, setYAxis] = useState<IrisFeature>('petalWidth');
  const [hoveredSample, setHoveredSample] = useState<IrisSample | null>(null);
  const [hoveredCoords, setHoveredCoords] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [plotDims, setPlotDims] = useState({ width: 500, height: 350 });

  // Handle dynamic SVG resizing using ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const targetHeight = Math.max(300, Math.floor(width * 0.65));
        setPlotDims({
          width: Math.max(280, width),
          height: Math.min(420, targetHeight),
        });
      }
    });

    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const xMeta = featureMetadata[xAxis];
  const yMeta = featureMetadata[yAxis];

  const padding = { top: 30, right: 30, bottom: 50, left: 55 };

  // Helper scaling values
  const xScale = useMemo(() => {
    const min = xMeta.min - 0.2;
    const max = xMeta.max + 0.2;
    const scaleWidth = plotDims.width - padding.left - padding.right;
    return {
      toPixel: (val: number) => padding.left + ((val - min) / (max - min)) * scaleWidth,
      toValue: (pixel: number) => min + ((pixel - padding.left) / scaleWidth) * (max - min),
      min,
      max,
    };
  }, [xAxis, plotDims.width, xMeta.min, xMeta.max]);

  const yScale = useMemo(() => {
    const min = yMeta.min - 0.2;
    const max = yMeta.max + 0.2;
    const scaleHeight = plotDims.height - padding.top - padding.bottom;
    // SVGs draw from top down
    return {
      toPixel: (val: number) => plotDims.height - padding.bottom - ((val - min) / (max - min)) * scaleHeight,
      toValue: (pixel: number) => min + ((plotDims.height - padding.bottom - pixel) / scaleHeight) * (max - min),
      min,
      max,
    };
  }, [yAxis, plotDims.height, yMeta.min, yMeta.max]);

  // Handle click on plot to set dimensions
  const handlePlotClick = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check if within graph bounds
    if (
      clickX >= padding.left &&
      clickX <= plotDims.width - padding.right &&
      clickY >= padding.top &&
      clickY <= plotDims.height - padding.bottom
    ) {
      const xVal = Math.max(xMeta.min, Math.min(xMeta.max, parseFloat(xScale.toValue(clickX).toFixed(1))));
      const yVal = Math.max(yMeta.min, Math.min(yMeta.max, parseFloat(yScale.toValue(clickY).toFixed(1))));

      onInputChange(xAxis, xVal);
      onInputChange(yAxis, yVal);
    }
  };

  // Get current user dimension values representing our test query
  const userX = input[xAxis];
  const userY = input[yAxis];

  const userPixelX = xScale.toPixel(userX);
  const userPixelY = yScale.toPixel(userY);

  // Generate ticks for axises
  const xTicks = useMemo(() => {
    const ticks = [];
    const step = xAxis.includes('Width') ? 0.5 : 1.0;
    const start = Math.ceil(xScale.min);
    const end = Math.floor(xScale.max);
    for (let t = start; t <= end; t += step) {
      ticks.push(t);
    }
    return ticks;
  }, [xAxis, xScale.min, xScale.max]);

  const yTicks = useMemo(() => {
    const ticks = [];
    const step = yAxis.includes('Width') ? 0.5 : 1.0;
    const start = Math.ceil(yScale.min);
    const end = Math.floor(yScale.max);
    for (let t = start; t <= end; t += step) {
      ticks.push(t);
    }
    return ticks;
  }, [yAxis, yScale.min, yScale.max]);

  return (
    <div className="bg-transparent p-1 flex flex-col h-full" id="interactive-plot-card">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-white/10">
        <div>
          <h3 className="font-serif italic text-white text-lg flex items-center gap-2">
            <Layers className="h-4 w-4 text-white/60" />
            Decision Space Projection
          </h3>
          <p className="text-xs text-white/40 mt-1">
            Real dataset distribution, showing classification and neighbors. Click inside the grid to reposition your specimen!
          </p>
        </div>

        {/* Dropdown selectors for X/Y */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1 font-mono">X-Axis</label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value as IrisFeature)}
              className="bg-[#121418] border border-white/15 rounded-sm text-xs font-semibold p-1 px-2.5 text-white outline-none focus:border-white/40"
            >
              {Object.keys(featureMetadata).map((key) => (
                <option key={key} value={key}>
                  {featureMetadata[key as IrisFeature].label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="text-[9px] font-bold text-white/30 uppercase tracking-widest mb-1 font-mono">Y-Axis</label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value as IrisFeature)}
              className="bg-[#121418] border border-white/15 rounded-sm text-xs font-semibold p-1 px-2.5 text-white outline-none focus:border-white/40"
            >
              {Object.keys(featureMetadata).map((key) => (
                <option key={key} value={key}>
                  {featureMetadata[key as IrisFeature].label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main interactive SVG Container */}
      <div ref={containerRef} className="flex-1 min-h-[300px] relative w-full bg-[#0a0b0d] rounded-sm border border-white/5 p-1">
        <svg
          width={plotDims.width}
          height={plotDims.height}
          onClick={handlePlotClick}
          className="cursor-crosshair overflow-visible select-none max-w-full"
        >
          {/* Grid lines */}
          {xTicks.map((tick) => (
            <line
              key={`grid-x-${tick}`}
              x1={xScale.toPixel(tick)}
              y1={padding.top}
              x2={xScale.toPixel(tick)}
              y2={plotDims.height - padding.bottom}
              stroke="#1b1c21"
              strokeWidth="1"
            />
          ))}
          {yTicks.map((tick) => (
            <line
              key={`grid-y-${tick}`}
              x1={padding.left}
              y1={yScale.toPixel(tick)}
              x2={plotDims.width - padding.right}
              y2={yScale.toPixel(tick)}
              stroke="#1b1c21"
              strokeWidth="1"
            />
          ))}

          {/* Axes lines with partial opacity */}
          <line
            x1={padding.left}
            y1={plotDims.height - padding.bottom}
            x2={plotDims.width - padding.right}
            y2={plotDims.height - padding.bottom}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
          />
          <line
            x1={padding.left}
            y1={padding.top}
            x2={padding.left}
            y2={plotDims.height - padding.bottom}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="1.5"
          />

          {/* X ticks labels */}
          {xTicks.map((tick) => (
            <g key={`lbl-x-${tick}`}>
              <line
                x1={xScale.toPixel(tick)}
                y1={plotDims.height - padding.bottom}
                x2={xScale.toPixel(tick)}
                y2={plotDims.height - padding.bottom + 4}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.5"
              />
              <text
                x={xScale.toPixel(tick)}
                y={plotDims.height - padding.bottom + 16}
                fill="rgba(255,255,255,0.4)"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Y ticks labels */}
          {yTicks.map((tick) => (
            <g key={`lbl-y-${tick}`}>
              <line
                x1={padding.left - 4}
                y1={yScale.toPixel(tick)}
                x2={padding.left}
                y2={yScale.toPixel(tick)}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.5"
              />
              <text
                x={padding.left - 8}
                y={yScale.toPixel(tick) + 3}
                fill="rgba(255,255,255,0.4)"
                fontSize="10"
                fontFamily="monospace"
                textAnchor="end"
              >
                {tick}
              </text>
            </g>
          ))}

          {/* Axes Titles */}
          <text
            x={padding.left + (plotDims.width - padding.left - padding.right) / 2}
            y={plotDims.height - 12}
            fill="rgba(255,255,255,0.6)"
            fontSize="10"
            fontFamily="sans-serif"
            fontWeight="bold"
            letterSpacing="0.1em"
            textAnchor="middle"
          >
            {xMeta.label.toUpperCase()} ({xMeta.unit})
          </text>

          <text
            transform={`rotate(-90, 16, ${padding.top + (plotDims.height - padding.top - padding.bottom) / 2})`}
            x={16}
            y={padding.top + (plotDims.height - padding.top - padding.bottom) / 2}
            fill="rgba(255,255,255,0.6)"
            fontSize="10"
            fontFamily="sans-serif"
            fontWeight="bold"
            letterSpacing="0.1em"
            textAnchor="middle"
          >
            {yMeta.label.toUpperCase()} ({yMeta.unit})
          </text>

          {/* Draw connecting lines to K-nearest neighbors if KNN used and available */}
          {result && result.algorithm === 'knn' && result.neighbors && (
            <g>
              {result.neighbors.map(({ sample }, idx) => {
                const samplePxX = xScale.toPixel(sample[xAxis]);
                const samplePxY = yScale.toPixel(sample[yAxis]);
                return (
                  <line
                    key={`nn-line-${sample.id}-${idx}`}
                    x1={userPixelX}
                    y1={userPixelY}
                    x2={samplePxX}
                    y2={samplePxY}
                    stroke="rgba(255,255,255,0.4)"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                    opacity="0.6"
                  />
                );
              })}
            </g>
          )}

          {/* Standard background data points */}
          {irisDataset.map((sample) => {
            const sx = sample[xAxis];
            const sy = sample[yAxis];
            const px = xScale.toPixel(sx);
            const py = yScale.toPixel(sy);
            const color = speciesMetadata[sample.species].color;

            // Highlight if is one of neighbors
            const isNeighb = result?.algorithm === 'knn' && result.neighbors?.some((n) => n.sample.id === sample.id);

            return (
              <circle
                key={`point-${sample.id}`}
                cx={px}
                cy={py}
                r={isNeighb ? 7 : 4}
                fill={color}
                stroke={isNeighb ? '#ffffff' : '#0a0b0d'}
                strokeWidth={isNeighb ? 1.5 : 0.8}
                opacity={isNeighb ? '1.0' : hoveredSample?.id === sample.id ? '1.0' : '0.6'}
                className="transition-all duration-300 pointer-events-auto"
                onMouseEnter={(e) => {
                  setHoveredSample(sample);
                  setHoveredCoords({ x: px, y: py });
                }}
                onMouseLeave={() => {
                  setHoveredSample(null);
                  setHoveredCoords(null);
                }}
              />
            );
          })}

          {/* User's Specimen interactive point */}
          <g>
            {/* outer halo wave animation */}
            <circle
              cx={userPixelX}
              cy={userPixelY}
              r="22"
              fill={result ? speciesMetadata[result.species].color : '#475569'}
              opacity="0.15"
              className="animate-ping"
              style={{ transformOrigin: `${userPixelX}px ${userPixelY}px` }}
            />
            {/* outer border point */}
            <circle
              cx={userPixelX}
              cy={userPixelY}
              r="8"
              fill={result ? speciesMetadata[result.species].color : '#475569'}
              stroke="#ffffff"
              strokeWidth="2"
            />
            {/* inner pin point */}
            <circle cx={userPixelX} cy={userPixelY} r="3.5" fill="#0a0b0d" />
          </g>
        </svg>

        {/* Hover Tooltip display */}
        {hoveredSample && hoveredCoords && (
          <div
            className="absolute z-30 bg-[#121418] text-white p-2.5 rounded-sm text-[11px] shadow-xl pointer-events-none border border-white/10"
            style={{
              left: `${Math.min(plotDims.width - 150, hoveredCoords.x + 12)}px`,
              top: `${Math.min(plotDims.height - 110, hoveredCoords.y - 12)}px`,
            }}
          >
            <p className="font-serif italic tracking-wide flex items-center gap-1.5" style={{ color: speciesMetadata[hoveredSample.species].color }}>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: speciesMetadata[hoveredSample.species].color }} />
              {speciesMetadata[hoveredSample.species].name}
            </p>
            <p className="text-white/40 mt-1 uppercase text-[9px] tracking-wider">Sample: #{hoveredSample.id}</p>
            <p className="font-mono mt-0.5 text-white/60">
              {xMeta.label}: {hoveredSample[xAxis].toFixed(1)} cm
            </p>
            <p className="font-mono text-white/60">
              {yMeta.label}: {hoveredSample[yAxis].toFixed(1)} cm
            </p>
          </div>
        )}
      </div>

      {/* Legend and indicators */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-white/10">
        <div className="flex flex-wrap gap-4 items-center">
          {Object.entries(speciesMetadata).map(([key, meta]) => (
            <div key={key} className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
              <span className="h-2 w-2 rounded-full border border-white/10" style={{ backgroundColor: meta.color }} />
              <span>{meta.name}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 text-xs font-semibold text-white/50">
            <span className="h-3 w-3 rounded-full border border-dashed border-white/30 bg-white/5 flex items-center justify-center text-[9px]">◎</span>
            <span>Query Specimen</span>
          </div>
        </div>

        <div className="text-[9px] uppercase tracking-widest bg-white/5 font-bold p-1 px-2.5 rounded-sm text-white/40 border border-white/5 inline-flex items-center gap-1">
          <Info className="h-3 w-3" />
          <span>Click plot to reposition</span>
        </div>
      </div>
    </div>
  );
};
