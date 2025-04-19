import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios'
import style from "@/styles/inscription.module.css"
import {useRouter} from "next/router"

export default function(props){
 
const router = useRouter()

    function editer(articleAmodifier){
           
        router.push(
            {
                  pathname :"http://localhost:3000/front/edit",
                  query:{  
                           _id   : articleAmodifier._id,
                           nom    :  articleAmodifier.nom,
                           prenom :  articleAmodifier.prenom,
                           role   :  articleAmodifier.role,
                           specialite   :  articleAmodifier.specialite,
                           email :  articleAmodifier.email,
                           password   :  articleAmodifier.password,
                           
                        }

            }
    
    )
    }

  return (
           props.tab.map((article)=>{
               return(
                   <div className= {style.card}>
                      <div>{article.nom}</div>
                      <div>{article.prenom}</div>
                      <div>{article.role}</div>
                      <div>{article.specialite}</div>
                      <div>{article.email}</div>
                      <div>{article.password}</div>
                      <button  onClick={()=>{editer(article)}}>Edit</button>
                      <button >Delete</button>
                   </div>
               )
           })
  )
}

export async function getStaticProps(){

 const reponse = await axios.get("http://localhost:3000/api/back/")

 const donnees = reponse.data;
 return{
          props: {tab : donnees}
 }

}