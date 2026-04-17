import mongoose from "mongoose";

const CancionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  titulo: { type: String, required: [true, "El titulo es obligatorio"], trim: true },
  autor: { type: String, required: [true, "El autor es obligatorio"], trim: true },
  letra: { type: String, required: [true, "La letra es obligatoria"] },
  portada: {
    url: { type: String },
    publicId: { type: String },
  },
  descripcion: { type: String },
  analisisIA: { type: String },
  partituras: {
    type: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'Partitura' }
    ],
    validate: {
      validator: function (arr) {
        return arr.length > 0
      },
      message: 'La canción debe tener al menos una partitura'
    }
  }
}, { timestamps: true });

export const Cancion = mongoose.model("Cancion", CancionSchema, "canciones");
