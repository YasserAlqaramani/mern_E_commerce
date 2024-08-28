const {promisify} = require('util');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');
const crypto = require('crypto');

const fs = require('fs');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
}

const createSendToken = (user, statusCode, res) => {
    const accessToken = signToken(user._id);

    res.status(statusCode).json({
        status: 'success',
        message: 'Successful',
        accessToken,
        data: {
            user
        }
    })
}

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
    });

    createSendToken(newUser, 201, res);
});

exports.login = catchAsync( async (req, res, next) => {
    const { email, password } = req.body;

    if(!email || !password){
        return next(new AppError('Please provide email and password!', 400));
    }

    const user = await User.findOne({email}).select('+password');
    if(!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    if(!user.active) return next(new AppError('You are DisActive, Please call the Admin to Check', 401));

    createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {

    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    } else if(req.cookies.jwt) { 
        token = req.cookies.jwt
    }

    if(!token) return next(new AppError('You are not logged in, Please login to get access', 401));

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    if(!currentUser) return next(new AppError('The user belonging to this token dose no longer exist.',401))
    
    if(currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password!, Please login again.', 401));
    }

    // Grant Access to Protected Route
    req.user = currentUser;
    next();
});

// ONLY FOR RENDERED PAGES, no ERRORS!!
exports.isLoggedIn = async (req, res, next) => {
    if(req.cookies.jwt) {
        try {
            const decoded = await promisify(jwt.verify)(req.cookies.jwt, process.env.JWT_SECRET);
            const currentUser = await User.findById(decoded.id);
            if(!currentUser) return next();
            
            if(currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }
        
            // There is a Logged in User  ACCESS TO THAT USER FROM OUR TEMPLATE
            req.user = currentUser;
            return next();
        } catch (err) {
            return next();
        }
    }
    next();
}

exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)){
            return next(new AppError('You do not have permission to perform this action', 403));
        }
        next();
    }
}

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if(!user) return next(new AppError('There is no user with email address', 404));

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forgot your password ignore this email`;
    
    //below is just to replace send token to the EMAIL!!!
    const fakeEmail = [{
        email: user.email,
        subject: 'your password reset token (valid for 10 min)',
        message
    }]
    fs.writeFile(
        `${__dirname}/../../public/email/email.json`,
        JSON.stringify(fakeEmail),
        err => {
            res.status(200).json({
                status: 'success',
                message: 'Token send to email'
            });
        }
    );
    //Here is really send EMAIL method!

    // try {
    //     await sendEmail({
    //         email: user.email,
    //         subject: 'your password reset token (valid for 10 min)',
    //         message
    //     });
        
    //     res.status(200).json({
    //         status: 'success',
    //         message: 'Token send to email'
    //     });
    // } catch (err) {
    //     user.passwordResetToken = undefined;
    //     user.passwordResetExpires = undefined;
    //     await user.save({ validateBeforeSave: false });

    //     return next(new AppError('There was an error sending the email. Try again later!',500));
    // }

})
exports.resetPassword = catchAsync(async (req, res, next) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({ 
        passwordResetToken: hashedToken, 
        passwordResetExpires: { $gt: Date.now() } 
    });

    if(!user) return next(new AppError('Token is Invalid or has Expired!', 400))

    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');

    const { currentPassword, password, passwordConfirm } = req.body;
    if(!(await user.correctPassword(currentPassword, user.password))) return next(new AppError('Your current password is wrong!',401))
    
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save();

    createSendToken(user, 200, res);
});
