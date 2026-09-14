import type { InjectionToken } from '../types/injection-token.js';
import type { DependencyGraph } from './dependency-graph.js';
import { CircularDependencyError } from '../errors/circular-dependency.error.js';

enum NodeVisitState {
  UNVISITED = 0,
  VISITING = 1,
  VISITED = 2,
}

/**
 * Low-overhead DFS cycle detection engine for Dependency Injection graphs.
 */
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class CircularDependencyDetector {
  /**
   * Detects circular dependencies within a DependencyGraph instance.
   *
   * @param graph - The built DependencyGraph to evaluate.
   * @throws {CircularDependencyError} Thrown when a cycle is detected.
   */
  public static detect(graph: DependencyGraph): void {
    const states = new Map<InjectionToken, NodeVisitState>();
    const stack: InjectionToken[] = [];

    const dfs = (token: InjectionToken): void => {
      const currentState = states.get(token) ?? NodeVisitState.UNVISITED;

      if (currentState === NodeVisitState.VISITING) {
        // Cycle detected, extract sub-path forming the loop
        const cycleStartIndex = stack.indexOf(token);
        const cyclePath = [...stack.slice(cycleStartIndex), token];
        throw new CircularDependencyError(cyclePath);
      }

      if (currentState === NodeVisitState.VISITED) {
        return;
      }

      states.set(token, NodeVisitState.VISITING);
      stack.push(token);

      const node = graph.getNode(token);
      if (node) {
        for (const depToken of node.dependencies) {
          dfs(depToken);
        }
      }

      stack.pop();
      states.set(token, NodeVisitState.VISITED);
    };

    for (const node of graph.getNodes()) {
      if ((states.get(node.token) ?? NodeVisitState.UNVISITED) === NodeVisitState.UNVISITED) {
        dfs(node.token);
      }
    }
  }
}
