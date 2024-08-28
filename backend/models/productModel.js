const mongoose = require('mongoose');
const slugify = require('slugify');
// const validator = require('validator');
// const User = require('./userModel');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A product must have a name'],
        trim: true,
        maxlength: [200, 'A product name must have less or equal then 200 characters '],
        minlength: [5, 'A product name must have more or equal then 5 characters '],
        // validate: [validator.isAlpha, 'Product name must only contain character']  its not include a spaces in word
    },
    category: { type: String, required: [true, 'A product must have a Category'] },
    slug: String,
    ratingsAverage: {
        type: Number,
        default: 4.5,
        min: [1, 'Rating must be above 1.0'],
        max: [5, 'Rating must be below 5.0'],
        set: val => Math.round(val * 10) /10
    },
    ratingsQuantity: { type: Number, default: 0 },
    newPrice: { type: Number, required: [true, 'A product must have a price'] },
    oldPrice: { type: Number },
    description: { type: String, trim: true },
    imageCover: { type: String },
    images: [String],
    sizes: [String],
    createdAt: { type: Date, default: Date.now(), select: false }, // mean this field not return in query
    available: { type: Boolean, default: true }

},
{
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
}
)

// tourSchema.index({price: 1});// {price: -1}
// tourSchema.index({price: 1, ratingsAverage: -1});
// tourSchema.index({slug: 1});
// tourSchema.index({startLocation: '2dsphere'});

// tourSchema.virtual('durationWeeks').get(function() {
//     return this.duration / 7;
// });

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
productSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
})

// to get all users data from guides array of ids of users (if guides: Array in Schema)
// tourSchema.pre('save', async function(next) {
//     const guidesPromises = this.guides.map(async id => await User.findById(id))
//     this.guides = await Promise.all(guidesPromises);
//     next();
// })

// tourSchema.pre('save', function(next) {
//     console.log("Will Save Document!");
//     next();
// })
// Document Middleware: runs after .save() and .create()
// tourSchema.post('save', function(doc, next) {
//     console.log(doc);
//     next();
// })

//VIRTUAL POPULATE 
productSchema.virtual('reviews', {
    ref: 'Review',
    foreignField: 'product',
    localField: '_id'
});

// productSchema.pre(/^find/, function(next) {
//     this.find({ available: { $ne: true } });
//     next();
// });

// tourSchema.pre(/^find/, function(next) {
//     //we use populate to fill up guides field with all user data  ....for relationShip 
//     this.populate({ path: 'guides', select: '-__v -passwordChangedAt'})
//     next();
// });
const Product = mongoose.model('Product', productSchema);
module.exports = Product;