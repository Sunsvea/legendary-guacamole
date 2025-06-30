import { PathfindingNode, Coordinate } from '@/types/route';

/**
 * Coordinate comparison tolerance for pathfinding nodes
 */
const COORDINATE_TOLERANCE = 0.0001;

/**
 * Priority queue implementation for A* pathfinding algorithm
 * Manages PathfindingNode objects sorted by their fCost (total cost)
 */
class PriorityQueue {
  private items: PathfindingNode[] = [];

  /**
   * Add a node to the priority queue, maintaining sorted order by fCost
   * @param item The PathfindingNode to add
   */
  enqueue(item: PathfindingNode) {
    this.items.push(item);
    this.items.sort((a, b) => a.fCost - b.fCost);
  }

  /**
   * Remove and return the node with the lowest fCost
   * @returns The PathfindingNode with lowest fCost, or undefined if queue is empty
   */
  dequeue(): PathfindingNode | undefined {
    return this.items.shift();
  }

  /**
   * Check if the priority queue is empty
   * @returns True if the queue has no items
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Check if a coordinate is already in the priority queue
   * @param coordinate The coordinate to search for
   * @returns True if a node with similar coordinates exists in the queue
   */
  contains(coordinate: Coordinate): boolean {
    return this.items.some(item => 
      Math.abs(item.coordinate.lat - coordinate.lat) < COORDINATE_TOLERANCE &&
      Math.abs(item.coordinate.lng - coordinate.lng) < COORDINATE_TOLERANCE
    );
  }
}

export default PriorityQueue;