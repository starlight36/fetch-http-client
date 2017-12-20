import assert from 'assert';
import FetchHttpClient, {
  query,
  form,
  json,
  header,
  userAgent,
  credentials,
  timeout,
} from '../modules';

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
        assert.equal(request.url, 'http://mydomain.com/test/1');
        Promise.resolve('dumy-token')
          .then(token => (request.options.headers.Token = token, request));
      })
      .addMiddleware(request => assert.equal(request.options.headers.Token, 'dumy-token'))
      .addMiddleware(() => response => (response.status1 = response.status, response))
      .fetch('/test/{id}', { method: 'GET', uriParams: { id: 1 } })
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
    assert.equal('http://mydomain.com/api/1', client.resolveUrl('api/{id}', { id: 1 }));
    assert.equal('http://mydomain.com/api/1/test', client.resolveUrl('api/{id}/{name}', { id: 1, name: 'test' }));
    assert.equal('http://mydomain.com/api/%E6%B1%89%E5%AD%97', client.resolveUrl('api/{name}', { name: '汉字' }));
    try {
      client.resolveUrl('api/{unknown}');
      assert.fail('Should throw exception when a unknown variable in path.');
    } catch (ex) {
      assert.equal('Unknown path variable \'unknown\'.', ex.message);
    }
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

  it('should handle request without body and response.', () => {
    const request = {
      options: {
        headers: {},
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

describe('Middleware credentials', () => {
  it('should set credentials options on request.', () => {
    const request = {
      options: {},
    };
    credentials('same-origin')(request);
    assert.equal(request.options.credentials, 'same-origin');
  });
});

describe('Middleware timeout', () => {
  it('should set timeout options on request.', () => {
    const request = new Promise(resolve => {
      setTimeout(resolve, 200, 'success!');
    });

    timeout(300)(request).then(res => {
      assert.equal(res, 'success!');
    });
  });

  it('should set timeout options on request. With timeout.', () => {
    const request = new Promise(resolve => {
      setTimeout(resolve, 200, 'success!');
    });

    timeout(100)(request).catch(err => {
      assert.equal(err, 'request timeout!');
    });
  });
});
