const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = process.cwd();
const contentRoot = path.join(root, 'content');

function gitTimestampsForFile(relFile) {
  const all = execFileSync('git', ['log', '--follow', '--format=%ct', '--', relFile], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();
  const added = execFileSync('git', ['log', '--follow', '--diff-filter=A', '--format=%ct', '--', relFile], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  }).trim();

  const history = all ? all.split(/\r?\n/).map(v => Number(v)).filter(Number.isFinite) : [];
  const addeds = added ? added.split(/\r?\n/).map(v => Number(v)).filter(Number.isFinite) : [];
  const created = addeds.length ? Math.min(...addeds) : (history.length ? Math.min(...history) : null);
  const updated = history.length ? Math.max(...history) : created;

  return { created, updated };
}

function toIsoDate(value) {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}

function updateFrontMatter(filePath) {
  const rel = path.relative(root, filePath).replace(/\\/g, '/');
  const { created, updated } = gitTimestampsForFile(rel);

  if (!created && !updated) {
    return;
  }

  const text = fs.readFileSync(filePath, 'utf8');
  const match = text.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) {
    return;
  }

  let front = match[1];
  const createdAt = toIsoDate(created);
  const updatedAt = toIsoDate(updated);

  const fieldPattern = /^([A-Za-z0-9_-]+):\s*(.*)$/gm;
  const existing = {};
  let m;
  while ((m = fieldPattern.exec(front)) !== null) {
    existing[m[1]] = m[2];
  }

  if (createdAt) {
    front = front.replace(/^createdAt:\s*.*$/m, `createdAt: ${createdAt}`);
    if (!/^createdAt:\s*/m.test(front)) {
      front += `\ncreatedAt: ${createdAt}`;
    }
  }

  if (updatedAt) {
    front = front.replace(/^updatedAt:\s*.*$/m, `updatedAt: ${updatedAt}`);
    if (!/^updatedAt:\s*/m.test(front)) {
      front += `\nupdatedAt: ${updatedAt}`;
    }
  }

  const newText = text.replace(/^---\n([\s\S]*?)\n---\n?/, `---\n${front}\n---\n`);
  fs.writeFileSync(filePath, newText, 'utf8');
  console.log(`updated ${rel}`);
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      walk(full);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      updateFrontMatter(full);
    }
  }
}

walk(contentRoot);
