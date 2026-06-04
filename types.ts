/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Species = 'setosa' | 'versicolor' | 'virginica';

export interface IrisSample {
  id: number;
  sepalLength: number;
  sepalWidth: number;
  petalLength: number;
  petalWidth: number;
  species: Species;
}

export type AlgorithmType = 'knn' | 'decisionTree' | 'gemini';

export interface ClassificationResult {
  species: Species;
  confidence: number;
  algorithm: AlgorithmType;
  details: string;
  neighbors?: { sample: IrisSample; distance: number }[];
  decisionPath?: string[];
}

export type IrisFeature = 'sepalLength' | 'sepalWidth' | 'petalLength' | 'petalWidth';

export interface FeatureMeta {
  name: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
}
