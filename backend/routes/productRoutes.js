const express = require('express');
const productController = require('../controllers/productController');
const authController = require('../controllers/authController');
// const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./reviewRoutes');


const router = express.Router();

router.use('/:proId/reviews', reviewRouter);

// router.param('id', productController.checkID)
router.route('/popular-product').get(
    productController.aliasTopProducts,
    productController.getAllProducts
);

router.route('/')
    .get(productController.getAllProducts)
    .post(
        authController.protect,
        // authController.restrictTo('admin', 'lead-guide'),
        productController.uploadProductImages,
        productController.resizeProductImagesToCreate,
        productController.createProduct
    );
router.route('/:id')
    .get(productController.getProduct)
    .patch(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        productController.uploadProductImages,
        productController.resizeProductImages,
        productController.updateProduct
    )
    .delete(
        authController.protect,
        authController.restrictTo('admin', 'lead-guide'),
        productController.deleteProduct
    );
module.exports = router;