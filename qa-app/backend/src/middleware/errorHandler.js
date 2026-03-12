function errorHandler(err, req, res, next) {
    console.error('Error occurred:', err.message);
    if (err.stack) {
        console.error(err.stack);
    }
    
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        error: {
            message: err.message || '内部服务器错误',
            code: err.code || 'INTERNAL_ERROR'
        }
    });
}

module.exports = errorHandler;
