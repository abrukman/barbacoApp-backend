import mongoose from "mongoose";

const PartituraSchema = new mongoose.Schema({
  id: String,
  instrumento: String,
  archivo: String,
});

const CancionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  titulo: { type: String, required: true },
  autor: { type: String, required: true },
  descripcion: String,
  portada: String,
  letra: String,
  analisisIA: String,
  partituras: [PartituraSchema],
});

export const Cancion = mongoose.model("Cancion", CancionSchema);
