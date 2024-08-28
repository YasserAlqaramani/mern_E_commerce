const Review = require('./../models/reviewModel');
// const catchAsync = require('./../utils/catchAsync');
const factory = require('../utils/handlerFactory');

exports.setProductUserIds = (req, res, next) => {
    //ALLOW nested Route
    if(!req.body.product) req.body.product = req.params.proId;
    if(!req.body.user) req.body.user = req.user.id;

    next();
}
exports.getAllReviews = factory.getAll(Review);
exports.getReview = factory.getOne(Review);
exports.createReview = factory.createOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.deleteReview = factory.deleteOne(Review);