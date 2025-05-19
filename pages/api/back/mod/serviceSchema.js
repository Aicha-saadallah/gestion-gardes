// models/Service.js
import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
});

const Service = mongoose.models.Service || mongoose.model('Service', serviceSchema);

export default Service;