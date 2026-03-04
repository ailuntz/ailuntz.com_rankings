import { access, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';
import { countries } from './countries.js';
import { languages } from './languages.js';
import { sleep } from './utils.js';

const port = Number(process.env.PORT || 8080);
const dataDir = resolve(process.env.DATA_DIR || './data');
const autoFetchEnabled = process.env.AUTO_FETCH !== 'false';
const fetchTimezone = process.env.FETCH_TIMEZONE || 'Asia/Shanghai';
const corsAllowOrigin = process.env.CORS_ALLOW_ORIGIN || '*';
const apiPrefix = process.env.API_PREFIX || '/rankings';
const taskDelayMs = Number(process.env.TASK_DELAY_MS || 10000);
const distDir = dirname(fileURLToPath(import.meta.url));
const fetchMetaFile = join(dataDir, '_fetch-meta.json');
const countryCodes = countries.map(c => c.code).filter(Boolean);
const timeRanges = ['daily', 'weekly', 'monthly'] as const;

let refreshing = false;
let lastRefreshAt: string | null = null;
let lastRefreshError: string | null = null;

function toSlug(value: string): string {
  return value.toLowerCase().replace(/\s+/g, '-');
}

function safeLang(languageCode: string): string {
  return languageCode.replace(/%23/g, 'sharp').replace(/[^a-z0-9-]/gi, '-');
}

function buildRequiredDataFiles(): string[] {
  const files = new Set<string>();

  files.add('users.json');
  files.add('users-org.json');
  files.add('repos.json');
  files.add('repos-user.json');
  files.add('repos-org.json');

  for (const country of countryCodes) {
    if (country === 'China') {
      files.add('users-china.json');
    } else {
      files.add(`users-${toSlug(country)}.json`);
    }
    files.add(`users-org-${toSlug(country)}.json`);
  }

  for (const range of timeRanges) {
    files.add(`trending-${range}.json`);
    for (const lang of languages) {
      if (!lang.code) continue;
      files.add(`trending-${range}-${safeLang(lang.code)}.json`);
    }
  }

  return Array.from(files);
}

const requiredDataFiles = buildRequiredDataFiles();

interface FetchTask {
  script: string;
  args: string[];
  label: string;
  outputFile: string;
}

function buildFetchTasks(): FetchTask[] {
  const tasks: FetchTask[] = [];

  tasks.push({ script: 'fetchUsers.js', args: [], label: 'users-global', outputFile: 'users.json' });
  for (const country of countryCodes) {
    if (country === 'China') {
      tasks.push({ script: 'fetchUsers.js', args: ['--china'], label: 'users-China', outputFile: 'users-china.json' });
    } else {
      tasks.push({
        script: 'fetchUsers.js',
        args: ['--country', country],
        label: `users-${country}`,
        outputFile: `users-${toSlug(country)}.json`,
      });
    }
  }

  tasks.push({ script: 'fetchUsers.js', args: ['--org'], label: 'orgs-global', outputFile: 'users-org.json' });
  for (const country of countryCodes) {
    tasks.push({
      script: 'fetchUsers.js',
      args: ['--org', '--country', country],
      label: `orgs-${country}`,
      outputFile: `users-org-${toSlug(country)}.json`,
    });
  }

  tasks.push({ script: 'fetchRepos.js', args: [], label: 'repos-all', outputFile: 'repos.json' });
  tasks.push({ script: 'fetchRepos.js', args: ['--user'], label: 'repos-user', outputFile: 'repos-user.json' });
  tasks.push({ script: 'fetchRepos.js', args: ['--org'], label: 'repos-org', outputFile: 'repos-org.json' });

  for (const range of timeRanges) {
    tasks.push({
      script: 'fetchTrending.js',
      args: [range],
      label: `trending-${range}-all`,
      outputFile: `trending-${range}.json`,
    });
    for (const lang of languages) {
      if (!lang.code) continue;
      tasks.push({
        script: 'fetchTrending.js',
        args: [range, '--lang', lang.code],
        label: `trending-${range}-${lang.code}`,
        outputFile: `trending-${range}-${safeLang(lang.code)}.json`,
      });
    }
  }

  return tasks;
}

const fetchTasks = buildFetchTasks();

function jsonResponse(statusCode: number, payload: unknown): ResponseLike {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  };
}

function isSafeJsonFilename(filename: string): boolean {
  return /^[a-zA-Z0-9._-]+\.json$/.test(filename);
}

async function fileExists(pathname: string): Promise<boolean> {
  try {
    await access(pathname);
    return true;
  } catch {
    return false;
  }
}

function todayInTimezone(timeZone: string): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

function nextMidnightDelayMs(timeZone: string): number {
  const nowInZone = new Date(new Date().toLocaleString('en-US', { timeZone }));
  const nextMidnightInZone = new Date(nowInZone);
  nextMidnightInZone.setHours(24, 0, 0, 0);
  const delay = nextMidnightInZone.getTime() - nowInZone.getTime();
  return Math.max(60_000, delay);
}

async function readLastFetchDate(): Promise<string | null> {
  try {
    const raw = await readFile(fetchMetaFile, 'utf-8');
    const parsed = JSON.parse(raw) as { date?: string };
    return parsed.date || null;
  } catch {
    return null;
  }
}

async function writeLastFetchDate(date: string): Promise<void> {
  await writeFile(fetchMetaFile, JSON.stringify({ date, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
}

async function allRequiredFilesExist(): Promise<boolean> {
  for (const filename of requiredDataFiles) {
    if (!(await fileExists(join(dataDir, filename)))) {
      return false;
    }
  }
  return true;
}

async function getMissingRequiredFiles(): Promise<string[]> {
  const missing: string[] = [];
  for (const filename of requiredDataFiles) {
    if (!(await fileExists(join(dataDir, filename)))) {
      missing.push(filename);
    }
  }
  return missing;
}

function runNodeScript(scriptName: string, args: string[] = []): Promise<void> {
  return new Promise((resolvePromise, rejectPromise) => {
    const scriptPath = join(distDir, scriptName);
    const child = spawn(process.execPath, [scriptPath, ...args], { stdio: 'inherit' });

    child.once('error', rejectPromise);
    child.once('exit', (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }
      rejectPromise(new Error(`${scriptName} exited with code ${code}`));
    });
  });
}

async function refreshAllData(tasksToRun: FetchTask[] = fetchTasks): Promise<void> {
  if (refreshing) {
    console.log('[fetch] skip: already running');
    return;
  }

  refreshing = true;
  lastRefreshError = null;
  const startedAt = new Date();
  console.log(`[fetch] started at ${startedAt.toISOString()} (tasks=${tasksToRun.length})`);

  const failedTasks: string[] = [];

  try {
    for (const task of tasksToRun) {
      try {
        await runNodeScript(task.script, task.args);
      } catch (error) {
        failedTasks.push(task.label);
        console.error(`[fetch] task failed: ${task.label}`, error);
      }
      if (taskDelayMs > 0) {
        await sleep(taskDelayMs);
      }
    }

    const missingAfterRun = await getMissingRequiredFiles();
    if (failedTasks.length === 0 && missingAfterRun.length === 0) {
      await writeLastFetchDate(todayInTimezone(fetchTimezone));
      lastRefreshError = null;
    } else {
      const parts: string[] = [];
      if (failedTasks.length > 0) {
        parts.push(`failed tasks: ${failedTasks.join(', ')}`);
      }
      if (missingAfterRun.length > 0) {
        parts.push(`missing files: ${missingAfterRun.join(', ')}`);
      }
      lastRefreshError = parts.join(' | ');
      console.error(`[fetch] completed with issues: ${lastRefreshError}`);
    }
  } finally {
    lastRefreshAt = new Date().toISOString();
    console.log(`[fetch] finished at ${lastRefreshAt}`);
    refreshing = false;
  }
}

function scheduleDailyMidnightRefresh(): void {
  if (!autoFetchEnabled) {
    console.log('[fetch] auto fetch disabled (AUTO_FETCH=false)');
    return;
  }

  const scheduleNext = () => {
    const delayMs = nextMidnightDelayMs(fetchTimezone);
    const nextRunAt = new Date(Date.now() + delayMs).toISOString();
    console.log(`[fetch] next scheduled run at ${nextRunAt} (${fetchTimezone})`);
    setTimeout(async () => {
      await refreshAllData(fetchTasks);
      scheduleNext();
    }, delayMs);
  };

  void (async () => {
    const today = todayInTimezone(fetchTimezone);
    const lastDate = await readLastFetchDate();
    if (lastDate === today) {
      const missingFiles = await getMissingRequiredFiles();
      if (missingFiles.length === 0) {
        console.log('[fetch] today data exists, skip immediate refresh');
      } else {
        const missingTasks = fetchTasks.filter(task => missingFiles.includes(task.outputFile));
        console.log(`[fetch] today data partially missing (${missingFiles.length}), patching missing tasks (${missingTasks.length})`);
        await refreshAllData(missingTasks);
      }
    } else {
      console.log('[fetch] today data not found, running full refresh');
      await refreshAllData(fetchTasks);
    }
    scheduleNext();
  })();
}

interface ResponseLike {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host || `localhost:${port}`;
    const requestUrl = new URL(req.url || '/', `http://${host}`);
    const pathname = decodeURIComponent(requestUrl.pathname);
    const baseHeaders: Record<string, string> = {
      'Access-Control-Allow-Origin': corsAllowOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (req.method === 'OPTIONS') {
      res.writeHead(204, baseHeaders);
      res.end();
      return;
    }

    if (pathname === `${apiPrefix}/health`) {
      const lastDataDate = await readLastFetchDate();
      const response = jsonResponse(200, {
        ok: true,
        refreshing,
        lastRefreshAt,
        lastRefreshError,
        lastDataDate,
        timezone: fetchTimezone,
      });
      res.writeHead(response.statusCode, { ...response.headers, ...baseHeaders });
      res.end(response.body);
      return;
    }

    const dataPrefix = `${apiPrefix}/data/`;
    if (pathname.startsWith(dataPrefix)) {
      const filename = pathname.slice(dataPrefix.length);
      if (!isSafeJsonFilename(filename)) {
        const response = jsonResponse(400, { error: 'invalid filename' });
        res.writeHead(response.statusCode, { ...response.headers, ...baseHeaders });
        res.end(response.body);
        return;
      }

      const filePath = join(dataDir, filename);
      if (!(await fileExists(filePath))) {
        const response = jsonResponse(404, { error: 'data file not found', filename });
        res.writeHead(response.statusCode, { ...response.headers, ...baseHeaders });
        res.end(response.body);
        return;
      }

      const content = await readFile(filePath, 'utf-8');
      res.writeHead(200, {
        ...baseHeaders,
        'Content-Type': 'application/json; charset=utf-8',
      });
      res.end(content);
      return;
    }

    const response = jsonResponse(404, { error: 'not found' });
    res.writeHead(response.statusCode, { ...response.headers, ...baseHeaders });
    res.end(response.body);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const response = jsonResponse(500, { error: message });
    res.writeHead(response.statusCode, {
      ...response.headers,
      'Access-Control-Allow-Origin': corsAllowOrigin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    res.end(response.body);
  }
});

server.listen(port, () => {
  console.log(`[server] listening on port ${port}`);
  console.log(`[server] data dir: ${dataDir}`);
  console.log(`[server] api prefix: ${apiPrefix}`);
  console.log(`[fetch] task delay ms: ${taskDelayMs}`);
  console.log(`[fetch] timezone: ${fetchTimezone}`);
  console.log(`[server] cors allow origin: ${corsAllowOrigin}`);
});

scheduleDailyMidnightRefresh();
