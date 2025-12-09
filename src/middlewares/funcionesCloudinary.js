import cloudinary from "../config/cloudinary.js";

export async function subirACloudinary(buffer) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                folder: 'portadas',
                resource_type: 'image'
            },
            (error, result) => {
                if (error) return reject(error);
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id
                });
            }
        ).end(buffer);
    });
};

export async function borrarDeCloudinary(publicId) {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error('Error: ', error);
        throw error;
    };
};