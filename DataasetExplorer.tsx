/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { irisDataset, speciesMetadata } from '../data/irisDataset';
import { Species, IrisSample } from '../types';
import { Search, ChevronLeft, ChevronRight, BarChart3, ListFilter, HelpCircle } from 'lucide-react';

export const DatasetExplorer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState<'all' | Species>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<keyof IrisSample>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const itemsPerPage = 8;

  // Compute Averages per Species
  const stats = useMemo(() => {
    const summary: Record<string, {
      count: number;
      avgSL: number;
      avgSW: number;
      avgPL: number;
      avgPW: number;
    }> = {
      setosa: { count: 0, avgSL: 0, avgSW: 0, avgPL: 0, avgPW: 0 },
      versicolor: { count: 0, avgSL: 0, avgSW: 0, avgPL: 0, avgPW: 0 },
      virginica: { count: 0, avgSL: 0, avgSW: 0, avgPL: 0, avgPW: 0 },
    };

    irisDataset.forEach((sample) => {
      const s = summary[sample.species];
      s.count++;
      s.avgSL += sample.sepalLength;
      s.avgSW += sample.sepalWidth;
      s.avgPL += sample.petalLength;
      s.avgPW += sample.petalWidth;
    });

    Object.keys(summary).forEach((species) => {
      const s = summary[species];
      if (s.count > 0) {
        s.avgSL = parseFloat((s.avgSL / s.count).toFixed(2));
        s.avgSW = parseFloat((s.avgSW / s.count).toFixed(2));
        s.avgPL = parseFloat((s.avgPL / s.count).toFixed(2));
        s.avgPW = parseFloat((s.avgPW / s.count).toFixed(2));
      }
    });

    return summary;
  }, []);

  // Filter & Sort Dataset
  const processedData = useMemo(() => {
    let result = [...irisDataset];

    // Filter by Species
    if (speciesFilter !== 'all') {
      result = result.filter((item) => item.species === speciesFilter);
    }

    // Filter by Search Query
    if (searchTerm) {
      const query = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.id.toString().includes(query) ||
          item.sepalLength.toFixed(1).includes(query) ||
          item.sepalWidth.toFixed(1).includes(query) ||
          item.petalLength.toFixed(1).includes(query) ||
          item.petalWidth.toFixed(1).includes(query)
      );
    }

    // Sort Results
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (typeof aVal === 'string') {
        aVal = (aVal as string).toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [searchTerm, speciesFilter, sortField, sortDirection]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, currentPage]);

  const totalPages = Math.max(1, Math.ceil(processedData.length / itemsPerPage));

  // Handle pagination safety boundary
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSort = (field: keyof IrisSample) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6" id="dataset-explorer-section">
      {/* 1. Statistics Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {Object.entries(speciesMetadata).map(([key, meta]) => {
          const specStats = stats[key];
          return (
            <div key={key} className="bg-white/5 p-4 rounded-sm border border-white/5 hover:border-white/10 transition-all">
              <div className="flex items-center gap-2 mb-3">
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
                <h4 className="font-serif italic text-white text-sm">{meta.name}</h4>
                <span className="text-[10px] text-white/30 font-semibold font-mono ml-auto">N={specStats.count}</span>
              </div>
              <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs font-mono">
                <div>
                  <span className="text-white/30 block text-[8px] uppercase tracking-wider font-sans font-bold">Sepal L Avg</span>
                  <span className="font-bold font-mono text-white/80">{specStats.avgSL} cm</span>
                </div>
                <div>
                  <span className="text-white/30 block text-[8px] uppercase tracking-wider font-sans font-bold">Sepal W Avg</span>
                  <span className="font-bold font-mono text-white/80">{specStats.avgSW} cm</span>
                </div>
                <div>
                  <span className="text-white/30 block text-[8px] uppercase tracking-wider font-sans font-bold">Petal L Avg</span>
                  <span className="font-bold font-mono text-white/80">{specStats.avgPL} cm</span>
                </div>
                <div>
                  <span className="text-white/30 block text-[8px] uppercase tracking-wider font-sans font-bold">Petal W Avg</span>
                  <span className="font-bold font-mono text-white/80">{specStats.avgPW} cm</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Search & Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-transparent pb-4 border-b border-white/10">
        <div className="flex flex-wrap gap-2 items-center w-full md:w-auto">
          <button
            onClick={() => { setSpeciesFilter('all'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-sm text-xs font-semibold border transition-all ${
              speciesFilter === 'all'
                ? 'bg-white text-black border-white'
                : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10 hover:text-white'
            }`}
          >
            All Species
          </button>
          
          {Object.entries(speciesMetadata).map(([key, meta]) => (
            <button
              key={key}
              onClick={() => { setSpeciesFilter(key as Species); setCurrentPage(1); }}
              className="px-3 py-1.5 rounded-sm text-xs font-bold flex items-center gap-1.5 border transition-all"
              style={
                speciesFilter === key
                  ? { borderColor: meta.color, color: meta.color, backgroundColor: 'rgba(255,255,255,0.03)' }
                  : { borderColor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', backgroundColor: 'transparent' }
              }
            >
              <span className="h-1 w-1 rounded-full" style={{ backgroundColor: speciesFilter === key ? meta.color : 'rgba(255,255,255,0.4)' }} />
              {meta.name}
            </button>
          ))}
        </div>

        {/* Search tool */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Search measurements..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-white/5 border border-white/10 rounded-sm py-2 pl-9 pr-4 text-xs font-medium text-white outline-none focus:border-white/30 font-mono"
          />
        </div>
      </div>

      {/* 3. Table list */}
      <div className="bg-[#0a0b0d] rounded-sm border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/10 text-[#a8b8d0] text-[9px] uppercase tracking-widest font-bold font-mono">
                <th onClick={() => handleSort('id')} className="py-3 px-4 cursor-pointer hover:bg-white/5 hover:text-white transition whitespace-nowrap">
                  ID {sortField === 'id' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('sepalLength')} className="py-3 px-4 cursor-pointer hover:bg-white/5 hover:text-white transition whitespace-nowrap">
                  Sepal L (cm) {sortField === 'sepalLength' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('sepalWidth')} className="py-3 px-4 cursor-pointer hover:bg-white/5 hover:text-white transition whitespace-nowrap">
                  Sepal W (cm) {sortField === 'sepalWidth' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('petalLength')} className="py-3 px-4 cursor-pointer hover:bg-white/5 hover:text-white transition whitespace-nowrap">
                  Petal L (cm) {sortField === 'petalLength' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('petalWidth')} className="py-3 px-4 cursor-pointer hover:bg-white/5 hover:text-white transition whitespace-nowrap">
                  Petal W (cm) {sortField === 'petalWidth' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => handleSort('species')} className="py-3 px-4 cursor-pointer hover:bg-white/5 hover:text-white transition whitespace-nowrap">
                  Species {sortField === 'species' && (sortDirection === 'asc' ? '▲' : '▼')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/75 text-xs font-mono">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-white/30">#{item.id}</td>
                    <td className="py-3.5 px-4">{item.sepalLength.toFixed(1)}</td>
                    <td className="py-3.5 px-4">{item.sepalWidth.toFixed(1)}</td>
                    <td className="py-3.5 px-4">{item.petalLength.toFixed(1)}</td>
                    <td className="py-3.5 px-4">{item.petalWidth.toFixed(1)}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase tracking-wider border font-sans"
                        style={{
                          backgroundColor: 'rgba(255,255,255,0.02)',
                          borderColor: `${speciesMetadata[item.species].color}40`,
                          color: speciesMetadata[item.species].color,
                        }}
                      >
                        <span className="h-1 w-1 rounded-full" style={{ backgroundColor: speciesMetadata[item.species].color }} />
                        {speciesMetadata[item.species].name}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-white/30">
                    No specimens match your search queries.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="bg-[#121418] py-3.5 px-4 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-white/40">
              Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(processedData.length, currentPage * itemsPerPage)} of {processedData.length} specimens
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1 px-2.5 bg-white/5 border border-white/10 rounded-sm text-white/60 disabled:opacity-30 select-none hover:bg-white/10 hover:text-white font-bold transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5 inline mr-0.5" /> Prev
              </button>
              <span className="font-semibold text-white/70 font-mono">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-1 px-2.5 bg-white/5 border border-white/10 rounded-sm text-white/60 disabled:opacity-30 select-none hover:bg-white/10 hover:text-white font-bold transition-all"
              >
                Next <ChevronRight className="h-3.5 w-3.5 inline ml-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
