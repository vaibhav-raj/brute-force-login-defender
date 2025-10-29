module.exports.getClientIP = function (req) {
    const xff = req.headers['x-forwarded-for'];
    if (xff) {
        return xff.split(',')[0].trim();
    }

    if (req.headers['cf-connecting-ip']) {
        return req.headers['cf-connecting-ip'];
    }

    if (req.headers['x-real-ip']) {
        return req.headers['x-real-ip'];
    }

    return (
        req.ip ||
        (req.connection && req.connection.remoteAddress) ||
        (req.socket && req.socket.remoteAddress) ||
        (req.connection && req.connection.socket && req.connection.socket.remoteAddress) ||
        'anonymous'
    );
};
