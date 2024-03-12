import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        //in the temporarry folder the file will get stored 
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      //it returns the original name of the file which the user selected
      //we can put custom names also and save it.
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ 
    storage, 
})