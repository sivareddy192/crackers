import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FaTimes, FaCamera, FaSpinner, FaQrcode, FaRedo } from 'react-icons/fa';
import { motion } from 'framer-motion';

const QRScanner = ({ onScan, onClose }) => {
    // 'checking' | 'starting' | 'granted' | 'denied' | 'error'
    const [status, setStatus] = useState('checking');
    const [errorMsg, setErrorMsg] = useState('');
    const scannerRef = useRef(null);
    const containerId = 'tracly-qr-reader';

    const stopScanner = useCallback(async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
            } catch (_) {}
            try { scannerRef.current.clear(); } catch (_) {}
            scannerRef.current = null;
        }
    }, []);

    const startScanner = useCallback(async () => {
        setStatus('checking');
        setErrorMsg('');

        await stopScanner();

        // ── Step 1: Probe camera with getUserMedia to get the real permission state ──
        if (!navigator?.mediaDevices?.getUserMedia) {
            setStatus('error');
            setErrorMsg(
                window.isSecureContext === false
                    ? 'Camera access requires HTTPS or localhost. Please ensure you are connected securely.'
                    : 'Camera API is not supported on this browser.'
            );
            return;
        }

        let testStream = null;
        try {
            testStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } }
            });
            // Camera IS accessible — stop probe stream before html5-qrcode takes over
            testStream.getTracks().forEach(t => t.stop());
            testStream = null;
        } catch (probeErr) {
            if (testStream) {
                try { testStream.getTracks().forEach(t => t.stop()); } catch (_) {}
            }

            const name = probeErr?.name || '';
            if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
                setStatus('denied');
                setErrorMsg(
                    'Camera permission is blocked.\n\n' +
                    'In Chrome: tap the 🔒 lock icon in the address bar → Site Settings → Camera → set to "Allow", then come back and tap Try Again.'
                );
            } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
                setStatus('denied');
                setErrorMsg('No camera found on this device.');
            } else if (name === 'NotReadableError' || name === 'TrackStartError') {
                // Camera physically in use — still accessible, just busy
                setStatus('error');
                setErrorMsg('Camera is being used by another app. Close other apps and try again.');
            } else {
                setStatus('error');
                setErrorMsg(`Could not access camera: ${probeErr?.message || name || 'Unknown error'}. Please try again.`);
            }
            return;
        }

        // ── Step 2: Start html5-qrcode scanner ──
        setStatus('starting');

        // Small delay to allow the DOM element to settle after state update
        await new Promise(r => setTimeout(r, 120));

        try {
            const el = document.getElementById(containerId);
            if (!el) {
                setStatus('error');
                setErrorMsg('Scanner element not found. Please close and reopen the scanner.');
                return;
            }

            const html5QrCode = new Html5Qrcode(containerId);
            scannerRef.current = html5QrCode;

            const qrConfig = {
                fps: 15,
                qrbox: (w, h) => {
                    const size = Math.floor(Math.min(w, h) * 0.72);
                    return { width: size, height: size };
                },
                aspectRatio: 1.0,
                disableFlip: false,
            };

            const onScanSuccess = async (decodedText) => {
                await stopScanner();
                onScan(decodedText);
            };

            const onScanFailure = () => {};

            // html5-qrcode expects { facingMode: 'environment' } (string), NOT { facingMode: { ideal: 'environment' } }
            try {
                await html5QrCode.start(
                    { facingMode: 'environment' },
                    qrConfig,
                    onScanSuccess,
                    onScanFailure
                );
            } catch (envErr) {
                console.warn('Environment camera start failed, attempting front camera fallback:', envErr);
                // Fallback to front/user camera
                await html5QrCode.start(
                    { facingMode: 'user' },
                    qrConfig,
                    onScanSuccess,
                    onScanFailure
                );
            }

            setStatus('granted');
        } catch (scanErr) {
            console.error('html5-qrcode start error:', scanErr);
            await stopScanner();
            const errStr = scanErr?.message || String(scanErr);
            const isPermError = /permission|notallowed|not allowed/i.test(errStr);
            if (isPermError) {
                setStatus('denied');
                setErrorMsg(
                    'Camera permission is blocked.\n\n' +
                    'In Chrome: tap the 🔒 lock icon in the address bar → Site Settings → Camera → set to "Allow", then come back and tap Try Again.'
                );
            } else {
                setStatus('error');
                setErrorMsg(
                    `Scanner failed to start: ${errStr}.\nTap Try Again.`
                );
            }
        }
    }, [stopScanner, onScan]);

    useEffect(() => {
        startScanner();
        return () => { stopScanner(); };
    }, []);

    const isBlocked = status === 'denied';
    const isError = status === 'error';
    const isLoading = status === 'checking' || status === 'starting';

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className='fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4'
        >
            <div className='w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden p-6 relative shadow-2xl'>
                {/* Close */}
                <button
                    onClick={onClose}
                    className='absolute top-6 right-6 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 active:scale-90 transition-all z-20'
                >
                    <FaTimes />
                </button>

                {/* Header */}
                <div className='text-center mb-5'>
                    <h3 className='text-xl font-black uppercase tracking-widest text-gray-900'>QR Scanner</h3>
                    <p className='text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider'>
                        {status === 'granted' ? 'Point camera at the QR code' : 'Setting up camera…'}
                    </p>
                </div>

                {/* Viewfinder */}
                <div className='relative w-full aspect-square bg-gray-100 rounded-[2rem] overflow-hidden border-2 border-gray-50 shadow-inner'>
                    {/* html5-qrcode always needs this element in the DOM */}
                    <div id={containerId} className='w-full h-full' />

                    {/* Corner guides when scanning */}
                    {status === 'granted' && (
                        <>
                            <div className='pointer-events-none absolute inset-0 flex items-center justify-center'>
                                <div className='w-[60%] h-[60%] relative'>
                                    {['tl','tr','bl','br'].map(c => (
                                        <span key={c} className={`absolute w-7 h-7 border-4 border-orange-500
                                            ${c==='tl'?'top-0 left-0 border-r-0 border-b-0 rounded-tl-lg':''}
                                            ${c==='tr'?'top-0 right-0 border-l-0 border-b-0 rounded-tr-lg':''}
                                            ${c==='bl'?'bottom-0 left-0 border-r-0 border-t-0 rounded-bl-lg':''}
                                            ${c==='br'?'bottom-0 right-0 border-l-0 border-t-0 rounded-br-lg':''}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {/* Loading overlay */}
                    {isLoading && (
                        <div className='absolute inset-0 flex flex-col items-center justify-center bg-gray-50/90 gap-3'>
                            <FaSpinner className='text-indigo-500 text-2xl animate-spin' />
                            <p className='text-[10px] font-black text-indigo-400 uppercase tracking-widest'>
                                {status === 'checking' ? 'Checking camera access…' : 'Starting scanner…'}
                            </p>
                        </div>
                    )}

                    {/* Denied / Error overlay */}
                    {(isBlocked || isError) && (
                        <div className='absolute inset-0 bg-white/97 flex flex-col items-center justify-center p-6 text-center gap-3'>
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isBlocked ? 'bg-red-50' : 'bg-amber-50'}`}>
                                <FaCamera className={`text-2xl ${isBlocked ? 'text-red-500' : 'text-amber-500'}`} />
                            </div>
                            <p className='text-sm font-black text-gray-800 uppercase tracking-wide'>
                                {isBlocked ? 'Camera Blocked' : 'Scanner Error'}
                            </p>
                            <p className='text-xs text-gray-500 font-medium leading-relaxed max-w-xs whitespace-pre-line'>
                                {errorMsg}
                            </p>
                            <button
                                onClick={startScanner}
                                className='mt-1 bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all'
                            >
                                <FaRedo size={10} /> Try Again
                            </button>
                        </div>
                    )}
                </div>

                {/* Info bar */}
                <div className='mt-5 bg-indigo-50 p-4 rounded-2xl flex items-center gap-4 border border-indigo-100'>
                    <div className='w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg'>
                        <FaQrcode size={18} />
                    </div>
                    <div>
                        <p className='text-[10px] font-black text-indigo-700 uppercase tracking-wider'>Scan to Assign Order</p>
                        <p className='text-[9px] font-bold text-indigo-400 mt-0.5 leading-tight'>
                            Align the order QR code inside the frame to auto-assign delivery.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default QRScanner;
