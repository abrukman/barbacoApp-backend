import slugify from "slugify";
import { ValidationError } from "../errors/validationError.js";

export default function validarAccionesPartituras({
  partiturasExistentes,
  nuevaMetadata: acciones,
  archivosPartituras: archivos,
}) {
  if (!Array.isArray(acciones)) {
    throw new ValidationError("La metadata de partituras debe ser un array");
  }

  if (!Array.isArray(archivos)) {
    throw new ValidationError("Los archivos de partituras deben ser un array");
  }

  const accionesConArchivo = ["agregar", "reemplazar"];
  const accionesValidas = ["agregar", "borrar", "reemplazar"];

  //contar los archivos esperados
  /*   console.log(
    "acciones: ",
    acciones.map((a) => `[${a.accion}]`),
  ); */
  const totalEsperado = acciones
    .filter((a) => accionesConArchivo.includes(a.accion))
    .reduce((acc, a) => acc + (a.cantidadArchivos || 0), 0);

  if (totalEsperado !== archivos.length) {
    throw new ValidationError(
      "La cantidad de archivos no coincide con las acciones",
    );
  }

  //normalizacion
  function normalizar(instrumento, rol) {
    return {
      instrumento: slugify(instrumento, { lower: true, strict: true }),
      rol: rol ? String(rol) : null,
    };
  }

  //simular estado
  const instrumentos = {};

  for (const p of partiturasExistentes) {
    const n = normalizar(p.instrumento, p.rol);
    if (!p) continue;
    instrumentos[n.instrumento] ??= new Set();
    instrumentos[n.instrumento].add(n.rol);
  }

  //validar acciones
  for (const accion of acciones) {
    if (!accionesValidas.includes(accion.accion)) {
      throw new ValidationError(`Accion invalida: ${accion.accion}`);
    }

    if (accionesConArchivo.includes(accion.accion)) {
      if (!accion.cantidadArchivos || accion.cantidadArchivos <= 0) {
        throw new ValidationError(
          `cantidadArchivos inválido para accion ${accion.accion}`,
        );
      }
    }

    if (accion.accion === "borrar") {
      const { instrumento, rol } = accion;
      if (!instrumento) {
        throw new ValidationError("Falta instrumento para borrar");
      }

      const n = normalizar(instrumento, rol);

      if (
        !instrumentos[n.instrumento] ||
        !instrumentos[n.instrumento].has(n.rol)
      ) {
        throw new ValidationError(
          `No existe partitura de ${n.instrumento} con ese rol`,
        );
      }

      instrumentos[n.instrumento].delete(n.rol);

      if (instrumentos[n.instrumento].size === 0) {
        delete instrumentos[n.instrumento];
      }
    }

    if (accion.accion === "reemplazar") {
      const { instrumento, rol } = accion;

      if (!instrumento) {
        throw new ValidationError("Falta instrumento para reemplazar");
      }

      const n = normalizar(instrumento, rol);

      if (
        !instrumentos[n.instrumento] ||
        !instrumentos[n.instrumento].has(n.rol)
      ) {
        throw new ValidationError(
          `No existe partitura de ${n.instrumento} con ese rol`,
        );
      }
    }

    if (accion.accion === "agregar") {
      const { instrumento, rol } = accion;

      if (!instrumento) {
        throw new ValidationError("Falta instrumento");
      }

      const n = normalizar(instrumento, rol);
      instrumentos[n.instrumento] ??= new Set();

      if (instrumentos[n.instrumento].size > 0 && !n.rol) {
        throw new ValidationError(
          `Ya existe una partitura para ${n.instrumento}. Debe indicar rol`,
        );
      }

      if (instrumentos[n.instrumento].has(n.rol)) {
        throw new ValidationError(
          `Ya existe una partitura de ${n.instrumento} con ese rol`,
        );
      }

      instrumentos[n.instrumento].add(n.rol);
    }
  }

  const totalFinal =
    partiturasExistentes.length +
    acciones.filter((a) => a.accion === "agregar").length -
    acciones.filter((a) => a.accion === "borrar").length;

  if (totalFinal <= 0) {
    throw new ValidationError("La cancion debe tener al menos una partitura");
  }
}
