#!/usr/bin/env node

import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const DATABASE_FILES = ['analytics.sqlite', 'analytics.sqlite-shm', 'analytics.sqlite-wal'];

function parseArgs(argv) {
  const options = {};

  for (const rawArg of argv) {
    if (!rawArg.startsWith('--')) {
      continue;
    }

    const normalizedArg = rawArg.slice(2);
    if (!normalizedArg.includes('=')) {
      options[normalizedArg] = 'true';
      continue;
    }

    const [key, ...valueParts] = normalizedArg.split('=');
    options[key] = valueParts.join('=');
  }

  return options;
}

function resolveDataDirectory() {
  return process.env.CLAWPLAY_DATA_DIR
    ? path.resolve(process.env.CLAWPLAY_DATA_DIR)
    : path.join(process.cwd(), 'data');
}

function formatTimestamp(value = new Date()) {
  return value.toISOString().replace(/[:.]/g, '-');
}

async function collectExistingFiles(dataDirectory) {
  const found = [];

  for (const fileName of DATABASE_FILES) {
    const filePath = path.join(dataDirectory, fileName);

    try {
      const info = await stat(filePath);
      if (info.isFile()) {
        found.push({
          fileName,
          filePath,
          sizeBytes: info.size,
          modifiedAt: info.mtime.toISOString(),
        });
      }
    } catch {
      continue;
    }
  }

  return found;
}

async function maybeReadPackageVersion(projectRoot) {
  try {
    const raw = await readFile(path.join(projectRoot, 'package.json'), 'utf8');
    const pkg = JSON.parse(raw);
    return typeof pkg.version === 'string' ? pkg.version : null;
  } catch {
    return null;
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const projectRoot = process.cwd();
  const dataDirectory = resolveDataDirectory();
  const outputDirectory = options['output-dir']
    ? path.resolve(options['output-dir'])
    : path.join(projectRoot, 'backups');
  const backupDirectory = path.join(outputDirectory, `clawplay-data-${formatTimestamp()}`);
  const includeEnv = options['include-env'] === 'true';

  const existingFiles = await collectExistingFiles(dataDirectory);
  const mainDatabase = existingFiles.find((item) => item.fileName === 'analytics.sqlite');

  if (!mainDatabase) {
    throw new Error(`未找到主数据库文件：${path.join(dataDirectory, 'analytics.sqlite')}`);
  }

  await mkdir(backupDirectory, { recursive: true });

  const copiedFiles = [];

  for (const file of existingFiles) {
    const destination = path.join(backupDirectory, file.fileName);
    await copyFile(file.filePath, destination);
    copiedFiles.push({
      ...file,
      destination,
    });
  }

  let copiedEnvFile = null;
  if (includeEnv) {
    const envPath = path.join(projectRoot, '.env.production.local');
    try {
      const envInfo = await stat(envPath);
      if (envInfo.isFile()) {
        const destination = path.join(backupDirectory, '.env.production.local');
        await copyFile(envPath, destination);
        copiedEnvFile = {
          filePath: envPath,
          destination,
          sizeBytes: envInfo.size,
          modifiedAt: envInfo.mtime.toISOString(),
        };
      }
    } catch {
      copiedEnvFile = null;
    }
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    projectRoot,
    dataDirectory,
    backupDirectory,
    version: await maybeReadPackageVersion(projectRoot),
    files: copiedFiles,
    includedEnvFile: copiedEnvFile,
    restoreHint: [
      `cp ${path.join(backupDirectory, 'analytics.sqlite')} ${path.join(dataDirectory, 'analytics.sqlite')}`,
      `cp ${path.join(backupDirectory, 'analytics.sqlite-wal')} ${path.join(dataDirectory, 'analytics.sqlite-wal')} # 如果备份目录中存在`,
      `cp ${path.join(backupDirectory, 'analytics.sqlite-shm')} ${path.join(dataDirectory, 'analytics.sqlite-shm')} # 如果备份目录中存在`,
    ],
  };

  await writeFile(path.join(backupDirectory, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  console.log('ClawPlay data backup completed');
  console.log(`- Data directory: ${dataDirectory}`);
  console.log(`- Backup directory: ${backupDirectory}`);
  console.log(`- Files copied: ${copiedFiles.map((item) => item.fileName).join(', ')}`);
  if (copiedEnvFile) {
    console.log('- Environment file: .env.production.local copied');
  }
}

main().catch((error) => {
  console.error(`Backup failed: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
