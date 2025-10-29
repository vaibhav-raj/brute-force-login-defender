const { createModuleError } = require('../../../utils/createModuleError');
const AuthError = createModuleError('AUTH', 'AUTH_ERROR');
module.exports = { AuthError };
