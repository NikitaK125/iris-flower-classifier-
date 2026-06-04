/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { irisDataset, featureMetadata } from '../data/irisDataset';
import { Species, ClassificationResult, IrisSample } from '../types';

/**
 * Normalizes a value between 0 and 1 using featureMetadata limits
 */
function normalize(val: number, feature: 'sepalLength' | 'sepalWidth' | 'petalLength' | 'petalWidth'): number {
  const { min, max } = featureMetadata[feature];
  return (val - min) / (max - min);
}

/**
 * Computes Euclidean distance in normalized 4D space
 */
function computeDistance(s1: { sepalLength: number; sepalWidth: number; petalLength: number; petalWidth: number }, s2: IrisSample): number {
  const dl = normalize(s1.sepalLength, 'sepalLength') - normalize(s2.sepalLength, 'sepalLength');
  const dw = normalize(s1.sepalWidth, 'sepalWidth') - normalize(s2.sepalWidth, 'sepalWidth');
  const dpl = normalize(s1.petalLength, 'petalLength') - normalize(s2.petalLength, 'petalLength');
  const dpw = normalize(s1.petalWidth, 'petalWidth') - normalize(s2.petalWidth, 'petalWidth');
  
  return Math.sqrt(dl * dl + dw * dw + dpl * dpl + dpw * dpw);
}

/**
 * Classifies using K-Nearest Neighbors (KNN)
 */
export function classifyKNN(
  input: { sepalLength: number; sepalWidth: number; petalLength: number; petalWidth: number },
  k: number = 5
): ClassificationResult {
  // Compute distance to all items in dataset
  const distances = irisDataset.map((sample) => ({
    sample,
    distance: computeDistance(input, sample),
  }));

  // Sort by ascending distance
  distances.sort((a, b) => a.distance - b.distance);

  // Take top K
  const nearest = distances.slice(0, k);

  // Tally votes
  const votes: Record<Species, number> = { setosa: 0, versicolor: 0, virginica: 0 };
  nearest.forEach(({ sample }) => {
    votes[sample.species]++;
  });

  // Find winner
  let winner: Species = 'setosa';
  let maxVotes = -1;
  const speciesList: Species[] = ['setosa', 'versicolor', 'virginica'];
  speciesList.forEach((species) => {
    if (votes[species] > maxVotes) {
      maxVotes = votes[species];
      winner = species;
    }
  });

  const confidence = maxVotes / k;
  const neighborReports = nearest.map(
    (n) => `Neighbor #${n.sample.id} (${n.sample.species}): distance = ${n.distance.toFixed(3)}`
  );

  const details = `Of the ${k} nearest neighbors in normalized 4D space:\n` +
    `- ${votes.setosa} are Setosa\n` +
    `- ${votes.versicolor} are Versicolor\n` +
    `- ${votes.virginica} are Virginica\n\n` +
    `Detailed breakdown:\n${neighborReports.join('\n')}`;

  return {
    species: winner,
    confidence,
    algorithm: 'knn',
    details,
    neighbors: nearest,
  };
}

/**
 * Classifies using a standard trained ID3/C4.5 Decision Tree
 */
export function classifyDecisionTree(input: {
  sepalLength: number;
  sepalWidth: number;
  petalLength: number;
  petalWidth: number;
}): ClassificationResult {
  const path: string[] = [];
  let species: Species = 'setosa';
  let confidence = 1.0;

  const { petalLength, petalWidth, sepalLength } = input;

  if (petalLength < 2.45) {
    path.push(`Petal Length (${petalLength.toFixed(1)} cm) < 2.45 cm`);
    species = 'setosa';
    confidence = 1.0; // Setosas are perfectly separated in this branch
    path.push('Result Leaf Node: 100% Setosa');
  } else {
    path.push(`Petal Length (${petalLength.toFixed(1)} cm) ≥ 2.45 cm`);
    
    if (petalWidth < 1.75) {
      path.push(`Petal Width (${petalWidth.toFixed(1)} cm) < 1.75 cm`);
      
      if (petalLength < 4.95) {
        path.push(`Petal Length (${petalLength.toFixed(1)} cm) < 4.95 cm`);
        species = 'versicolor';
        confidence = 0.97; // 47/48 samples in this branch are Versicolor
        path.push('Result Leaf Node: 97% Versicolor, 3% Virginica');
      } else {
        path.push(`Petal Length (${petalLength.toFixed(1)} cm) ≥ 4.95 cm`);
        
        if (petalWidth < 1.55) {
          path.push(`Petal Width (${petalWidth.toFixed(1)} cm) < 1.55 cm`);
          species = 'virginica';
          confidence = 0.90; // Rare boundary cases
          path.push('Result Leaf Node: 90% Virginica, 10% Versicolor');
        } else {
          path.push(`Petal Width (${petalWidth.toFixed(1)} cm) ≥ 1.55 cm`);
          species = 'versicolor';
          confidence = 0.67; // Highly overlapping boundary
          path.push('Result Leaf Node (Boundary overlap): 67% Versicolor, 33% Virginica');
        }
      }
    } else {
      path.push(`Petal Width (${petalWidth.toFixed(1)} cm) ≥ 1.75 cm`);
      
      if (petalLength >= 4.85) {
        path.push(`Petal Length (${petalLength.toFixed(1)} cm) ≥ 4.85 cm`);
        species = 'virginica';
        confidence = 0.98; // 43/44 in this branch are Virginica
        path.push('Result Leaf Node: 98% Virginica, 2% Versicolor');
      } else {
        path.push(`Petal Length (${petalLength.toFixed(1)} cm) < 4.85 cm`);
        
        if (sepalLength < 6.0) {
          path.push(`Sepal Length (${sepalLength.toFixed(1)} cm) < 6.0 cm`);
          species = 'versicolor';
          confidence = 0.80; // Boundary mixed
          path.push('Result Leaf Node: 80% Versicolor');
        } else {
          path.push(`Sepal Length (${sepalLength.toFixed(1)} cm) ≥ 6.0 cm`);
          species = 'virginica';
          confidence = 0.90;
          path.push('Result Leaf Node: 90% Virginica');
        }
      }
    }
  }

  const details = `Decision path traversed:\n${path.map((p, index) => `${index + 1}. ${p}`).join('\n')}`;

  return {
    species,
    confidence,
    algorithm: 'decisionTree',
    details,
    decisionPath: path,
  };
}
