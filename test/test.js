import assert from 'assert';
import FetchHttpClient, { query, form, json, header, userAgent } from '../modules';

describe('FetchHttpClient', () => {
  it('should be a class.', () => {
    assert.notEqual(FetchHttpClient, null);
    assert(typeof FetchHttpClient === 'function');
  });

  it('can be add and remove middleware.', () => {
    const middleware = () => null;
    const client = new FetchHttpClient();
    client.addMiddleware(middleware).removeMiddleware(middleware);
  });

  it('can be fetch a url, pre/post processed with middlewares.', () => {
    global.fetch = () => Promise.resolve({ status: 200 });
    return new FetchHttpClient('http://mydomain.com')
      .addMiddleware(request => {
        assert.equal(request.url, 'http://mydomain.com/test');
        Promise.resolve('dumy-token')
          .then(token => (request.options.headers.Token = token, request));
      })
      .addMiddleware(request => assert.equal(request.options.headers.Token, 'dumy-token'))
      .addMiddleware(() => response => (response.status1 = response.status, response))
      .fetch('/test', { method: 'GET' })
      .then(response => {
        assert.equal(response.status, 200);
        assert.equal(response.status1, 200);
      });
  });

  it('can request url.', () => {
    global.fetch = () => Promise.resolve({ status: 200 });
    return new FetchHttpClient('http://mydomain.com')
      .request('/test', 'GET')
      .then(response => assert.equal(response.status, 200));
  });

  it('can request url via get.', () => {
    global.fetch = () => Promise.resolve({ status: 200 });
    return new FetchHttpClient('http://mydomain.com')
      .get('/test').then(response => assert.equal(response.status, 200));
  });

  it('can request url via post.', () => {
    global.fetch = () => Promise.resolve({ status: 200 });
    return new FetchHttpClient('http://mydomain.com')
      .post('/test').then(response => assert.equal(response.status, 200));
  });

  it('can request url via put.', () => {
    global.fetch = () => Promise.resolve({ status: 200 });
    return new FetchHttpClient('http://mydomain.com')
      .put('/test').then(response => assert.equal(response.status, 200));
  });

  it('can request url via delete.', () => {
    global.fetch = () => Promise.resolve({ status: 200 });
    return new FetchHttpClient('http://mydomain.com')
      .delete('/test').then(response => assert.equal(response.status, 200));
  });

  it('can request url via patch.', () => {
    global.fetch = () => Promise.resolve({ status: 200 });
    return new FetchHttpClient('http://mydomain.com')
      .patch('/test').then(response => assert.equal(response.status, 200));
  });

  it('can resovle a url.', () => {
    let client = new FetchHttpClient('http://mydomain.com');
    assert.equal('http://mydomain.com/', client.resolveUrl('/'));
    assert.equal('http://mydomain.com/api', client.resolveUrl('/api'));
    assert.equal('http://mydomain.com/api', client.resolveUrl('api'));
    assert.equal('http://site.com/test/path', client.resolveUrl('http://site.com/test/path'));
    assert.equal('https://site.com/test/path', client.resolveUrl('https://site.com/test/path'));
    assert.equal('//site.com/test/path', client.resolveUrl('//site.com/test/path'));
    client = new FetchHttpClient('http://mydomain.com/api');
    assert.equal('http://mydomain.com/test', client.resolveUrl('/test'));
    assert.equal('http://mydomain.com/api/test', client.resolveUrl('test'));
    client = new FetchHttpClient('//mydomain.com/api');
    assert.equal('//mydomain.com/test', client.resolveUrl('/test'));
    assert.equal('//mydomain.com/api/test', client.resolveUrl('test'));
  });
});

describe('Middleware query', () => {
  it('should create query string.', () => {
    let request = {
      url: '/test',
      options: {
        query: {
          key: 'value',
        },
      },
    };
    query()(request);
    assert.equal(request.url, '/test?key=value');

    request = {
      url: '/test?',
      options: {
        query: {
          key: 'value',
        },
      },
    };
    query()(request);
    assert.equal(request.url, '/test?key=value');

    request = {
      url: '/test?id=1',
      options: {
        query: {
          key: 'value',
        },
      },
    };
    query()(request);
    assert.equal(request.url, '/test?id=1&key=value');

    request = {
      url: '/test?id=1&',
      options: {
        query: {
          key: 'value',
        },
      },
    };
    query()(request);
    assert.equal(request.url, '/test?id=1&key=value');
  });
});

describe('Middleware form', () => {
  it('should create form request.', () => {
    const request = {
      options: {
        headers: {},
        form: {
          key: 'value',
        },
      },
    };
    form()(request);
    assert.equal(request.options.body, 'key=value');
    assert.equal(request.options.headers['Content-Type']
      , 'application/x-www-form-urlencoded;charset=UTF-8');
  });
});

describe('Middleware json', done => {
  it('should handle json request and response.', () => {
    const request = {
      options: {
        headers: {},
        json: {
          key: 'value',
        },
      },
    };

    const response = {
      headers: {
        get: key => {
          assert.equal(key, 'Content-Type');
          return 'application/json';
        },
      },
      json: () => Promise.resolve(({ key: 'value' })),
    };

    json()(request)(response).then(response => {
      assert.equal(response.jsonData, { key: 'value' });
      done();
    });
    assert.equal(request.options.body, '{"key":"value"}');
    assert.equal(request.options.headers['Content-Type'], 'application/json');
    assert.equal(request.options.headers.Accept, 'application/json');
  });
});


describe('Middleware header', () => {
  it('should create headers on request.', () => {
    const request = {
      options: {
        headers: {},
      },
    };
    header({ 'X-Test': 'test' })(request);
    assert.equal(request.options.headers['X-Test'], 'test');
  });
});

describe('Middleware userAgent', () => {
  it('should userAgent headers on request.', () => {
    const request = {
      options: {
        headers: {},
      },
    };
    userAgent({ Test: 'test', Test2: 'test2' })(request);
    assert.equal(request.options.headers['User-Agent'], 'Test/test Test2/test2');
  });
});
