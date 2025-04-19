
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios'
import style from "@/styles/Liste.module.css"
import {useRouter} from "next/router"

export default function(props){
 
const router = useRouter()

    function editer(articleAmodifier){
           
        router.push(
            {
                  pathname :"http://localhost:3000/front/add",
                  query:{  
                           _id   : articleAmodifier._id,
                           id    :  articleAmodifier.id,
                           title :  articleAmodifier.title,
                           url   :  articleAmodifier.url
                        }

            }
    
    )
    }

  return (
           props.tab.map((article)=>{
               return(
                   <div className= {style.card}>
                      <div>{article.id}</div>
                      <div>{article.title}</div>
                      <div>{article.url}</div>
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




