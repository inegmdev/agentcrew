const { DEFAULT_ROSTER } = require('../workspace/manager');

/**
 * Manages virtual team room isometric coordinates and real-time state badges (PRD §12).
 */
class VirtualTeamRoom {
  constructor() {
    this.agentStates = new Map();

    // Map default 13 agent roster to isometric grid coordinates
    this.stations = DEFAULT_ROSTER.map((agent, index) => {
      // 4x4 isometric grid layout
      const gridX = index % 4;
      const gridY = Math.floor(index / 4);

      // Standard isometric transformation: x = (gx - gy) * tileWidth/2; y = (gx + gy) * tileHeight/2
      const isoX = (gridX - gridY) * 32;
      const isoY = (gridX + gridY) * 16;

      this.agentStates.set(agent.name, {
        state: 'idle',
        activeTaskId: null,
      });

      return {
        agentName: agent.name,
        role: agent.role,
        gridX,
        gridY,
        isoX,
        isoY,
      };
    });
  }

  getStations() {
    return this.stations;
  }

  updateAgentState(agentName, { state, activeTaskId } = {}) {
    const current = this.agentStates.get(agentName) || {};
    this.agentStates.set(agentName, {
      ...current,
      state: state || current.state || 'idle',
      activeTaskId: activeTaskId !== undefined ? activeTaskId : current.activeTaskId,
    });
  }

  getAgentState(agentName) {
    return this.agentStates.get(agentName);
  }

  getAccessibleList() {
    return this.stations.map(station => {
      const state = this.agentStates.get(station.agentName) || { state: 'idle' };
      return {
        agentName: station.agentName,
        role: station.role,
        statusLabel: state.state,
        activeTaskId: state.activeTaskId,
      };
    });
  }
}

module.exports = { VirtualTeamRoom };
