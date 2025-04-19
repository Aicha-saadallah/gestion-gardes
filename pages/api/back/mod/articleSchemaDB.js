

import mongoose from 'mongoose'

const articleSchema = new mongoose.Schema({
    nom: String,
    prenom: String,
    role: String,
    specialite: String,
    email: { type: String, unique: true },
    password: String,
    isVerified: { type: Boolean, default: false }, // Nouveau champ
    createdAt: { type: Date, default: Date.now }
  });
const exstingModel = mongoose.models.tableArticle;

const ModelArticle = exstingModel || mongoose.model('tableArticle',articleSchema)


export default ModelArticle

