class HttpClient {
  baseUrl:string;
  middlewareId:number;
  middlewares:Array<any>;

  constructor(baseUrl) {
    this.baseUrl = baseUrl;
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
      return;
    }

    if (this.middlewares[middleware.middlewareId]) {
      delete this.middlewares[middleware.middlewareId];
    }

    return this;
  }

  request(path:string, options) {
    if (typeof fetch !== "function") {
      throw new TypeError("fetch() function not available");
    }

    options = { headers: {}, ...options};

    const url = this._resolveUrl(path);
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

    return requestPromise.then((response) => responseMiddlewares.reduce(
      (promise, middleware) => promise.then(response => middleware(response) || response),
      Promise.resolve(response)
    ));
  }

  _resolveUrl(path:string, query = {}) {
    if (path.toLowerCase().startsWith('http://')
      || path.toLowerCase().startsWith('https://')
      || path.startsWith('//')) {
      return path;
    }

    let baseUrl = this.baseUrl.replace(/(^\/+|\/+$)/g, '');
    let fullUrl = '';

    if (path.startsWith('/')) {
      const rootPos = baseUrl.indexOf('/', baseUrl.indexOf('//') + 2);
      fullUrl = baseUrl.substr(0, rootPos) + path;
    } else {
      fullUrl = baseUrl + '/' + path;
    }

    return fullUrl;
  }
}

export default HttpClient;
