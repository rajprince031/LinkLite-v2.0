import { useState } from "react";
import { toast } from "react-toastify";
import '../style/CommonDialogBox.css'
import '../style/changeActiveStatus.css'
import axios from "axios";


function ChangeActiveStatusOfURL({ changeStatus, value }) {
    const authToken = localStorage.getItem('authToken')
    const LOCALHOST_API = import.meta.env.VITE_LOCALHOST_API;
    const [isOpen, setIsOpen] = useState(false);
    const { id, title, active } = value;
    const [isActive, setIsActive] = useState(active);
    const onChangeStatusBtn = () => {
        axios.patch(`${LOCALHOST_API}/links/${id}/status`, { active: !active }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`,
            },
        }).then((res) => {
            setIsOpen(false);
            setIsActive(res.data.active)
            return changeStatus(true, id, res.data.active, title);
        }).catch(error => toast.error('Something went wrong!'))
    }


    return (
        <div>
            <div className="checkbox-wrapper-35">
                <input
                    onClick={onChangeStatusBtn}
                    value="private"
                    name={`switch-${id}`} // Make the name unique
                    id={`switch-${id}`} // Make the id unique
                    type="checkbox"
                    className="switch"
                    checked={!isActive} // Control the checkbox state
                    onChange={() => { }} // Prevent default checkbox behavior
                />
                <label htmlFor={`switch-${id}`}>
                    <span className="switch-x-text"></span>
                </label>
            </div>
        </div>
    );




}


export default ChangeActiveStatusOfURL;
