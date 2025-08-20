const logger = {
    info: (message, meta = {}) => {
        console.log(`ℹ️  [INFO] ${new Date().toISOString()} - ${message}`, meta);
    },

    warn: (message, meta = {}) => {
        console.warn(`⚠️  [WARN] ${new Date().toISOString()} - ${message}`, meta);
    },

    error: (message, error = null, meta = {}) => {
        console.error(`❌ [ERROR] ${new Date().toISOString()} - ${message}`, {
            ...meta,
            ...(error && {
                error: error.message,
                stack: error.stack
            })
        });
    },

    success: (message, meta = {}) => {
        console.log(`✅ [SUCCESS] ${new Date().toISOString()} - ${message}`, meta);
    },

    debug: (message, meta = {}) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(`🐛 [DEBUG] ${new Date().toISOString()} - ${message}`, meta);
        }
    }
};

module.exports = logger;
