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
        super(message)
        this.statusCode=statusCode
        this.data=null
        this.message=message
        this.success=false;
        this.errors=errors


        //To trace the error in the error stack
        //Not vital as of now
        if (stack) {
            this.stack = stack
        } else{
            Error. captureStackTrace(this, this.constructor)
        }
            
    }
}

export {ApiError}