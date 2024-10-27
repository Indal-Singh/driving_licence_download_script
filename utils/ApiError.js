class ApiError extends Error {
    /**
     * @param {number} statusCode - HTTP status code for the error.
     * @param {string} message - Description of the error.
     * @param {any[]} errors - Array of additional error details (optional).
     * @param {string} stack - Stack trace (optional).
     */
    constructor(
        statusCode,
        message = "Something went wrong",
        errors = [],
        stack = ""
    ) {
        super(message);
        this.statusCode = statusCode;
        this.data = null; // You can use this to attach additional data if needed
        this.message = message;
        this.success = false;
        this.errors = errors;

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }

    // Optional: Method to add additional errors to the error array
    addError(error) {
        this.errors.push(error);
    }

    // Optional: Method to format the error response
    format() {
        return {
            statusCode: this.statusCode,
            message: this.message,
            errors: this.errors,
            success: this.success,
            // stack: this.stack, // Include stack in development environment only
        };
    }
}

module.exports = ApiError;
