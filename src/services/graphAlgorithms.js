/**
 * Knowledge Graph Algorithms for SmartEdu OS
 * Topological sorting, bottleneck identification, prerequisite resolution.
 */

/**
 * Finds all prerequisite ancestor IDs for a given concept
 */
export function getPrerequisiteAncestors(conceptId, graphNodes) {
  const ancestors = new Set();
  const nodeMap = new Map(graphNodes.map(n => [n.id, n]));

  function traverse(id) {
    const node = nodeMap.get(id);
    if (!node || !node.prerequisites) return;
    for (const prereqId of node.prerequisites) {
      if (!ancestors.has(prereqId)) {
        ancestors.add(prereqId);
        traverse(prereqId);
      }
    }
  }

  traverse(conceptId);
  return Array.from(ancestors);
}

/**
 * Finds all downstream dependent concepts that rely on this concept
 */
export function getDownstreamDependents(conceptId, graphNodes) {
  const dependents = new Set();
  
  for (const node of graphNodes) {
    if (node.prerequisites && node.prerequisites.includes(conceptId)) {
      dependents.add(node.id);
    }
  }

  return Array.from(dependents);
}

/**
 * Identifies the top prerequisite bottlenecks in the learner's knowledge graph.
 * A bottleneck is a concept where:
 * 1. Current mastery is < 60%
 * 2. It has multiple downstream dependencies that are blocked
 */
export function findPrerequisiteBottlenecks(graphNodes, masteryState) {
  const bottlenecks = [];

  for (const node of graphNodes) {
    const currentMastery = masteryState[node.id]?.mastery ?? node.initialMastery ?? 0;
    const dependents = getDownstreamDependents(node.id, graphNodes);

    if (currentMastery < 65 && dependents.length > 0) {
      const blockedScore = (100 - currentMastery) * (dependents.length * 1.5);
      bottlenecks.push({
        id: node.id,
        name: node.name,
        category: node.category,
        currentMastery,
        dependentsCount: dependents.length,
        dependentNames: dependents.map(dId => graphNodes.find(n => n.id === dId)?.name || dId),
        severityScore: Math.round(blockedScore)
      });
    }
  }

  // Sort descending by severity
  return bottlenecks.sort((a, b) => b.severityScore - a.severityScore);
}

/**
 * Computes topological study order taking prerequisites into account
 */
export function getTopologicalStudyOrder(graphNodes) {
  const inDegree = new Map();
  const adjList = new Map();

  graphNodes.forEach(node => {
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  });

  graphNodes.forEach(node => {
    if (node.prerequisites) {
      node.prerequisites.forEach(prereqId => {
        if (adjList.has(prereqId)) {
          adjList.get(prereqId).push(node.id);
          inDegree.set(node.id, (inDegree.get(node.id) || 0) + 1);
        }
      });
    }
  });

  const queue = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const order = [];
  while (queue.length > 0) {
    const curr = queue.shift();
    order.push(curr);

    const neighbors = adjList.get(curr) || [];
    for (const neighbor of neighbors) {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    }
  }

  return order.map(id => graphNodes.find(n => n.id === id)).filter(Boolean);
}

/**
 * Calculates Prerequisite Health Index (PHI) for a target concept
 * Returns % of prerequisites that have >= 70% mastery
 */
export function calculatePrerequisiteHealth(conceptId, graphNodes, masteryState) {
  const ancestors = getPrerequisiteAncestors(conceptId, graphNodes);
  if (ancestors.length === 0) return { healthIndex: 100, isBlocked: false, weakPrereqs: [] };

  const weakPrereqs = [];
  let totalMastery = 0;

  for (const aId of ancestors) {
    const node = graphNodes.find(n => n.id === aId);
    const mastery = masteryState[aId]?.mastery ?? node?.initialMastery ?? 0;
    totalMastery += mastery;
    if (mastery < 65) {
      weakPrereqs.push({ id: aId, name: node?.name || aId, mastery });
    }
  }

  const avgMastery = Math.round(totalMastery / ancestors.length);
  const isBlocked = weakPrereqs.length > 0;

  return {
    healthIndex: avgMastery,
    isBlocked,
    weakPrereqs,
    totalAncestors: ancestors.length
  };
}
