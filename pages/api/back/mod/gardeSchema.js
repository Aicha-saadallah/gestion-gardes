// pages/api/back/mod/gardeSchema.js
import mongoose from "mongoose";

const gardeSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  service: { type: String, required: true },
  date: { type: Date, required: true },
  statut: {
    type: String,
    enum: ['planifiée', 'confirmée', 'annulée'],
    default: 'planifiée'
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'tableArticle',
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'tableArticle'
  }
});

const existingGarde = mongoose.models.Garde;
const ModelGarde = existingGarde || mongoose.model('Garde', gardeSchema);

export default ModelGarde;