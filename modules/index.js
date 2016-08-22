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

  fetch(path, options = {}) {
    if (typeof fetch !== 'function') {
      throw new TypeError('fetch() function not available');
    }

    options = { headers: {}, ...options };

    const url = this.resolveUrl(path);
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

  request(path, method, options = {}) {
    return this.fetch(path, { ...options, method });
  }

  get(path, options = {}) {
    return this.request(path, 'GET', options);
  }

  post(path, options = {}) {
    return this.request(path, 'POST', options);
  }

  put(path, options = {}) {
    return this.request(path, 'PUT', options);
  }

  delete(path, options = {}) {
    return this.request(path, 'DELETE', options);
  }

  patch(path, options = {}) {
    return this.request(path, 'PATCH', options);
  }

  resolveUrl(path) {
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
    request.options.headers.Accept = 'application/json';
    request.options.headers['Content-Type'] = 'application/json';
  }

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
