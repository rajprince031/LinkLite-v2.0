import axios from "axios";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Loader from "../component/Loader";
import { userDetails } from "../redux/slices/UserDetails";
import { useDispatch, useSelector } from "react-redux";


function IsLoginRoute(){
    const LOCALHOST_API = import.meta.env.VITE_LOCALHOST_API;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [isLogin, setIsLogin] = useState(true);
    const authToken = localStorage.getItem('authToken')
    useEffect(()=>{
        if(!authToken) {
            setIsLogin(false)
            return 
        }
        axios.get(`${LOCALHOST_API}/auth/me`,{
            headers:{
                Authorization : `Bearer ${authToken}`
            }
        }).then((res)=>{
                dispatch(userDetails(res.data))
            navigate('/dashboard',{replace:true})

            return 
        }).catch(err => setIsLogin(false))
    },[authToken, LOCALHOST_API, dispatch, navigate])

    return isLogin ? <Loader/> : <Outlet/>
}
     



export default IsLoginRoute
