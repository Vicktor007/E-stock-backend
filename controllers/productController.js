const asyncHandler = require("express-async-handler");
const Product = require("../models/productModel");
const { fileSizeFormatter } = require("../utils/flieUpload");
const cloudinary = require("cloudinary").v2;




const createProduct = asyncHandler(async(req, res) =>{
    const {name, sku, category, quantity, price, description} = req.body

    // valdation
    if(!name || !category || !quantity || !price || !description) {
        res.status(400)
        throw new Error("Please fill in all fields")
    }
// handle image upload
     let fileData = {}
     if(req.file) {
        // save image to cloudinary
        let uploadedFile;
        try {
            uploadedFile = await cloudinary.uploader.upload(req.file.path, {folder: "E-stock", resource_type: "image"})
        } catch (error) {
            res.status(500)
            throw new Error("Image could not be uploaded")
        }
        fileData = {
            fileName: req.file.originalname,
            filePath: (await uploadedFile).secure_url,
            fileType: req.file.mimetype,
            fileSize: fileSizeFormatter(req.file.size, 2),
            public_id: uploadedFile.public_id, // Save public_id for deletion later
        }
     }


    // create product

    const product = await Product.create({
        user: req.user.id,
        name,
        sku,
        category,
        quantity,
        price,
        description,
        image: fileData
    })
    res.status(201).json(product);
});


// Get all products
const getProducts = asyncHandler(async (req, res) => {
   const products = await Product.find({user: req.user.id}).sort("-createdAt")
   res.status(200).json(products)
})


// Get single product
const getProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    // if product doesnt exist
    if (!product) {
      res.status(404);
      throw new Error("Product not found");
    }
    // Match product to its user
    if (product.user.toString() !== req.user.id) {
      res.status(401);
      throw new Error("User not authorized");
    }
    res.status(200).json(product);
  });


// Delete Product
// const deleteProduct = asyncHandler(async (req, res) => {
//     const product = await Product.findById(req.params.id);
//     // if product doesnt exist
//     if (!product) {
//       res.status(404);
//       throw new Error("Product not found");
//     }
//     // Match product to its user
//     if (product.user.toString() !== req.user.id) {
//       res.status(401);
//       throw new Error("User not authorized");
//     }
//     await Product.findByIdAndDelete(req.params.id);
//     res.status(200).json({ message: "Product deleted." });
// });

const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  // if product doesn't exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  // Delete image from Cloudinary
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
        console.error(error);  // Log the original error message
        res.status(500);
        throw new Error("Image could not be deleted from Cloudinary: " + error.message);
    }
    

  // Delete product from database
  await Product.findByIdAndDelete(req.params.id);
  res.status(200).json({ message: "Product and image deleted." });
});

// Update product
// const updateProduct = asyncHandler(async(req, res) =>{
//     const {name, category, quantity, price, description} = req.body;
//     const {id} = req.params

//     const product = await Product.findById(id)
//     // if product doesnt exist
//     if (!product) {
//         res.status(404);
//         throw new Error("Product not found");
//       }
//       // Match product to its user
//     if (product.user.toString() !== req.user.id) {
//         res.status(401);
//         throw new Error("User not authorized");
//       }

   
// // handle image upload
//      let fileData = {}
//      if(req.file) {
//         // save image to cloudinary
//         let uploadedFile;
//         try {
//             uploadedFile = cloudinary.uploader.upload(req.file.path, {folder: "E-stock", resource_type: "image"})
//         } catch (error) {
//             res.status(500)
//             throw new Error("Image could not be uploaded")
//         }
//         fileData = {
//             fileName: req.file.originalname,
//             filePath: (await uploadedFile).secure_url,
//             fileType: req.file.mimetype,
//             fileSize: fileSizeFormatter(req.file.size, 2),
//         }
//      }


//     // update product

//     const updatedProduct = await Product.findByIdAndUpdate(
//         {id: id},
//         {
//             name,
//             category,
//             quantity,
//             price,
//             description,
//             image: fileData || product.image
//         },
//         {
//             new: true,
//             runValidators: true
//         }
//     )
//     res.status(200).json(updatedProduct);
// });



// Update Product
// const updateProduct = asyncHandler(async (req, res) => {
//     const { name, category, quantity, price, description } = req.body;
//     const { id } = req.params;
  
//     const product = await Product.findById(id);
  
//     // if product doesnt exist
//     if (!product) {
//       res.status(404);
//       throw new Error("Product not found");
//     }
//     // Match product to its user
//     if (product.user.toString() !== req.user.id) {
//       res.status(401);
//       throw new Error("User not authorized");
//     }
  
//     // Handle Image upload
//     let fileData = {};
//     if (req.file) {
//       // Save image to cloudinary
//       let uploadedFile;
//       try {
//         uploadedFile = await cloudinary.uploader.upload(req.file.path, {
//           folder: "E-stock",
//           resource_type: "image",
//         });
//       } catch (error) {
//         res.status(500);
//         throw new Error("Image could not be uploaded");
//       }
  
//       fileData = {
//         fileName: req.file.originalname,
//         filePath: uploadedFile.secure_url,
//         fileType: req.file.mimetype,
//         fileSize: fileSizeFormatter(req.file.size, 2),
//       };
//     }
  
//     // Update Product
//     const updatedProduct = await Product.findByIdAndUpdate(
//       { _id: id },
//       {
//         name,
//         category,
//         quantity,
//         price,
//         description,
//         image: Object.keys(fileData).length === 0 ? product?.image : fileData,
//         // image: fileData || product.image
//         //         },
//       },
//       {
//         new: true,
//         runValidators: true,
//       }
//     );
  
//     res.status(200).json(updatedProduct);
//   });



// Update Product
const updateProduct = asyncHandler(async (req, res) => {
  const { name, category, quantity, price, description } = req.body;
  const { id } = req.params;

  const product = await Product.findById(id);

  // if product doesnt exist
  if (!product) {
    res.status(404);
    throw new Error("Product not found");
  }
  // Match product to its user
  if (product.user.toString() !== req.user.id) {
    res.status(401);
    throw new Error("User not authorized");
  }

  // Handle Image upload
  let fileData = {};
  if (req.file) {
    // Delete previous image from cloudinary
    if (product.image && product.image.public_id) {
      try {
        await cloudinary.uploader.destroy(product.image.public_id);
      } catch (error) {
        res.status(500);
        // throw new Error("Previous image could not be deleted");
        console.error("Previous image could not be deleted", error);
      }
    }

    // Save new image to cloudinary
    let uploadedFile;
    try {
      uploadedFile = await cloudinary.uploader.upload(req.file.path, {
        folder: "E-stock",
        resource_type: "image",
      });
    } catch (error) {
      res.status(500);
      throw new Error("Image could not be uploaded");
    }

    fileData = {
      fileName: req.file.originalname,
      filePath: uploadedFile.secure_url,
      fileType: req.file.mimetype,
      fileSize: fileSizeFormatter(req.file.size, 2),
      public_id: uploadedFile.public_id, // Save public_id for deletion later
    };
  }

  // Update Product
  const updatedProduct = await Product.findByIdAndUpdate(
    { _id: id },
    {
      name,
      category,
      quantity,
      price,
      description,
      image: Object.keys(fileData).length === 0 ? product?.image : fileData,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json(updatedProduct);

  // Update Product
// const updatedProduct = await Product.findByIdAndUpdate(
//   { _id: id },
//   {
//     name,
//     category,
//     quantity,
//     price,
//     description,
//     image: null, // Set image to null
//   },
//   {
//     new: true,
//     runValidators: true,
//   }
// );

// // Update the image field with the new image data
// updatedProduct.image = Object.keys(fileData).length === 0 ? product?.image : fileData;
// await updatedProduct.save();

// res.status(200).json(updatedProduct);

});

  




module.exports = {
    createProduct,
    getProducts,
    getProduct,
    deleteProduct,
    updateProduct
}