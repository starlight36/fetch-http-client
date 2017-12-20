# Fetch Http Client

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/starlight36/fetch-http-client/master/LICENSE) [![npm version](https://badge.fury.io/js/fetch-http-client.svg)](https://badge.fury.io/js/fetch-http-client) [![Build Status](https://travis-ci.org/starlight36/fetch-http-client.svg?branch=master)](https://travis-ci.org/starlight36/fetch-http-client) [![Coverage Status](https://coveralls.io/repos/github/starlight36/fetch-http-client/badge.svg)](https://coveralls.io/github/starlight36/fetch-http-client)

A http client wrapper for [Fetch API](https://github.com/whatwg/fetch) with middleware support.

# Introduction

Fetch API is a elegant way to access HTTP resources. I used it in my React/ReactNative project as the default network layer. But it still has some inconvenience to use. For example, every request should carry the access token in HTTP request headers, ervery request error should be logged to console etc. 

If Fetch API support middleware, everything can be elegantly fixed. Both [fetch-plus](https://github.com/RickWong/fetch-plus) and [http-client](https://github.com/mjackson/http-client) provided the middleware support, but if you need some asynchronous pre-request opreation, they could not suppport elegantly.

So this project is another choice to use Fetch API with middleware support, it's quite simple and powerful.

# Installation

```shell
npm install fetch-http-client --save
```

# Usage

## Import

```js
import FetchHttpClient, { json } from 'fetch-http-client';
```

## Quick start

```js
// Create a new client object.
const client = new FetchHttpClient('http://api.example.com/endpoint');

// Add access token
client.addMiddleware(request => {
  request.options.headers['X-Access-Token'] = 'secret';
});

// Add json support
client.addMiddleware(json());

// Add Logging
client.addMiddleware(request => response => {
  console.log(request, response);
});

// Fire request.
client.get('test').then(response => console.log(response.jsonData));

// Path variables support.
client.get('users/{id}', { uriParams: { id: 1 } }).then(response => console.log(response.jsonData));
```

## Asynchronous pre-request middleware

if your access token is stored in a asynchronous storage, it should be fetch before every request, you can use such kind of middleware:

```js
// Add access token asynchronously
client.addMiddleware(request => {
  return AsynchronousStorage.fetch('accessToken').then(token => {
    request.options.headers['X-Access-Token'] = token;
    return request;
  });
});
```

That means your middleware could return a `Promise` object and the real request opreate will be issued after the asynchronous method finished.

**NEVER forget returning the request object after you handled the result!**

# API

## FetchHttpClient

```js
new FetchHttpClient(baseUrl:string);
```

### fetch

`fetch` method can been used the same as Fetch API.

```
instance.fetch(uri:string[, options: object])
```

### request

Convenience way to issue a request with specific verb.

```
instance.request(uri:string, method:string[, options: object])
```

### get

Convenience way to issue a GET request.

```
instance.get(uri:string[, options: object])
```

### post

Convenience way to issue a POST request.

```
instance.post(uri:string[, options: object])
```

### put

Convenience way to issue a PUT request.

```
instance.put(uri:string[, options: object])
```

### delete

Convenience way to issue a DELETE request.

```
instance.delete(uri:string[, options: object])
```

### patch

Convenience way to issue a PATCH request.

```
instance.patch(uri:string[, options: object])
```

## Build-in middlewares

### query

This middleware could add the ability to append object value to query string:

```js
// Add query middleware
client.addMiddleware(query());

// Request
client.get('test', {
  query: {
    foo: 'FOO',
    bar: 'BAR',
  },
});
```

It will request to `http://api.example.com/endpoint/test?foo=FOO&bar=BAR`.

### form

Like `query`, this could be used to handle post form values.

```js
// Add form middleware
client.addMiddleware(form());

// Request
client.post('test', {
  form: {
    foo: 'FOO',
    bar: 'BAR',
  },
});
```

### header

A convenience middleware to add headers to request.

```js
// Add header middleware
client.addMiddleware(header({
  'X-Request-By': 'FetchHttpClient',
}));

```

### userAgent

A convenience middleware to set User-Agent to headers.

```js
// Add header middleware
client.addMiddleware(userAgent({
  'Client': '1.1',
}));

```

### json

Convert object to request and parse from response.

```js
// Add json middleware
client.addMiddleware(json());

// Request
client.post('add', {
  json: {
    foo: 'FOO',
  },
}).then(response => {
  console.log(response.jsonData);
});
```

### timeout

Set timeout options to fetch.

```js
// Add timeout middleware
client.addMiddleware(timeout(1000));
```

### credentials

Set credentials options to fetch. If you want to automatically send cookies for the current domain, use this middleware and config it as `same-origin`.

```js
// Add credentials middleware
client.addMiddleware(credentials('same-origin'));
```

# Feedback

If you have any questions, use [Issues](https://github.com/starlight36/fetch-http-client/issues).

Sina Weibo: [@starlight36](http://weibo.com/starlight36)

# License

MIT Licence.




