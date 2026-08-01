import axios from "axios";
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { baseUrl } from "../App";

export default function Login() {
   
    const [userid, setUserId] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const navigate = useNavigate();

    const handleLogin = async (event) => {
        event.preventDefault();
        if (!userid || !password) {
            setErrorMessage("Please fill all fields");
            return;
        }

        try {
            const response = await axios.post(
                baseUrl,
                new URLSearchParams({
                    tag: "admin-login",
                    email: userid,
                    password: password,
                }),
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                }
            );

            if (response.data && response.data.error === 0) {
                sessionStorage.setItem("user", JSON.stringify(response.data));
                alert("Login successful");
                navigate("/AdminDashboard/Addcenter");
            } else {
                setErrorMessage(response.data.message || "Invalid credentials");
            }
        } catch (error) {
            setErrorMessage(
                error.response?.data?.message || "An error occurred. Please try again."
            );
        }
    };

    return (
        <div
            style={{
                background: "linear-gradient(135deg, #00b4d8, #0077b6, #023e8a)",
                height: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontFamily: "Poppins, sans-serif",
            }}
        >
            <div
                className="p-4 shadow-lg"
                style={{
                    width: "100%",
                    maxWidth: "400px",
                    borderRadius: "15px",
                    background: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(10px)",
                    color: "#fff",
                }}
            >
                <h2 className="text-center mb-4 fw-bold">🔐 Secure Login</h2>

                {/* Error Message */}
                {errorMessage && (
                    <div className="alert alert-danger text-center">{errorMessage}</div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="mb-3">
                        <label className="form-label">Email ID</label>
                        <input
                            type="text"
                            className="form-control"
                            value={userid}
                            onChange={(e) => setUserId(e.target.value)}
                            required
                            placeholder="Enter your Email ID"
                            style={{
                                borderRadius: "30px",
                                padding: "12px",
                                border: "none",
                                outline: "none",
                            }}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Enter your password"
                            style={{
                                borderRadius: "30px",
                                padding: "12px",
                                border: "none",
                                outline: "none",
                            }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn w-100 fw-bold"
                        style={{
                            background: "#00b4d8",
                            border: "none",
                            padding: "12px",
                            borderRadius: "30px",
                            fontSize: "16px",
                            transition: "0.3s",
                        }}
                        onMouseOver={(e) => (e.target.style.background = "#0077b6")}
                        onMouseOut={(e) => (e.target.style.background = "#00b4d8")}
                    >
                        Login
                    </button>
                </form>

                <button
                    as={Link}
                    to="/"
                    className="btn w-100 fw-bold"
                    style={{
                        background: "#e4c40f",
                        border: "none",
                        padding: "12px",
                        borderRadius: "30px",
                        fontSize: "16px",
                        transition: "0.3s",
                        margin: "5px",
                    }}
                >
                    ⬅ Back
                </button>
            </div>
        </div>
    );
}
