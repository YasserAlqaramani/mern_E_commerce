require('dotenv').config({path: './config.env'})
const app = require('./app')
const mongoose = require('mongoose');

process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    process.exit(1);
});

mongoose.connect(process.env.DATABASE,{
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
}).then(() => {
    console.log('DB Connection Successful!')
});

port = process.env.PORT || 3000;
const server = app.listen(port, () => {
    console.log(`App Running on Port ${port}...`);
})

process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    server.close(() => {
        process.exit(1);
    })
});