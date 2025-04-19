
import style from "@/styles/inscription.module.css"


import {useRouter} from "next/router";

import axios from 'axios'

import { useState } from "react";

export default function Edit(){
     
    const router = useRouter();

    const _id = router.query._id

    const [nom,setNom]       = useState(router.query.nom)
    const [prenom,setPrenom] = useState(router.query.prenom)
    const [role, setRole]    = useState(router.query.role)
    const [specialite,setSpecialite]   = useState(router.query.specialite)
    const [email,setEmail] = useState(router.query.email)
    const [password, setPassword]    = useState(router.query.password)
    const [error, setError]    = useState(router.query.error)
    
  
   
 
 function modifier(){
  
    axios.put("http://localhost:3000/api/back/",
    {  
      _id  :_id ,
      nom   :nom,
      prenom   :prenom,
      role  :role,
      specialite  :specialite,
      email  :email,
      password  :password,
      error  :error,
    })

    router.push('http://localhost:3000/front/insci')
   

 }
  

      return(
         <div className={style.formContainer}>
               Nom :<input type ="text"     value={nom}      onChange={(e)=>{setNom(e.target.value)}}    />  <br />
               Prenom : <input type ="text"   value={prenom}   onChange={(e)=>{setPrenom(e.target.value)}}/> <br />
               Role :<input type ="text"      value={role}     onChange={(e)=>{setRole(e.target.value)}} /> <br />
               Specialite :<input type ="text"       value={specialite}      onChange={(e)=>{setSpecialite(e.target.value)}}    />  <br />
               Email : <input type ="text"   value={email}   onChange={(e)=>{setEmail(e.target.value)}}/> <br />
               Password :<input type ="text"      value={password}     onChange={(e)=>{setPassword(e.target.value)}} /> <br />
               Erreur :<input type ="text"      value={error}     onChange={(e)=>{setError(e.target.value)}} /> <br />
               <button onClick={()=>{modifier()}}> Modifier</button>

         </div>
   
           
      )

}