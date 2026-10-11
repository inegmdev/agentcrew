const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

/**
 * Manages customer requirements imports and joint planning packages (PRD §7).
 */
class RequirementsManager {
  constructor(opts = {}) {
    this.storageDir = opts.storageDir || path.join(process.cwd(), '.scratch', 'requirements');
    fs.mkdirSync(this.storageDir, { recursive: true });
    this.packages = new Map();
  }

  async importRequirements({ type, filename, content } = {}) {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    const id = `req-source-${hash.slice(0, 8)}`;

    const filePath = path.join(this.storageDir, `${id}-${filename}`);
    fs.writeFileSync(filePath, content, 'utf8');

    let items = [];
    if (type === 'csv') {
      const lines = content.trim().split('\n').filter(Boolean);
      const headers = lines[0].split(',').map(h => h.trim());
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(p => p.trim());
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = parts[idx];
        });
        items.push({
          id: row.id || `REQ-${i}`,
          title: row.title || 'Untitled',
          description: row.description || '',
        });
      }
    } else {
      items.push({
        id: 'REQ-1',
        title: filename,
        description: content,
      });
    }

    return {
      id,
      filename,
      hash,
      itemCount: items.length,
      items,
      storedPath: filePath,
    };
  }

  async createPlanningPackage({ iterationGoal, requirements, tasks, acceptanceChecklist } = {}) {
    const id = `pkg-${crypto.randomUUID().slice(0, 8)}`;
    const pkg = {
      id,
      iterationGoal,
      requirements: requirements || [],
      tasks: tasks || [],
      acceptanceChecklist: acceptanceChecklist || [],
      status: 'awaiting_approval',
      createdAt: new Date().toISOString(),
      approvedAt: null,
      approver: null,
    };

    this.packages.set(id, pkg);
    return pkg;
  }

  async approvePlanningPackage(packageId, { approver } = {}) {
    const pkg = this.packages.get(packageId);
    if (!pkg) throw new Error(`Planning package ${packageId} not found`);

    pkg.status = 'approved';
    pkg.approvedAt = new Date().toISOString();
    pkg.approver = approver || 'operator';

    return pkg;
  }
}

module.exports = { RequirementsManager };
