import slugify from "slugify";
import { Partitura } from "../models/Partitura.js";
import { subirACloudinary } from "../middlewares/funcionesCloudinary.js";

export async function crearPartitura({ cancion, archivos, instrumento, rol }) {
  const instrumentoSlug = slugify(instrumento, { lower: true, strict: true });
  const rolSlug = rol
    ? slugify(String(rol), { lower: true, strict: true })
    : null;
  const partituraId = rolSlug
    ? `${cancion.id}-${instrumentoSlug}-${rolSlug}`
    : `${cancion.id}-${instrumentoSlug}`;

  const archivosSubidos = [];

  for (let i = 0; i < archivos.length; i++) {
    const archivo = archivos[i];

    const ext = archivo.originalname.split(".").pop();

    const subida = await subirACloudinary(archivo.buffer, {
      folder: `partituras/${cancion.id}`,
      resource_type: "raw",
      public_id: `${partituraId}-p${i + 1}.${ext}`,
    });

    archivosSubidos.push({
      url: subida.url,
      publicId: subida.publicId,
    });
  }

  const nuevaPartitura = new Partitura({
    id: partituraId,
    cancionId: cancion._id,
    instrumento,
    rol,
    archivos: archivosSubidos,
  });

  return nuevaPartitura;
}

export async function reemplazarPartitura({ cancion, partituraId, archivos }) {
  const partitura = await Partitura.findOne({
    id: partituraId,
    cancionId: cancion._id,
  });

  if (!partitura) {
    throw new Error(`Partitura ${partituraId} no encontrada`);
  }

  const nuevosArchivos = [];

  for (let i = 0; i < archivos.length; i++) {
    const archivo = archivos[i];
    const ext = archivo.originalname.split(".").pop();

    const subida = await subirACloudinary(archivo.buffer, {
      folder: `partituras/${cancion.id}`,
      resource_type: "raw",
      public_id: `${partitura.id}-p${i + 1}.${ext}`,
    });

    nuevosArchivos.push({
      url: subida.url,
      publicId: subida.publicId,
    });
  }

  return {
    partitura,
    nuevosArchivos,
  };
}
