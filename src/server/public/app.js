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
  const terminal = document.getElementById('takeover-terminal-log');
  const terminalEmulator = document.getElementById('takeover-terminal-emulator');
  const mobileKeys = document.getElementById('terminal-mobile-keys');
  const terminalAlert = document.getElementById('agent-terminal-alert');
  const backupFeedback = document.getElementById('agent-backup-feedback');
  const btnTakeover = document.getElementById('btn-takeover');
  const btnRelease = document.getElementById('btn-release');
  const agentSelect = document.getElementById('takeover-agent-select');
  const takeoverTokens = new Map();
  try {
    Object.entries(JSON.parse(sessionStorage.getItem('agentcrew.takeoverTokens') || '{}')).forEach(([agent, token]) => takeoverTokens.set(agent, token));
  } catch (_) {}
  function persistTakeoverTokens() {
    try { sessionStorage.setItem('agentcrew.takeoverTokens', JSON.stringify(Object.fromEntries(takeoverTokens))); } catch (_) {}
  }
  const stateBadge = document.getElementById('takeover-state-badge');
  const agentSearchInput = document.getElementById('agent-search');
  const agentRosterCount = document.getElementById('agent-roster-count');
  const agentStatusSummary = document.getElementById('agent-status-summary');
  const agentFilterButtons = document.querySelectorAll('.agent-filter[data-agent-filter]');
  const roomMapView = document.getElementById('room-map-view');
  const teamRoomView = document.getElementById('view-team-room');
  let liveAgents = [];
  let selectedAgentName = '';
  let activeAgentFilter = 'all';

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
  const mobileThemeBtn = document.getElementById('mobile-theme-btn');
  const themeLabelText = document.getElementById('theme-label-text');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionEase = 'cubic-bezier(0.16, 1, 0.3, 1)';
  let themeTransitionTimer = null;

  function applyTheme(theme, animate = false) {
    if (animate) {
      document.body.classList.add('theme-transitioning');
      window.clearTimeout(themeTransitionTimer);
      themeTransitionTimer = window.setTimeout(() => {
        document.body.classList.remove('theme-transitioning');
      }, 220);
    }
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
        selectAgentByName(agent.name);
        log(`Inspecting ${agent.name} (${agent.role}) via isometric station`, 'system');
      }
    });
  }

  applyTheme(initialTheme);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      const next = current === 'dark' ? 'light' : 'dark';
      applyTheme(next, true);
      log(`Switched interface theme to ${next}`, 'system');
    });
  }

  if (mobileThemeBtn) {
    mobileThemeBtn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'light';
      applyTheme(current === 'dark' ? 'light' : 'dark', true);
    });
  }

  // --- Full-Screen Navigation Tabs ---
  const navTabs = document.querySelectorAll('.nav-tab, .mobile-nav-tab[data-view]');
  const views = document.querySelectorAll('.fullscreen-view');
  const appSidebar = document.getElementById('app-sidebar');
  const sidebarBackdrop = document.getElementById('sidebar-backdrop');
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMoreBtn = document.getElementById('mobile-more-btn');
  const mobileSidebarClose = document.getElementById('mobile-sidebar-close');
  const mobileViewTitle = document.getElementById('mobile-view-title');
  const viewLabels = {
    'view-overview': 'Overview',
    'view-team-room': 'Agent Room',
    'view-reviews': 'Code Review',
    'view-kanban': 'Tasks & Flow',
    'view-repositories': 'Repositories',
    'view-observability': 'Observability',
    'view-settings': 'Settings'
  };
  const viewOrder = Object.keys(viewLabels);
  let viewAnimation = null;

  function animateElement(element, keyframes, options) {
    if (!element || typeof element.animate !== 'function') return null;
    return element.animate(keyframes, { easing: motionEase, fill: 'both', ...options });
  }

  function setMobileDrawer(open) {
    if (!appSidebar) return;
    appSidebar.classList.toggle('open', open);
    document.body.classList.toggle('mobile-drawer-open', open);
    if (sidebarBackdrop) sidebarBackdrop.classList.toggle('visible', open);
    if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', String(open));
    if (mobileMoreBtn) mobileMoreBtn.setAttribute('aria-expanded', String(open));
  }

  function switchView(targetViewId) {
    const currentView = document.querySelector('.fullscreen-view.active');
    if (!document.getElementById(targetViewId) || currentView?.id === targetViewId) {
      setMobileDrawer(false);
      return;
    }
    const direction = viewOrder.indexOf(targetViewId) >= viewOrder.indexOf(currentView?.id) ? 1 : -1;
    if (targetViewId !== 'view-reviews' && typeof selectedPR !== 'undefined' && selectedPR) {
      closePRPanel();
    }
    views.forEach(v => {
      v.classList.toggle('active', v.id === targetViewId);
    });
    navTabs.forEach(t => {
      t.classList.toggle('active', t.dataset.view === targetViewId);
      if (t.dataset.view === targetViewId) t.setAttribute('aria-current', 'page');
      else t.removeAttribute('aria-current');
    });
    if (mobileViewTitle) mobileViewTitle.textContent = viewLabels[targetViewId] || 'AgentCrew';
    if (mobileMoreBtn) {
      const secondaryViews = ['view-repositories', 'view-observability', 'view-settings'];
      mobileMoreBtn.classList.toggle('active', secondaryViews.includes(targetViewId));
    }
    setMobileDrawer(false);
    const dashboard = document.querySelector('.dashboard-container');
    if (dashboard) dashboard.scrollTo({ top: 0, behavior: 'auto' });

    const targetView = document.getElementById(targetViewId);
    if (viewAnimation) viewAnimation.cancel();
    viewAnimation = animateElement(
      targetView,
      reducedMotion.matches
        ? [{ opacity: 0.72 }, { opacity: 1 }]
        : [
            { opacity: 0, transform: `translateX(${direction * 12}px)`, clipPath: 'inset(0 0 7% 0 round 12px)' },
            { opacity: 1, transform: 'translateX(0)', clipPath: 'inset(0 0 0 0 round 12px)' }
          ],
      { duration: reducedMotion.matches ? 90 : 180 }
    );
  }

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      switchView(tab.dataset.view);
    });
  });

  if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', () => setMobileDrawer(true));
  if (mobileMoreBtn) mobileMoreBtn.addEventListener('click', () => setMobileDrawer(true));
  if (mobileSidebarClose) mobileSidebarClose.addEventListener('click', () => setMobileDrawer(false));
  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', () => setMobileDrawer(false));

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && appSidebar && appSidebar.classList.contains('open')) {
      setMobileDrawer(false);
      if (mobileMenuBtn) mobileMenuBtn.focus();
    }
  });

  window.matchMedia('(min-width: 901px)').addEventListener('change', event => {
    if (event.matches) setMobileDrawer(false);
  });

  if (btnTogglePixel && roomMapView && teamRoomView) {
    btnTogglePixel.addEventListener('click', () => {
      const openMap = roomMapView.hidden;
      roomMapView.hidden = !openMap;
      teamRoomView.classList.toggle('map-view-active', openMap);
      btnTogglePixel.setAttribute('aria-expanded', String(openMap));
      btnTogglePixel.textContent = openMap ? 'Back to agent room' : 'Open room map';
      if (openMap) {
        pixelWrapper.style.display = 'flex';
        animateElement(
          roomMapView,
          reducedMotion.matches
            ? [{ opacity: 0.8 }, { opacity: 1 }]
            : [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: reducedMotion.matches ? 90 : 180 }
        );
      }
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
      if (btn.dataset.range === activeRange) return;
      updateOverview(btn.dataset.range);
      const overview = document.getElementById('view-overview');
      overview?.querySelectorAll('.kpi-card').forEach((card, index) => {
        animateElement(
          card,
          reducedMotion.matches
            ? [{ opacity: 0.78 }, { opacity: 1 }]
            : [{ opacity: 0.55, transform: 'translateY(5px)' }, { opacity: 1, transform: 'translateY(0)' }],
          { duration: reducedMotion.matches ? 90 : 160, delay: reducedMotion.matches ? 0 : index * 18 }
        );
      });
      const chart = document.querySelector('.activity-chart-card');
      animateElement(
        chart,
        reducedMotion.matches
          ? [{ opacity: 0.8 }, { opacity: 1 }]
          : [{ opacity: 0.65, clipPath: 'inset(0 3% 0 0)' }, { opacity: 1, clipPath: 'inset(0 0 0 0)' }],
        { duration: reducedMotion.matches ? 90 : 200 }
      );
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
  const prPanelBackdrop = document.getElementById('pr-panel-backdrop');
  const closeDockBtn = document.getElementById('close-pr-panel-btn');
  let prPanelReturnFocus = null;
  let activeFilter = 'all';

  if (detailsPanel && window.matchMedia('(max-width: 1180px)').matches) {
    detailsPanel.setAttribute('aria-hidden', 'true');
  }

  function renderPRList(filter = 'all') {
    activeFilter = filter;
    if (!prItemsList) return;
    prItemsList.innerHTML = '';

    const prs = analyticsData.pullRequests.filter(pr => {
      if (filter === 'all') return true;
      return pr.status.kind === filter;
    });

    prs.forEach(pr => {
      const author = analyticsData.people.find(p => p.handle === pr.author) || {
        name: pr.author,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${pr.author}`
      };
      const card = document.createElement('button');
      card.type = 'button';
      card.className = `pr-card-item ${selectedPR && selectedPR.number === pr.number ? 'selected' : ''}`;
      card.dataset.number = pr.number;
      card.setAttribute('aria-label', `Open pull request ${pr.number}: ${pr.title}`);

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
    prPanelReturnFocus = document.activeElement;
    selectedPR = pr;
    document.querySelectorAll('.pr-card-item').forEach(el => {
      el.classList.toggle('selected', Number(el.dataset.number) === pr.number);
    });

    const author = analyticsData.people.find(p => p.handle === pr.author) || {
      name: pr.author,
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${pr.author}`
    };

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
    const problems = Array.isArray(pr.problem) ? pr.problem : [pr.problem || 'No description provided.'];
    if (probEl) probEl.innerHTML = problems.map(p => `<p>${p}</p>`).join('');

    const appEl = document.getElementById('pr-panel-approach');
    const approaches = Array.isArray(pr.approach) ? pr.approach : [pr.approach || 'No approach summary provided.'];
    if (appEl) appEl.innerHTML = approaches.map(a => `<p>${a}</p>`).join('');

    // Reset Assistant response
    const respBox = document.getElementById('assistant-response-card');
    if (respBox) respBox.style.display = 'none';

    if (detailsPanel) {
      detailsPanel.style.removeProperty('display');
      if (!window.matchMedia('(max-width: 1180px)').matches) {
        detailsPanel.style.display = 'flex';
      }
      detailsPanel.setAttribute('aria-hidden', 'false');
      if (window.matchMedia('(max-width: 1180px)').matches) {
        document.body.classList.add('pr-panel-open');
        if (closeDockBtn) closeDockBtn.focus();
      }
    }
  }

  function closePRPanel() {
    selectedPR = null;
    document.querySelectorAll('.pr-card-item').forEach(el => el.classList.remove('selected'));
    if (detailsPanel) {
      detailsPanel.setAttribute('aria-hidden', 'true');
      if (!window.matchMedia('(max-width: 1180px)').matches) {
        detailsPanel.style.display = 'none';
      } else {
        detailsPanel.style.removeProperty('display');
      }
    }
    document.body.classList.remove('pr-panel-open');
    if (prPanelReturnFocus && typeof prPanelReturnFocus.focus === 'function') {
      prPanelReturnFocus.focus();
    }
    prPanelReturnFocus = null;
  }

  if (closeDockBtn) {
    closeDockBtn.addEventListener('click', closePRPanel);
  }
  if (prPanelBackdrop) {
    prPanelBackdrop.addEventListener('click', closePRPanel);
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

    // Determine target agent persona based on question or PR reviewer
    let targetAgent = 'Arthur (Architect)';
    const q = question.toLowerCase();
    if (q.includes('test') || q.includes('coverage') || q.includes('qa')) {
      targetAgent = 'QA Lead';
    } else if (q.includes('author') || q.includes('why')) {
      targetAgent = selectedPR.author || 'Dev-1';
    }

    try {
      const res = await fetch('/api/v1/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command_type: 'agent.ask',
          payload: {
            agent_id: targetAgent,
            pr_number: selectedPR.number,
            pr_title: selectedPR.title,
            question: question.trim(),
            author: selectedPR.author,
          }
        })
      });

      const data = await res.json();
      assistantShimmer.style.display = 'none';
      if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
      if (!data.result?.answer) throw new Error('Provider returned no review answer');
      assistantAnswerText.textContent = data.result.answer;
      assistantAnswerText.style.color = '';
    } catch (err) {
      assistantShimmer.style.display = 'none';
      assistantAnswerText.textContent = `Failed to query agent: ${err.message}`;
      assistantAnswerText.style.color = 'var(--danger)';
    }
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
      const warning = document.getElementById('remote-http-warning');
      if (warning) warning.hidden = !data.public_http_warning;
    } catch (err) {
      log(`Error loading workspace: ${err.message}`, 'action');
    }
  }

  const agentStatusMeta = {
    'needs-you': { label: 'Needs you', group: 'Needs you' },
    working: { label: 'Working', group: 'Working' },
    review: { label: 'To review', group: 'To review' },
    available: { label: 'Ready', group: 'Available' }
  };

  function getAgentStatus(agent) {
    if (agent.provider_status === 'disconnected' && !agent.active_provider) return 'needs-you';
    const raw = String(agent.activity_badge || agent.state || 'idle').toLowerCase().replace(/[ _]+/g, '-');
    if (/takeover|human-owned|waiting|blocked|stuck|needs-input|needs-you/.test(raw)) return 'needs-you';
    if (/review|approval/.test(raw)) return 'review';
    if (/working|running|active|thinking/.test(raw)) return 'working';
    return 'available';
  }

  function isAgentHumanOwned(agent) {
    const raw = String(agent?.state || agent?.activity_badge || '').toLowerCase().replace(/[ _]+/g, '-');
    return raw === 'takeover' || raw === 'human-owned' || raw === 'human-owned-session';
  }

  function getAgentColor(agent) {
    const person = analyticsData.people.find(p => p.name.toLowerCase() === String(agent.name).toLowerCase());
    return person?.color || 'var(--accent-primary)';
  }

  function updateAgentWorkspace(agent) {
    if (!agent) return;
    const nameEl = document.getElementById('selected-agent-name');
    const avatarEl = document.getElementById('selected-agent-avatar');
    const statusEl = document.getElementById('selected-agent-status');
    const owned = isAgentHumanOwned(agent);
    const status = getAgentStatus(agent);
    const statusLabel = agent.provider_status === 'disconnected' && !agent.active_provider ? 'Disconnected'
      : owned ? 'Human owned' : agentStatusMeta[status].label;
    const stateText = document.getElementById('agent-session-state');

    if (nameEl) nameEl.textContent = agent.name;
    if (avatarEl) {
      avatarEl.textContent = agent.name.slice(0, 2).toUpperCase();
      avatarEl.style.setProperty('--agent-avatar-color', getAgentColor(agent));
    }
    if (statusEl) {
      statusEl.textContent = statusLabel;
      statusEl.dataset.state = status;
      statusEl.classList.toggle('is-human-owned', owned);
    }
    const roleEl = document.getElementById('selected-agent-role');
    if (roleEl) roleEl.textContent = agent.role || 'Agent';
    const providerEl = document.getElementById('selected-agent-provider');
    if (providerEl) providerEl.textContent = String(agent.active_provider || agent.provider || 'Provider').toUpperCase();
    const providerStatusEl = document.getElementById('selected-agent-provider-status');
    if (providerStatusEl) providerStatusEl.textContent = agent.active_provider && agent.active_provider !== agent.provider
      ? `Backup active · ${agent.provider} disconnected`
      : agent.provider_status === 'disconnected' ? 'Disconnected · CLI unavailable' : 'CLI detected · sign-in unverified';
    const modelEl = document.getElementById('selected-agent-model');
    if (modelEl) modelEl.textContent = agent.model || '';
    const taskEl = document.getElementById('selected-agent-task');
    const taskId = agent.active_task_id || agent.activeTaskId;
    if (taskEl) taskEl.textContent = taskId ? `Task ${taskId}` : 'No active task assigned';
    const idEl = document.getElementById('selected-agent-id');
    if (idEl) idEl.textContent = agent.id ? `ID ${String(agent.id).slice(0, 8)}` : '';
    const guidanceEl = document.getElementById('selected-agent-guidance');
    if (guidanceEl) guidanceEl.textContent = owned
      ? 'You control the native CLI. Type in the terminal; Shell is separate.'
      : 'Take over to open this agent’s CLI. Shell commands use a separate channel.';
    const captionEl = document.getElementById('agent-session-caption');
    if (captionEl) captionEl.textContent = owned
      ? terminalReady ? 'Connected to the selected agent’s live terminal.' : 'Takeover acquired; connecting to the CLI…'
      : 'Live output appears here when a session is connected.';
    if (stateBadge) stateBadge.textContent = owned ? 'Human owned' : 'Auto';
    if (btnTakeover) btnTakeover.disabled = owned;
    if (btnRelease) btnRelease.disabled = !owned;
    if (cmdInput) cmdInput.disabled = !owned;
    if (btnSendCmd) btnSendCmd.disabled = !owned;
    if (stateText) stateText.textContent = owned ? (terminalReady ? 'Connected' : 'Connecting') : statusLabel;
    if (agentSelect && agentSelect.value !== agent.name) agentSelect.value = agent.name;
    const backupSelect = document.getElementById('agent-backup-provider');
    const backupModel = document.getElementById('agent-backup-model');
    if (backupSelect) {
      [...backupSelect.options].forEach(option => { option.disabled = option.value === agent.provider; });
      backupSelect.value = agent.backup_provider || '';
    }
    if (backupModel) backupModel.value = agent.backup_model || '';
  }

  function renderAgentRoster() {
    if (!teamRoomGrid) return;
    teamRoomGrid.replaceChildren();
    const query = (agentSearchInput?.value || '').trim().toLowerCase();
    const filtered = liveAgents.filter(agent => {
      const status = getAgentStatus(agent);
      const matchesFilter = activeAgentFilter === 'all' || status === activeAgentFilter;
      const text = `${agent.name} ${agent.role} ${agent.provider} ${agent.model}`.toLowerCase();
      return matchesFilter && (!query || text.includes(query));
    });
    const groups = [
      ['needs-you', 'Needs you'],
      ['working', 'Working'],
      ['review', 'To review'],
      ['available', 'Available']
    ];

    groups.forEach(([status, label]) => {
      const agents = filtered.filter(agent => getAgentStatus(agent) === status);
      if (!agents.length) return;
      const group = document.createElement('section');
      group.className = `agent-status-group status-${status}`;
      const heading = document.createElement('h4');
      heading.className = 'agent-status-heading';
      heading.innerHTML = `<span>${label}</span><span>${agents.length}</span>`;
      group.appendChild(heading);

      agents.forEach(agent => {
        const row = document.createElement('button');
        const humanOwned = isAgentHumanOwned(agent);
        row.type = 'button';
        row.className = 'agent-roster-row';
        row.dataset.agentName = agent.name;
        row.dataset.status = status;
        row.setAttribute('aria-pressed', String(agent.name === selectedAgentName));
        row.setAttribute('aria-label', `${agent.name}, ${agent.role || 'Agent'}, ${humanOwned ? 'human owned' : agentStatusMeta[status].label}`);

        const avatar = document.createElement('span');
        avatar.className = 'agent-roster-avatar';
        avatar.textContent = agent.name.slice(0, 2).toUpperCase();
        avatar.style.setProperty('--agent-avatar-color', getAgentColor(agent));
        avatar.setAttribute('aria-hidden', 'true');
        const identity = document.createElement('span');
        identity.className = 'agent-roster-identity';
        const name = document.createElement('strong');
        name.textContent = agent.name;
        const meta = document.createElement('span');
        meta.textContent = `${agent.role || 'Agent'} · ${agent.provider || 'Provider'}`;
        identity.append(name, meta);
        const presence = document.createElement('i');
        presence.className = `agent-presence-dot ${humanOwned ? 'human-owned' : ''}`;
        presence.setAttribute('aria-hidden', 'true');
        row.append(avatar, identity, presence);
        row.addEventListener('click', () => selectAgent(agent));
        group.appendChild(row);
      });
      teamRoomGrid.appendChild(group);
    });

    if (!filtered.length) {
      const empty = document.createElement('p');
      empty.className = 'agent-roster-empty';
      empty.textContent = liveAgents.length ? 'No agents match this filter.' : 'No agents are available.';
      teamRoomGrid.appendChild(empty);
    }

    if (agentRosterCount) {
      agentRosterCount.textContent = `${liveAgents.length} ${liveAgents.length === 1 ? 'agent' : 'agents'}`;
    }
    const counts = groups.map(([status, label]) => ({ status, label, count: liveAgents.filter(agent => getAgentStatus(agent) === status).length }));
    if (agentStatusSummary) {
      agentStatusSummary.replaceChildren();
      counts.forEach(({ status, label, count }) => {
        if (!count) return;
        const item = document.createElement('div');
        item.className = `agent-summary-item status-${status}`;
        item.innerHTML = `<i aria-hidden="true"></i><strong>${count}</strong><span>${label}</span>`;
        agentStatusSummary.appendChild(item);
      });
    }
  }

  function selectAgent(agent) {
    if (!agent) return;
    const changedAgent = selectedAgentName && selectedAgentName !== agent.name;
    if (changedAgent && ptySocket) disconnectPty();
    if (changedAgent && backupFeedback) backupFeedback.textContent = '';
    selectedAgentName = agent.name;
    updateAgentWorkspace(agent);
    renderAgentRoster();
    if (takeoverTokens.has(agent.name) && (!ptySocket || changedAgent)) connectPty(agent.name);
  }

  function selectAgentByName(name) {
    const agent = liveAgents.find(item => item.name === name);
    if (agent) selectAgent(agent);
  }

  agentFilterButtons.forEach(button => {
    button.addEventListener('click', () => {
      activeAgentFilter = button.dataset.agentFilter;
      agentFilterButtons.forEach(item => {
        const active = item === button;
        item.classList.toggle('active', active);
        item.setAttribute('aria-pressed', String(active));
      });
      renderAgentRoster();
    });
  });

  if (agentSearchInput) agentSearchInput.addEventListener('input', renderAgentRoster);
  if (agentSelect) agentSelect.addEventListener('change', () => selectAgentByName(agentSelect.value));

  document.addEventListener('keydown', event => {
    if (event.key === '/' && !event.metaKey && !event.ctrlKey && !event.altKey &&
      !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      event.preventDefault();
      agentSearchInput?.focus();
    }
  });

  // Load Agent Stations
  async function loadAgents() {
    try {
      const res = await fetch('/api/v1/agents');
      const data = await res.json();
      liveAgents = Array.isArray(data.agents) ? data.agents : [];

      if (agentSelect) {
        const current = selectedAgentName || agentSelect.value;
        agentSelect.replaceChildren();
        liveAgents.forEach(agent => {
          const option = document.createElement('option');
          option.value = agent.name;
          option.textContent = `${agent.name} · ${agent.role || agent.provider}`;
          agentSelect.appendChild(option);
        });
        if (liveAgents.some(agent => agent.name === current)) agentSelect.value = current;
      }

      if (pixelRenderer && data.agents) {
        pixelRenderer.updateAgentStates(data.agents);
      }

      if (teamRoomGrid && data.agents) {
        renderAgentRoster();
        const selected = liveAgents.find(agent => agent.name === selectedAgentName) ||
          liveAgents.find(agent => agent.name === agentSelect?.value) ||
          liveAgents.find(agent => agent.name === 'Dev-1') || liveAgents[0];
        if (selected) selectAgent(selected);
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
      const list = data.providers || [];
      list.forEach(p => {
        const badge = document.createElement('span');
        const statusLabel = p.status === 'available' ? 'Available'
          : p.status === 'quota_limited' ? 'Quota limited' : 'Unavailable';
        badge.className = `badge ${p.status === 'available' ? 'badge-success' : 'badge-warning'}`;
        const reset = p.reset_at ? ` · resets ${new Date(p.reset_at).toLocaleTimeString()}` : '';
        badge.textContent = `Provider ${p.name}: ${statusLabel}${reset}`;
        const affectedAgents = p.agents?.length ? ` Assigned agents: ${p.agents.join(', ')}.` : '';
        badge.title = `${p.reason || `${p.name} runner detected`}${affectedAgents}`;
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

    sse.addEventListener('agent_answered', (e) => {
      const data = JSON.parse(e.data);
      loadReadiness();
      if (pixelRenderer && data.agent_id) {
        const bubblePreview = data.answer.replace(/\[\d+m/g, '').replace(/[\r\n]+/g, ' ').slice(0, 28);
        pixelRenderer.showSpeechBubble(data.agent_id, bubblePreview, 5000);
      }
      if (data.pr_number && data.pr_number !== 'live') {
        log(`[${data.agent_id}] Response regarding PR #${data.pr_number}: ${data.question}`, 'success');
      }
    });

    sse.addEventListener('agent_thinking', (e) => {
      const data = JSON.parse(e.data);
      pixelRenderer?.updateAgentStates([{ name: data.agent_id, state: 'thinking' }]);
    });

    sse.addEventListener('agent_thinking_ended', (e) => {
      const data = JSON.parse(e.data);
      pixelRenderer?.updateAgentStates([{ name: data.agent_id, state: data.state || 'idle' }]);
    });

    sse.addEventListener('command_executed', (e) => {
      const data = JSON.parse(e.data);
      if (pixelRenderer && data.agent_id) {
        pixelRenderer.showSpeechBubble(data.agent_id, `Cmd: ${data.command.slice(0, 15)}`, 3000);
      }
    });

    sse.onerror = () => {
      if (statusEl) {
        statusEl.className = 'status-indicator disconnected';
        statusEl.querySelector('.label').textContent = 'Reconnecting...';
      }
    };
  }

  // Interactive Browser Takeover Cycle
  document.getElementById('save-agent-backup')?.addEventListener('click', async () => {
    const agentId = selectedAgentName;
    const backupProvider = document.getElementById('agent-backup-provider')?.value || null;
    const backupModel = document.getElementById('agent-backup-model')?.value.trim() || null;
    try {
      const response = await fetch('/api/v1/commands', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command_type: 'agent.provider_config', payload: {
          agent_id: agentId, backup_provider: backupProvider, backup_model: backupModel,
        } }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Could not save backup provider');
      log(`${agentId}: ${backupProvider ? `explicit backup ${backupProvider} saved` : 'strict provider routing saved'}`, 'success');
      if (backupFeedback) backupFeedback.textContent = backupProvider ? `${backupProvider} backup saved` : 'Strict routing saved';
      await loadAgents();
    } catch (error) {
      log(`Provider setting failed: ${error.message}`, 'action');
      if (backupFeedback) backupFeedback.textContent = `Could not save: ${error.message}`;
    }
  });

  if (btnTakeover && btnRelease) {
    btnTakeover.addEventListener('click', async () => {
      const agentId = selectedAgentName || agentSelect?.value || 'Dev-1';
      log(`Initiating takeover for ${agentId}... (10s soft budget)`, 'action');
      btnTakeover.disabled = true;

      try {
        const res = await fetch('/api/v1/commands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'takeover', agent_id: agentId })
        });
        const result = await res.json();
        if (!res.ok || result.status !== 'acknowledged' || !result.result?.takeover_token) {
          throw new Error(result.error || 'Takeover was not acquired');
        }
        const token = result.result.takeover_token;
        takeoverTokens.set(agentId, token);
        persistTakeoverTokens();
        log(`Takeover confirmed: ${agentId} is now HUMAN_OWNED`, 'success');
        stateBadge.textContent = 'Human Owned';
        btnRelease.disabled = false;
        if (cmdInput) cmdInput.disabled = false;
        if (btnSendCmd) btnSendCmd.disabled = false;
        if (cmdInput) cmdInput.focus();
        connectPty(agentId);
        if (pixelRenderer) {
          pixelRenderer.showSpeechBubble(agentId, 'Operator Live Takeover', 8000);
        }
        loadAgents();
      } catch (err) {
        reportTerminalIssue(`Takeover failed: ${err.message}`);
        btnTakeover.disabled = false;
      }
    });

    btnRelease.addEventListener('click', async () => {
      const agentId = selectedAgentName || agentSelect?.value || 'Dev-1';
      log(`Releasing takeover for ${agentId}...`, 'action');
      btnRelease.disabled = true;

      try {
        const res = await fetch('/api/v1/commands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'release', agent_id: agentId, takeover_token: takeoverTokens.get(agentId), guidance: 'Takeover completed successfully.' })
        });
        const released = await res.json();
        if (!res.ok) throw new Error(released.error || 'Release failed');
        takeoverTokens.delete(agentId);
        persistTakeoverTokens();
        log(`Takeover released: ${agentId} returned to AUTO`, 'success');
        stateBadge.textContent = 'Auto';
        btnTakeover.disabled = false;
        disconnectPty();
        clearTerminalIssue();
        setSessionConnectionState('Ready', 'Take over to connect this agent’s CLI.');
        if (cmdInput) {
          cmdInput.disabled = true;
          cmdInput.value = '';
        }
        if (btnSendCmd) btnSendCmd.disabled = true;
        loadAgents();
      } catch (err) {
        reportTerminalIssue(`Release failed: ${err.message}`);
        btnRelease.disabled = false;
      }
    });
  }

  // --- Live WebSocket PTY Interface for Takeover ---
  let ptySocket = null;
  let terminalInstance = null;
  let fitAddon = null;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let controlPending = false;
  let resumeRequested = false;
  let terminalReady = false;
  const cmdInput = document.getElementById('takeover-command-input');
  const btnSendCmd = document.getElementById('btn-send-command');
  const shellComposer = document.getElementById('takeover-shell-composer');
  const modeButtons = document.querySelectorAll('[data-input-mode]');
  let inputMode = 'agent_tui';

  function setSessionConnectionState(state, caption) {
    const stateEl = document.getElementById('agent-session-state');
    const captionEl = document.getElementById('agent-session-caption');
    if (stateEl) stateEl.textContent = state;
    if (captionEl) captionEl.textContent = caption;
  }

  function reportTerminalIssue(message) {
    log(message, 'action');
    if (terminalAlert) {
      terminalAlert.textContent = message;
      terminalAlert.hidden = false;
    }
    setSessionConnectionState('Unavailable', message);
    if (inputMode === 'agent_tui') terminalInstance?.writeln(`\r\n[AgentCrew] ${message}`);
  }

  function clearTerminalIssue() {
    if (terminalAlert) terminalAlert.hidden = true;
  }

  function showTerminalMode() {
    const tui = inputMode === 'agent_tui';
    if (terminalEmulator) terminalEmulator.hidden = !tui;
    if (terminal) terminal.hidden = tui;
    if (mobileKeys) mobileKeys.hidden = !tui;
    if (shellComposer) shellComposer.hidden = tui;
    if (tui && fitAddon && terminalInstance) {
      requestAnimationFrame(() => { fitAddon.fit(); sendTerminalResize(); });
    }
  }

  function sendTerminalResize() {
    if (inputMode !== 'agent_tui' || !terminalInstance || ptySocket?.readyState !== WebSocket.OPEN) return;
    ptySocket.send(JSON.stringify({ type: 'resize', cols: terminalInstance.cols, rows: terminalInstance.rows }));
  }

  function sendTerminalInput(data) {
    if (ptySocket?.readyState !== WebSocket.OPEN) return;
    if (controlPending) {
      if (/^[a-z]$/i.test(data)) data = String.fromCharCode(data.toUpperCase().charCodeAt(0) - 64);
      controlPending = false;
      const ctrl = mobileKeys?.querySelector('[data-terminal-key="control"]');
      if (ctrl) ctrl.setAttribute('aria-pressed', 'false');
    }
    ptySocket.send(JSON.stringify({ type: 'input', data }));
  }

  mobileKeys?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-terminal-key]');
    if (!button) return;
    if (button.dataset.terminalKey === 'control') {
      controlPending = !controlPending;
      button.setAttribute('aria-pressed', String(controlPending));
      terminalInstance?.focus();
      return;
    }
    const keys = { escape: '\x1b', tab: '\t', left: '\x1b[D', right: '\x1b[C', up: '\x1b[A', down: '\x1b[B' };
    controlPending = false;
    const ctrl = mobileKeys?.querySelector('[data-terminal-key="control"]');
    if (ctrl) ctrl.setAttribute('aria-pressed', 'false');
    sendTerminalInput(keys[button.dataset.terminalKey]);
    terminalInstance?.focus();
  });

  if (terminalEmulator && window.Terminal && window.FitAddon) {
    new ResizeObserver(() => {
      if (terminalInstance && !terminalEmulator.hidden) {
        fitAddon.fit();
        sendTerminalResize();
      }
    }).observe(terminalEmulator);
  }

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      inputMode = button.dataset.inputMode === 'shell' ? 'shell' : 'agent_tui';
      modeButtons.forEach((candidate) => {
        const selected = candidate.dataset.inputMode === inputMode;
        candidate.classList.toggle('active', selected);
        candidate.setAttribute('aria-pressed', String(selected));
      });
      disconnectPty();
      showTerminalMode();
      if (!btnRelease.disabled) {
        connectPty(selectedAgentName || agentSelect?.value || 'Dev-1');
      }
    });
  });

  showTerminalMode();

  function connectPty(agentId) {
    disconnectPty();
    resumeRequested = false;

    const selected = liveAgents.find((agent) => agent.name === agentId);
    if (inputMode === 'agent_tui' && selected?.provider_status === 'disconnected' && !selected.active_provider) {
      reportTerminalIssue(`${selected.provider} CLI unavailable or unqualified. Configure an explicit backup CLI or release takeover.`);
      return;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const token = takeoverTokens.get(agentId);
    if (!token) { log('[Session] Takeover token missing; connection unavailable', 'action'); return; }
    const wsUrl = `${proto}//${window.location.host}/api/v1/pty?mode=${inputMode}&agent_id=${encodeURIComponent(agentId)}&token=${encodeURIComponent(token)}`;

    try {
      const socket = new WebSocket(wsUrl);
      ptySocket = socket;

      if (inputMode === 'agent_tui') {
        if (!window.Terminal || !window.FitAddon) throw new Error('Terminal assets failed to load');
        terminalInstance = new window.Terminal({
          cursorBlink: true, scrollback: 2000, fontSize: 13, lineHeight: 1.25, screenReaderMode: true,
          theme: { background: '#0d111a', foreground: '#e5eaf2', cursor: '#71baf1' },
        });
        fitAddon = new window.FitAddon.FitAddon();
        terminalInstance.loadAddon(fitAddon);
        terminalInstance.open(terminalEmulator);
        fitAddon.fit();
        terminalInstance.onData(sendTerminalInput);
      }

      socket.onopen = () => {
        log(`[Session] Connected ${inputMode} channel for ${agentId}`, 'success');
        setSessionConnectionState('Connecting', 'WebSocket connected; waiting for the CLI…');
        if (inputMode === 'agent_tui') { sendTerminalResize(); terminalInstance?.focus(); }
      };

      socket.onmessage = (event) => {
        if (ptySocket !== socket) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'ready') {
            reconnectAttempts = 0;
            terminalReady = true;
            clearTerminalIssue();
            resumeRequested = Boolean(msg.resumeRequested);
            const label = `${msg.provider || 'Shell'}${msg.fallback ? ' (explicit backup)' : ''}`;
            log(`[PTY Ready] ${label} · ${msg.resumeRequested ? 'resume requested; verify CLI state' : 'new conversation (native ID not yet tracked)'}`, 'system');
            setSessionConnectionState('Connected', `${label} CLI connected${msg.resumeRequested ? '; verify resumed context in CLI' : ''}.`);
          } else if (msg.type === 'output') {
            if (inputMode === 'agent_tui') terminalInstance?.write(msg.data);
            else log(msg.data.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g, '').trim());
          } else if (msg.type === 'exit') {
            terminalReady = false;
            const exitText = resumeRequested && msg.exitCode !== 0
              ? 'Native resume failed; this CLI session is unavailable.'
              : `CLI exited with code ${msg.exitCode}`;
            reportTerminalIssue(exitText);
          } else if (msg.type === 'error') {
            reportTerminalIssue(msg.data);
          }
        } catch (_) {
          log(event.data);
        }
      };

      socket.onclose = () => {
        if (ptySocket !== socket) return;
        terminalReady = false;
        reportTerminalIssue('CLI connection lost. Reconnecting if takeover is still active…');
        ptySocket = null;
        if (takeoverTokens.has(agentId) && ++reconnectAttempts <= 3) {
          reconnectTimer = setTimeout(() => connectPty(agentId), 1200);
        } else if (takeoverTokens.has(agentId)) {
          reportTerminalIssue('CLI connection unavailable. Check provider readiness, then refresh this tab to retry.');
        }
      };

      socket.onerror = (err) => {
        if (ptySocket !== socket) return;
        terminalReady = false;
        reportTerminalIssue('CLI WebSocket connection failed. Check provider availability.');
      };
    } catch (err) {
      reportTerminalIssue(`Unable to connect: ${err.message}`);
    }
  }

  function disconnectPty() {
    if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
    terminalReady = false;
    controlPending = false;
    const ctrl = mobileKeys?.querySelector('[data-terminal-key="control"]');
    if (ctrl) ctrl.setAttribute('aria-pressed', 'false');
    if (ptySocket) {
      try { ptySocket.close(); } catch (_) {}
      ptySocket = null;
    }
    terminalInstance?.dispose();
    terminalInstance = null;
    fitAddon = null;
  }

  async function executeOperatorCommand() {
    if (inputMode !== 'shell') return;
    if (!cmdInput || !cmdInput.value.trim()) return;
    const commandText = cmdInput.value.trim();
    const agentId = selectedAgentName || agentSelect?.value || 'Dev-1';

    log(`[Operator > ${agentId}]$ ${commandText}`, 'action');
    cmdInput.value = '';

    if (ptySocket && ptySocket.readyState === WebSocket.OPEN) {
      ptySocket.send(JSON.stringify({ type: 'input', data: commandText, mode: inputMode }));
    } else {
      // Fallback to HTTP command dispatch
      try {
        const res = await fetch('/api/v1/commands', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command_type: 'session.exec',
            payload: { agent_id: agentId, command: commandText, mode: inputMode, takeover_token: takeoverTokens.get(agentId) }
          })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Command rejected');
        if (data.result && data.result.output) {
          log(data.result.output, 'success');
        }
      } catch (err) {
        log(`Execution error: ${err.message}`, 'action');
      }
    }
  }

  if (btnSendCmd && cmdInput) {
    btnSendCmd.addEventListener('click', executeOperatorCommand);
    cmdInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        executeOperatorCommand();
      }
    });
  }

  // Load Tasks into Kanban
  async function loadTasks() {
    let tasks = [];
    try {
      const res = await fetch('/api/v1/tasks');
      const data = await res.json();
      if (Array.isArray(data.tasks) && data.tasks.length > 0) {
        tasks = data.tasks;
      }
    } catch (err) {
      console.warn('Failed to fetch tasks from /api/v1/tasks:', err);
    }

    if (tasks.length === 0) {
      tasks = [
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
    }

    ['planning', 'in_progress', 'review', 'qa', 'done'].forEach(stage => {
      const col = document.getElementById(`tasks-${stage}`);
      if (!col) return;
      col.innerHTML = '';
      const stageTasks = tasks.filter(t => t.stage === stage);
      stageTasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'task-item';
        const prioBadge = task.priority === 'high' ? '<span class="badge badge-warning" style="font-size:0.65rem; padding: 2px 6px;">high</span>' : '';
        item.innerHTML = `
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 4px;">
            <span class="task-id" style="font-weight:700;">${task.id}</span>
            ${prioBadge}
          </div>
          <div class="task-title" style="font-weight:600; font-size:0.85rem; line-height: 1.3; margin-bottom: 4px;">${task.title}</div>
          <div class="task-owner" style="font-size:0.75rem; color:var(--text-muted);">${task.owner}</div>
        `;
        col.appendChild(item);
      });
    });
  }

  // Load Real Repository Data & Analytics
  async function loadRealRepositoryData() {
    try {
      // 1. Fetch Pull Requests from live repo
      const prRes = await fetch('/api/v1/pull-requests');
      const prData = await prRes.json();
      if (Array.isArray(prData.pullRequests) && prData.pullRequests.length > 0) {
        analyticsData.pullRequests = prData.pullRequests;
        renderPRList('all');
        if (window.matchMedia('(min-width: 1181px)').matches) {
          selectPR(analyticsData.pullRequests[0]);
        }
      }

      // 2. Fetch Repositories & Worktrees from live repo
      const repoRes = await fetch('/api/v1/repositories');
      const repoData = await repoRes.json();
      if (Array.isArray(repoData.repositories) && repoData.repositories.length > 0) {
        analyticsData.repositories = repoData.repositories;
        renderRepositories('');
      }

      // 3. Fetch Analytics & KPIs from live repo
      const analRes = await fetch('/api/v1/analytics');
      const analData = await analRes.json();
      if (analData.analytics) {
        if (analData.analytics.kpis) {
          analyticsData.kpis = analData.analytics.kpis;
        }
        updateOverview('week');
      }
    } catch (err) {
      console.warn('Failed to load real repository data:', err);
    }
  }

  // --- Initial Boot ---
  updateOverview('week');
  renderOverviewContributors();
  renderPRList('all');
  renderRepositories('');
  // Select first PR initially for rich display
  if (analyticsData.pullRequests.length > 0 && window.matchMedia('(min-width: 1181px)').matches) {
    selectPR(analyticsData.pullRequests[0]);
  }

  loadWorkspace();
  loadAgents();
  loadReadiness();
  loadTasks();
  loadRealRepositoryData();
  connectSSE();
});
