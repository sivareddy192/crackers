import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineChevronRight } from "react-icons/hi";
import { FaTrashAlt } from "react-icons/fa";
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';

const AccountPrivacy = () => {
    const [loading, setLoading] = useState(false);

    const handleRequestDelete = async () => {
        try {
            setLoading(true);
            const response = await Axios({
                ...SummaryApi.request_delete
            });

            if (response.data.success) {
                toast.success(response.data.message);
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='p-4 lg:p-8'
        >
            <div className='max-w-3xl mx-auto'>
                <h1 className='text-2xl font-black text-gray-900 mb-6'>Account privacy and policy</h1>
                
                <div className='space-y-6 text-gray-600 leading-relaxed text-sm lg:text-base'>
                    <p>
                        We i.e. "Trace Commerce Private Limited", are committed to protecting the privacy and security of your personal information. Your privacy is important to us and maintaining your trust is paramount.
                    </p>
                    
                    <p>
                        This privacy policy explains how we collect, use, process and disclose information about you. By using our website/ app/ platform and affiliated services, you consent to the terms of our privacy policy ("Privacy Policy") in addition to our 'Terms of Use.' We encourage you to read this privacy policy to understand the collection, use, and disclosure of your information from time to time, to keep yourself updated with the changes and updates that we make to this policy. This privacy policy describes our privacy practices for all websites, products and services that are linked to it. However this policy does not apply to those affiliates and partners that have their own privacy policy. In such situations, we recommend that you read the privacy policy on the applicable site. Should you have any clarifications regarding this privacy policy, please write to us at munnareddy03457@gmail.com
                    </p>
                </div>

                {/* Action Cards */}
                <div className='mt-10 space-y-4'>
                    <button 
                        onClick={handleRequestDelete}
                        disabled={loading}
                        className='w-full bg-white border border-gray-100 rounded-3xl p-5 flex items-center justify-between hover:bg-gray-50 transition-all group shadow-sm active:scale-[0.98] disabled:opacity-50'
                    >
                        <div className='flex items-center gap-5'>
                            <div className='w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 group-hover:scale-110 transition-transform'>
                                <FaTrashAlt size={20} />
                            </div>
                            <div className='text-left'>
                                <h3 className='font-black text-gray-900 text-lg'>Request to delete account</h3>
                                <p className='text-sm text-gray-400 font-medium mt-0.5'>
                                    {loading ? "Sending Request..." : "Request to closure of your account"}
                                </p>
                            </div>
                        </div>
                        <HiOutlineChevronRight className='text-gray-400 text-2xl group-hover:translate-x-1 transition-transform' />
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

export default AccountPrivacy;
