import mongoose from "mongoose";

const exchangeSchema = new mongoose.Schema({
  gardeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Garde",
    required: true,
  },
  fromDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "tableArticle", // Modifier la référence à "tableArticle"
    required: true,
  },
  toDoctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "tableArticle", // Modifier la référence à "tableArticle"
    required: true,
  },
  message: {
    type: String,
    default: ""
  },
  status: {
    type: String,
    enum: ["en attente", "accepté", "refusé"],
    default: "en attente"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


const existingEchange = mongoose.models.Exchange;
const ModelEchange = existingEchange || mongoose.model('Exchange',exchangeSchema);

export default ModelEchange;