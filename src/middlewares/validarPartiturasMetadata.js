import { ValidationError } from "../errors/validationError.js";

export default function validarPartiturasMetadata(metadata) {
    const porInstrumento = {};

    for (const meta of metadata) {
        if (!porInstrumento[meta.instrumento]) {
            porInstrumento[meta.instrumento] = [];
        };
        porInstrumento[meta.instrumento].push(meta);
    };

    for (const instrumento in porInstrumento) {
        const lista = porInstrumento[instrumento];
        
        //una sola partitura
        if (lista.length === 1) continue;

        //varias partituras, todas deben tener rol
        const roles = new Set();

        for (const meta of lista) {
            if (!meta.rol || meta.rol.trim() === '') {
                throw new ValidationError(`El instrumento ${instrumento} tiene varias partituras, cada una debe tener un único rol.`);
            };

            if (roles.has(meta.rol)) {
                throw new ValidationError (`Rol duplicado "${meta.rol}" para el instrumento ${instrumento}. Cada partitura debe tener un rol único.`);
            };

            roles.add(meta.rol);
        };
    };
};