import express from "express";
import { cancionParam } from "../middlewares/cancionParam.js";
import { Cancion } from "../models/Cancion.js";
import { Partitura } from "../models/Partitura.js";
import { guardarEnMemoria } from "../middlewares/guardarEnMemoria.js";
import { borrarDeCloudinary } from "../middlewares/funcionesCloudinary.js";
import {
  actualizarCamposSimples,
  crearCancionBase,
} from "../services/cancion.service.js";
import { subirPortada } from "../services/portada.service.js";
import {
  crearPartitura,
  reemplazarPartitura,
} from "../services/partituras.service.js";
import validarAccionesPartituras from "../middlewares/validarAccionesPartituras.js";
import validarPartiturasMetadata from "../middlewares/validarPartiturasMetadata.js";
import { ValidationError } from "../errors/validationError.js";

const router = express.Router();

//lista todas las canciones
router.get("/", async (req, res) => {
  try {
    const canciones = await Cancion.find();
    res.json(canciones);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error del servidor" });
  }
});

//accedo a router.param
router.param("id", cancionParam);

//acceder a una cancion particular
router.get("/:id", async (req, res) => {
  res.json(req.cancion);
});

//acceder a las partituras de una cancion particular
router.get("/:id/partituras", async (req, res) => {
  try {
    const partituras = await Partitura.find({ cancionId: req.cancion._id });
    res.json(partituras);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener las partituras" });
  }
});

//acceder a una partitura especifica dentro de una cancion
router.get("/:id/partituras/:pid", async (req, res) => {
  try {
    const partitura = await Partitura.find({
      id: req.params.pid,
      cancionId: req.cancion._id,
    });

    if (!partitura) {
      res.status(400).json({ error: "Partitura no encontrada" });
    }
    res.json(partitura);
  } catch (error) {
    res.status(500).json({ error: "Error al obtener la partitura" });
  }
});

//POST crear cancion y partituras asociadas
router.post(
  "/",
  guardarEnMemoria.fields([
    { name: "portada", maxCount: 1 },
    { name: "partituras", maxCount: 20 },
  ]),
  async (req, res) => {
    //variables para rollback
    const partiturasCreadas = [];
    const upload = [];

    try {
      const { titulo, autor, letra, descripcion } = req.body;
      const partiturasMetadata = JSON.parse(
        req.body.partiturasMetadata || "[]",
      );
      const archivosPartituras = req.files?.partituras || [];

      const totalEsperado = partiturasMetadata.reduce(
        (acc, p) => acc + p.cantidadArchivos,
        0,
      );

      if (totalEsperado !== archivosPartituras.length) {
        throw new ValidationError("Cantidad de archivos no coincide");
      }

      if (
        !Array.isArray(partiturasMetadata) ||
        partiturasMetadata.length === 0
      ) {
        return res
          .status(400)
          .json({ error: "Debe incluir al menos una partitura" });
      }

      if (
        !Array.isArray(archivosPartituras) ||
        archivosPartituras.length === 0
      ) {
        return res
          .status(400)
          .json({ error: "Debe subir al menos un archivo de partitura" });
      }

      validarPartiturasMetadata(partiturasMetadata);

      //crear la cancion base
      const cancion = await crearCancionBase({
        titulo,
        autor,
        letra,
        descripcion,
      });

      //si hay archivo de portada se sube a cloudinary
      if (req.files?.portada?.[0]) {
        const portada = await subirPortada(cancion, req.files.portada[0]);
        cancion.portada = portada;
        upload.push(portada.publicId);
      }

      let cursor = 0;
      for (let i = 0; i < partiturasMetadata.length; i++) {
        const meta = partiturasMetadata[i];

        const cantidad = meta.cantidadArchivos;

        const archivosDeEstaPartitura = archivosPartituras.slice(
          cursor,
          cursor + cantidad,
        );

        cursor += cantidad;

        const partitura = await crearPartitura({
          cancion,
          archivos: archivosDeEstaPartitura,
          instrumento: meta.instrumento,
          rol: meta.rol,
        });

        partiturasCreadas.push(partitura);
      }

      for (const partitura of partiturasCreadas) {
        await partitura.save();
        cancion.partituras.push(partitura._id);
      }
      await cancion.save();

      res.status(201).json({
        mensaje: "Canción creada correctamente",
        cancion,
      });
    } catch (error) {
      const status = error.status || 500;
      console.error(error);
      //rollback
      for (const partitura of partiturasCreadas) {
        try {
          await borrarDeCloudinary(partitura.archivo.publicId, "raw");
          await partitura.deleteOne();
        } catch {}
      }

      for (const publicId of upload) {
        try {
          await borrarDeCloudinary(publicId);
        } catch {}
      }

      res.status(status).json({
        error: error.message || "Error al crear la canción",
      });
    }
  },
);

//PATCH(editar parcialmente, no se puede modificar titulo ni autor, solo letra, descripcion, portada y partituras)
router.patch(
  "/:id",
  guardarEnMemoria.fields([
    { name: "portada", maxCount: 1 },
    { name: "partituras", maxCount: 20 },
  ]),
  async (req, res) => {
    const cancion = req.cancion;
    const partiturasExistentes = await Partitura.find({
      _id: { $in: cancion.partituras },
    });
    const nuevaMetadata = req.body.partiturasMetadata
      ? JSON.parse(req.body.partiturasMetadata)
      : [];
    const archivosPartituras = req.files?.partituras || [];
    let archivoIndex = 0;

    //para rollback y limpieza de cloudinary
    const archivosParaBorrar = [];
    const archivosNuevos = [];
    //para mongo
    const partiturasParaCrear = [];
    const partiturasParaBorrar = [];
    const partiturasParaActualizar = [];

    try {
      //validaciones
      validarAccionesPartituras({
        partiturasExistentes,
        nuevaMetadata,
        archivosPartituras,
      });

      //cambios
      actualizarCamposSimples(cancion, req.body);

      //------actualizar portada
      if (req.files?.portada?.[0]) {
        const portadaAnterior = cancion.portada?.publicId;

        const portadaNueva = await subirPortada(cancion, req.files.portada[0]);

        if (portadaAnterior) {
          archivosParaBorrar.push({
            publicId: portadaAnterior,
            resource_type: "image",
          });
        }

        archivosNuevos.push(portadaNueva.publicId);
        cancion.portada = portadaNueva;
      }

      //------procesar acciones sobre partituras
      let cursor = 0;

      for (const accion of nuevaMetadata) {
        switch (accion.accion) {
          case "agregar": {
            const archivosDeAccion = archivosPartituras.slice(
              cursor,
              cursor + accion.cantidadArchivos,
            );

            cursor += accion.cantidadArchivos;
            //no toca mongo aun, crea la partitura y sube a cloudinary pero no hace save ni push a la cancion
            const nuevaPartitura = await crearPartitura({
              cancion,
              archivos: archivosDeAccion,
              instrumento: accion.instrumento,
              rol: accion.rol,
            });

            //en caso de rollback
            for (const archivo of nuevaPartitura.archivos) {
              archivosNuevos.push({
                publicId: archivo.publicId,
                resource_type: "raw",
              });
            }
            //para hacer el save al final
            partiturasParaCrear.push(nuevaPartitura);

            break;
          }

          case "borrar": {
            const partitura = partiturasExistentes.find(
              (p) =>
                p.instrumento === accion.instrumento && p.rol === accion.rol,
            );
            if (!partitura) {
              throw new Error("Partitura a borrar no encontrada");
            }

            for (const archivo of partitura.archivos) {
              archivosParaBorrar.push({
                publicId: archivo.publicId,
                resource_type: "raw",
              });
            }

            //prepara para borrar de mongo
            partiturasParaBorrar.push(partitura);

            break;
          }

          case "reemplazar": {
            const archivosDeAccion = archivosPartituras.slice(
              cursor,
              cursor + accion.cantidadArchivos,
            );

            cursor += accion.cantidadArchivos;

            if (!accion.rol) {
              accion.rol = "";
            }

            const partitura = partiturasExistentes.find(
              (p) =>
                p.instrumento === accion.instrumento && p.rol === accion.rol,
            );
            if (!partitura) {
              throw new Error("Partitura a reemplazar no encontrada");
            }

            const cantidadVieja = partitura.archivos.length;
            const cantidadNueva = archivosDeAccion.length;

            //detectar sobrantes
            if (cantidadNueva < cantidadVieja) {
              const sobrantes = partitura.archivos.slice(cantidadNueva);

              for (const archivo of sobrantes) {
                archivosParaBorrar.push({
                  publicId: archivo.publicId,
                  resource_type: "raw",
                });
              }
            }

            //sube a cloudinary el nuevo archivo y reemplaza el viejo (mismo publicId), no toca mongo
            const { nuevosArchivos } = await reemplazarPartitura({
              cancion,
              partituraId: partitura.id,
              archivos: archivosDeAccion,
            });

            //para rollback
            for (const archivo of nuevosArchivos) {
              archivosNuevos.push({
                publicId: archivo.publicId,
                resoure_type: "raw",
              });
            }

            //para mongo
            partiturasParaActualizar.push({
              partitura,
              nuevosArchivos,
            });

            break;
          }

          default:
            throw new ValidationError(`Accion desconocida: ${accion.accion}`);
        }
      }

      if (cancion.partituras.length === 0) {
        return res
          .status(400)
          .json({ error: "La canción debe tener al menos una partitura" });
      }

      for (const partitura of partiturasParaCrear) {
        await partitura.save();
        cancion.partituras.push(partitura._id);
      }

      for (const { partitura, nuevosArchivos } of partiturasParaActualizar) {
        partitura.archivos = nuevosArchivos;
        await partitura.save();
      }

      for (const partitura of partiturasParaBorrar) {
        await partitura.deleteOne();
        cancion.partituras.pull(partitura._id);
      }

      await cancion.save();

      //limpieza
      for (const archivo of archivosParaBorrar) {
        try {
          await borrarDeCloudinary(archivo.publicId, archivo.resource_type);
        } catch (error) {
          console.error("Error borrando de Cloudinary: ", error);
        }
      }

      res.json({
        mensaje: "Canción actualizada correctamente",
        cancion,
      });
    } catch (error) {
      const status = error.status || 500;
      console.error(error);
      //rollback
      for (const publicId of archivosNuevos) {
        try {
          await borrarDeCloudinary(publicId);
        } catch (error) {
          console.error("Error borrando de Cloudinary: ");
        }
      }
      res.status(status).json({
        error: error.message || "Error al actualizar la canción",
      });
    }
  },
);

//DELETE
router.delete("/:id", async (req, res) => {
  const cancionAEliminar = req.cancion;

  try {
    //buscamos las partituras de la cancion
    const partituras = await Partitura.find({
      cancionId: cancionAEliminar._id,
    });

    //buscamos archivos para borrar de cloudinary
    const archivosParaBorrar = [];
    if (cancionAEliminar.portada?.publicId) {
      archivosParaBorrar.push({
        publicId: cancionAEliminar.portada.publicId,
        resource_type: "image",
      });
    }

    for (const partitura of partituras) {
      for (const archivo of partitura.archivos) {
        archivosParaBorrar.push({
          publicId: archivo.publicId,
          resource_type: "raw",
        });
      }
    }

    //borramos de mongo - 1ero las partituras
    await Partitura.deleteMany({ cancionId: cancionAEliminar._id });
    await cancionAEliminar.deleteOne();

    //res Ok
    res.json({ mensaje: "Canción eliminada correctamente" });

    console.log("Archivos eliminados: ", archivosParaBorrar.length);
    await Promise.all(
      archivosParaBorrar
        .map((archivo) =>
          borrarDeCloudinary(archivo.publicId, archivo.resource_type),
        )
        .catch((error) => {
          console.error(
            "Error al borrar de Cloudinary: ",
            archivo.publicId,
            error,
          );
        }),
    );
  } catch (error) {
    const status = error.status || 500;
    console.error(error);
    res
      .status(status)
      .json({ error: error.message || "Error al eliminar la canción " });
  }
});

export default router;
