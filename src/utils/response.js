exports.success = (res, data, message = "Success", status = 200) => {
    res.status(status).json({
        success: true,
        message,
        data,
    });
};
