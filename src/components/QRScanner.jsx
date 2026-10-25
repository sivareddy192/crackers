import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { FaTimes, FaCamera, FaSpinner, FaQrcode } from 'react-icons/fa';
import { motion } from 'framer-motion';

const QRScanner = ({ onScan, onClose }) => {
    const [permission, setPermission] = useState('pending');
    const scannerRef = useRef(null);
    const containerId = "mern-qr-reader";

    const startScanner = async () => {
        try {
            setPermission('pending');
            
            if (scannerRef.current) {
                try {
                    await scannerRef.current.stop();
                } catch (e) {}
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
                { 
                    fps: 15, 
                    qrbox: qrboxFunction,
                    aspectRatio: 1.0 
                },
                async (decodedText) => {
                    if (scannerRef.current) {
                        try {
                            await scannerRef.current.stop();
                            scannerRef.current = null;
                        } catch (e) {}
                    }
                    onScan(decodedText);
                },
                () => {} // Ignore frame errors
            );
            
            setPermission('granted');
        } catch (err) {
            console.error("QR Scanner Error:", err);
            setPermission('denied');
        }
    };

    useEffect(() => {
        startScanner();
        return () => {
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().catch(console.error);
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
                    <h3 className='text-xl font-black uppercase tracking-widest text-gray-900'>MERN Scanner</h3>
                    <p className='text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider'>Integrated QR Recognition</p>
                </div>

                <div className='relative w-full aspect-square bg-gray-100 rounded-[2rem] overflow-hidden border-2 border-gray-50 shadow-inner flex items-center justify-center'>
                    <div id={containerId} className='w-full h-full' />
                    
                    {permission === 'denied' && (
                        <div className='absolute inset-0 bg-white/90 flex flex-col items-center justify-center p-8 text-center'>
                            <FaCamera className='text-4xl text-red-500 mb-4' />
                            <p className='text-sm font-black text-gray-800 uppercase'>Access Blocked</p>
                            <p className='text-xs text-gray-400 mt-2 font-bold'>Please enable camera permissions in settings.</p>
                            <button 
                                onClick={startScanner}
                                className='mt-6 bg-indigo-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest'
                            >
                                Try Again
                            </button>
                        </div>
                    )}
                    
                    {permission === 'pending' && (
                        <div className='absolute inset-0 flex flex-col items-center justify-center p-8 bg-gray-50/80 animate-pulse'>
                            <div className='w-12 h-12 bg-indigo-100 rounded-full mb-3 flex items-center justify-center'>
                                <div className='w-6 h-6 bg-indigo-200 rounded-full' />
                            </div>
                            <p className='text-[10px] font-black text-indigo-400 uppercase tracking-widest'>Initialising Scanner...</p>
                        </div>
                    )}
                </div>

                <div className='mt-6 bg-indigo-50 p-4 rounded-2xl flex items-center gap-4 border border-indigo-100'>
                    <div className='w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shrink-0 shadow-lg'>
                        <FaQrcode size={18} />
                    </div>
                    <div>
                        <p className='text-[10px] font-black text-indigo-700 uppercase tracking-wider'>MERN Stack Integration</p>
                        <p className='text-[9px] font-bold text-indigo-400 mt-0.5 leading-tight'>Decoded data is processed securely through the backend API.</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default QRScanner;
