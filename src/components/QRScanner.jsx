import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FaTimes, FaCamera, FaSpinner, FaQrcode } from 'react-icons/fa';
import { motion } from 'framer-motion';

const QRScanner = ({ onScan, onClose }) => {
    // 'pending' | 'granted' | 'denied' | 'checking'
    const [permission, setPermission] = useState('checking');
    const [errorMsg, setErrorMsg] = useState('');
    const scannerRef = useRef(null);
    const containerId = "Scan The QR";

    const startScanner = async () => {
        try {
            setPermission('pending');
            setErrorMsg('');

            // Stop any existing scanner
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        await scannerRef.current.stop();
                    }
                } catch (e) {}
                scannerRef.current = null;
            }

            // On mobile Chrome, check actual permission state first via Permissions API
            if (navigator.permissions) {
                try {
                    const status = await navigator.permissions.query({ name: 'camera' });
                    if (status.state === 'denied') {
                        setPermission('denied');
                        setErrorMsg('Camera permission is blocked. Please open Chrome Settings → Site Settings → Camera and allow this site, then reload.');
                        return;
                    }
                } catch (permErr) {
                    // Permissions API may not support 'camera' on some browsers — proceed
                }
            }

            const html5QrCode = new Html5Qrcode(containerId);
            scannerRef.current = html5QrCode;

            const qrboxFunction = (viewfinderWidth, viewfinderHeight) => {
                const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
                const qrboxSize = Math.floor(minEdgeSize * 0.7);
                return { width: qrboxSize, height: qrboxSize };
            };

            await html5QrCode.start(
                { facingMode: "environment" },
                { fps: 15, qrbox: qrboxFunction, aspectRatio: 1.0 },
                async (decodedText) => {
                    if (scannerRef.current) {
                        try {
                            await scannerRef.current.stop();
                            scannerRef.current = null;
                        } catch (e) {}
                    }
                    onScan(decodedText);
                },
                () => {}
            );

            setPermission('granted');
        } catch (err) {
            console.error("QR Scanner Error:", err);
            const msg = err?.message || String(err);

            // Identify what actually went wrong
            if (
                msg.toLowerCase().includes('permission') ||
                msg.toLowerCase().includes('notallowed') ||
                msg.toLowerCase().includes('denied')
            ) {
                setPermission('denied');
                setErrorMsg('Camera access was denied. In Chrome, tap the 🔒 lock icon in the address bar → Site Settings → Camera → Allow.');
            } else if (
                msg.toLowerCase().includes('notfound') ||
                msg.toLowerCase().includes('no camera') ||
                msg.toLowerCase().includes('devicenotfound')
            ) {
                setPermission('denied');
                setErrorMsg('No camera found on this device.');
            } else {
                // Transient error — let the user retry
                setPermission('denied');
                setErrorMsg(`Scanner error: ${msg}. Please try again.`);
            }
        }
    };

    // Check permission state on mount; start scanner if already granted
    useEffect(() => {
        const init = async () => {
            if (navigator.permissions) {
                try {
                    const status = await navigator.permissions.query({ name: 'camera' });

                    if (status.state === 'denied') {
                        setPermission('denied');
                        setErrorMsg('Camera permission is blocked. Open Chrome Settings → Site Settings → Camera and allow this site, then reload.');
                        return;
                    }
                    // 'granted' or 'prompt' — attempt to start
                    startScanner();

                    // Listen for runtime changes
                    status.onchange = () => {
                        if (status.state === 'granted') {
                            startScanner();
                        } else if (status.state === 'denied') {
                            setPermission('denied');
                            setErrorMsg('Camera permission was revoked. Allow it in Chrome site settings.');
                        }
                    };
                    return;
                } catch (e) {
                    // Permissions API not supported for camera — fall through
                }
            }
            // Fallback: just try starting
            startScanner();
        };

        init();

        return () => {
            if (scannerRef.current) {
                try {
                    if (scannerRef.current.isScanning) {
                        scannerRef.current.stop().catch(() => {});
                    }
                } catch (e) {}
            }
        };
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4'
        >
            <div className='w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden p-6 relative shadow-2xl'>
                <button
                    onClick={onClose}
                    className='absolute top-6 right-6 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 active:scale-90 transition-all z-20'
                >
                    <FaTimes />
                </button>

                <div className='text-center mb-6'>
                    <h3 className='text-xl font-black uppercase tracking-widest text-gray-900'>QR Scanner</h3>
                    <p className='text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider'>Point camera at a QR code</p>
                </div>

                <div className='relative w-full aspect-square bg-gray-100 rounded-[2rem] overflow-hidden border-2 border-gray-50 shadow-inner flex items-center justify-center'>
                    <div id={containerId} className='w-full h-full' />

                    {/* Camera blocked / error */}
                    {permission === 'denied' && (
                        <div className='absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 text-center gap-3'>
                            <div className='w-14 h-14 rounded-full bg-red-50 flex items-center justify-center'>
                                <FaCamera className='text-2xl text-red-500' />
                            </div>
                            <p className='text-sm font-black text-gray-800 uppercase tracking-wide'>Camera Access Blocked</p>
                            <p className='text-xs text-gray-500 font-medium leading-relaxed max-w-xs'>{errorMsg || 'Allow camera access in your browser settings.'}</p>
                            <button
                                onClick={startScanner}
                                className='mt-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all'
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {/* Initialising */}
                    {(permission === 'pending' || permission === 'checking') && (
                        <div className='absolute inset-0 flex flex-col items-center justify-center p-8 bg-gray-50/80'>
                            <FaSpinner className='text-indigo-500 text-2xl animate-spin mb-3' />
                            <p className='text-[10px] font-black text-indigo-400 uppercase tracking-widest'>
                                {permission === 'checking' ? 'Checking camera...' : 'Starting scanner...'}
                            </p>
                        </div>
                    )}
                </div>

                <div className='mt-6 bg-indigo-50 p-4 rounded-2xl flex items-center gap-4 border border-indigo-100'>
                    <div className='w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg'>
                        <FaQrcode size={18} />
                    </div>
                    <div>
                        <p className='text-[10px] font-black text-indigo-700 uppercase tracking-wider'>Scan to Assign</p>
                        <p className='text-[9px] font-bold text-indigo-400 mt-0.5 leading-tight'>Point your rear camera at the order QR code to assign delivery.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default QRScanner;
