//Error handler class to standerdise error response format.
//see error in nodejs for reference

class ApiError extends Error{
    constructor(
        statusCode,
        message="Something went wrong",
        errors=[],
        stack=""

    ){
        //Override the constructor
        //super keyword is used to get parent 
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false;
        this.errors=errors


        //To trace the error in the error stack
        //Stack trace: A list of function calls that led to the error, helpful for debugging.
        if (stack) {
            this.stack = stack
        } else{
            Error. captureStackTrace(this, this.constructor)
        }
            
    }
}

export {ApiError}