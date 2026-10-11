/**
 * AgentCrew Analytics Dashboard Data
 * Browser & Node compatible export
 */
const agentCrewAnalyticsData = {
  people: [
    {
      handle: 'arthur',
      name: 'Arthur',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Arthur',
      color: '#8b5cf6',
      role: 'Architect · Lead',
      provider: 'codex',
      model: 'o3'
    },
    {
      handle: 'alice',
      name: 'Alice',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Alice',
      color: '#ec4899',
      role: 'Business Analyst',
      provider: 'agy',
      model: 'gemini-2.5-pro'
    },
    {
      handle: 'peter',
      name: 'Peter',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Peter',
      color: '#f59e0b',
      role: 'Product Owner',
      provider: 'agy',
      model: 'gemini-2.5-pro'
    },
    {
      handle: 'dev1',
      name: 'Dev-1',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Dev1',
      color: '#06b6d4',
      role: 'Developer (Codex)',
      provider: 'codex',
      model: 'o3'
    },
    {
      handle: 'dev2',
      name: 'Dev-2',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Dev2',
      color: '#3b82f6',
      role: 'Developer (Codex)',
      provider: 'codex',
      model: 'o3'
    },
    {
      handle: 'dev3',
      name: 'Dev-3',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Dev3',
      color: '#10b981',
      role: 'Developer (agy)',
      provider: 'agy',
      model: 'gemini-2.5-pro'
    },
    {
      handle: 'dev4',
      name: 'Dev-4',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Dev4',
      color: '#14b8a6',
      role: 'Developer (agy)',
      provider: 'agy',
      model: 'gemini-2.5-pro'
    },
    {
      handle: 'qa1',
      name: 'QA-1',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=QA1',
      color: '#84cc16',
      role: 'Tester (Gemini)',
      provider: 'gemini',
      model: 'gemini-2.5-pro'
    },
    {
      handle: 'qa2',
      name: 'QA-2',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=QA2',
      color: '#22c55e',
      role: 'Tester (Gemini)',
      provider: 'gemini',
      model: 'gemini-2.5-pro'
    },
    {
      handle: 'qa3',
      name: 'QA-3',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=QA3',
      color: '#a855f7',
      role: 'Tester (agy)',
      provider: 'agy',
      model: 'gemini-2.5-pro'
    },
    {
      handle: 'qa4',
      name: 'QA-4',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=QA4',
      color: '#6366f1',
      role: 'Tester (agy)',
      provider: 'agy',
      model: 'gemini-2.5-pro'
    },
    {
      handle: 'integrator1',
      name: 'Integrator-1',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Integrator1',
      color: '#f97316',
      role: 'Integrator (Codex)',
      provider: 'codex',
      model: 'o3'
    },
    {
      handle: 'integrator2',
      name: 'Integrator-2',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Integrator2',
      color: '#e11d48',
      role: 'Integrator (agy)',
      provider: 'agy',
      model: 'gemini-2.5-pro'
    }
  ],

  ranges: [
    { id: 'week', label: 'Current Iteration', caption: 'Iteration 001 · Oct 05 – Oct 11, 2026' },
    { id: 'month', label: 'Milestone 1 & 2', caption: 'Sep 15 – Oct 11, 2026' }
  ],

  kpis: {
    week: [
      { id: 'cycle-time', label: 'Avg. Cycle Time', icon: 'clock', value: '14.2m', delta: -24, lowerIsBetter: true, spark: [22.4, 19.8, 17.5, 15.6, 14.2] },
      { id: 'qa-pass', label: 'QA First-Pass Yield', icon: 'check', value: '96.8%', delta: 8.5, spark: [88.0, 91.2, 93.5, 95.0, 96.8] },
      { id: 'concurrency', label: 'Peak Concurrency', icon: 'pulse', value: '4 / 4', delta: 0, spark: [3, 4, 4, 3, 4] },
      { id: 'delivered', label: 'Tasks Delivered', icon: 'commit', value: '15', delta: 25, spark: [9, 11, 12, 14, 15] }
    ],
    month: [
      { id: 'cycle-time', label: 'Avg. Cycle Time', icon: 'clock', value: '18.5m', delta: -15, lowerIsBetter: true, spark: [28.0, 24.5, 21.0, 19.2, 18.5] },
      { id: 'qa-pass', label: 'QA First-Pass Yield', icon: 'check', value: '94.2%', delta: 12.0, spark: [82.0, 86.5, 90.0, 92.5, 94.2] },
      { id: 'concurrency', label: 'Peak Concurrency', icon: 'pulse', value: '4 / 4', delta: 0, spark: [2, 3, 4, 4, 4] },
      { id: 'delivered', label: 'Tasks Delivered', icon: 'commit', value: '27', delta: 42, spark: [6, 12, 18, 22, 27] }
    ]
  },

  activity: {
    week: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      series: {
        dev1: [12, 18, 15, 22, 19],
        dev2: [14, 21, 24, 28, 25],
        dev3: [9, 14, 16, 18, 15],
        qa1: [15, 20, 22, 25, 21],
        integrator1: [4, 7, 9, 12, 10]
      },
      lines: {
        dev1: { added: 3850, removed: 840 },
        dev2: { added: 4200, removed: 1150 },
        dev3: { added: 2900, removed: 620 },
        qa1: { added: 1650, removed: 310 },
        integrator1: { added: 1420, removed: 980 }
      }
    },
    month: {
      labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
      series: {
        dev1: [45, 68, 72, 86],
        dev2: [52, 79, 88, 98],
        dev3: [38, 55, 64, 72],
        qa1: [48, 70, 81, 92],
        integrator1: [18, 28, 35, 42]
      },
      lines: {
        dev1: { added: 14200, removed: 3100 },
        dev2: { added: 16800, removed: 4200 },
        dev3: { added: 11400, removed: 2400 },
        qa1: { added: 6200, removed: 1200 },
        integrator1: { added: 5100, removed: 3400 }
      }
    }
  },

  repositories: [
    {
      name: 'agentcrew/core',
      description: 'Orchestrator daemon, TurnScheduler, and multi-provider adapter engine',
      branch: 'main',
      worktreesCount: 4,
      status: 'clean',
      lastSync: '10m ago'
    },
    {
      name: 'agentcrew/iteration-001',
      description: 'Active sprint integration branch for milestone m-1 & m-2 verification',
      branch: 'iteration/iter-001',
      worktreesCount: 3,
      status: 'clean',
      lastSync: '2m ago'
    },
    {
      name: 'agentcrew/web-ui',
      description: 'Interactive single-page workspace with 2.5D pixel room and analytics',
      branch: 'docs/ai-team-workspace-prd-trd',
      worktreesCount: 2,
      status: 'clean',
      lastSync: 'Just now'
    }
  ],

  pullRequests: [
    {
      number: 26,
      title: 'TASK-26: `Interactive Web UI Full-Screen Dashboards & Pixel Room`',
      author: 'dev2',
      status: { kind: 'review', label: 'Under Review' },
      repository: 'agentcrew/web-ui',
      opened: 'Oct 11, 2026, 02:40 AM',
      age: '1h',
      today: true,
      additions: 560,
      deletions: 120,
      comments: 4,
      problem: [
        'Autonomous teams executing multi-turn tasks operate inside opaque terminal processes.',
        'Operators require visual oversight across 13 agent identities, turn states, and real-time outputs without stalling autonomous iteration.'
      ],
      approach: [
        'Built single-page application shell with vertical sidebar navigation and dual theme support (light default / dark).',
        'Implemented 2.5D pixel-art isometric Virtual Team Room on HTML5 Canvas with live activity bubbles and human takeover console.',
        'Integrated real-time SSE telemetry stream and cycle time metrics.'
      ]
    },
    {
      number: 25,
      title: 'TASK-25: `Supervisor HTTP & SSE Server Daemon`',
      author: 'dev1',
      status: { kind: 'merged', label: 'Merged' },
      repository: 'agentcrew/core',
      opened: 'Oct 11, 2026, 01:15 AM',
      age: '3h',
      today: true,
      additions: 430,
      deletions: 15,
      comments: 6,
      problem: [
        'Browser dashboard needed a lightweight, zero-dependency HTTP and SSE server daemon compliant with TRD §12 specification.',
        'Cloud dependencies or external gateway proxies violate offline and corporate qualification requirements.'
      ],
      approach: [
        'Constructed native Node.js SupervisorServer with clean REST endpoints (/api/v1/workspace, /agents, /metrics, /commands).',
        'Implemented resilient Server-Sent Events (SSE) pipe with cursor-based replay and heartbeat monitoring.'
      ]
    },
    {
      number: 20,
      title: 'TASK-20: `Iteration Branch Integration Strategy`',
      author: 'integrator1',
      status: { kind: 'open', label: 'In Progress' },
      repository: 'agentcrew/iteration-001',
      opened: 'Oct 10, 2026, 11:30 PM',
      age: '5h',
      today: false,
      additions: 310,
      deletions: 45,
      comments: 2,
      problem: [
        'Concurrent agent worktrees committing directly to target branches create merge conflicts and CI flakiness.',
        'Automated workflows require a staged sandbox before final mainline promotion.'
      ],
      approach: [
        'Created IntegrationStrategyManager establishing dedicated iteration/<id> branches.',
        'Enforced automated rebase qualification and human approval gating before merge.'
      ]
    },
    {
      number: 19,
      title: 'TASK-19: `Commit-Bound Approvals & Revision Invalidation`',
      author: 'qa1',
      status: { kind: 'merged', label: 'Merged' },
      repository: 'agentcrew/core',
      opened: 'Oct 10, 2026, 08:20 PM',
      age: '8h',
      today: false,
      additions: 280,
      deletions: 18,
      comments: 3,
      problem: [
        'Stale QA approval signatures allowed developers to make untested follow-up edits without re-triggering verification.',
        'Silent regressions crept into release candidates.'
      ],
      approach: [
        'Implemented QualityVerificationManager binding all QA approval tokens to exact git commit SHAs.',
        'Automatically invalidate verification tokens whenever the worktree HEAD advances.'
      ]
    }
  ]
};

if (typeof window !== 'undefined') {
  window.agentCrewAnalyticsData = agentCrewAnalyticsData;
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { agentCrewAnalyticsData };
}
