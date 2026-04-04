import { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import Loader from "../component/Loader";
import axios from "axios";
import { useDispatch } from "react-redux";
import { userDetails } from "../redux/slices/UserDetails";
const IsAuthRoute = () => {
  const LOCALHOST_API = import.meta.env.VITE_LOCALHOST_API;
  const [isLogin, setIsLogin] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const authToken = localStorage.getItem('authToken');

  useEffect(() => {
    if (!authToken) {
      navigate('/login', { replace: true });
      return;
    }
    axios.get(`${LOCALHOST_API}/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    })
      .then((res) => {
        dispatch(userDetails(res.data))
        setIsLogin(true)
      })
      .catch((err) => {
        console.log('Error in IsAuthRoute : \n', err)
        navigate('/login', { replace: true });
        return;
      })
  }, [LOCALHOST_API, authToken, dispatch, navigate])

  return (
    !isLogin ? <Loader /> : <Outlet/>
  )


};

export default IsAuthRoute;
