import multer from "multer";

const storage = multer.memoryStorage();

export const guardarEnMemoria = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const permitidos = ['image/png'];
        if(!permitidos.includes(file.mimetype)) {
            cb(new Error('Formato no permitido. Solo PNG'));
        } else {
            cb(null, true);
        };
    }
});