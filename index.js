require('traceur-runtime');

module.exports = require('./build/zygo-server').default;

//Expose config api
module.exports.Config = require('./build/config');
