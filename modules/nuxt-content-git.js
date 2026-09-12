const { execFile } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

function parseGitTimestamps(stdout) {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

function gitTimestampsForFile(filePath, repoRoot, { follow = true, onlyAdded = false } = {}) {
  return new Promise((resolve) => {
    if (!filePath || typeof filePath !== 'string') {
      resolve([]);
      return;
    }

    const normalized = filePath.replace(/\\/g, '/');
    const args = ['log'];

    if (follow) {
      args.push('--follow');
    }

    if (onlyAdded) {
      args.push('--diff-filter=A');
    }

    args.push('--format=%ct', '--', normalized);

    execFile('git', args, { cwd: repoRoot }, (error, stdout) => {
      if (error) {
        resolve([]);
        return;
      }

      resolve(parseGitTimestamps(stdout));
    });
  });
}

function earliestGitDate(timestamps) {
  if (!timestamps.length) {
    return null;
  }

  return new Date(Math.min(...timestamps) * 1000);
}

function latestGitDate(timestamps) {
  if (!timestamps.length) {
    return null;
  }

  return new Date(Math.max(...timestamps) * 1000);
}

async function fileSystemCreatedDate(filePath) {
  try {
    const stats = await fs.stat(filePath);
    if (stats && Number.isFinite(stats.birthtimeMs)) {
      return new Date(stats.birthtimeMs);
    }

    if (stats && Number.isFinite(stats.ctimeMs)) {
      return new Date(stats.ctimeMs);
    }
  } catch (error) {
    return null;
  }

  return null;
}

module.exports = function nuxtContentGit(moduleOptions) {
  const repoRoot = this.options.rootDir || process.cwd();

  this.nuxt.hook('content:file:beforeInsert', async (document) => {
    if (!document || typeof document.path !== 'string') {
      return document;
    }

    let filePath = document.path;
    if (!path.isAbsolute(filePath)) {
      filePath = path.resolve(repoRoot, filePath);
    }

    const relativeFilePath = path.relative(repoRoot, filePath).replace(/\\/g, '/');
    if (!relativeFilePath || relativeFilePath.startsWith('..')) {
      return document;
    }

    const createdAt = document.createdAt || document._createdAt;
    const updatedAt = document.updatedAt || document._updatedAt;

    const addedTimestamps = await gitTimestampsForFile(relativeFilePath, repoRoot, { onlyAdded: true });
    const historyTimestamps = await gitTimestampsForFile(relativeFilePath, repoRoot, { follow: true, onlyAdded: false });
    const gitCreated = earliestGitDate(addedTimestamps.length ? addedTimestamps : historyTimestamps);
    const gitUpdated = latestGitDate(historyTimestamps);

    if (gitCreated) {
      document.createdAt = gitCreated;
    } else if (!createdAt) {
      const fsCreated = await fileSystemCreatedDate(filePath);
      if (fsCreated) {
        document.createdAt = fsCreated;
      }
    }

    if (gitUpdated) {
      document.updatedAt = gitUpdated;
    } else if (!updatedAt) {
      const fsUpdated = await fileSystemCreatedDate(filePath);
      if (fsUpdated) {
        document.updatedAt = fsUpdated;
      }
    }

    return document;
  });
};

module.exports.meta = {
  name: 'nuxt-content-git',
  version: '1.0.0'
};
