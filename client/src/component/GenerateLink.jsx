import React, { useState } from "react";
import "../style/GenerateUrl.css";
import axios from "axios";
import { toast } from "react-toastify";
import { FIELD_LIMITS, clampValue } from "../utils/fieldLimits";
import Spinner from "./Spinner";

export default function GenerateLink({ updateNewUrl, triggerClassName = "", triggerContent = "+ Create Link" }) {
    const expiryOptions = [
        { key: "none", label: "No expiry" },
        { key: "30m", label: "30 min" },
        { key: "1h", label: "1 hr" },
        { key: "2h", label: "2 hr" },
        { key: "1d", label: "1 day" },
        { key: "1w", label: "1 week" },
        { key: "custom", label: "Custom" },
    ];

    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const authToken = localStorage.getItem("authToken");
    const LOCALHOST_API = import.meta.env.VITE_LOCALHOST_API;

    const apiURL = LOCALHOST_API;
    const [expiryType, setExpiryType] = useState("none");

    const [userURL, updateUserURL] = useState({
        title: "",
        targetUrl: "",
        customAlias: "",
        expiresAt: "",
        active: true,
    });

    const handleCloseDialogBox = (force = false) => {
        if (isSubmitting && !force) return;
        setIsOpen(false);
        setIsSubmitting(false);
        updateUserURL({
            title: "",
            targetUrl: "",
            customAlias: "",
            expiresAt: "",
            active: true,
        })
        setExpiryType("none");
    }

    const calculateExpiry = () => {
        const now = new Date();
        const next = new Date(now);

        if (expiryType === "30m") next.setMinutes(next.getMinutes() + 30);
        if (expiryType === "1h") next.setHours(next.getHours() + 1);
        if (expiryType === "2h") next.setHours(next.getHours() + 2);
        if (expiryType === "1d") next.setDate(next.getDate() + 1);
        if (expiryType === "1w") next.setDate(next.getDate() + 7);

        return next.toISOString();
    };

    const handleGenerateURL = async () => {
        if (isSubmitting) return;
        const expiresAtValue =
            expiryType === "none"
                ? null
                : expiryType === "custom"
                    ? (userURL.expiresAt ? new Date(userURL.expiresAt).toISOString() : null)
                    : calculateExpiry();

        if (expiryType === "custom" && !userURL.expiresAt) {
            return toast.error("Please select a custom expiry date and time");
        }

        setIsSubmitting(true);
        axios.post(`${apiURL}/links`, {
            ...userURL,
            expiresAt: expiresAtValue
        }, {
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${authToken}`
            },
        })
            .then((res) => {
                updateNewUrl(res.data);
                handleCloseDialogBox(true);
                toast.success('Link created successfully.')
            }).catch((err)=>{
                toast.error(err.response?.data?.message || err.response?.data?.error || 'Something went wrong')
            }).finally(() => {
                setIsSubmitting(false);
            });
    };
    return (
        <div className="generate_url_container">
            <button type="button" className={triggerClassName} onClick={() => setIsOpen(true)}>
                {triggerContent}
            </button>
            {isOpen &&
                <div onClick={handleCloseDialogBox} className="dialog_box_overlay">
                    <div
                        className="dialog_box_main_container"
                        onClick={(e) => {
                            e.stopPropagation();
                        }}
                    >
                        <div className="generate_input_field" >
                            <div className="gen_title">Create a new short link</div>
                            <p className="generate_link_helper_text">Add a title, target URL, custom alias, and an optional expiry window.</p>
                            <input
                                className="input"
                                placeholder="Enter title"
                                value={userURL.title}
                                maxLength={FIELD_LIMITS.title}
                                onChange={e => updateUserURL({ ...userURL, title: clampValue(e.target.value, FIELD_LIMITS.title) })}
                            ></input>
                            <input
                                className="input"
                                placeholder="Enter your url"
                                value={userURL.targetUrl}
                                onChange={(e) =>
                                    updateUserURL({ ...userURL, targetUrl: e.target.value })
                                }
                            ></input>
                            <input
                                className="input"
                                placeholder="Custom alias (optional)"
                                value={userURL.customAlias}
                                maxLength={FIELD_LIMITS.alias}
                                onChange={(e) =>
                                    updateUserURL({ ...userURL, customAlias: clampValue(e.target.value, FIELD_LIMITS.alias) })
                                }
                            ></input>
                            <div className="expiry_selector_container">
                                <p className="expiry_label">Link expiry</p>
                                <div className="expiry_option_list">
                                    {expiryOptions.map((option) => (
                                        <button
                                            key={option.key}
                                            type="button"
                                            className={`expiry_option_button ${expiryType === option.key ? "active" : ""}`}
                                            onClick={() => setExpiryType(option.key)}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {expiryType === "custom" && <input
                                className="input"
                                type="datetime-local"
                                value={userURL.expiresAt}
                                onChange={(e) =>
                                    updateUserURL({ ...userURL, expiresAt: e.target.value })
                                }
                            ></input>}
                        </div>
                        <div className='dashboard_gen_button'>
                            <button
                                type="button"
                                className={`generate_link_submit_button ${isSubmitting ? "is-loading" : ""}`}
                                onClick={handleGenerateURL}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <span className="generate_link_submit_spinner"><Spinner /></span>
                                        <span>Generating...</span>
                                    </>
                                ) : (
                                    <span>Generate URL</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

            }

        </div>
    );
}
