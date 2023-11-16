const asyncHandler = require("express-async-handler");
const User = require("../models/userModels");
const jwt = require("jsonwebtoken");

const protectDeletedUser = asyncHandler (async(req, res, next) => {
    try {
        // check if login token exist
        const token = req.cookies.token
        if(!token) {
            res.status(401) 
            throw new Error("Not authorized, please login")      
           }

        // Verify token
        const verifiedToken = jwt.verify(token, process.env.JWT_SECRET)
        // Get user id from token
        const user = await User.findById(verifiedToken.id).select("-password")

        if(!user) {
          return  res.json(false);
        } else{
          return  res.json(true);
        }
        
        
    } catch (error) {
       
        res.status(200).json(false)
       
    }
    
})

module.exports = protectDeletedUser;
