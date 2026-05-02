import Logger, { Log, setAuthToken } from './logger.js';

const registrationLogger = new Logger('RegistrationAPI');
const API_CONFIG = {
  baseURL: 'http://20.207.122.201',
  endpoints: {
    register: '/evaluation-service/register',
    auth: '/evaluation-service/auth',
  },
  timeout: 30000,
};

class APIInterceptor {
  constructor(baseURL = API_CONFIG.baseURL) {
    this.baseURL = baseURL;
    this.logger = registrationLogger;
  }

  getFullURL(endpoint) {
    return `${this.baseURL}${endpoint}`;
  }

  logRequest(method, endpoint, data = null) {
    const url = this.getFullURL(endpoint);
    this.logger.info(`${method} Request`, {
      url,
      method,
      data: data ? JSON.parse(JSON.stringify(data)) : null,
    });
    Log('frontend', 'info', 'api', `${method} Request to ${endpoint}`);
  }

  logResponse(method, endpoint, status, data) {
    const url = this.getFullURL(endpoint);
    this.logger.info(`${method} Response`, {
      url,
      status,
      data,
    });
    Log('frontend', 'info', 'api', `${method} Response from ${endpoint}`);
  }

  logError(method, endpoint, error) {
    const url = this.getFullURL(endpoint);
    this.logger.error(`${method} Request Failed`, {
      url,
      status: error.status || 'Unknown',
      message: error.message,
      stack: error.stack,
    });
    Log('frontend', 'error', 'api', `${method} Request Failed for ${endpoint}`);
  }

  generateRandomString(length = 32) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
      const array = new Uint8Array(length);
      globalThis.crypto.getRandomValues(array);
      return Array.from(array)
        .map((value) => chars[value % chars.length])
        .join('');
    }

    return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  generateClientID() {
    return `client_${Date.now()}_${this.generateRandomString(8)}`;
  }

  generateClientSecret() {
    return this.generateRandomString(48);
  }

  prepareRegistrationData(userData) {
    const credentials = {
      clientID: this.generateClientID(),
      clientSecret: this.generateClientSecret(),
    };

    return {
      ...userData,
      ...credentials,
    };
  }

  async register(userData) {
    const endpoint = API_CONFIG.endpoints.register;
    const method = 'POST';
    const payload = this.prepareRegistrationData(userData);

    try {
      this.logRequest(method, endpoint, payload);

      const response = await fetch(this.getFullURL(endpoint), {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      if (!response.ok) {
        const error = new Error(
          responseData.message || `HTTP Error ${response.status}`
        );
        error.status = response.status;
        error.data = responseData;
        this.logError(method, endpoint, error);
        throw error;
      }

      this.logResponse(method, endpoint, response.status, responseData);
      return {
        success: true,
        status: response.status,
        data: responseData,
        clientCredentials: {
          clientID: payload.clientID,
          clientSecret: payload.clientSecret,
        },
      };
    } catch (error) {
      this.logError(method, endpoint, error);

      return {
        success: false,
        status: error.status || 500,
        message: error.message,
        data: error.data || null,
      };
    }
  }

  async auth(authData) {
    const endpoint = API_CONFIG.endpoints.auth;
    const method = 'POST';

    try {
      this.logRequest(method, endpoint, authData);

      const response = await fetch(this.getFullURL(endpoint), {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(authData),
      });

      const responseData = await response.json();
      if (!response.ok) {
        const error = new Error(
          responseData.message || `HTTP Error ${response.status}`
        );
        error.status = response.status;
        error.data = responseData;
        this.logError(method, endpoint, error);
        throw error;
      }

      setAuthToken(responseData.access_token || responseData.token);
      this.logResponse(method, endpoint, response.status, responseData);
      return {
        success: true,
        status: response.status,
        data: responseData,
      };
    } catch (error) {
      this.logError(method, endpoint, error);
      return {
        success: false,
        status: error.status || 500,
        message: error.message,
        data: error.data || null,
      };
    }
  }

  getLogs() {
    return this.logger.getLogs();
  }

  clearLogs() {
    this.logger.clearLogs();
  }

  exportLogs() {
    return this.logger.exportLogs();
  }
}

export { APIInterceptor, registrationLogger, API_CONFIG };
