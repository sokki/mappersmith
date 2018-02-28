'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mockRequest = require('./mock-request');

var _mockRequest2 = _interopRequireDefault(_mockRequest);

var _request = require('../request');

var _request2 = _interopRequireDefault(_request);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var VALUE_NOT_MATCHED = '<MAPPERSMITH_VALUE_NOT_MATCHED>';

/**
 * @param {Integer} id
 * @param {Object} client - the client generated by {@link forge}
 */
function MockResource(id, client) {
  if (!client || !client._manifest) {
    throw new Error('[Mappersmith Test] "mockClient" received an invalid client');
  }

  this.id = id;
  this.manifest = client._manifest;
  this.resourceName = null;
  this.methodName = null;
  this.requestParams = {};
  this.responseData = null;
  this.responseHeaders = {};
  this.responseStatus = 200;
  this.mockRequest = null;
}

MockResource.prototype = {
  /**
   * @return {MockResource}
   */
  resource: function resource(resourceName) {
    this.resourceName = resourceName;
    return this;
  },


  /**
   * @return {MockResource}
   */
  method: function method(methodName) {
    this.methodName = methodName;
    return this;
  },


  /**
   * @return {MockResource}
   */
  with: function _with(requestParams) {
    this.requestParams = requestParams;
    return this;
  },


  /**
   * @return {MockResource}
   */
  headers: function headers(responseHeaders) {
    this.responseHeaders = responseHeaders;
    return this;
  },


  /**
   * @return {MockResource}
   */
  status: function status(responseStatus) {
    this.responseStatus = responseStatus;
    return this;
  },


  /**
   * @return {MockResource}
   */
  response: function response(responseData) {
    this.responseData = responseData;
    return this;
  },


  /**
   * @return {MockAssert}
   */
  assertObject: function assertObject() {
    return this.toMockRequest().assertObject();
  },


  /**
   * @return {MockRequest}
   */
  toMockRequest: function toMockRequest() {
    var _this = this;

    if (!this.mockRequest) {
      var methodDescriptor = this.manifest.createMethodDescriptor(this.resourceName, this.methodName);
      var initialRequest = new _request2.default(methodDescriptor, this.requestParams);
      var middleware = this.manifest.createMiddleware({
        resourceName: this.resourceName,
        resourceMethod: this.methodName,
        mockRequest: true
      });
      var finalRequest = middleware.reduce(function (request, middleware) {
        return middleware.request(request);
      }, initialRequest);

      var params = finalRequest.params();
      var hasParamMatchers = Object.keys(params).find(function (key) {
        return typeof params[key] === 'function';
      });
      var urlMatcher = function urlMatcher(requestUrl, requestParams) {
        var expandedParams = _this.expandParams(params, requestParams);
        var testRequest = finalRequest.enhance({ params: expandedParams });
        return testRequest.url() === requestUrl;
      };

      var url = hasParamMatchers ? urlMatcher : finalRequest.url();

      this.mockRequest = new _mockRequest2.default(this.id, {
        method: finalRequest.method(),
        url: url,
        body: finalRequest.body(),
        response: {
          status: this.responseStatus,
          headers: this.responseHeaders,
          body: this.responseData
        }
      });
    }

    return this.mockRequest;
  },


  /**
   * @private
   */
  expandParams: function expandParams(mockParams, requestParams) {
    return Object.keys(mockParams).reduce(function (obj, key) {
      var value = requestParams[key];
      if (typeof mockParams[key] === 'function') {
        obj[key] = mockParams[key](value) ? value : VALUE_NOT_MATCHED;
      } else {
        obj[key] = value;
      }
      return obj;
    }, {});
  }
};

exports.default = MockResource;