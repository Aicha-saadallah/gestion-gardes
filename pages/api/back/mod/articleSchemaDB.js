import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  role: { 
    type: String, 
    required: true,
    enum: ['Médecin', 'Chef de service', 'Superviseur', 'admin'],
    default: 'Médecin'
  },
  service: { 
    type: String, 
    required: function() { 
      return ['Médecin', 'Chef de service'].includes(this.role); 
    } 
  },
  email: { 
    type: String, 
    unique: true, 
    required: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false }, // Ajouté pour correspondre à l'image
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedAt: Date,
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'tableArticle' },
  rejectedAt: Date,
  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'tableArticle' },
}, { timestamps: true }); // timestamps ajoute createdAt et updatedAt automatiquement

const ModelArticle = mongoose.models.tableArticle || mongoose.model('tableArticle', articleSchema);

export default ModelArticle;
