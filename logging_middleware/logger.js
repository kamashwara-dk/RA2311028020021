const LogLevel = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
  fatal: 'fatal',
};

const validStacks = ['backend', 'frontend'];
const validPackages = [
  'api',
  'component',
  'hook',
  'page',
  'state',
  'style',
  'auth',
  'config',
  'middleware',
  'utils',
  'cache',
  'controller',
  'cron_job',
  'db',
  'domain',
  'handler',
  'repository',
  'route',
  'service',
];

const LOG_API_URL = 'http://20.207.122.201/evaluation-service/logs';
let authToken = null;
const logHistory = [];

function createLogEntry(stack, level, packageName, message, data = null) {
  const timestamp = new Date().toISOString();
  return {
    timestamp,
    stack,
    level,
    package: packageName,
    message,
    data,
  };
}

export function setAuthToken(token) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function clearAuthToken() {
  authToken = null;
}

export async function Log(stack, level, packageName, message, data = null) {
  const normalizedStack = stack?.toLowerCase();
  const normalizedLevel = level?.toLowerCase();
  const normalizedPackage = packageName?.toLowerCase();

  if (!validStacks.includes(normalizedStack)) {
    console.warn(`Invalid log stack: ${stack}. Expected one of ${validStacks.join(', ')}`);
  }

  if (!Object.values(LogLevel).includes(normalizedLevel)) {
    console.warn(`Invalid log level: ${level}. Expected one of ${Object.values(LogLevel).join(', ')}`);
  }

  if (!validPackages.includes(normalizedPackage)) {
    console.warn(`Invalid log package: ${packageName}. Expected one of ${validPackages.join(', ')}`);
  }

  const entry = createLogEntry(normalizedStack, normalizedLevel, normalizedPackage, message, data);
  logHistory.push(entry);

  const prefix = `[${entry.timestamp}] [${entry.level}] [${entry.package}] [${entry.stack}]`;
  if (data) {
    console.log(`${prefix} ${entry.message}`, data);
  } else {
    console.log(`${prefix} ${entry.message}`);
  }

  try {
    if (authToken) {
      await fetch(LOG_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          stack: entry.stack,
          level: entry.level,
          package: entry.package,
          message: entry.message,
        }),
      });
    }
  } catch (error) {
    console.warn('Log API request failed:', error);
  }

  return entry;
}

export function getLogs() {
  return [...logHistory];
}

export function clearLogs() {
  logHistory.length = 0;
}

export function exportLogs() {
  return JSON.stringify(logHistory, null, 2);
}

class Logger {
  constructor(namespace = 'App') {
    this.namespace = namespace;
    this.logs = [];
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      namespace: this.namespace,
      message,
      data,
    };

    this.logs.push(logEntry);
    const prefix = `[${timestamp}] [${level}] [${this.namespace}]`;
    if (data) {
      console.log(`${prefix} ${message}`, data);
    } else {
      console.log(`${prefix} ${message}`);
    }
  }

  debug(message, data) {
    this.log(LogLevel.debug, message, data);
  }

  info(message, data) {
    this.log(LogLevel.info, message, data);
  }

  warn(message, data) {
    this.log(LogLevel.warn, message, data);
  }

  error(message, data) {
    this.log(LogLevel.error, message, data);
  }

  getLogs() {
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

export default Logger;
