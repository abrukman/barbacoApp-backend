import cloudinary from "../config/cloudinary.js";

export async function subirACloudinary(buffer, {
    folder = 'otros',
    resource_type = 'auto',
    public_id = undefined
} = {}) {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder, resource_type, public_id },
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

export async function borrarDeCloudinary(publicId, resourceType = 'image') {
    if (!publicId) return;

    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};