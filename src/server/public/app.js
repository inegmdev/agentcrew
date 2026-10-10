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

  // Theme Management (Light Default, Dark Toggle, localStorage persisted)
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeLabelText = document.getElementById('theme-label-text');

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    if (themeLabelText) {
      themeLabelText.textContent = theme === 'dark' ? 'Theme: Dark' : 'Theme: Light';
    }
    if (pixelRenderer) {
      pixelRenderer.setTheme(theme);
    }
    try {
      localStorage.setItem('agentcrew_theme', theme);
    } catch (_) {}
  }

  let initialTheme = 'light';
  try {
    initialTheme = localStorage.getItem('agentcrew_theme') || 'light';
  } catch (_) {}

  const canvas = document.getElementById('pixel-room-canvas');
  const pixelWrapper = document.getElementById('pixel-room-wrapper');
  const btnTogglePixel = document.getElementById('toggle-pixel-view');
  const btnToggleList = document.getElementById('toggle-list-view');

  let pixelRenderer = null;
  if (canvas && window.PixelRoomRenderer) {
    pixelRenderer = new PixelRoomRenderer(canvas, {
      theme: initialTheme,
      onAgentClick: (agent) => {
        if (agentSelect) {
          agentSelect.value = agent.name;
        }
        log(`Inspecting ${agent.name} (${agent.role}) via isometric station`, 'system');
      }
    });
  }

  // Apply initially resolved theme
  applyTheme(initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      log(`Switched interface theme to ${next}`, 'system');
    });
  }

  // Full-Screen Navigation Tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  const views = document.querySelectorAll('.fullscreen-view');

  function switchView(targetViewId) {
    views.forEach(v => {
      if (v.id === targetViewId) {
        v.classList.add('active');
      } else {
        v.classList.remove('active');
      }
    });

    navTabs.forEach(t => {
      if (t.dataset.view === targetViewId) {
        t.classList.add('active');
      } else {
        t.classList.remove('active');
      }
    });
  }

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchView(tab.dataset.view);
    });
  });

  if (btnTogglePixel && btnToggleList) {
    btnTogglePixel.addEventListener('click', () => {
      btnTogglePixel.classList.add('active');
      btnToggleList.classList.remove('active');
      if (pixelWrapper) pixelWrapper.style.display = 'flex';
      if (teamRoomGrid) teamRoomGrid.style.display = 'none';
    });

    btnToggleList.addEventListener('click', () => {
      btnToggleList.classList.add('active');
      btnTogglePixel.classList.remove('active');
      if (pixelWrapper) pixelWrapper.style.display = 'none';
      if (teamRoomGrid) teamRoomGrid.style.display = 'grid';
    });
  }

  // Load Agent Stations
  async function loadAgents() {
    try {
      const res = await fetch('/api/v1/agents');
      const data = await res.json();

      if (pixelRenderer && data.agents) {
        pixelRenderer.updateAgentStates(data.agents);
      }

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

  // Load Tasks into Kanban
  async function loadTasks() {
    const tasks = [
      { id: 'TASK-13', title: 'Provider Qualification Spikes (agy, Codex, Gemini)', stage: 'done', owner: 'Arthur (Architect)' },
      { id: 'TASK-14', title: 'Workspace SQLite Schema & 13 Agent Identities', stage: 'done', owner: 'Dev-1' },
      { id: 'TASK-15', title: 'Provider Plugin Engine & 4-Turn Scheduler', stage: 'done', owner: 'Dev-2' },
      { id: 'TASK-16', title: 'Browser Session Takeover with 10s Soft Budget', stage: 'done', owner: 'Dev-3' },
      { id: 'TASK-17', title: 'Requirements Intake & Joint Planning Package', stage: 'review', owner: 'Alice (BA)' },
      { id: 'TASK-18', title: 'Worktree Task Lifecycle & Design Reviews', stage: 'qa', owner: 'QA-1 (Tester)' },
      { id: 'TASK-19', title: 'Commit-Bound Approvals & Revision Invalidation', stage: 'in_progress', owner: 'Dev-4' },
      { id: 'TASK-20', title: 'Iteration Branch Integration Strategy', stage: 'in_progress', owner: 'Integrator-1' },
      { id: 'TASK-21', title: 'Popup Scope Change Engine (P-xxx)', stage: 'planning', owner: 'Peter (PO)' },
      { id: 'TASK-25', title: 'Supervisor HTTP & SSE Server Daemon', stage: 'done', owner: 'Dev-1' },
      { id: 'TASK-26', title: 'Interactive Web UI Full-Screen Dashboards', stage: 'done', owner: 'Dev-2' },
      { id: 'TASK-27', title: 'CLI Server Command & User Workflow', stage: 'done', owner: 'Dev-3' }
    ];

    ['planning', 'in_progress', 'review', 'qa', 'done'].forEach(stage => {
      const col = document.getElementById(`tasks-${stage}`);
      if (!col) return;
      col.innerHTML = '';
      const stageTasks = tasks.filter(t => t.stage === stage);
      stageTasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'task-item';
        item.innerHTML = `
          <div class="task-id">${task.id}</div>
          <div class="task-title" style="font-weight:600; font-size:0.85rem;">${task.title}</div>
          <div class="task-owner" style="font-size:0.75rem; color:var(--text-muted);">${task.owner}</div>
        `;
        col.appendChild(item);
      });
    });
  }

  // Initial Boot
  loadWorkspace();
  loadAgents();
  loadMetrics();
  loadReadiness();
  loadTasks();
  connectSSE();
});
