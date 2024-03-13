 // This is erapper functions which is basically can be used to handle We can either use try catch or promises.

 //Wrapper function using promises->


 const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}


export { asyncHandler }


//Wrapper function using try catch->

//Higher order functions are those who take functions as parameter or can return functions.
//  const asyncHandler = () =>{}
// const asyncHandler = (func) => () =>{}
// const asyncHandler = (func) => async()=>{}

// const asyncHandler=(fn)=> async(req,res,next)=>{
//     try {
        
//     } catch (error) {
//         //sending json response if the responce is true or false
//         res.status(err.code || 500).json({
//             success:false,
//             message:err.message
//         })
        
//     }
// }