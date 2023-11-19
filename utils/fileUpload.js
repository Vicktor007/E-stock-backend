const dotenv = require("dotenv").config();
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: 'vickdawson',
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'E-stock',
    public_id: (req, file) => new Date().toISOString().replace(/:/g, "-") + "-" + file.originalname,
  },
});


//   specify file fomat that can be saved

function fileFilter (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);  // accept the file
    } else {
        cb(null, false);  // reject the file
    }  
}


const upload = multer({ storage, fileFilter });


// file size formatter
const fileSizeFormatter = (bytes, decimal) => {
  if (bytes === 0) {
    return "0 Bytes";
  }
  const dm = decimal || 2;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "YB", "ZB"];
  const index = Math.floor(Math.log(bytes) / Math.log(1000));
  return (
    parseFloat((bytes / Math.pow(1000, index)).toFixed(dm)) + " " + sizes[index]
  );
};


module.exports = {
    upload,
    fileSizeFormatter
};