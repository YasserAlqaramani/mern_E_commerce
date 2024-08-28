const Product = require('../models/productModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const multer = require('multer');
const sharp = require('sharp');

const factory = require('../utils/handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if(file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image, Please upload only images.', 400), false);
    }
}

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
})

exports.uploadProductImages = upload.fields([ // req.files ----MIX OF SINGLE & MULTIPLE
    { name: 'imageCover', maxCount: 1 },
    { name: 'images', maxCount: 4 }
])
//upload.single('image') req.file ---- SINGLE
//upload.array('images', 5) req.files ---- MULTIPLE

exports.resizeProductImages = catchAsync(async (req, res, next) => {
    if(!req.files.imageCover || !req.files.images) return next();

    // imageCover
    req.body.imageCover = `product-${req.params.id}-${Date.now()}-cover.jpeg`
    await sharp(req.files.imageCover[0].buffer)
            .resize(1000, 1000)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/products/${req.body.imageCover}`);

    // images
    req.body.images = [];
    await Promise.all(
        req.files.images.map( async (file, i) => {
        const filename = `product-${req.params.id}-${Date.now()}-${i + 1}.jpeg`
        await sharp(file.buffer)
            .resize(1000, 1000)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/products/${filename}`);
        req.body.images.push(filename);
        })
    );
    next();
});

exports.resizeProductImagesToCreate = catchAsync(async (req, res, next) => {
    console.log(req.files);
    if(!req.files.imageCover || !req.files.images) return next();

    //imageCover
    req.body.imageCover = `product-${Math.random()}-${Date.now()}-cover.jpeg`
    await sharp(req.files.imageCover[0].buffer)
            .resize(500, 425)
            .toFormat('png')
            .jpeg({ quality: 90 })
            .toFile(`public/img/products/${req.body.imageCover}`);

    // images
    req.body.images = [];
    await Promise.all(
        req.files.images.map( async (file, i) => {
        const filename = `product-${Math.random()}-${Date.now()}-${i + 1}.jpeg`
        await sharp(file.buffer)
            .resize(500, 500)
            .toFormat('png')
            .jpeg({ quality: 90 })
            .toFile(`public/img/products/${filename}`);
        req.body.images.push(filename);
        })
    );
    next();
});

exports.aliasTopProducts = (req, res, next) => {
    req.query.limit = '8';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsAverage';
    next();
}

exports.getAllProducts = factory.getAll(Product);
exports.getProduct = factory.getOne(Product, { path: 'reviews' });
exports.createProduct = factory.createOne(Product);
exports.updateProduct = factory.updateOne(Product);
exports.deleteProduct = factory.deleteOne(Product);