/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Species, ClassificationResult } from '../types';
import { speciesMetadata } from '../data/irisDataset';
import { Award, Leaf, Flame, Sparkles, HelpCircle } from 'lucide-react';

interface ClassificationCardProps {
  result: ClassificationResult | null;
  isLoading: boolean;
  algorithm: string;
}

export const ClassificationCard: React.FC<ClassificationCardProps> = ({
  result,
  isLoading,
  algorithm,
}) => {
  if (isLoading) {
    return (
      <div className="bg-[#121418]/60 backdrop-blur-md rounded-sm p-10 border border-white/5 flex flex-col items-center justify-center min-h-[320px] shadow-sm animate-pulse">
        <div className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center mb-4">
          <div className="w-2 h-2 bg-white rounded-full animate-ping"></div>
        </div>
        <p className="text-white/60 text-xs font-bold uppercase tracking-widest">DR. FLORA IS ANALYZING THE SPECIMEN MATRIX...</p>
        <p className="text-[10px] text-white/30 font-mono mt-1.5 uppercase tracking-wider">
          Running {algorithm === 'gemini' ? 'Gemini 3.5 AI inference' : 'high-speed local kernel'}...
        </p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-[#121418]/40 backdrop-blur-sm rounded-sm p-10 border border-white/5 flex flex-col items-center justify-center min-h-[320px] text-center">
        <Leaf className="h-8 w-8 text-white/20 mb-4 animate-pulse" />
        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1.5">No prediction yet</p>
        <p className="text-xs text-white/30 max-w-sm mx-auto leading-relaxed">
          Adjust the slides on the left pane and see the projection changes live, or query Gemini for botanical diagnostics.
        </p>
      </div>
    );
  }

  const { species, confidence, details } = result;
  const meta = speciesMetadata[species];

  const getAlgoBadgeName = () => {
    switch (result.algorithm) {
      case 'knn': return 'KNN Clustering';
      case 'decisionTree': return 'C4.5 Decision Tree';
      case 'gemini': return 'Gemini 3.5 Flash';
      default: return result.algorithm;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      id="classification-result-card"
      className="bg-gradient-to-br from-[#1a1c20] to-[#0a0b0d] rounded-sm p-6 sm:p-8 border border-white/10 relative overflow-hidden flex flex-col justify-between"
    >
      {/* Background elegant watermark */}
      <div className="absolute top-0 right-0 p-4 opacity-5 font-serif text-[12rem] leading-none pointer-events-none select-none">
        {meta.name[0]}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6 mb-6 relative z-10">
        <div className="space-y-2">
          <span className="text-[9px] uppercase tracking-[0.3em] text-[#6d7b8d] font-mono leading-none block">
            Classification Result // Predicted by {getAlgoBadgeName()}
          </span>
          <h2 className="text-4xl md:text-5xl font-serif text-white leading-none">
            Iris {meta.name}
          </h2>
          <p className="text-xs text-white/40 italic font-serif">
            {meta.scientificName}
          </p>
        </div>

        {/* Confidence indicators in Sophisticated design */}
        <div className="flex gap-8">
          <div className="border-l border-white/10 pl-4 flex flex-col justify-between py-1 min-w-[100px]">
            <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Confidence</p>
            <div className="text-3xl font-light text-white font-mono leading-tight">
              {(confidence).toFixed(3)}
            </div>
            <div className="h-px w-full bg-white/10 mt-1 structure-bar">
              <div className="h-full bg-white/50" style={{ width: `${confidence * 100}%` }}></div>
            </div>
          </div>

          <div className="border-l border-white/10 pl-4 flex flex-col justify-between py-1 min-w-[100px]">
            <p className="text-[9px] uppercase tracking-widest text-white/30 font-bold">Diagnosis</p>
            <div className="text-sm font-semibold uppercase tracking-wider text-[#a8b8d0] leading-tight pt-1">
              {confidence >= 0.9 ? 'Extreme' : confidence >= 0.7 ? 'High Match' : 'Boundary'}
            </div>
            <p className="text-[9px] text-white/20 uppercase tracking-widest">Optimized</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        <div className="space-y-6">
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#a8b8d0] mb-2">Botanical Character Profile</h3>
            <p className="text-xs text-white/50 leading-relaxed font-sans">{meta.description}</p>
          </div>

          <div className="bg-white/5 p-4 rounded-sm border border-white/5">
            <div className="flex items-center gap-1.5 text-white/80 font-bold text-[10px] uppercase tracking-wider mb-1.5">
              <Sparkles className="h-3 w-3 text-white/60" />
              <span>Taxonomic Fun Fact</span>
            </div>
            <p className="text-xs text-white/40 italic leading-relaxed">"{meta.funFact}"</p>
          </div>
        </div>

        <div className="space-y-6 border-t md:border-t-0 md:border-l border-white/10 md:pl-8 pt-4 md:pt-0">
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#a8b8d0] mb-2">Morphological Marker</h4>
            <div className="flex items-start gap-2.5">
              <span className="inline-block p-1 bg-white/5 text-white/80 border border-white/10 rounded-sm mt-0.5">
                <Leaf className="h-3 w-3" />
              </span>
              <p className="text-xs text-white/40 leading-relaxed font-sans">{meta.distinctiveFeature}</p>
            </div>
          </div>

          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#a8b8d0] mb-2">Primary Ecological Habitat</h4>
            <div className="flex items-start gap-2.5">
              <span className="inline-block p-1 bg-white/5 text-white/80 border border-white/10 rounded-sm mt-0.5">
                <HelpCircle className="h-3 w-3" />
              </span>
              <p className="text-xs text-white/40 leading-relaxed font-sans">{meta.habitat}</p>
            </div>
          </div>

          {result.algorithm === 'gemini' && (
            <div className="border-t border-white/10 pt-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#a8b8d0] mb-2">Dr. Flora's Deep Botanical Insights</h4>
              <p className="text-xs text-white/50 leading-relaxed bg-white/5 p-3 rounded-sm border border-white/5">
                {result.details}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
