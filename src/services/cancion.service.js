import slugify from "slugify";
import { Cancion } from "../models/Cancion.js";
import { ValidationError } from "../errors/validationError.js";


export async function crearCancionBase ({
    titulo,
    autor,
    letra,
    descripcion,
}) {
  if (!titulo || !autor || !letra) {
    throw new ValidationError("Faltan campos obligatorios: titulo, autor o letra"); 
    };

    const id = slugify(titulo.toLowerCase(), { lower: true, strict: true });

    const existe = await Cancion.findOne({ id });
    if (existe) {
      throw new ValidationError ("Ya existe una cancion con ese titulo");
    };

    const nuevaCancion = new Cancion({
      id,
      titulo,
      autor,
      letra,
      descripcion,
      partituras: []
    });

    //await nuevaCancion.save({ validateBeforeSave: false });
    return nuevaCancion;
};

export function actualizarCamposSimples (cancion, body) {
    if (body.letra !== undefined) {
      cancion.letra = body.letra;
    };

    if (body.descripcion !== undefined) {
      cancion.descripcion = body.descripcion;
    };
};



