import mongoose from "mongoose";

const gardeSchema = new mongoose.Schema({
  nom: String,
  prenom: String,
  specialite: String,
  date: Date
  
});

const exstingGarde = mongoose.models.Garde;

const ModelGarde = exstingGarde || mongoose.model('Garde',gardeSchema)


export default ModelGarde;