import multer from "multer";

const storage = multer.memoryStorage();

export const guardarEnMemoria = multer({
    storage,
    fileFilter: (req, file, cb) => {
        //portada solo png
        if (file.fieldname === 'portada') {
            if(file.mimetype !== 'image/png') {
                return cb(new Error('La portada debe ser una imagen PNG'));
            };
            return cb(null, true);
        };

        //partituras solo svg+xml
        if (file.fieldname === 'partituras') {
            if(file.mimetype !== 'image/svg+xml') {
                return cb(new Error('Las partituras deben ser archivos SVG'));
            };
            return cb(null, true);
        };

        //otros campos con archivos no permitidos
        return cb(new Error('Campo de archivo no permitido'));
    }
});