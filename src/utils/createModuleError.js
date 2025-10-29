const { AppError } = require('./error');

function createModuleError(moduleName, defaultCode) {
    return class ModuleError extends AppError {
        constructor({ message, status = 400, errorCode = defaultCode, details }) {
            super({ message, status, errorCode, details });
            this.module = moduleName.toUpperCase();
        }
    };
}

module.exports = { createModuleError };
