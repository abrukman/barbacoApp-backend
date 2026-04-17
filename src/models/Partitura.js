import mongoose from "mongoose";

const PartituraSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      unique: true,
    },
    cancionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Cancion",
      required: true,
      index: true,
    },
    instrumento: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    rol: {
      type: String,
      default: "",
      trim: true,
    },
    archivos: {
      type: [
        {
          url: {
            type: String,
            required: true,
          },
          publicId: {
            type: String,
            required: true,
          },
        },
      ],
      validate: {
        validator: (arr) => arr.length > 0,
        message: "La partitura debe tener al menos un archivo",
      },
    },
  },
  {
    timestamps: true,
  },
);

//indices para consultas rapidas
PartituraSchema.index(
  { cancionId: 1, instrumento: 1, rol: 1 },
  { unique: true },
);

export const Partitura = mongoose.model(
  "Partitura",
  PartituraSchema,
  "partituras",
);
