import { stringify } from 'query-string';

export default class FetchHttpClient {

  constructor(baseUrl) {
    this.baseUrl = baseUrl || '';
    this.middlewareId = 1;
    this.middlewares = [];
  }

  addMiddleware(middleware) {
    if (!middleware.middlewareId) {
      middleware.middlewareId = this.middlewareId++;
    }
    this.middlewares.push(middleware);

    return this;
  }

  removeMiddleware(middleware) {
    if (!middleware.middlewareId) {
      return this;
    }

    if (this.middlewares[middleware.middlewareId]) {
      delete this.middlewares[middleware.middlewareId];
    }

    return this;
  }

  async fetch(path, options = {}) {
    if (typeof fetch !== 'function') {
      throw new TypeError('fetch() function not available');
    }

    options = { headers: {}, ...options };

    const url = this.resolveUrl(path, options.uriParams || {});
    const responseMiddlewares = [];
    const requestPromise = this.middlewares.reduce(
      (promise, middleware) => promise.then(request => {
        const result = middleware(request);
        if (typeof result === 'function') {
          responseMiddlewares.push(result);
        }
        return (result && typeof result !== 'function') ? result : request;
      }),
      Promise.resolve({ url, path, options })
    ).then(request => fetch(request.url, request.options));

    return requestPromise.then(response => responseMiddlewares.reduce(
      (promise, middleware) => promise.then(response => middleware(response) || response),
      Promise.resolve(response)
    ));
  }

  async request(path, method, options = {}) {
    return await this.fetch(path, { ...options, method });
  }

  async get(path, options = {}) {
    return await this.request(path, 'GET', options);
  }

  async post(path, options = {}) {
    return await this.request(path, 'POST', options);
  }

  async put(path, options = {}) {
    return await this.request(path, 'PUT', options);
  }

  async delete(path, options = {}) {
    return await this.request(path, 'DELETE', options);
  }

  async patch(path, options = {}) {
    return await this.request(path, 'PATCH', options);
  }

  resolveUrl(path, variables = {}) {
    if (path.toLowerCase().startsWith('http://')
      || path.toLowerCase().startsWith('https://')
      || path.startsWith('//')) {
      return path;
    }

    const baseUrl = this.baseUrl.replace(/\/+$/g, '');
    let fullUrl = '';

    if (path.startsWith('/')) {
      const rootPos = baseUrl.indexOf('/', baseUrl.indexOf('//') + 2);
      fullUrl = baseUrl.substr(0, rootPos === -1 ? undefined : rootPos) + path;
    } else {
      fullUrl = `${baseUrl}/${path}`;
    }

    fullUrl = fullUrl.replace(/\{(\w+)\}/ig, (match, group) => {
      if (!variables[group]) throw new Error(`Unknown path variable '${group}'.`);
      return encodeURIComponent(variables[group]);
    });

    return fullUrl;
  }
}

export const query = () => request => {
  if (request.options.query) {
    const queryString = stringify(request.options.query);
    if (request.url.indexOf('?') === -1) {
      request.url = request.url.concat('?');
    }
    if (request.url.endsWith('&') || request.url.endsWith('?')) {
      request.url = request.url.concat(queryString);
    } else {
      request.url = request.url.concat('&', queryString);
    }
  }
};

export const form = () => request => {
  if (request.options.form) {
    request.options.body = stringify(request.options.form);
    request.options.headers['Content-Type'] = 'application/x-www-form-urlencoded;charset=UTF-8';
  }
};

export const json = () => request => {
  if (request.options.json) {
    request.options.body = JSON.stringify(request.options.json);
    request.options.headers['Content-Type'] = 'application/json';
  }
  request.options.headers.Accept = 'application/json';

  return response => {
    const contentType = response.headers.get('Content-Type') || '';
    if (contentType.indexOf('json') === -1) return response;
    return response.json().then(json => (response.jsonData = json, response));
  };
};

export const header = headers => request => {
  request.options.headers = { ...request.options.headers, ...headers };
};

export const userAgent = ua => request => {
  const uaSegments = [];
  Object.keys(ua).forEach(key => uaSegments.push(`${key}/${ua[key]}`));
  request.options.headers['User-Agent'] = uaSegments.join(' ');
};

export const credentials = credentials => request => {
  request.options.credentials = credentials;
};
