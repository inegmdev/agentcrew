/**
 * Pixel-Art Isometric Virtual Team Room Renderer (PRD §12; TRD §12.3)
 * Renders an authentic 2.5D pixel-art office with 13 workstations, isometric tiles,
 * decor, pixel character avatars, and animated real-time activity bubbles.
 */
class PixelRoomRenderer {
  constructor(canvas, options = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onAgentClick = options.onAgentClick || null;

    this.tileW = 68;
    this.tileH = 34;
    this.gridSize = 6;
    this.originX = canvas.width / 2;
    this.originY = 110;

    this.selectedAgent = null;
    this.hoveredAgent = null;
    this.animationTick = 0;

    // Workstation placement in the 6x6 room grid
    this.stations = [
      // Planning cluster (Top row)
      { id: 'Alice', name: 'Alice', role: 'Business Analyst', provider: 'agy', model: 'gemini-2.5-pro', gx: 1, gy: 0, hair: '#e06c75', shirt: '#98c379', state: 'idle' },
      { id: 'Peter', name: 'Peter', role: 'Product Owner', provider: 'agy', model: 'gemini-2.5-pro', gx: 2, gy: 0, hair: '#d19a66', shirt: '#61afef', state: 'idle' },
      { id: 'Arthur', name: 'Arthur', role: 'Architect', provider: 'codex', model: 'o3', gx: 3, gy: 0, hair: '#abb2bf', shirt: '#c678dd', state: 'idle' },

      // Developer Pod 1 & 2
      { id: 'Dev-1', name: 'Dev-1', role: 'Developer', provider: 'codex', model: 'o3', gx: 0, gy: 2, hair: '#e5c07b', shirt: '#56b6c2', state: 'idle' },
      { id: 'Dev-2', name: 'Dev-2', role: 'Developer', provider: 'codex', model: 'o3', gx: 1, gy: 2, hair: '#61afef', shirt: '#98c379', state: 'idle' },
      { id: 'Dev-3', name: 'Dev-3', role: 'Developer', provider: 'agy', model: 'gemini-2.5-pro', gx: 2, gy: 2, hair: '#d19a66', shirt: '#e06c75', state: 'idle' },
      { id: 'Dev-4', name: 'Dev-4', role: 'Developer', provider: 'agy', model: 'gemini-2.5-pro', gx: 3, gy: 2, hair: '#abb2bf', shirt: '#e5c07b', state: 'idle' },

      // QA Testing Bench
      { id: 'QA-1', name: 'QA-1', role: 'Tester', provider: 'gemini', model: 'gemini-2.5-pro', gx: 0, gy: 4, hair: '#98c379', shirt: '#e5c07b', state: 'idle' },
      { id: 'QA-2', name: 'QA-2', role: 'Tester', provider: 'gemini', model: 'gemini-2.5-pro', gx: 1, gy: 4, hair: '#e06c75', shirt: '#61afef', state: 'idle' },
      { id: 'QA-3', name: 'QA-3', role: 'Tester', provider: 'agy', model: 'gemini-2.5-pro', gx: 2, gy: 4, hair: '#c678dd', shirt: '#98c379', state: 'idle' },
      { id: 'QA-4', name: 'QA-4', role: 'Tester', provider: 'agy', model: 'gemini-2.5-pro', gx: 3, gy: 4, hair: '#d19a66', shirt: '#56b6c2', state: 'idle' },

      // Integration Hub
      { id: 'Integrator-1', name: 'Integrator-1', role: 'Integrator', provider: 'codex', model: 'o3', gx: 4, gy: 1, hair: '#e5c07b', shirt: '#e06c75', state: 'idle' },
      { id: 'Integrator-2', name: 'Integrator-2', role: 'Integrator', provider: 'agy', model: 'gemini-2.5-pro', gx: 4, gy: 3, hair: '#56b6c2', shirt: '#c678dd', state: 'idle' }
    ];

    this.bindEvents();
    this.startLoop();
  }

  toIso(gx, gy) {
    return {
      x: this.originX + (gx - gy) * (this.tileW / 2),
      y: this.originY + (gx + gy) * (this.tileH / 2)
    };
  }

  updateAgentStates(agents) {
    for (const agent of agents) {
      const match = this.stations.find(s => s.name === agent.name || s.id === agent.id);
      if (match) {
        match.state = agent.activity_badge || agent.state || 'idle';
      }
    }
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      let found = null;
      for (const st of this.stations) {
        const iso = this.toIso(st.gx, st.gy);
        // Hit box centered on character sprite
        if (Math.hypot(mouseX - iso.x, mouseY - (iso.y - 18)) < 26) {
          found = st;
          break;
        }
      }

      this.hoveredAgent = found;
      this.canvas.style.cursor = found ? 'pointer' : 'default';
    });

    this.canvas.addEventListener('click', () => {
      if (this.hoveredAgent) {
        this.selectedAgent = this.hoveredAgent;
        if (this.onAgentClick) {
          this.onAgentClick(this.selectedAgent);
        }
      }
    });
  }

  startLoop() {
    const loop = () => {
      this.animationTick++;
      this.render();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  render() {
    const ctx = this.ctx;
    ctx.imageSmoothingEnabled = false;

    // Clear background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Draw Office Back Walls
    this.drawWalls();

    // 2. Draw Isometric Floor Tiles
    for (let gy = 0; gy < this.gridSize; gy++) {
      for (let gx = 0; gx < this.gridSize; gx++) {
        this.drawFloorTile(gx, gy);
      }
    }

    // 3. Draw Room Decor (Back to Front)
    this.drawWaterCooler(0, 0);
    this.drawPottedPlant(5, 0);
    this.drawServerRack(5, 5);

    // 4. Draw Stations with Depth-Sorting (gx + gy)
    const sortedStations = [...this.stations].sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
    for (const station of sortedStations) {
      this.drawWorkstation(station);
    }

    // 5. Tooltip on hovered agent
    if (this.hoveredAgent) {
      this.drawTooltip(this.hoveredAgent);
    }
  }

  drawWalls() {
    const ctx = this.ctx;
    const origin = this.toIso(0, 0);
    const rightCorner = this.toIso(this.gridSize, 0);
    const leftCorner = this.toIso(0, this.gridSize);
    const wallHeight = 70;

    // Left wall
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(origin.x, origin.y - wallHeight);
    ctx.lineTo(leftCorner.x, leftCorner.y - wallHeight);
    ctx.lineTo(leftCorner.x, leftCorner.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Right wall
    ctx.fillStyle = '#273549';
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.lineTo(origin.x, origin.y - wallHeight);
    ctx.lineTo(rightCorner.x, rightCorner.y - wallHeight);
    ctx.lineTo(rightCorner.x, rightCorner.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    // Pixel Window on Right Wall
    const winIso = this.toIso(3, 0);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(winIso.x - 24, winIso.y - wallHeight + 15, 48, 28);
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(winIso.x - 22, winIso.y - wallHeight + 17, 44, 24);
    // Window cross
    ctx.fillStyle = '#334155';
    ctx.fillRect(winIso.x - 2, winIso.y - wallHeight + 17, 4, 24);
    ctx.fillRect(winIso.x - 22, winIso.y - wallHeight + 28, 44, 3);

    // Pixel Whiteboard on Left Wall
    const boardIso = this.toIso(0, 3);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(boardIso.x - 30, boardIso.y - wallHeight + 16, 50, 26);
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.strokeRect(boardIso.x - 30, boardIso.y - wallHeight + 16, 50, 26);
    // Diagram doodles
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(boardIso.x - 25, boardIso.y - wallHeight + 22, 10, 6);
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(boardIso.x - 10, boardIso.y - wallHeight + 22, 10, 6);
  }

  drawFloorTile(gx, gy) {
    const ctx = this.ctx;
    const { x, y } = this.toIso(gx, gy);
    const hw = this.tileW / 2;
    const hh = this.tileH / 2;

    const isEven = (gx + gy) % 2 === 0;
    ctx.fillStyle = isEven ? '#1c2438' : '#171e2e';

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + hw, y + hh);
    ctx.lineTo(x, y + this.tileH);
    ctx.lineTo(x - hw, y + hh);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#232d42';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  drawWaterCooler(gx, gy) {
    const ctx = this.ctx;
    const { x, y } = this.toIso(gx, gy);
    // Base cabinet
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(x - 6, y + 2, 12, 16);
    // Water jug
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(x - 5, y - 8, 10, 10);
    // Spigot
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(x - 2, y + 6, 4, 3);
  }

  drawPottedPlant(gx, gy) {
    const ctx = this.ctx;
    const { x, y } = this.toIso(gx, gy);
    // Terracotta pot
    ctx.fillStyle = '#b45309';
    ctx.fillRect(x - 7, y + 6, 14, 12);
    // Green foliage
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(x, y + 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(x + 2, y, 7, 0, Math.PI * 2);
    ctx.fill();
  }

  drawServerRack(gx, gy) {
    const ctx = this.ctx;
    const { x, y } = this.toIso(gx, gy);
    // Tall server chassis
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 10, y - 18, 20, 36);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(x - 10, y - 18, 20, 36);
    // Flashing LEDs
    const ledColor = (this.animationTick % 30 < 15) ? '#22c55e' : '#38bdf8';
    ctx.fillStyle = ledColor;
    ctx.fillRect(x - 6, y - 12, 3, 3);
    ctx.fillRect(x - 1, y - 12, 3, 3);
    ctx.fillRect(x + 4, y - 12, 3, 3);
  }

  drawWorkstation(st) {
    const ctx = this.ctx;
    const { x, y } = this.toIso(st.gx, st.gy);
    const isSelected = this.selectedAgent && this.selectedAgent.id === st.id;
    const isHovered = this.hoveredAgent && this.hoveredAgent.id === st.id;

    // Selection diamond under desk
    if (isSelected || isHovered) {
      ctx.strokeStyle = isSelected ? '#fbbf24' : '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y + 4);
      ctx.lineTo(x + this.tileW / 2, y + this.tileH / 2 + 4);
      ctx.lineTo(x, y + this.tileH + 4);
      ctx.lineTo(x - this.tileW / 2, y + this.tileH / 2 + 4);
      ctx.closePath();
      ctx.stroke();
    }

    // 1. Isometric Office Desk
    ctx.fillStyle = '#475569';
    ctx.fillRect(x - 14, y + 10, 28, 12);
    ctx.fillStyle = '#334155';
    ctx.fillRect(x - 14, y + 20, 28, 4);

    // 2. Desktop Monitor with glowing pixel screen
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(x - 7, y + 1, 14, 10);
    // Screen glow
    ctx.fillStyle = st.state === 'takeover' ? '#f59e0b' : '#38bdf8';
    ctx.fillRect(x - 5, y + 3, 10, 6);
    // Keyboard
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(x - 6, y + 12, 12, 3);

    // 3. Pixel Character Avatar seated at desk
    const bob = Math.sin(this.animationTick * 0.1) * (st.state === 'thinking' ? 1.5 : 0);
    const charY = y + 2 + bob;

    // Torso / Shirt
    ctx.fillStyle = st.shirt;
    ctx.fillRect(x - 5, charY - 2, 10, 8);

    // Head / Face
    ctx.fillStyle = '#fed7aa'; // Skin tone
    ctx.fillRect(x - 4, charY - 10, 8, 8);

    // Hair
    ctx.fillStyle = st.hair;
    ctx.fillRect(x - 5, charY - 12, 10, 4);

    // Role Details
    if (st.role === 'Architect' || st.role === 'Business Analyst') {
      // Glasses
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(x - 3, charY - 8, 2, 2);
      ctx.fillRect(x + 1, charY - 8, 2, 2);
    } else if (st.role === 'Developer') {
      // Headphones
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(x - 6, charY - 9, 2, 4);
      ctx.fillRect(x + 4, charY - 9, 2, 4);
    }

    // Agent Name Tag below desk
    ctx.fillStyle = '#f8fafc';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(st.name, x, y + 32);

    // 4. Real-Time Activity Speech Bubble
    this.drawActivityBubble(st, x, charY - 16);
  }

  drawActivityBubble(st, x, y) {
    const ctx = this.ctx;
    const state = st.state || 'idle';

    if (state === 'idle') {
      // Small coffee cup
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(x + 8, y + 4, 6, 6);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x + 9, y + 5, 4, 3);
      return;
    }

    // Speech bubble background
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(x - 12, y - 10, 24, 12, 3);
    ctx.fill();

    // Bubble pointer
    ctx.beginPath();
    ctx.moveTo(x - 2, y + 2);
    ctx.lineTo(x, y + 5);
    ctx.lineTo(x + 2, y + 2);
    ctx.fill();

    if (state === 'thinking' || state === 'executing') {
      // Animated typing dots
      const dotCount = Math.floor((this.animationTick / 10) % 4);
      ctx.fillStyle = '#0284c7';
      for (let i = 0; i < 3; i++) {
        if (i < dotCount) {
          ctx.fillRect(x - 7 + i * 5, y - 5, 2, 2);
        }
      }
    } else if (state === 'reviewing') {
      ctx.fillStyle = '#9333ea';
      ctx.font = '8px monospace';
      ctx.fillText('REV', x, y - 1);
    } else if (state === 'qa') {
      ctx.fillStyle = '#16a34a';
      ctx.font = '8px monospace';
      ctx.fillText('QA', x, y - 1);
    } else if (state === 'takeover') {
      ctx.fillStyle = '#d97706';
      ctx.font = 'bold 9px monospace';
      ctx.fillText('!', x, y - 1);
    }
  }

  drawTooltip(st) {
    const ctx = this.ctx;
    const { x, y } = this.toIso(st.gx, st.gy);
    const boxW = 140;
    const boxH = 46;
    const bx = Math.min(Math.max(x - boxW / 2, 10), this.canvas.width - boxW - 10);
    const by = y - 55;

    ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(bx, by, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${st.name} (${st.role})`, bx + 8, by + 14);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '9px monospace';
    ctx.fillText(`${st.provider} · ${st.model}`, bx + 8, by + 27);

    ctx.fillStyle = st.state === 'takeover' ? '#fbbf24' : '#38bdf8';
    ctx.fillText(`State: ${st.state.toUpperCase()}`, bx + 8, by + 39);
  }
}

// Browser export
if (typeof window !== 'undefined') {
  window.PixelRoomRenderer = PixelRoomRenderer;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { PixelRoomRenderer };
}
