import {
  borrarDeCloudinary,
  subirACloudinary,
} from "../middlewares/funcionesCloudinary.js";

export async function subirPortada(cancion, file) {
  if (!file) return null;

  const subida = await subirACloudinary(file.buffer, {
    folder: "portadas",
    resource_type: "image",
    public_id: `${cancion.id}-portada`,
  });

  console.log("subida cloudinary: ", subida);

  return {
    url: subida.url,
    publicId: subida.publicId,
  };
}

export async function actualizarPortada(cancion, file) {
  if (!file) return;

  if (cancion.portada?.publicId) {
    await borrarDeCloudinary(cancion.portada.publicId);
  }

  const nuevaPortada = await subirPortada(cancion, file);
  return nuevaPortada;
}
