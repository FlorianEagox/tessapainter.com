const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = process.cwd();
const contentRoot = path.join(root, 'content');

function walk(dir, files) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === '.git' || entry.name === 'node_modules') continue;
      walk(full, files);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
}

function getGitDates(relFile) {
  try {
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

    const history = all ? all.split(/\r?\n/).map((v) => Number(v.trim())).filter(Number.isFinite) : [];
    const addeds = added ? added.split(/\r?\n/).map((v) => Number(v.trim())).filter(Number.isFinite) : [];

    const created = addeds.length ? Math.min(...addeds) : (history.length ? Math.min(...history) : null);
    const updated = history.length ? Math.max(...history) : created;

    return { created, updated };
  } catch (error) {
    return { created: null, updated: null };
  }
}

function setFrontMatterField(front, key, value) {
  if (!value) {
    return front;
  }

  const keyPattern = new RegExp(`^${key}:\\s*.*$`, 'm');
  const keyExists = new RegExp(`^${key}:\\s*`, 'm').test(front);

  if (keyExists) {
    return front.replace(keyPattern, `${key}: ${value}`);
  }

  return `${front}\n${key}: ${value}`;
}

const files = [];
walk(contentRoot, files);

for (const file of files) {
  const rel = path.relative(root, file).replace(/\\/g, '/');
  const { created, updated } = getGitDates(rel);

  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) continue;

  let front = match[1];
  front = setFrontMatterField(front, 'createdAt', created ? new Date(created * 1000).toISOString() : null);
  front = setFrontMatterField(front, 'updatedAt', updated ? new Date(updated * 1000).toISOString() : null);

  const updatedText = text.replace(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/, `---\r\n${front}\r\n---\r\n`);
  fs.writeFileSync(file, updatedText, 'utf8');
  console.log(`updated ${rel}`);
}
