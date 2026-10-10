// AgentCrew Dashboard Application Script
document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('connection-status');
  const teamRoomGrid = document.getElementById('team-room-grid');
  const providerBadges = document.getElementById('provider-badges');
  const terminal = document.getElementById('takeover-terminal');
  const btnTakeover = document.getElementById('btn-takeover');
  const btnRelease = document.getElementById('btn-release');
  const agentSelect = document.getElementById('takeover-agent-select');
  const stateBadge = document.getElementById('takeover-state-badge');

  function log(text, type = 'system') {
    if (!terminal) return;
    const line = document.createElement('div');
    line.className = `term-line ${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    terminal.appendChild(line);
    terminal.scrollTop = terminal.scrollHeight;
  }

  // Load Workspace and Roster
  async function loadWorkspace() {
    try {
      const res = await fetch('/api/v1/workspace');
      const data = await res.json();
      log(`Workspace loaded: ${data.workspace.name} (${data.agents.length} agents)`);
    } catch (err) {
      log(`Error loading workspace: ${err.message}`, 'action');
    }
  }

  // Load Agent Stations
  async function loadAgents() {
    try {
      const res = await fetch('/api/v1/agents');
      const data = await res.json();
      if (!teamRoomGrid) return;
      teamRoomGrid.innerHTML = '';

      data.agents.forEach((agent) => {
        const card = document.createElement('div');
        card.className = 'station-card';
        card.id = `station-${agent.name}`;
        card.innerHTML = `
          <div class="station-top">
            <span class="station-name">${agent.name}</span>
            <span class="activity-badge ${agent.activity_badge || 'idle'}">${agent.activity_badge || 'idle'}</span>
          </div>
          <span class="station-role">${agent.role}</span>
          <span class="station-provider">${agent.provider} · ${agent.model}</span>
        `;
        teamRoomGrid.appendChild(card);
      });
    } catch (err) {
      log(`Error loading agents: ${err.message}`, 'action');
    }
  }

  // Load Metrics
  async function loadMetrics() {
    try {
      const res = await fetch('/api/v1/metrics');
      const data = await res.json();
      if (data.metrics) {
        const cycle = document.getElementById('metric-cycle-time');
        const pass = document.getElementById('metric-pass-rate');
        const count = document.getElementById('metric-completed-tasks');
        if (cycle) cycle.textContent = data.metrics.cycle_time_minutes.toFixed(1);
        if (pass) pass.textContent = `${(data.metrics.pass_rate * 100).toFixed(0)}%`;
        if (count) count.textContent = data.metrics.completed_task_count;
      }
    } catch (err) {
      // Ignore
    }
  }

  // Load Readiness
  async function loadReadiness() {
    try {
      const res = await fetch('/api/v1/readiness');
      const data = await res.json();
      if (providerBadges && data.providers) {
        providerBadges.innerHTML = '';
        data.providers.forEach((p) => {
          const pill = document.createElement('span');
          pill.className = 'provider-pill';
          pill.textContent = `${p.name} (Ready)`;
          providerBadges.appendChild(pill);
        });
      }
    } catch (err) {
      // Ignore
    }
  }

  // Takeover Handlers
  if (btnTakeover) {
    btnTakeover.addEventListener('click', async () => {
      const targetAgent = agentSelect.value;
      log(`Initiating browser takeover on ${targetAgent} (10s soft budget)...`, 'action');
      btnTakeover.disabled = true;

      try {
        const res = await fetch('/api/v1/commands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command_type: 'session.takeover',
            payload: { agent_id: targetAgent, reason: 'Operator initiated takeover via UI' }
          })
        });
        const data = await res.json();
        if (data.status === 'acknowledged') {
          log(`Takeover ACQUIRED on ${targetAgent}. Autonomous turns halted. Human authority active.`, 'success');
          stateBadge.textContent = 'Human Owned';
          stateBadge.className = 'badge badge-warning';
          btnRelease.disabled = false;

          // Update station badge
          const station = document.getElementById(`station-${targetAgent}`);
          if (station) {
            const badge = station.querySelector('.activity-badge');
            if (badge) {
              badge.textContent = 'takeover';
              badge.className = 'activity-badge takeover';
            }
          }
        }
      } catch (err) {
        log(`Takeover failed: ${err.message}`, 'action');
        btnTakeover.disabled = false;
      }
    });
  }

  if (btnRelease) {
    btnRelease.addEventListener('click', async () => {
      const targetAgent = agentSelect.value;
      const notes = prompt('Enter guidance notes for releasing session back to autonomous runner:', 'Manual fix verified.');
      if (notes === null) return;

      log(`Releasing takeover for ${targetAgent}...`, 'action');
      try {
        const res = await fetch('/api/v1/commands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command_type: 'session.release',
            payload: { agent_id: targetAgent, guidance_notes: notes }
          })
        });
        const data = await res.json();
        if (data.status === 'acknowledged') {
          log(`Session RELEASED back to auto with guidance: "${notes}"`, 'success');
          stateBadge.textContent = 'Auto';
          stateBadge.className = 'badge';
          btnTakeover.disabled = false;
          btnRelease.disabled = true;
          loadAgents();
        }
      } catch (err) {
        log(`Release failed: ${err.message}`, 'action');
      }
    });
  }

  // Real-time Event Stream (SSE)
  function connectSSE() {
    const sse = new EventSource('/api/v1/events');

    sse.addEventListener('snapshot', (e) => {
      log('SSE Stream established with supervisor.', 'system');
      if (statusEl) {
        statusEl.className = 'status-indicator connected';
        statusEl.querySelector('.label').textContent = 'Connected (SSE)';
      }
    });

    sse.addEventListener('takeover_started', (e) => {
      const data = JSON.parse(e.data);
      log(`Remote Event: Agent ${data.agent_id} entered human takeover`, 'action');
    });

    sse.addEventListener('takeover_released', (e) => {
      const data = JSON.parse(e.data);
      log(`Remote Event: Agent ${data.agent_id} released to auto`, 'success');
      loadAgents();
    });

    sse.addEventListener('turn_started', (e) => {
      const data = JSON.parse(e.data);
      log(`Turn started for ${data.agent_id}`, 'system');
    });

    sse.onerror = () => {
      if (statusEl) {
        statusEl.className = 'status-indicator disconnected';
        statusEl.querySelector('.label').textContent = 'Reconnecting...';
      }
    };
  }

  // Initial Boot
  loadWorkspace();
  loadAgents();
  loadMetrics();
  loadReadiness();
  connectSSE();
});
