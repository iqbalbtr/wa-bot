export const successResponse = (message: string = "Success", data?: any) => {
    return {
        status: true,
        message: message,
        ...(data && { data }),
    };
}

export const validatorException = () => {
    
}