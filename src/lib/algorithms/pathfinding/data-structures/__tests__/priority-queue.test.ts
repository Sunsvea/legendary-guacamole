/**
 * Comprehensive unit tests for PriorityQueue data structure
 * Tests enqueue, dequeue, isEmpty, and contains operations
 * for A* pathfinding algorithm implementation
 */

import PriorityQueue from '../priority-queue';
import { PathfindingNode, Coordinate } from '@/types/route';

describe('PriorityQueue', () => {
  let queue: PriorityQueue;

  beforeEach(() => {
    queue = new PriorityQueue();
  });

  describe('constructor', () => {
    it('creates empty queue', () => {
      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe('enqueue', () => {
    it('adds single node to empty queue', () => {
      const node: PathfindingNode = {
        coordinate: { lat: 47.0000, lng: 8.0000, elevation: 1000 },
        gCost: 5,
        hCost: 10,
        fCost: 15
      };

      queue.enqueue(node);

      expect(queue.isEmpty()).toBe(false);
    });

    it('maintains order by fCost (ascending)', () => {
      const highCostNode: PathfindingNode = {
        coordinate: { lat: 47.0000, lng: 8.0000 },
        gCost: 10,
        hCost: 20,
        fCost: 30
      };

      const lowCostNode: PathfindingNode = {
        coordinate: { lat: 47.0010, lng: 8.0010 },
        gCost: 2,
        hCost: 3,
        fCost: 5
      };

      const mediumCostNode: PathfindingNode = {
        coordinate: { lat: 47.0005, lng: 8.0005 },
        gCost: 8,
        hCost: 7,
        fCost: 15
      };

      // Add in random order
      queue.enqueue(highCostNode);
      queue.enqueue(lowCostNode);
      queue.enqueue(mediumCostNode);

      // Should dequeue in fCost order (lowest first)
      expect(queue.dequeue()).toBe(lowCostNode);
      expect(queue.dequeue()).toBe(mediumCostNode);
      expect(queue.dequeue()).toBe(highCostNode);
    });

    it('handles nodes with equal fCost', () => {
      const node1: PathfindingNode = {
        coordinate: { lat: 47.0000, lng: 8.0000 },
        gCost: 5,
        hCost: 5,
        fCost: 10
      };

      const node2: PathfindingNode = {
        coordinate: { lat: 47.0010, lng: 8.0010 },
        gCost: 3,
        hCost: 7,
        fCost: 10
      };

      queue.enqueue(node1);
      queue.enqueue(node2);

      // Both should be dequeued (order doesn't matter for equal fCost)
      const first = queue.dequeue();
      const second = queue.dequeue();

      expect([node1, node2]).toContain(first);
      expect([node1, node2]).toContain(second);
      expect(first).not.toBe(second);
    });

    it('adds many nodes and maintains order', () => {
      const nodes: PathfindingNode[] = [];
      const costs = [50, 10, 30, 5, 25, 15, 40, 20];

      costs.forEach((cost, index) => {
        const node: PathfindingNode = {
          coordinate: { lat: 47.0000 + index * 0.001, lng: 8.0000 + index * 0.001 },
          gCost: cost / 2,
          hCost: cost / 2,
          fCost: cost
        };
        nodes.push(node);
        queue.enqueue(node);
      });

      // Should dequeue in ascending fCost order
      const sortedCosts = [...costs].sort((a, b) => a - b);
      sortedCosts.forEach(expectedCost => {
        const dequeuedNode = queue.dequeue();
        expect(dequeuedNode?.fCost).toBe(expectedCost);
      });
    });

    it('handles nodes with zero costs', () => {
      const zeroCostNode: PathfindingNode = {
        coordinate: { lat: 47.0000, lng: 8.0000 },
        gCost: 0,
        hCost: 0,
        fCost: 0
      };

      const positiveCostNode: PathfindingNode = {
        coordinate: { lat: 47.0010, lng: 8.0010 },
        gCost: 1,
        hCost: 1,
        fCost: 2
      };

      queue.enqueue(positiveCostNode);
      queue.enqueue(zeroCostNode);

      expect(queue.dequeue()).toBe(zeroCostNode);
      expect(queue.dequeue()).toBe(positiveCostNode);
    });

    it('handles negative costs', () => {
      const negativeCostNode: PathfindingNode = {
        coordinate: { lat: 47.0000, lng: 8.0000 },
        gCost: -5,
        hCost: 3,
        fCost: -2
      };

      const positiveCostNode: PathfindingNode = {
        coordinate: { lat: 47.0010, lng: 8.0010 },
        gCost: 1,
        hCost: 1,
        fCost: 2
      };

      queue.enqueue(positiveCostNode);
      queue.enqueue(negativeCostNode);

      expect(queue.dequeue()).toBe(negativeCostNode);
      expect(queue.dequeue()).toBe(positiveCostNode);
    });
  });

  describe('dequeue', () => {
    it('returns undefined for empty queue', () => {
      expect(queue.dequeue()).toBeUndefined();
    });

    it('returns and removes lowest fCost node', () => {
      const node1: PathfindingNode = {
        coordinate: { lat: 47.0000, lng: 8.0000 },
        gCost: 10,
        hCost: 10,
        fCost: 20
      };

      const node2: PathfindingNode = {
        coordinate: { lat: 47.0010, lng: 8.0010 },
        gCost: 5,
        hCost: 5,
        fCost: 10
      };

      queue.enqueue(node1);
      queue.enqueue(node2);

      expect(queue.dequeue()).toBe(node2); // Lower fCost
      expect(queue.dequeue()).toBe(node1);
      expect(queue.dequeue()).toBeUndefined(); // Queue is now empty
    });

    it('removes node from queue', () => {
      const node: PathfindingNode = {
        coordinate: { lat: 47.0000, lng: 8.0000 },
        gCost: 5,
        hCost: 5,
        fCost: 10
      };

      queue.enqueue(node);
      expect(queue.isEmpty()).toBe(false);

      queue.dequeue();
      expect(queue.isEmpty()).toBe(true);
    });

    it('handles single node queue', () => {
      const node: PathfindingNode = {
        coordinate: { lat: 47.0000, lng: 8.0000 },
        gCost: 1,
        hCost: 1,
        fCost: 2
      };

      queue.enqueue(node);
      
      expect(queue.dequeue()).toBe(node);
      expect(queue.isEmpty()).toBe(true);
      expect(queue.dequeue()).toBeUndefined();
    });

    it('maintains order after partial dequeue', () => {
      const nodes: PathfindingNode[] = [10, 20, 30, 40, 50].map(cost => ({
        coordinate: { lat: 47.0000 + cost * 0.0001, lng: 8.0000 + cost * 0.0001 },
        gCost: cost / 2,
        hCost: cost / 2,
        fCost: cost
      }));

      nodes.forEach(node => queue.enqueue(node));

      // Dequeue first two
      expect(queue.dequeue()?.fCost).toBe(10);
      expect(queue.dequeue()?.fCost).toBe(20);

      // Add new node
      const newNode: PathfindingNode = {
        coordinate: { lat: 47.0025, lng: 8.0025 },
        gCost: 12.5,
        hCost: 12.5,
        fCost: 25
      };
      queue.enqueue(newNode);

      // Should maintain order
      expect(queue.dequeue()?.fCost).toBe(25); // New node
      expect(queue.dequeue()?.fCost).toBe(30);
      expect(queue.dequeue()?.fCost).toBe(40);
      expect(queue.dequeue()?.fCost).toBe(50);
    });
  });

  describe('isEmpty', () => {
    it('returns true for new queue', () => {
      expect(queue.isEmpty()).toBe(true);
    });

    it('returns false after enqueue', () => {
      const node: PathfindingNode = {
        coordinate: { lat: 47.0000, lng: 8.0000 },
        gCost: 1,
        hCost: 1,
        fCost: 2
      };

      queue.enqueue(node);
      expect(queue.isEmpty()).toBe(false);
    });

    it('returns true after dequeuing all nodes', () => {
      const node: PathfindingNode = {
        coordinate: { lat: 47.0000, lng: 8.0000 },
        gCost: 1,
        hCost: 1,
        fCost: 2
      };

      queue.enqueue(node);
      queue.dequeue();
      expect(queue.isEmpty()).toBe(true);
    });

    it('handles multiple enqueue/dequeue cycles', () => {
      const node1: PathfindingNode = {
        coordinate: { lat: 47.0000, lng: 8.0000 },
        gCost: 1,
        hCost: 1,
        fCost: 2
      };

      const node2: PathfindingNode = {
        coordinate: { lat: 47.0010, lng: 8.0010 },
        gCost: 2,
        hCost: 2,
        fCost: 4
      };

      expect(queue.isEmpty()).toBe(true);

      queue.enqueue(node1);
      expect(queue.isEmpty()).toBe(false);

      queue.enqueue(node2);
      expect(queue.isEmpty()).toBe(false);

      queue.dequeue();
      expect(queue.isEmpty()).toBe(false);

      queue.dequeue();
      expect(queue.isEmpty()).toBe(true);
    });
  });

  describe('contains', () => {
    const COORDINATE_TOLERANCE = 0.0001;

    it('returns false for empty queue', () => {
      const coordinate: Coordinate = { lat: 47.0000, lng: 8.0000 };
      expect(queue.contains(coordinate)).toBe(false);
    });

    it('finds exact coordinate match', () => {
      const coordinate: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
      const node: PathfindingNode = {
        coordinate,
        gCost: 1,
        hCost: 1,
        fCost: 2
      };

      queue.enqueue(node);
      expect(queue.contains(coordinate)).toBe(true);
    });

    it('finds coordinate within tolerance', () => {
      const nodeCoordinate: Coordinate = { lat: 47.0000, lng: 8.0000 };
      const searchCoordinate: Coordinate = { 
        lat: 47.0000 + COORDINATE_TOLERANCE * 0.5, 
        lng: 8.0000 + COORDINATE_TOLERANCE * 0.5 
      };

      const node: PathfindingNode = {
        coordinate: nodeCoordinate,
        gCost: 1,
        hCost: 1,
        fCost: 2
      };

      queue.enqueue(node);
      expect(queue.contains(searchCoordinate)).toBe(true);
    });

    it('does not find coordinate outside tolerance', () => {
      const nodeCoordinate: Coordinate = { lat: 47.0000, lng: 8.0000 };
      const searchCoordinate: Coordinate = { 
        lat: 47.0000 + COORDINATE_TOLERANCE * 2, 
        lng: 8.0000 + COORDINATE_TOLERANCE * 2 
      };

      const node: PathfindingNode = {
        coordinate: nodeCoordinate,
        gCost: 1,
        hCost: 1,
        fCost: 2
      };

      queue.enqueue(node);
      expect(queue.contains(searchCoordinate)).toBe(false);
    });

    it('handles boundary tolerance cases', () => {
      const nodeCoordinate: Coordinate = { lat: 47.0000, lng: 8.0000 };
      
      // Exactly at tolerance boundary
      const boundaryCoordinate: Coordinate = { 
        lat: 47.0000 + COORDINATE_TOLERANCE, 
        lng: 8.0000 
      };

      const node: PathfindingNode = {
        coordinate: nodeCoordinate,
        gCost: 1,
        hCost: 1,
        fCost: 2
      };

      queue.enqueue(node);
      expect(queue.contains(boundaryCoordinate)).toBe(false); // Should be false for exact boundary
    });

    it('finds multiple nodes with similar coordinates', () => {
      const coordinate1: Coordinate = { lat: 47.0000, lng: 8.0000 };
      const coordinate2: Coordinate = { lat: 47.0010, lng: 8.0010 };
      const searchCoordinate: Coordinate = { lat: 47.0000, lng: 8.0000 };

      const node1: PathfindingNode = {
        coordinate: coordinate1,
        gCost: 1,
        hCost: 1,
        fCost: 2
      };

      const node2: PathfindingNode = {
        coordinate: coordinate2,
        gCost: 2,
        hCost: 2,
        fCost: 4
      };

      queue.enqueue(node1);
      queue.enqueue(node2);

      expect(queue.contains(searchCoordinate)).toBe(true); // Should find coordinate1
    });

    it('returns false after dequeuing matching node', () => {
      const coordinate: Coordinate = { lat: 47.0000, lng: 8.0000 };
      const node: PathfindingNode = {
        coordinate,
        gCost: 1,
        hCost: 1,
        fCost: 2
      };

      queue.enqueue(node);
      expect(queue.contains(coordinate)).toBe(true);

      queue.dequeue();
      expect(queue.contains(coordinate)).toBe(false);
    });

    it('handles negative coordinates', () => {
      const coordinate: Coordinate = { lat: -47.0000, lng: -8.0000 };
      const node: PathfindingNode = {
        coordinate,
        gCost: 1,
        hCost: 1,
        fCost: 2
      };

      queue.enqueue(node);
      expect(queue.contains(coordinate)).toBe(true);

      const nearbyCoordinate: Coordinate = { 
        lat: -47.0000 + COORDINATE_TOLERANCE * 0.5, 
        lng: -8.0000 + COORDINATE_TOLERANCE * 0.5 
      };
      expect(queue.contains(nearbyCoordinate)).toBe(true);
    });

    it('ignores elevation in coordinate comparison', () => {
      const nodeCoordinate: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 1000 };
      const searchCoordinate: Coordinate = { lat: 47.0000, lng: 8.0000, elevation: 2000 };

      const node: PathfindingNode = {
        coordinate: nodeCoordinate,
        gCost: 1,
        hCost: 1,
        fCost: 2
      };

      queue.enqueue(node);
      expect(queue.contains(searchCoordinate)).toBe(true); // Should ignore elevation difference
    });

    it('handles coordinate without elevation', () => {
      const nodeCoordinate: Coordinate = { lat: 47.0000, lng: 8.0000 };
      const searchCoordinate: Coordinate = { lat: 47.0000, lng: 8.0000 };

      const node: PathfindingNode = {
        coordinate: nodeCoordinate,
        gCost: 1,
        hCost: 1,
        fCost: 2
      };

      queue.enqueue(node);
      expect(queue.contains(searchCoordinate)).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    it('supports typical A* algorithm usage pattern', () => {
      // Simulate A* algorithm usage
      const startNode: PathfindingNode = {
        coordinate: { lat: 47.0000, lng: 8.0000 },
        gCost: 0,
        hCost: 10,
        fCost: 10
      };

      const goalNode: PathfindingNode = {
        coordinate: { lat: 47.0100, lng: 8.0100 },
        gCost: 15,
        hCost: 0,
        fCost: 15
      };

      // Add start to open list
      queue.enqueue(startNode);
      expect(queue.contains(startNode.coordinate)).toBe(true);

      // Process start node
      const current = queue.dequeue();
      expect(current).toBe(startNode);
      expect(queue.isEmpty()).toBe(true);

      // Add neighbors (simulate neighbor generation)
      const neighbors = [
        {
          coordinate: { lat: 47.0010, lng: 8.0000 },
          gCost: 1,
          hCost: 9,
          fCost: 10,
          parent: startNode
        },
        {
          coordinate: { lat: 47.0000, lng: 8.0010 },
          gCost: 1,
          hCost: 9,
          fCost: 10,
          parent: startNode
        },
        {
          coordinate: { lat: 47.0010, lng: 8.0010 },
          gCost: 1.4,
          hCost: 8.6,
          fCost: 10,
          parent: startNode
        }
      ];

      neighbors.forEach(neighbor => {
        if (!queue.contains(neighbor.coordinate)) {
          queue.enqueue(neighbor);
        }
      });

      expect(queue.isEmpty()).toBe(false);

      // Should be able to continue processing
      const next = queue.dequeue();
      expect(neighbors).toContain(next);
    });

    it('maintains performance with many nodes', () => {
      const startTime = Date.now();
      const nodeCount = 1000;

      // Add many nodes
      for (let i = 0; i < nodeCount; i++) {
        const node: PathfindingNode = {
          coordinate: { 
            lat: 47.0000 + Math.random() * 0.1, 
            lng: 8.0000 + Math.random() * 0.1 
          },
          gCost: Math.random() * 100,
          hCost: Math.random() * 100,
          fCost: Math.random() * 200
        };
        queue.enqueue(node);
      }

      // Dequeue all nodes
      const dequeueStart = Date.now();
      const dequeuedNodes: PathfindingNode[] = [];
      
      while (!queue.isEmpty()) {
        const node = queue.dequeue();
        if (node) {
          dequeuedNodes.push(node);
        }
      }

      const endTime = Date.now();

      expect(dequeuedNodes.length).toBe(nodeCount);

      // Verify ordering
      for (let i = 1; i < dequeuedNodes.length; i++) {
        expect(dequeuedNodes[i].fCost).toBeGreaterThanOrEqual(dequeuedNodes[i - 1].fCost);
      }

      // Should complete reasonably quickly (adjust threshold as needed)
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(1000); // Should complete within 1 second
    });

    it('handles pathfinding nodes with parent references', () => {
      const parentNode: PathfindingNode = {
        coordinate: { lat: 47.0000, lng: 8.0000 },
        gCost: 0,
        hCost: 10,
        fCost: 10
      };

      const childNode: PathfindingNode = {
        coordinate: { lat: 47.0010, lng: 8.0010 },
        gCost: 5,
        hCost: 5,
        fCost: 10,
        parent: parentNode
      };

      queue.enqueue(parentNode);
      queue.enqueue(childNode);

      expect(queue.contains(parentNode.coordinate)).toBe(true);
      expect(queue.contains(childNode.coordinate)).toBe(true);

      // Should be able to dequeue both (order may vary due to equal fCost)
      const first = queue.dequeue();
      const second = queue.dequeue();

      expect([parentNode, childNode]).toContain(first);
      expect([parentNode, childNode]).toContain(second);
      expect(first).not.toBe(second);

      // Parent reference should be preserved
      if (second?.parent) {
        expect(second.parent).toBe(parentNode);
      }
    });
  });
});