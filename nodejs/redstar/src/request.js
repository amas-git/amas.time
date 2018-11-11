const axios = require('axios');

const instance = axios.create({
  timeout: 5000, // 超时3000ms
});

// http request post method
function post(url, data = {}, options = {}) {
  const optionConf = options;
  optionConf.data = data;
  optionConf.url = url;
  optionConf.method = 'post';
  return instance(optionConf).then(response => response);
}

// http request get method
function get(url, params = {}, options = {}) {
  const optionConf = options;
  optionConf.params = params;
  optionConf.url = url;
  optionConf.method = 'get';
  return instance(optionConf).then(response => response);
}
module.exports = {
  post,
  get,
};