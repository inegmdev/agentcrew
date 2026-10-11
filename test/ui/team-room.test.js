const test = require('node:test');
const assert = require('node:assert/strict');
const { VirtualTeamRoom } = require('../../src/ui/team-room');

test('VirtualTeamRoom lays out 13 agent stations in an isometric grid', () => {
  const room = new VirtualTeamRoom();

  const stations = room.getStations();
  assert.equal(stations.length, 13);
  assert.ok(stations.find(s => s.role === 'Business Analyst'));
  assert.ok(stations.find(s => s.role === 'Product Owner'));
  assert.ok(stations.find(s => s.role === 'Architect'));
  assert.equal(stations.filter(s => s.role === 'Developer').length, 4);
  assert.equal(stations.filter(s => s.role === 'Tester').length, 4);
  assert.equal(stations.filter(s => s.role === 'Integrator').length, 2);

  // Each station has coordinate mappings for isometric layout
  assert.ok(typeof stations[0].isoX === 'number');
  assert.ok(typeof stations[0].isoY === 'number');
});

test('VirtualTeamRoom updates agent activity badge and provides keyboard navigation list', () => {
  const room = new VirtualTeamRoom();

  room.updateAgentState('Dev-1', {
    state: 'executing',
    activeTaskId: 'TASK-18',
  });

  const agentState = room.getAgentState('Dev-1');
  assert.equal(agentState.state, 'executing');
  assert.equal(agentState.activeTaskId, 'TASK-18');

  // Accessible list representation
  const list = room.getAccessibleList();
  assert.equal(list.length, 13);
  const dev1Item = list.find(item => item.agentName === 'Dev-1');
  assert.equal(dev1Item.statusLabel, 'executing');
});
