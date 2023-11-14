const asyncHandler = require("express-async-handler");
const User = require("../models/userModels");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Token = require("../models/tokenModel");
const crypto = require("crypto");
const sendEmail = require("../utils/sendMail");
const Product = require('../models/productModel');
const cloudinary = require('cloudinary').v2;

// ...





const generateToken = (id) => {
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: "1d" })
}

// register user
const registerUser = asyncHandler(async (req, res) => {
    const {name, email, password} = req.body

    // validation
    if(!name || !email || !password) {
        res.status(400)
        throw new Error("please fill in all required fields")
    }
    if(password.length < 6) {
        res.status(400)
        throw new Error("Password must be up to 6 characters")
     }
    // check if user email alrady exists
    const userExists = await User.findOne({email})

    if (userExists) {
        res.status(400)
        throw new Error("Email has already been registered")
    }
    
   

    // Create new user
    const user = await User.create({
        name,
        email,
        password
    })

     // Generate Token
     const token = generateToken(user._id);
    //  send HTTP-only cookie
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), //1 day
        sameSite: "none",
        secure: true
    })

    if (user) {
        const {_id, name, email, photo, phone, bio} =user
        res.status(201).json({
            _id,name, email, phone, photo, bio, token
              
        })
    } else {
        res.status(400)
        throw new Error("Invalid user data")
    }

});

// login user
const loginUser = asyncHandler(async (req, res) => {

    const {email, password} =req.body

    // validate request
    if (!email || !password) {
        res.status(400)
        throw new Error("Please enter your email and password");
    }
    // Check if user exists
    const user = await User.findOne({email})
    if (!user) {
        res.status(400)
        throw new Error("User not found, please sign up");
    }
    // User exists, check of password is correct
    const passwordIsCorrect = await bcrypt.compare(password, user.password);
     // Generate Token
     const token = generateToken(user._id);
    //  send HTTP-only cookie
    res.cookie("token", token, {
        path: "/",
        httpOnly: true,
        expires: new Date(Date.now() + 1000 * 86400), //1 day
        sameSite: "none",
        secure: true
    })

    if (user && passwordIsCorrect) {
        const {_id, name, email, photo, phone, bio} =user;
        res.status(200).json({
            _id,name, email,  phone, photo, bio, token
              
        });
    } else {
        res.status(400)
        throw new Error("Invalid email or password");
    }
});

// logout user
const logoutUser = asyncHandler(async (req, res) =>{
    res.cookie("token", "", {
        path: "/",
        httpOnly: true,
        expires: new Date(0), 
        sameSite: "none",
        secure: true
    });
    return res.status(200).json({message: "Succesfully logged out"})
}) 

// get user data 
const getUser = asyncHandler(async(req, res) =>{
const user = await User.findById(req.user._id);
if (user) {
    const {_id, name, email,  phone, photo, bio} =user
    res.status(200).json({
        _id,name, email, phone, photo, bio
          
    })
} else {
    res.status(400)
    throw new Error("User not found");
}
})

// get login status
const loginStatus = asyncHandler(async(req, res) => {
  const token = req.cookies.token;
  if(!token) {
      return res.json(false);
  }
  // Verify token
  const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (verifiedToken) {
      // Check if user exists
      const user = await User.findById(_id);
      if (!user) {
          res.status(400)
          throw new Error("User not found");
      } else {
          return res.json(true);
      }
  }
  return res.json(false);
})


// const loginStatus = asyncHandler(async(req, res) => {
//     const token = req.cookies.token;
//     if(!token) {
//         return res.json(false);
//     }
//     //    verify token
//     const verifiedToken = jwt.verify(token, process.env.JWT_SECRET);
//     if (verifiedToken) {
//         return res.json(true);
           
//         }
//         return res.json(false);
    
// })


// update user information
// const updateUser = asyncHandler (async (req, res) => {
//     const user = await User.findById(req.user._id)

    
//         if (user) {
//             const {name, email, phone, photo, bio} = user;
         
//                user.email = email;
//                user.name = req.body.name || name;
//                user.phone = req.body.phone || phone;
//                user.bio = req.body.bio || bio;
//                user.photo = req.body.photo || photo;

//                const updatedUser = await user.save();
//                res.status(200).json({
//                 // _id: updatedUser._id,
//                 name: updatedUser.name, 
//                 email: updatedUser.email, 
//                 phone: updatedUser.phone, 
//                 photo: updatedUser.photo, 
//                 bio: updatedUser.bio,
//                });
                  
           
//         } else {
//             res.status(404)
//             throw new Error("User not found");
//         }

    
// })

const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
  
    if (user) {
      const { name, email, photo, phone, bio } = user;
      user.email = email;
      user.name = req.body.name || name;
      user.phone = req.body.phone || phone;
      user.bio = req.body.bio || bio;
      user.photo = req.body.photo || photo;
  
      const updatedUser = await user.save();
      res.status(200).json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        photo: updatedUser.photo,
        phone: updatedUser.phone,
        bio: updatedUser.bio,
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  });
  
//   change password
const changePassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    const {oldPassword, password} = req.body

    if(!user) {
        res.status(400);
        throw new Error("User not found, please signup");
    }
    // valdate
    if(!oldPassword || !password) {
        res.status(400);
        throw new Error("Please enter old and new passowrd");
    }

    // check if old password matched password in DB 
    const passwordIsCorrect = await bcrypt.compare(oldPassword, user.password)

    // save new password
    if (user && passwordIsCorrect) {
        user.password = password
        await user.save()
        res.status(200).send("Password successfully changed")
    } else {
        res.status(400);
        throw new Error("Old passowrd is incorrect");
    }
})

// reset password function 
// const forgotPassword = asyncHandler (async(req, res) => {
//     const {email} = req.body
//     const user = await User.findOne({email})

//     if (!user) {
//         res.status(404)
//         throw new Error("User does not exist")
//     }

//     // create reset token
//     let resetToken = crypto.randomBytes(32).toString("hex") + user._id;

// // hash token before savng to database
// const hashedToken = crypto
// .createHash("sha256")
// .update(resetToken)
// .digest("hex");

// // save token to database
// await new Token({
//     userId: user._id,
//     token: hashedToken,
//     createdAt: Date.now(),
//     expiresAt: Date.now() + 30 * (60 * 1000) //thirty minutes
// }).save()

// // construct reset url
// const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`

// // reset password message 
// const message = `
// <h2>Hello ${user.name}</h2>
// <p>Please use the url below to reset your password</p>
// <p>This link is only valid for 30 minutes.</p>
// <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
// <p>Thank you</p>
// <p>E-stock Team</p>
// `;

// const subject = "Password Reset Request";
// const send_to = user.email;
// const sent_from = process.EMAIL_USER;

// try {
//     await sendEmail(subject, message, send_to, sent_from)
//     res.status(200).json({success: true, message: "Reset Email Sent"})
// } catch (error) {
//     res.status(500)
//     throw new Error("Email not sent, please try again")
// }
// })

const forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
  
    if (!user) {
      res.status(404);
      throw new Error("User does not exist");
    }
  
    // Delete token if it exists in DB
    let token = await Token.findOne({ userId: user._id });
    if (token) {
      await token.deleteOne();
    }
  
    // Create Reset Token
    let resetToken = crypto.randomBytes(32).toString("hex") + user._id;
    console.log(resetToken);
  
    // Hash token before saving to DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
  
    // Save Token to DB
    await new Token({
      userId: user._id,
      token: hashedToken,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * (60 * 1000), // Thirty minutes
    }).save();
  
    // Construct Reset Url
    const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;
  
    // Reset Email
    const message = `
        <h2>Hello ${user.name}</h2>
        <p>Please use the url below to reset your password</p>  
        <p>This reset link is valid for only 30minutes.</p>
  
        <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
  
        <p>Regards...</p>
        <p>E-stock Team</p>
      `;
    const subject = "Password Reset Request";
    const send_to = user.email;
    const sent_from = process.env.EMAIL_USER;
  
    try {
      await sendEmail(subject, message, send_to, sent_from);
      res.status(200).json({ success: true, message: "Reset Email Sent" });
    } catch (error) {
      res.status(500);
      throw new Error("Email not sent, please try again");
    }
  });

//   reset password
const resetPassword = asyncHandler (async (req, res) =>{

    const {password} = req.body
    const {resetToken} = req.params

    // Hash token before comparing to the one in DB
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    //   find token in database
    const userToken =  await Token.findOne({
        token: hashedToken,
        expiresAt: {$gt: Date.now()}
    })

    if (!userToken) {
        res.status(404);
        throw new Error("Invalid or expired token");
    }

    // find user
    const user = await User.findOne({_id: userToken.userId})
    user.password = password
    await user.save()
    res.status(200).json({
        message: "Passowrd Reset successful, please login"
    })
})




// Delete user account and all their products
const deleteAccount = async (req, res) => {
  try {
    // Get user id from request
    const userId = req.user._id;

    // Find all products associated with the user
    const products = await Product.find({ user: userId });

    // Delete each product image from Cloudinary
    for (let product of products) {
      if (product.image.filePath) {
        try {
          // Extract the public ID of the image from the file path
          let filePath = product.image.filePath;
          let fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
          let publicId = "E-stock/" + fileName.split(".")[0];

          // Delete the image using the public ID
          let result = await cloudinary.uploader.destroy(publicId);

          if (result.result !== "ok") {
            throw new Error("Failed to delete image from Cloudinary");
          }
        } catch (error) {
          res.status(500);
          throw new Error("Image could not be deleted from Cloudinary");
        }
      }
    }

    // Delete all products associated with the user from the database
    await Product.deleteMany({ user: userId });

    // Delete the user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      status: 'success',
      message: 'Account and all associated products and images have been deleted',
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'An error occurred while trying to delete the account',
    });
  }
};


module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUser,
    loginStatus,
    updateUser,
    changePassword,
    forgotPassword,
    resetPassword,
    deleteAccount
}