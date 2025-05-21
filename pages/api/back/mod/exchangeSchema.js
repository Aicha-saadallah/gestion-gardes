import mongoose from 'mongoose';

const exchangeSchema = new mongoose.Schema({
  gardesToGet: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Garde',
    required: true 
  }],
  gardesToGive: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Garde',
    required: true 
  }],
  fromDoctor: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'tableArticle',
    required: true 
  },
  toDoctors: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'tableArticle',
    required: true 
  }],
  message: { type: String, trim: true },
  status: { 
    type: String, 
    enum: ['en attente', 'accepté', 'refusé', 'annulé'],
    default: 'en attente'
  },
  createdAt: { type: Date, default: Date.now },
  respondedAt: { type: Date },
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'tableArticle' }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index pour améliorer les performances
exchangeSchema.index({ fromDoctor: 1, status: 1 });
exchangeSchema.index({ toDoctors: 1, status: 1 });

const ModelEchange = mongoose.models.Exchange || mongoose.model('Exchange', exchangeSchema);

export default ModelEchange;