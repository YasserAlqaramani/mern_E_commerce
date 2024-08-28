const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');

const productRoutes = require('./routes/productRoutes')
const userRouter = require('./routes/userRoutes')
const reviewRouter = require('./routes/reviewRoutes');

const AppError = require('./utils/appError');
const globalErrorHandler = require('./utils/handleError');

const app = express();

// Serving Static Files
app.use(express.static(path.join(__dirname, 'public')));

// DEVELOPMENT logging
if(process.env.NODE_ENV === 'development') app.use(morgan('dev'));


const limiter = rateLimit({
    max: 100,
    windowMs: 60 * 60 * 1000,
    message: 'Too many request from this IP, Please try again in an hour!'
})
// Set Security HTTP headers
app.use(helmet());

// Limit requests from same IP
// app.use('/api', limiter);


app.use(cors('*'));
// Body Parser, reading data from body into req.body
// json({ limit: '10kb' }
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//Data Sanitization Against NoSQL query Injection
app.use(mongoSanitize());
//Data Sanitization Against XSS
app.use(xss());

//Prevent Parameter Pollution
app.use(hpp({
    whitelist: [
        'name',
        'ratingsQuantity',
        'ratingsAverage',
        'category',
        'newPrice'
    ]
}))

//Test MiddleWare
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
})

app.use('/api/v1/products', productRoutes);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
    next(new AppError(`Can't Find ${req.originalUrl} on this Server`, 404));
})

app.use(globalErrorHandler);
module.exports = app;