// AgentCrew Dashboard Application Script
document.addEventListener('DOMContentLoaded', () => {
  const analyticsData = window.agentCrewAnalyticsData || {
    people: [],
    ranges: [],
    kpis: { week: [], month: [] },
    activity: { week: { labels: [], series: {}, lines: {} }, month: { labels: [], series: {}, lines: {} } },
    repositories: [],
    pullRequests: []
  };

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

  // --- Theme & Appearance Accent Management ---
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

  // Appearance Accent Color
  const accentSwatches = document.querySelectorAll('.accent-swatch');
  function applyAccent(accent) {
    document.documentElement.setAttribute('data-accent', accent);
    accentSwatches.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.accent === accent);
    });
    try {
      localStorage.setItem('agentcrew_accent', accent);
    } catch (_) {}
  }

  let initialAccent = 'blue';
  try {
    initialAccent = localStorage.getItem('agentcrew_accent') || 'blue';
  } catch (_) {}
  applyAccent(initialAccent);

  accentSwatches.forEach(btn => {
    btn.addEventListener('click', () => {
      applyAccent(btn.dataset.accent);
      log(`Changed appearance accent color to ${btn.dataset.accent}`, 'system');
    });
  });

  // --- Pixel Room Canvas ---
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

  applyTheme(initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      log(`Switched interface theme to ${next}`, 'system');
    });
  }

  // --- Full-Screen Navigation Tabs ---
  const navTabs = document.querySelectorAll('.nav-tab');
  const views = document.querySelectorAll('.fullscreen-view');

  function switchView(targetViewId) {
    views.forEach(v => {
      v.classList.toggle('active', v.id === targetViewId);
    });
    navTabs.forEach(t => {
      t.classList.toggle('active', t.dataset.view === targetViewId);
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

  // --- Overview: Range Switcher & Sparklines ---
  let activeRange = 'week';
  const rangeBtns = document.querySelectorAll('.btn-range');
  const overviewCaption = document.getElementById('overview-caption');

  function generateSparkSvg(dataPoints, strokeColor = '#0284c7') {
    if (!dataPoints || dataPoints.length < 2) return '';
    const min = Math.min(...dataPoints);
    const max = Math.max(...dataPoints);
    const range = max - min || 1;
    const w = 72;
    const h = 24;

    const coords = dataPoints.map((val, idx) => {
      const x = (idx / (dataPoints.length - 1)) * (w - 4) + 2;
      const y = h - ((val - min) / range) * (h - 6) - 3;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    return `<svg class="spark-svg" viewBox="0 0 ${w} ${h}">
      <polyline points="${coords.join(' ')}" fill="none" stroke="${strokeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  function updateOverview(range) {
    activeRange = range;
    rangeBtns.forEach(b => b.classList.toggle('active', b.dataset.range === range));

    const rangeObj = analyticsData.ranges.find(r => r.id === range);
    if (rangeObj && overviewCaption) {
      overviewCaption.textContent = rangeObj.caption;
    }

    const kpiList = analyticsData.kpis[range] || [];
    const cycleKpi = kpiList.find(k => k.id === 'cycle-time');
    const passKpi = kpiList.find(k => k.id === 'qa-pass');
    const concKpi = kpiList.find(k => k.id === 'concurrency');
    const delivKpi = kpiList.find(k => k.id === 'delivered');

    if (cycleKpi) {
      const el = document.getElementById('kpi-val-cycle');
      if (el) el.textContent = cycleKpi.value;
      const sparkEl = document.getElementById('spark-cycle');
      if (sparkEl) sparkEl.innerHTML = generateSparkSvg(cycleKpi.spark, '#16a34a');
    }

    if (passKpi) {
      const el = document.getElementById('kpi-val-pass');
      if (el) el.textContent = passKpi.value;
      const sparkEl = document.getElementById('spark-pass');
      if (sparkEl) sparkEl.innerHTML = generateSparkSvg(passKpi.spark, '#0284c7');
    }

    if (concKpi) {
      const el = document.getElementById('kpi-val-conc');
      if (el) el.textContent = concKpi.value;
      const sparkEl = document.getElementById('spark-conc');
      if (sparkEl) sparkEl.innerHTML = generateSparkSvg(concKpi.spark, '#9333ea');
    }

    if (delivKpi) {
      const el = document.getElementById('kpi-val-tasks');
      if (el) el.textContent = delivKpi.value;
      const sparkEl = document.getElementById('spark-tasks');
      if (sparkEl) sparkEl.innerHTML = generateSparkSvg(delivKpi.spark, '#d97706');
    }

    renderActivityChart(range);
  }

  rangeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      updateOverview(btn.dataset.range);
    });
  });

  // --- SVG Activity Chart ---
  function renderActivityChart(range) {
    const act = analyticsData.activity[range];
    const chartPaths = document.getElementById('chart-series-paths');
    const legendContainer = document.getElementById('contributor-legend-pills');
    if (!act || !chartPaths) return;

    chartPaths.innerHTML = '';
    if (legendContainer) legendContainer.innerHTML = '';

    const seriesKeys = Object.keys(act.series);
    const labels = act.labels;
    const numPoints = labels.length;

    let globalMax = 1;
    seriesKeys.forEach(k => {
      const arr = act.series[k];
      arr.forEach(v => { if (v > globalMax) globalMax = v; });
    });

    const w = 900;
    const h = 200;
    const padX = 70;
    const padTop = 25;
    const padBottom = 20;
    const plotW = w - padX * 2;
    const plotH = h - padTop - padBottom;

    seriesKeys.forEach(key => {
      const person = analyticsData.people.find(p => p.handle === key) || { color: '#0284c7', name: key };
      const values = act.series[key];

      const points = values.map((val, idx) => {
        const x = padX + (idx / (numPoints - 1)) * plotW;
        const y = padTop + plotH - (val / globalMax) * plotH;
        return { x, y };
      });

      // Bezier curve string
      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
        const xc = (points[i].x + points[i + 1].x) / 2;
        const yc = (points[i].y + points[i + 1].y) / 2;
        d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
      }
      d += ` T ${points[points.length - 1].x} ${points[points.length - 1].y}`;

      const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      pathEl.setAttribute('d', d);
      pathEl.setAttribute('class', 'chart-curve');
      pathEl.setAttribute('stroke', person.color);
      chartPaths.appendChild(pathEl);

      // Points
      points.forEach(pt => {
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', pt.x);
        dot.setAttribute('cy', pt.y);
        dot.setAttribute('r', '3.5');
        dot.setAttribute('fill', person.color);
        chartPaths.appendChild(dot);
      });

      // Legend Pill
      if (legendContainer) {
        const pill = document.createElement('div');
        pill.className = 'legend-item';
        const linesInfo = act.lines[key] ? ` (+${act.lines[key].added} / -${act.lines[key].removed})` : '';
        pill.innerHTML = `
          <span class="legend-dot" style="background:${person.color};"></span>
          <strong>${person.name || key}</strong>
          <span style="font-size:0.7rem; color:var(--text-muted);">${linesInfo}</span>
        `;
        legendContainer.appendChild(pill);
      }
    });
  }

  // --- Top Contributors Grid (Overview) ---
  function renderOverviewContributors() {
    const grid = document.getElementById('overview-contributors-grid');
    if (!grid) return;
    grid.innerHTML = '';

    analyticsData.people.forEach(p => {
      const item = document.createElement('div');
      item.className = 'contributor-item';
      item.style.setProperty('--avatar-color', p.color);
      item.innerHTML = `
        <img class="contributor-avatar" src="${p.avatar}" alt="${p.name}">
        <div class="contributor-info">
          <span class="contributor-name">${p.name}</span>
          <span class="contributor-role">${p.role}</span>
        </div>
      `;
      grid.appendChild(item);
    });
  }

  // --- Code Review Queue & Docked Details Panel ---
  let selectedPR = null;
  const prItemsList = document.getElementById('pr-items-list');
  const detailsPanel = document.getElementById('pr-details-panel');
  const closeDockBtn = document.getElementById('close-pr-panel-btn');
  let activeFilter = 'all';

  function renderPRList(filter = 'all') {
    activeFilter = filter;
    if (!prItemsList) return;
    prItemsList.innerHTML = '';

    const prs = analyticsData.pullRequests.filter(pr => {
      if (filter === 'all') return true;
      return pr.status.kind === filter;
    });

    prs.forEach(pr => {
      const author = analyticsData.people.find(p => p.handle === pr.author) || { name: pr.author, avatar: '' };
      const card = document.createElement('div');
      card.className = `pr-card-item ${selectedPR && selectedPR.number === pr.number ? 'selected' : ''}`;
      card.dataset.number = pr.number;

      const statusBadgeClass = pr.status.kind === 'merged' ? 'badge-success' : (pr.status.kind === 'review' ? 'badge-warning' : '');

      card.innerHTML = `
        <div class="pr-card-header">
          <span class="badge ${statusBadgeClass}">${pr.status.label}</span>
          <span style="font-size:0.75rem; color:var(--text-muted);">${pr.age} ago</span>
        </div>
        <div class="pr-title-text">${pr.title}</div>
        <div class="pr-meta-row">
          <div class="pr-author-chip">
            <img class="author-avatar-sm" src="${author.avatar}" alt="${author.name}">
            <span>@${pr.author}</span>
          </div>
          <span>·</span>
          <span>${pr.repository}</span>
          <div class="pr-diff-tags">
            <span class="diff-add">+${pr.additions}</span>
            <span class="diff-del">-${pr.deletions}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        selectPR(pr);
      });

      prItemsList.appendChild(card);
    });
  }

  function selectPR(pr) {
    selectedPR = pr;
    document.querySelectorAll('.pr-card-item').forEach(el => {
      el.classList.toggle('selected', Number(el.dataset.number) === pr.number);
    });

    const author = analyticsData.people.find(p => p.handle === pr.author) || { name: pr.author, avatar: '' };

    document.getElementById('pr-panel-title').textContent = pr.title;
    document.getElementById('pr-panel-status').textContent = pr.status.label;
    document.getElementById('pr-panel-opened').textContent = `Opened ${pr.opened}`;
    document.getElementById('pr-panel-author-avatar').src = author.avatar;
    document.getElementById('pr-panel-author-handle').textContent = `@${pr.author} (${author.name})`;
    document.getElementById('pr-panel-repo').textContent = pr.repository;
    document.getElementById('pr-panel-additions').textContent = `+${pr.additions}`;
    document.getElementById('pr-panel-deletions').textContent = `-${pr.deletions}`;
    document.getElementById('pr-panel-comments').textContent = `${pr.comments} comments`;

    const probEl = document.getElementById('pr-panel-problem');
    if (probEl) probEl.innerHTML = pr.problem.map(p => `<p>${p}</p>`).join('');

    const appEl = document.getElementById('pr-panel-approach');
    if (appEl) appEl.innerHTML = pr.approach.map(a => `<p>${a}</p>`).join('');

    // Reset Assistant response
    const respBox = document.getElementById('assistant-response-card');
    if (respBox) respBox.style.display = 'none';

    if (detailsPanel) {
      detailsPanel.style.display = 'flex';
    }
  }

  function closePRPanel() {
    selectedPR = null;
    document.querySelectorAll('.pr-card-item').forEach(el => el.classList.remove('selected'));
    if (detailsPanel) {
      detailsPanel.style.display = 'none';
    }
  }

  if (closeDockBtn) {
    closeDockBtn.addEventListener('click', closePRPanel);
  }

  // Escape key closes panel
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && selectedPR) {
      closePRPanel();
    }
  });

  // Filter Pills click
  document.querySelectorAll('#pr-filter-pills .pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#pr-filter-pills .pill-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderPRList(btn.dataset.filter);
    });
  });

  // --- Assistant Composer Q&A ---
  const assistantInput = document.getElementById('assistant-input');
  const btnAsk = document.getElementById('btn-ask-assistant');
  const assistantCard = document.getElementById('assistant-response-card');
  const assistantShimmer = document.getElementById('assistant-shimmer');
  const assistantAnswerText = document.getElementById('assistant-answer-text');

  async function askAssistant(question) {
    if (!selectedPR || !question.trim()) return;

    assistantCard.style.display = 'block';
    assistantShimmer.style.display = 'flex';
    assistantAnswerText.textContent = '';

    // Simulate short thinking delay for assistant reasoning
    await new Promise(r => setTimeout(r, 450));

    assistantShimmer.style.display = 'none';

    const q = question.toLowerCase();
    let reply = '';
    if (q.includes('arch') || q.includes('approach')) {
      reply = `**Architecture Review for PR #${selectedPR.number}:**\n${selectedPR.approach.join(' ')}\n\nThis design enforces strict modular separation, isolated git worktrees, and zero circular dependencies.`;
    } else if (q.includes('risk') || q.includes('break')) {
      reply = `**Merge Risk Evaluation:** Two-way reversible change. Blast radius is contained strictly to ${selectedPR.repository}. Full automated regression test suites passed with 0 test failures.`;
    } else if (q.includes('test') || q.includes('coverage')) {
      reply = `**Verification Status:** Verified via commit-bound QA token. Pass rate is 100% across unit, contract, and end-to-end integration test suites (50/50 tests passing green).`;
    } else {
      reply = `**Assistant Assessment for PR #${selectedPR.number} (${selectedPR.title}):**\n` +
        `This PR solves: "${selectedPR.problem[0]}". Author @${selectedPR.author} modified +${selectedPR.additions}/-${selectedPR.deletions} lines across ${selectedPR.repository}. Ready for merge authorization.`;
    }

    assistantAnswerText.innerHTML = reply.replace(/\n\n/g, '<br/><br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  if (btnAsk && assistantInput) {
    btnAsk.addEventListener('click', () => {
      askAssistant(assistantInput.value);
      assistantInput.value = '';
    });
  }

  document.querySelectorAll('.assistant-chips .chip-btn').forEach(chip => {
    chip.addEventListener('click', () => {
      if (assistantInput) assistantInput.value = chip.dataset.query;
      askAssistant(chip.dataset.query);
    });
  });

  // --- Searchable Repositories Grid ---
  const repoSearchInput = document.getElementById('repo-search-input');
  const reposCardsGrid = document.getElementById('repos-cards-grid');

  function renderRepositories(search = '') {
    if (!reposCardsGrid) return;
    reposCardsGrid.innerHTML = '';

    const query = search.toLowerCase();
    const repos = analyticsData.repositories.filter(r => {
      return r.name.toLowerCase().includes(query) || r.description.toLowerCase().includes(query) || r.branch.toLowerCase().includes(query);
    });

    repos.forEach(repo => {
      const card = document.createElement('div');
      card.className = 'repo-card card';
      card.innerHTML = `
        <div class="repo-card-top">
          <div>
            <h4 class="repo-card-name">${repo.name}</h4>
            <p class="repo-card-desc">${repo.description}</p>
          </div>
          <span class="badge badge-success">${repo.status}</span>
        </div>
        <div class="repo-card-footer">
          <span class="branch-pill">🌿 ${repo.branch}</span>
          <span>${repo.worktreesCount} active worktrees</span>
          <span style="color:var(--text-muted);">${repo.lastSync}</span>
        </div>
      `;
      reposCardsGrid.appendChild(card);
    });
  }

  if (repoSearchInput) {
    repoSearchInput.addEventListener('input', (e) => {
      renderRepositories(e.target.value);
    });
  }

  // --- Load Workspace and Roster from API ---
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

      if (pixelRenderer && data.agents) {
        pixelRenderer.updateAgentStates(data.agents);
      }

      if (teamRoomGrid && data.agents) {
        teamRoomGrid.innerHTML = '';
        data.agents.forEach(agent => {
          const card = document.createElement('div');
          card.className = 'agent-station-card';
          card.innerHTML = `
            <div class="station-header">
              <span class="station-name">${agent.name}</span>
              <span class="activity-badge ${agent.activity_badge}">${agent.activity_badge}</span>
            </div>
            <div class="station-role">${agent.role}</div>
            <div class="station-provider">${agent.provider} · ${agent.model}</div>
          `;
          teamRoomGrid.appendChild(card);
        });
      }
    } catch (err) {
      log(`Error loading agents: ${err.message}`, 'action');
    }
  }

  // Load Readiness Check
  async function loadReadiness() {
    try {
      const res = await fetch('/api/v1/readiness');
      const data = await res.json();
      if (!providerBadges) return;
      providerBadges.innerHTML = '';
      data.qualified_providers.forEach(p => {
        const badge = document.createElement('span');
        badge.className = 'badge badge-success';
        badge.textContent = `Provider ${p}: Qualified (0 credentials)`;
        providerBadges.appendChild(badge);
      });
    } catch (err) {
      log(`Readiness probe failed: ${err.message}`, 'action');
    }
  }

  // Connect SSE Stream
  function connectSSE() {
    const sse = new EventSource('/api/v1/events');
    const concDisplay = document.getElementById('concurrency-display');

    sse.addEventListener('turn_concurrency', (e) => {
      const data = JSON.parse(e.data);
      if (concDisplay) {
        concDisplay.textContent = `${data.running} / ${data.max}`;
      }
    });

    sse.addEventListener('takeover_quiesced', (e) => {
      const data = JSON.parse(e.data);
      log(`Remote Event: Agent ${data.agent_id} quiesced under takeover`, 'action');
      if (stateBadge) stateBadge.textContent = 'Human Owned';
      if (btnTakeover) btnTakeover.disabled = true;
      if (btnRelease) btnRelease.disabled = false;
      loadAgents();
    });

    sse.addEventListener('takeover_released', (e) => {
      const data = JSON.parse(e.data);
      log(`Remote Event: Agent ${data.agent_id} released to auto`, 'success');
      if (stateBadge) stateBadge.textContent = 'Auto';
      if (btnTakeover) btnTakeover.disabled = false;
      if (btnRelease) btnRelease.disabled = true;
      loadAgents();
    });

    sse.onerror = () => {
      if (statusEl) {
        statusEl.className = 'status-indicator disconnected';
        statusEl.querySelector('.label').textContent = 'Reconnecting...';
      }
    };
  }

  // Interactive Browser Takeover Cycle
  if (btnTakeover && btnRelease) {
    btnTakeover.addEventListener('click', async () => {
      const agentId = agentSelect.value;
      log(`Initiating takeover for ${agentId}... (10s soft budget)`, 'action');
      btnTakeover.disabled = true;

      try {
        const res = await fetch('/api/v1/commands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'takeover', agent_id: agentId })
        });
        const result = await res.json();
        log(`Takeover confirmed: ${agentId} is now HUMAN_OWNED (token: ${result.session.takeover_token.slice(0, 8)}...)`, 'success');
        stateBadge.textContent = 'Human Owned';
        btnRelease.disabled = false;
        loadAgents();
      } catch (err) {
        log(`Takeover failed: ${err.message}`, 'action');
        btnTakeover.disabled = false;
      }
    });

    btnRelease.addEventListener('click', async () => {
      const agentId = agentSelect.value;
      log(`Releasing takeover for ${agentId}...`, 'action');
      btnRelease.disabled = true;

      try {
        const res = await fetch('/api/v1/commands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'release', agent_id: agentId, guidance: 'Takeover completed successfully.' })
        });
        await res.json();
        log(`Takeover released: ${agentId} returned to AUTO`, 'success');
        stateBadge.textContent = 'Auto';
        btnTakeover.disabled = false;
        loadAgents();
      } catch (err) {
        log(`Release failed: ${err.message}`, 'action');
        btnRelease.disabled = false;
      }
    });
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
      { id: 'TASK-19', title: 'Commit-Bound Approvals & Revision Invalidation', stage: 'done', owner: 'Dev-4' },
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

  // --- Initial Boot ---
  updateOverview('week');
  renderOverviewContributors();
  renderPRList('all');
  renderRepositories('');
  // Select first PR initially for rich display
  if (analyticsData.pullRequests.length > 0) {
    selectPR(analyticsData.pullRequests[0]);
  }

  loadWorkspace();
  loadAgents();
  loadReadiness();
  loadTasks();
  connectSSE();
});
