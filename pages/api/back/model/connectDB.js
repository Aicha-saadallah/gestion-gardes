
import mongoose from "mongoose"

export default function dbConnect(){

    try{
           mongoose.connect('mongodb+srv://aicha:aicha@cluster0.ax4le.mongodb.net/BaseDonnee1'),

           {
                    UseUnifiedTopology:true,
                    useNewUrlParser:true
           }

           console.log("......connexion avec succes")

        }
        catch(error){
                  console.log("erreur de conenxion :"+error)
        }
}
