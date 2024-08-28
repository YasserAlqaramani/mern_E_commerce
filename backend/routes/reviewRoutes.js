const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });
//{ mergeParams: true } is to get Access to proId from productRouter !!!

router.use(authController.protect);

router.route('/')
    .get(reviewController.getAllReviews)
    .post(
        authController.restrictTo('user','admin'),
        reviewController.setProductUserIds,
        reviewController.createReview
    );

router.route('/:id')
    .get(reviewController.getReview)
    .patch(
        authController.restrictTo('admin', 'user'),
        reviewController.updateReview
    )
    .delete(
        authController.restrictTo('admin', 'user'),
        reviewController.deleteReview
    );

module.exports = router;