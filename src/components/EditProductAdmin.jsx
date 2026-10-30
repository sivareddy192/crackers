import React, { useEffect, useState } from 'react'
import { FaCloudUploadAlt } from "react-icons/fa"
import uploadImage from '../utils/UploadImage'
import ButtonLoading from '../components/ButtonLoading'
import ViewImage from '../components/ViewImage'
import { MdDelete, MdAdd } from "react-icons/md"
import { useSelector, useDispatch } from 'react-redux'
import { IoClose } from "react-icons/io5"
import AddFieldComponent from '../components/AddFieldComponent'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import successAlert from '../utils/SuccessAlert'
import { setAllCategory, setAllSubCategory } from '../store/productSlice'
import { getImageUrl } from '../utils/getImageUrl'
import uploadVideo from '../utils/UploadVideo'
import ViewVideo from '../components/ViewVideo'
import { FaVideo } from 'react-icons/fa'
import { getDiscountPercent } from '../utils/PriceWithDiscount'
import { invalidateClientCatalog } from '../utils/apiCache'

const EditProductAdmin = ({ close, data: propsData, fetchProductData }) => {
  const dispatch = useDispatch()
  const allCategory = useSelector(state => state.product.allCategory || [])
  const allSubCategory = useSelector(state => state.product.allSubCategory || [])

  const asArray = (val) => {
    if (val === undefined || val === null) return []
    return Array.isArray(val) ? val : [val]
  }

  const normalizeToObjects = (items, allList) => {
    const arr = asArray(items)
    return arr
      .map(item => {
        const id = item && (typeof item === 'string' ? item : item._id)
        if (!id) return typeof item === 'object' ? item : null
        const found = allList.find(el => el._id === id)
        return found || (typeof item === 'object' ? item : { _id: id })
      })
      .filter(Boolean)
  }

  const [data, setData] = useState({
    _id: propsData?._id || "",
    name: propsData?.name || "",
    image: propsData?.image || [],
    category: Array.isArray(propsData?.category) ? propsData.category : (propsData?.category ? [propsData.category] : []),
    subCategory: Array.isArray(propsData?.subCategory) ? propsData.subCategory : (propsData?.subCategory ? [propsData.subCategory] : []),
    description: propsData?.description || "",
    more_details: propsData?.more_details || {},
    variants: propsData?.variants?.length > 0 ? propsData.variants : [
      { unit: propsData?.unit || "", mrp: propsData?.mrp || "", price: propsData?.price || "", discount: propsData?.discount || 0, stock: propsData?.stock || "" }
    ],
    relatedProducts: propsData?.relatedProducts || [],
    video: propsData?.video || ""
  })

  const [imageLoading, setImageLoading] = useState(false)
  const [viewImageURL, setViewImageURL] = useState("")
  const [openAddField, setOpenAddField] = useState(false)
  const [fieldName, setFieldName] = useState("")
  const [selectCategory, setSelectCategory] = useState("")
  const [selectSubCategory, setSelectSubCategory] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [relatedSearch, setRelatedSearch] = useState("")
  const [relatedResults, setRelatedResults] = useState([])
  const [relatedLoading, setRelatedLoading] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const [viewVideoURL, setViewVideoURL] = useState("")

  useEffect(() => {
    const loadData = async () => {
      try {
        const [cat, sub] = await Promise.all([
          Axios({
            ...SummaryApi.getCategory,
            params: { t: Date.now() },
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
          }),
          Axios({
            ...SummaryApi.getSubCategory,
            params: { t: Date.now() },
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' }
          })
        ])
        if (cat.data?.success) {
          dispatch(setAllCategory(cat.data.data || []))
        }
        if (sub.data?.success) {
          dispatch(setAllSubCategory(sub.data.data || []))
        }
      } catch (err) {
        AxiosToastError(err)
      }
    }

    loadData()
  }, [dispatch])

  useEffect(() => {
    if (!propsData) return
    const syncedCategory = normalizeToObjects(propsData.category, allCategory)
    const syncedSubCategory = normalizeToObjects(propsData.subCategory, allSubCategory)
    setData(prev => ({
      ...prev,
      category: syncedCategory.length ? syncedCategory : prev.category,
      subCategory: syncedSubCategory.length ? syncedSubCategory : prev.subCategory,
    }))
  }, [allCategory, allSubCategory, propsData])

  const handleChange = (e) => {
    const { name, value } = e.target
    setData(prev => ({ ...prev, [name]: value }))
  }

  const handleUploadImage = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImageLoading(true)
    try {
      const response = await uploadImage(file)
      const url = response?.data?.data?.url || response?.data?.data
      if (!url) {
        throw new Error(response?.data?.message || "Failed to upload image")
      }
      setData(prev => ({ ...prev, image: [...prev.image, url] }))
    } catch (err) {
      AxiosToastError(err)
    } finally {
      setImageLoading(false)
      if (e.target) e.target.value = ""
    }
  }

  const handleDeleteImage = (index) => {
    setData(prev => ({
      ...prev,
      image: prev.image.filter((_, i) => i !== index)
    }))
  }

  const handleUploadVideo = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setVideoLoading(true)
    try {
      const response = await uploadVideo(file)
      const url = response?.data?.data?.url || response?.data?.data
      if (!url) {
        throw new Error(response?.data?.message || "Failed to upload video")
      }
      setData(prev => ({ ...prev, video: url }))
    } catch (err) {
      AxiosToastError(err)
    } finally {
      setVideoLoading(false)
      if (e.target) e.target.value = ""
    }
  }

  const handleDeleteVideo = () => {
    setData(prev => ({ ...prev, video: "" }))
  }

  const handleAddField = () => {
    if (!fieldName.trim()) return
    setData(prev => ({
      ...prev,
      more_details: { ...prev.more_details, [fieldName]: "" }
    }))
    setFieldName("")
    setOpenAddField(false)
  }

  const handleSearchRelated = async (e) => {
    const value = e.target.value
    setRelatedSearch(value)
    if (value.length < 2) {
      setRelatedResults([])
      return
    }

    try {
      setRelatedLoading(true)
      const response = await Axios({
        ...SummaryApi.searchProduct,
        data: { search: value, limit: 5 }
      })
      if (response.data.success) {
        setRelatedResults(response.data.data)
      }
    } catch (error) {
      console.error("Related search failed", error)
    } finally {
      setRelatedLoading(false)
    }
  }

  const handleAddRelated = (product) => {
    if (data.relatedProducts.some(p => p._id === product._id)) {
      return
    }
    setData(prev => ({
      ...prev,
      relatedProducts: [...prev.relatedProducts, product]
    }))
    setRelatedSearch("")
    setRelatedResults([])
  }

  const handleRemoveRelated = (index) => {
    setData(prev => ({
      ...prev,
      relatedProducts: prev.relatedProducts.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isSubmitting) return
    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        variants: data.variants.map(variant => ({
          ...variant,
          discount: getDiscountPercent(variant.mrp, variant.price)
        })),
        category: (data.category || []).map(c => (typeof c === 'string' ? c : c._id)),
        subCategory: (data.subCategory || []).map(c => (typeof c === 'string' ? c : c._id)),
        relatedProducts: (data.relatedProducts || []).map(p => (typeof p === 'string' ? p : p._id)),
        unit: data.variants[0]?.unit,
        price: data.variants[0]?.price,
        mrp: data.variants[0]?.mrp,
        discount: getDiscountPercent(data.variants[0]?.mrp, data.variants[0]?.price),
        stock: data.variants[0]?.stock
      }

      const response = await Axios({
        ...SummaryApi.updateProductDetails,
        data: payload,
      })

      if (response.data?.success) {
        successAlert("Product Updated Successfully!")
        invalidateClientCatalog()
        close()
        fetchProductData()
      }
    } catch (err) {
      AxiosToastError(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300'>
      <div className='bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20'>
        <div className='p-8 flex items-center justify-between border-b border-gray-50'>
          <div>
            <h2 className='text-2xl font-black text-gray-900 uppercase tracking-tighter'>Edit Product</h2>
            <p className='text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest'>Update your product listing information</p>
          </div>
          <button 
            onClick={close}
            className='w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all active:scale-90'
          >
            <IoClose size={24} />
          </button>
        </div>

        <form className='flex-1 overflow-y-auto p-8 no-scrollbar' onSubmit={handleSubmit}>
          <div className='grid lg:grid-cols-2 gap-10'>
            <div className='space-y-8'>
              <div className='space-y-4'>
                <label className='text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1'>Basic Information</label>
                <div className='space-y-4'>
                  <div className='group'>
                    <input
                      type='text'
                      name='name'
                      placeholder='Product Name'
                      value={data.name}
                      onChange={handleChange}
                      className='w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-gray-900 placeholder:text-gray-300'
                    />
                  </div>
                  <textarea
                    name='description'
                    placeholder='Describe your product...'
                    value={data.description}
                    onChange={handleChange}
                    rows={4}
                    className='w-full bg-gray-50 border border-gray-100 p-4 rounded-2xl outline-none focus:border-indigo-500 focus:bg-white transition-all font-bold text-gray-900 placeholder:text-gray-300 resize-none'
                  />
                </div>
              </div>

              <div className='space-y-4'>
                <label className='text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1'>Product Images</label>
                <div className='grid grid-cols-4 gap-4'>
                  <label htmlFor='productImage' className='aspect-square rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-gray-400 hover:text-indigo-600'>
                    {imageLoading ? <ButtonLoading /> : (
                      <>
                        <FaCloudUploadAlt size={24} />
                        <span className='text-[9px] font-black uppercase mt-1'>Upload</span>
                      </>
                    )}
                    <input type='file' id='productImage' className='hidden' accept='image/*' onChange={handleUploadImage} />
                  </label>

                  {data.image.map((img, index) => (
                    <div key={index} className='aspect-square rounded-2xl border border-gray-100 relative group overflow-hidden bg-gray-50'>
                      <img
                        src={getImageUrl(img)}
                        alt=''
                        className='w-full h-full object-contain cursor-pointer transition-transform group-hover:scale-110'
                        onClick={() => setViewImageURL(img)}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteImage(index)}
                        className='absolute inset-0 bg-red-500/80 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity'
                      >
                        <MdDelete size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className='space-y-4'>
                <label className='text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1'>Product Video</label>
                <div className='grid grid-cols-1 gap-4'>
                  {!data.video ? (
                    <label htmlFor='productVideo' className='aspect-video rounded-2xl border-2 border-dashed border-gray-100 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all text-gray-400 hover:text-indigo-600'>
                      {videoLoading ? <ButtonLoading /> : (
                        <>
                          <FaVideo size={32} />
                          <span className='text-[10px] font-black uppercase mt-2'>Upload Product Video</span>
                        </>
                      )}
                      <input type='file' id='productVideo' className='hidden' accept='video/*' onChange={handleUploadVideo} />
                    </label>
                  ) : (
                    <div className='aspect-video rounded-2xl border border-gray-100 relative group overflow-hidden bg-black shadow-lg'>
                      <video
                        src={getImageUrl(data.video)}
                        className='w-full h-full object-cover'
                      />
                      <div className='absolute inset-0 bg-black/60 flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity'>
                        <button
                          type="button"
                          onClick={() => setViewVideoURL(getImageUrl(data.video))}
                          className='p-3 bg-white text-gray-900 rounded-full hover:scale-110 transition-transform font-bold text-xs uppercase'
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteVideo}
                          className='p-3 bg-red-500 text-white rounded-full hover:scale-110 transition-transform'
                        >
                          <MdDelete size={20} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className='space-y-8'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-4'>
                  <label className='text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1'>Categories</label>
                  <select
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-xs"
                    value={selectCategory}
                    onChange={(e) => {
                      const id = e.target.value
                      const match = allCategory.find(c => c._id === id) || { _id: id }
                      if (match && !(data.category || []).some(c => (c._id || c) === (match._id || match))) {
                        setData(prev => ({ ...prev, category: [...(prev.category || []), match] }))
                      }
                      setSelectCategory("")
                    }}
                  >
                    <option value="">Add Category</option>
                    {allCategory.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    {(data.category || []).map((c, i) => (
                      <div key={i} className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase border border-indigo-100">
                        {typeof c === 'string' ? (allCategory.find(a => a._id === c)?.name || c) : (c.name || c._id)}
                        <IoClose className="cursor-pointer hover:text-red-500" onClick={() => setData(prev => ({ ...prev, category: prev.category.filter((_, idx) => idx !== i) }))} />
                      </div>
                    ))}
                  </div>
                </div>

                <div className='space-y-4'>
                  <label className='text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1'>Sub Categories</label>
                  <select
                    className="w-full bg-gray-50 border border-gray-100 p-3 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-xs"
                    value={selectSubCategory}
                    onChange={(e) => {
                      const id = e.target.value
                      const match = allSubCategory.find(c => c._id === id) || { _id: id }
                      if (match && !(data.subCategory || []).some(c => (c._id || c) === (match._id || match))) {
                        setData(prev => ({ ...prev, subCategory: [...(prev.subCategory || []), match] }))
                      }
                      setSelectSubCategory("")
                    }}
                  >
                    <option value="">Add Sub Category</option>
                    {allSubCategory.map(sc => <option key={sc._id} value={sc._id}>{sc.name}</option>)}
                  </select>
                  <div className="flex flex-wrap gap-2">
                    {(data.subCategory || []).map((s, i) => (
                      <div key={i} className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase border border-emerald-100">
                        {typeof s === 'string' ? (allSubCategory.find(a => a._id === s)?.name || s) : (s.name || s._id)}
                        <IoClose className="cursor-pointer hover:text-red-500" onClick={() => setData(prev => ({ ...prev, subCategory: prev.subCategory.filter((_, idx) => idx !== i) }))} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className='space-y-4'>
                <div className='flex items-center justify-between ml-1'>
                  <label className='text-[10px] font-black text-gray-400 uppercase tracking-widest'>Product Units / Variants</label>
                  <button 
                    type="button"
                    onClick={() => setData(prev => ({ ...prev, variants: [...prev.variants, { unit: "", mrp: "", price: "", discount: 0, stock: "" }] }))}
                    className="flex items-center gap-1 text-[10px] bg-gray-900 text-white px-3 py-1.5 rounded-xl font-black uppercase hover:bg-indigo-600 transition-colors shadow-lg active:scale-95"
                  >
                    <MdAdd size={14} /> Add Unit
                  </button>
                </div>

                <div className='space-y-3'>
                  {data.variants.map((variant, index) => (
                    <div key={index} className='bg-gray-50/50 border border-gray-100 p-5 rounded-3xl relative group hover:bg-white hover:shadow-xl hover:shadow-indigo-500/5 transition-all'>
                      <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
                        <div className='space-y-1.5'>
                          <label className='text-[9px] font-black text-gray-400 uppercase tracking-tighter'>Unit</label>
                          <input 
                            type="text" placeholder="e.g. 500g" value={variant.unit}
                            onChange={(e) => {
                              const updated = [...data.variants];
                              updated[index].unit = e.target.value;
                              setData(prev => ({ ...prev, variants: updated }));
                            }}
                            required className='w-full bg-white border border-gray-100 p-2.5 rounded-xl outline-none focus:border-indigo-500 font-bold text-xs'
                          />
                        </div>
                        <div className='space-y-1.5'>
                          <label className='text-[9px] font-black text-gray-400 uppercase tracking-tighter'>MRP (₹)</label>
                          <input 
                            type="number" value={variant.mrp}
                            onChange={(e) => {
                              const updated = [...data.variants];
                              updated[index].mrp = e.target.value;
                              setData(prev => ({ ...prev, variants: updated }));
                            }}
                            required className='w-full bg-white border border-gray-100 p-2.5 rounded-xl outline-none focus:border-indigo-500 font-bold text-xs'
                          />
                        </div>
                        <div className='space-y-1.5'>
                          <label className='text-[9px] font-black text-gray-400 uppercase tracking-tighter'>Price (₹)</label>
                          <input 
                            type="number" value={variant.price}
                            onChange={(e) => {
                              const updated = [...data.variants];
                              updated[index].price = e.target.value;
                              setData(prev => ({ ...prev, variants: updated }));
                            }}
                            required className='w-full bg-white border border-gray-100 p-2.5 rounded-xl outline-none focus:border-indigo-500 font-bold text-xs'
                          />
                        </div>
                        <div className='space-y-1.5'>
                          <label className='text-[9px] font-black text-gray-400 uppercase tracking-tighter'>Disc (%)</label>
                          <input 
                            type="number" value={getDiscountPercent(variant.mrp, variant.price)} readOnly
                            aria-label="Calculated discount percentage"
                            className='w-full bg-gray-100 border border-gray-100 p-2.5 rounded-xl outline-none font-bold text-xs text-gray-500'
                          />
                        </div>
                        <div className='space-y-1.5'>
                          <label className='text-[9px] font-black text-gray-400 uppercase tracking-tighter'>Stock</label>
                          <input 
                            type="number" value={variant.stock}
                            onChange={(e) => {
                              const updated = [...data.variants];
                              updated[index].stock = e.target.value;
                              setData(prev => ({ ...prev, variants: updated }));
                            }}
                            required className='w-full bg-white border border-gray-100 p-2.5 rounded-xl outline-none focus:border-indigo-500 font-bold text-xs'
                          />
                        </div>
                      </div>
                      {data.variants.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => setData(prev => ({ ...prev, variants: prev.variants.filter((_, idx) => idx !== index) }))}
                          className='absolute -top-2 -right-2 w-7 h-7 bg-white border border-gray-100 text-red-500 rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-90'
                        >
                          <IoClose size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className='space-y-4'>
                <label className='text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1'>Related Products</label>
                <div className='relative'>
                  <input
                    type='text'
                    placeholder='Search related products...'
                    value={relatedSearch}
                    onChange={handleSearchRelated}
                    className='w-full bg-gray-50 border border-gray-100 p-3 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-xs'
                  />
                  {relatedLoading && (
                    <div className='absolute right-3 top-2.5'>
                      <ButtonLoading />
                    </div>
                  )}
                  {relatedResults.length > 0 && (
                    <div className='absolute top-full left-0 right-0 bg-white border border-gray-100 shadow-2xl rounded-2xl mt-2 z-50 overflow-hidden'>
                      {relatedResults.map(product => (
                        <div 
                          key={product._id}
                          onClick={() => handleAddRelated(product)}
                          className='p-3 hover:bg-indigo-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0 transition-colors'
                        >
                          <img src={getImageUrl(product.image[0])} className='w-8 h-8 object-contain bg-gray-50 rounded-lg' alt='' />
                          <div className='flex flex-col'>
                            <span className='text-xs font-bold text-gray-800'>{product.name}</span>
                            <span className='text-[9px] text-gray-400 font-bold uppercase'>{product.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className='flex flex-wrap gap-2'>
                  {data.relatedProducts.map((product, index) => (
                    <div key={index} className='bg-indigo-50/50 text-indigo-700 px-3 py-2 rounded-xl flex items-center gap-3 text-[10px] font-black uppercase border border-indigo-100 shadow-sm'>
                      <img src={getImageUrl(product.image?.[0])} className='w-5 h-5 object-contain mix-blend-multiply' alt='' />
                      <span>{product.name}</span>
                      <IoClose 
                        className='cursor-pointer hover:text-red-500 transition-colors' 
                        size={14} 
                        onClick={() => handleRemoveRelated(index)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className='mt-10 pt-10 border-t border-gray-50 space-y-6'>
            <div className='flex items-center justify-between'>
                <label className='text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1'>Extended Attributes</label>
                <button 
                    type="button"
                    onClick={() => setOpenAddField(true)}
                    className='text-[10px] font-black text-indigo-600 hover:text-indigo-700 uppercase tracking-widest'
                >
                    + Add New Field
                </button>
            </div>
            
            <div className='grid md:grid-cols-2 gap-6'>
                {Object.keys(data.more_details || {}).map((k, i) => (
                    <div key={i} className='space-y-1.5'>
                        <div className='flex items-center justify-between px-1'>
                            <label className='text-[9px] font-black text-gray-400 uppercase'>{k}</label>
                            <button 
                                type="button"
                                onClick={() => {
                                    const next = { ...data.more_details }
                                    delete next[k]
                                    setData(prev => ({ ...prev, more_details: next }))
                                }}
                                className='text-red-400 hover:text-red-600'
                            >
                                <MdDelete size={14} />
                            </button>
                        </div>
                        <textarea
                            placeholder={`Enter ${k} (e.g. 1) Product Name: ... 2) Quantity: ... or each point on a new line)`}
                            rows={4}
                            value={data.more_details[k]}
                            onChange={(e) => {
                            setData(prev => ({
                                ...prev,
                                more_details: { ...prev.more_details, [k]: e.target.value }
                            }))
                            }}
                            className='w-full bg-gray-50 border border-gray-100 p-3 rounded-2xl outline-none focus:border-indigo-500 font-bold text-xs resize-y'
                        />
                        <p className='text-[10px] text-gray-400 font-medium px-1'>
                            Tip: Enter each specification on a new line or as numbered points (e.g. 1) ..., 2) ...)
                        </p>
                    </div>
                ))}
            </div>
          </div>
        </form>

        <div className='p-8 bg-gray-50/50 border-t border-gray-50 flex justify-end gap-4'>
            <button 
                type="button"
                onClick={close}
                className='px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all'
            >
                Discard Changes
            </button>
            <button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className='px-10 py-3 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 shadow-xl shadow-gray-900/10 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2'
            >
                {isSubmitting ? 'Updating...' : 'Update Product'}
            </button>
        </div>

        {viewImageURL && (
          <ViewImage url={getImageUrl(viewImageURL)} close={() => setViewImageURL("")} />
        )}

        {openAddField && (
          <AddFieldComponent
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            submit={handleAddField}
            close={() => setOpenAddField(false)}
          />
        )}
        {viewVideoURL && (
          <ViewVideo url={getImageUrl(viewVideoURL)} close={() => setViewVideoURL("")} />
        )}
      </div>
    </section>
  )
}

export default EditProductAdmin
