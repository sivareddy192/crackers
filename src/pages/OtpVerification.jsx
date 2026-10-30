import React, { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const OtpVerification = () => {
    const [data, setData] = useState(["", "", "", "", "", ""]);
    const [isLoading, setIsLoading] = useState(false);
    const [shake, setShake] = useState(false);
    const [timer, setTimer] = useState(30);
    const [canResend, setCanResend] = useState(false);

    const navigate = useNavigate();
    const inputRef = useRef([]);
    const location = useLocation();

    useEffect(() => {
        if (!location?.state?.email) {
            navigate("/forgot-password");
        }
    }, []);

    useEffect(() => {
        if (timer === 0) {
            setCanResend(true);
            return;
        }

        const interval = setInterval(() => {
            setTimer(prev => prev - 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [timer]);

    const valideValue = data.every(el => el);

    const handleChange = (value, index) => {
        let newData = [...data];

        if (value.length === 6) {
            newData = value.split("").slice(0, 6);
            setData(newData);
            inputRef.current[5]?.focus();
            return;
        }

        newData[index] = value.slice(-1);
        setData(newData);

        if (value && index < 5) {
            inputRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        const key = e.key;

        if (key === "Backspace" && !data[index] && index > 0) {
            inputRef.current[index - 1]?.focus();
        }

        if (key === "ArrowLeft" && index > 0) {
            inputRef.current[index - 1]?.focus();
        }

        if (key === "ArrowRight" && index < 5) {
            inputRef.current[index + 1]?.focus();
        }
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData("text").trim();

        if (/^[0-9]{6}$/.test(pasted)) {
            setData(pasted.split(""));
            inputRef.current[5]?.focus();
        }

        e.preventDefault();
    };

    const handleResend = async () => {
        try {
            const res = await Axios({
                ...SummaryApi.forgot_password,
                data: { email: location?.state?.email }
            });

            toast.success("OTP Sent Again!");
            setTimer(30);
            setCanResend(false);
        } catch (error) {
            AxiosToastError(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setIsLoading(true);

        try {
            const response = await Axios({
                ...SummaryApi.forgot_password_otp_verification,
                data: {
                    otp: data.join(""),
                    email: location?.state?.email
                }
            });

            setIsLoading(false);

            if (response.data.error) {
                toast.error(response.data.message);

                setShake(true);
                setTimeout(() => setShake(false), 500);

                return;
            }

            if (response.data.success) {
                toast.success(response.data.message);
                setData(["", "", "", "", "", ""]);

                navigate("/reset-password", {
                    state: {
                        data: response.data,
                        email: location?.state?.email
                    }
                });
            }

        } catch (error) {
            setIsLoading(false);
            AxiosToastError(error);
        }
    };

    return (
        <section className='w-full container mx-auto px-2'>
            <div className='bg-white my-4 w-full max-w-lg mx-auto rounded-2xl p-7'>
                <p className='font-semibold text-lg'>Enter OTP</p>

                <form className='grid gap-4 py-4' onSubmit={handleSubmit}>
                    <div className='grid gap-1'>
                        <label htmlFor='otp'>Enter Your OTP :</label>

                        <div
                            className={`flex items-center gap-2 justify-between mt-3 ${shake ? "animate-shake" : ""}`}
                            onPaste={handlePaste}
                        >
                            {data.map((value, index) => (
                                <input
                                    key={index}
                                    type='text'
                                    maxLength={1}
                                    value={value}
                                    ref={ref => (inputRef.current[index] = ref)}
                                    onChange={(e) => handleChange(e.target.value, index)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    className='bg-blue-50 w-full max-w-16 p-2 border rounded-2xl outline-none 
                                    focus:border-green-200 text-center font-semibold text-lg'
                                />
                            ))}
                        </div>
                    </div>

                    <button
                        disabled={!valideValue || isLoading}
                        className={`w-full py-3.5 rounded-2xl font-extrabold text-xs uppercase tracking-wider transition-all active:scale-[0.98] shadow-md my-3 flex justify-center items-center gap-2 cursor-pointer ${
                            valideValue && !isLoading
                                ? "bg-gradient-to-r from-indigo-600 via-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-600/25 hover:shadow-lg"
                                : "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                        }`}
                    >
                        {isLoading ? (
                            <span className="spinner border-2 w-5 h-5 rounded-full border-t-transparent animate-spin"></span>
                        ) : (
                            "Verify OTP"
                        )}
                    </button>
                </form>

                <div className='flex justify-between items-center py-2 text-xs'>
                    <p className='text-slate-500'>
                        {canResend ? "Didn't receive OTP?" : `Resend in ${timer}s`}
                    </p>

                    <button
                        onClick={handleResend}
                        disabled={!canResend}
                        className={`font-bold transition-colors ${canResend ? "text-indigo-600 hover:text-indigo-700 cursor-pointer" : "text-slate-400 cursor-not-allowed"}`}
                    >
                        Resend OTP
                    </button>
                </div>

                <p>
                    Already have account?{" "}
                    <Link to={"/login"} className='font-semibold text-green-700 hover:text-green-800'>
                        Login
                    </Link>
                </p>
            </div>

            <style>{`
                .animate-shake {
                    animation: shake 0.3s linear;
                }
                @keyframes shake {
                    0% { transform: translateX(0); }
                    25% { transform: translateX(-4px); }
                    50% { transform: translateX(4px); }
                    75% { transform: translateX(-4px); }
                    100% { transform: translateX(0); }
                }
                .spinner {
                    border-radius: 50%;
                }
            `}</style>
        </section>
    );
};

export default OtpVerification;
