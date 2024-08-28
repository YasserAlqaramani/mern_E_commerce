const AppError = require("../utils/appError");

const handelCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
}

const handelDuplicateFieldsDB = err => {
    const value = err.message.match(/(["'])(\\?.)*?\1/);
    const message = `Duplicate field value: ${value[0]}, Please use another value`;
    return new AppError(message, 400);
}

const handelValidationErrorDB = err => {

    const errors = Object.values(err.errors).map(el => el.message);

    const message = `Invalid Input Data. ${errors.join('. ')}`;
    return new AppError(message, 400);
}

const sendErrorDev = (err, req, res) => {

    if(req.originalUrl.startsWith('/api')) {
        return res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: err.message
    })
}
const sendErrorProd = (err, req, res) => {

    if(req.originalUrl.startsWith('/api')) {
        if (err.isOperational) {
            return res.status(err.statusCode).json({
                status: err.status,
                message: err.message
            });
        }
        console.error('ERROR: ', err);
        return res.status(500).json({
            status: 'error',
            message: 'Something went very wrong! '
        });
    }
    if (err.isOperational) {
        return res.status(err.statusCode).render('error', {
            title: 'Something went wrong!',
            msg: err.message
        });
    }
    console.error('ERROR: ', err);
    return res.status(err.statusCode).render('error', {
        title: 'Something went wrong!',
        msg: 'Please try again later'
    });
}

const handelJWTError = () => new AppError('Invalid token, Please login again!', 401);
const handelJWTExpiredError = () => new AppError('Your token has expired!, Please login again', 401);

module.exports = ((err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    } else if (process.env.NODE_ENV === 'production') {

        let error = {...err};
        error.message = err.message;
        
        if (err.name === 'CastError') error = handelCastErrorDB(err);
        if (err.code === 11000) error = handelDuplicateFieldsDB(err);
        if (err.name === 'ValidationError') error = handelValidationErrorDB(err);
        if (err.name === 'JsonWebTokenError') error = handelJWTError();
        if (err.name === 'TokenExpiredError') error = handelJWTExpiredError();
        sendErrorProd(error, req, res);
    }
})