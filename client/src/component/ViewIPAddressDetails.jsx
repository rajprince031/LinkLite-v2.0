import { useState } from "react";
import '../style/CommonDialogBox.css';
import '../style/ViewIPAddressDetails.css';
const ViewIPAddressDetails = (props) => {
    const [isOpen, setIsOpen] = useState(false);
    const {
        ipAddress,
        browser,
        os,
        city,
        region,
        country,
        deviceType,
        userAgent,
        referrer,
    } = props.userDetails;
    return (
        <div className="ip_details_dialog_box_conatiner">
            <button onClick={() => setIsOpen(true)} className="info_button">Info</button>

            {
                isOpen &&
                <div onClick={() => setIsOpen(false)} className='ip_details_dialog_box_overlay'>
                    <div onClick={(e) => e.stopPropagation()} className="ip_details_main_content_box">
                        <ul className="ip_details_text_list">
                            <li><strong>IP Address:</strong> {ipAddress}</li>
                            <li><strong>Browser:</strong> {browser}</li>
                            <li><strong>OS:</strong> {os}</li>
                            <li><strong>Country:</strong> {country}</li>
                            <li><strong>Region:</strong> {region}</li>
                            <li><strong>City:</strong> {city}</li>
                            <li><strong>Device Type:</strong> {deviceType}</li>
                            <li><strong>User Agent:</strong> {userAgent}</li>
                            <li><strong>Referrer:</strong> {referrer || 'Direct'}</li>
                        </ul>

                        <button onClick={() => setIsOpen(false)}>close</button>
                    </div>

                </div>
            }
        </div>
    )
}


export default ViewIPAddressDetails;
