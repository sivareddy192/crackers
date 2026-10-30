import React, { useState, useEffect } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import uploadImage from "../utils/UploadImage";
import ButtonLoading from "../components/ButtonLoading";
import ViewImage from "../components/ViewImage";
import { MdDelete } from "react-icons/md";
import { useSelector, useDispatch } from "react-redux";
import { IoClose } from "react-icons/io5";
import AddFieldComponent from "../components/AddFieldComponent";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import AxiosToastError from "../utils/AxiosToastError";
import successAlert from "../utils/SuccessAlert";
import { setAllCategory, setAllSubCategory } from "../store/productSlice";
import uploadVideo from "../utils/UploadVideo";
import ViewVideo from "../components/ViewVideo";
import { getImageUrl } from "../utils/getImageUrl";
import { FaVideo } from "react-icons/fa";
import { getDiscountPercent } from "../utils/PriceWithDiscount";

const UploadProduct = () => {
  const dispatch = useDispatch();
  const allCategory = useSelector((state) => state.product.allCategory);
  const allSubCategory = useSelector((state) => state.product.allSubCategory);

  const [data, setData] = useState({
    name: "",
    image: [],
    category: [],
    subCategory: [],
    description: "",
    more_details: {},
    variants: [
      {
        unit: "",
        mrp: "",
        price: "",
        discount: 0,
        stock: ""
      }
    ],
    relatedProducts: [],
    video: ""
  });


  const [imageLoading, setImageLoading] = useState(false);
  const [ViewImageURL, setViewImageURL] = useState("");
  const [selectCategory, setSelectCategory] = useState("");
  const [selectSubCategory, setSelectSubCategory] = useState("");
  const [openAddField, setOpenAddField] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [relatedSearch, setRelatedSearch] = useState("");
  const [relatedResults, setRelatedResults] = useState([]);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [viewVideoURL, setViewVideoURL] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (!allCategory || allCategory.length === 0) {
          const response = await Axios({ ...SummaryApi.getCategory });
          const { data: res } = response;
          if (res.success) {
            dispatch(setAllCategory(res.data));
          }
        }
      } catch (error) {
        AxiosToastError(error);
      }
    };

    const fetchSubCategories = async () => {
      try {
        if (!allSubCategory || allSubCategory.length === 0) {
          const response = await Axios({ ...SummaryApi.getSubCategory });
          const { data: res } = response;
          if (res.success) {
            dispatch(setAllSubCategory(res.data));
          }
        }
      } catch (error) {
        AxiosToastError(error);
      }
    };

    fetchCategories();
    fetchSubCategories();
  }, [dispatch, allCategory, allSubCategory]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageLoading(true);
    try {
      const response = await uploadImage(file);
      const { data: ImageResponse } = response;
      const imageUrl = ImageResponse.data;

      setData((prev) => ({
        ...prev,
        image: [...prev.image, imageUrl],
      }));
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setImageLoading(false);
    }
  };

  const handleDeleteImage = (index) => {
    const updated = [...data.image];
    updated.splice(index, 1);
    setData((prev) => ({
      ...prev,
      image: updated,
    }));
  };

  const handleUploadVideo = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setVideoLoading(true);
    try {
      const response = await uploadVideo(file);
      const { data: videoResponse } = response;
      const videoUrl = videoResponse.data;

      setData((prev) => ({
        ...prev,
        video: videoUrl,
      }));
    } catch (error) {
      AxiosToastError(error);
    } finally {
      setVideoLoading(false);
    }
  };

  const handleDeleteVideo = () => {
    setData((prev) => ({
      ...prev,
      video: "",
    }));
  };

  const handleRemoveCategory = (index) => {
    const updated = [...data.category];
    updated.splice(index, 1);
    setData((prev) => ({
      ...prev,
      category: updated,
    }));
  };

  const handleRemoveSubCategory = (index) => {
    const updated = [...data.subCategory];
    updated.splice(index, 1);
    setData((prev) => ({
      ...prev,
      subCategory: updated,
    }));
  };

  const handleAddField = () => {
    if (!fieldName.trim()) return;
    setData((prev) => ({
      ...prev,
      more_details: {
        ...prev.more_details,
        [fieldName]: "",
      },
    }));
    setFieldName("");
    setOpenAddField(false);
  };

  const handleSearchRelated = async (e) => {
    const value = e.target.value;
    setRelatedSearch(value);
    if (value.length < 2) {
      setRelatedResults([]);
      return;
    }

    try {
      setRelatedLoading(true);
      const response = await Axios({
        ...SummaryApi.searchProduct,
        data: { search: value, limit: 5 }
      });
      if (response.data.success) {
        setRelatedResults(response.data.data);
      }
    } catch (error) {
      console.error("Related search failed", error);
    } finally {
      setRelatedLoading(false);
    }
  };

  const handleAddRelated = (product) => {
    if (data.relatedProducts.some(p => p._id === product._id)) {
      toast.error("Product already added as related");
      return;
    }
    setData(prev => ({
      ...prev,
      relatedProducts: [...prev.relatedProducts, product]
    }));
    setRelatedSearch("");
    setRelatedResults([]);
  };

  const handleRemoveRelated = (index) => {
    const updated = [...data.relatedProducts];
    updated.splice(index, 1);
    setData(prev => ({
      ...prev,
      relatedProducts: updated
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...data,
        variants: data.variants.map(variant => ({
          ...variant,
          discount: getDiscountPercent(variant.mrp, variant.price)
        })),
        category: data.category.map((cat) => cat._id),
        subCategory: data.subCategory.map((sub) => sub._id),
        relatedProducts: data.relatedProducts.map((p) => p._id),
        unit: data.variants[0]?.unit,
        price: data.variants[0]?.price,
        mrp: data.variants[0]?.mrp,
        discount: getDiscountPercent(data.variants[0]?.mrp, data.variants[0]?.price),
        stock: data.variants[0]?.stock
      };

      const response = await Axios({
        ...SummaryApi.createProduct,
        data: payload, 
      });

      const { data: responseData } = response;
      if (responseData.success) {
        successAlert(responseData.message);
        setData({
          name: "",
          image: [],
          category: [],
          subCategory: [],
          description: "",
          more_details: {},
          variants: [
            {
              unit: "",
              mrp: "",
              price: "",
              discount: 0,
              stock: ""
            }
          ],
          relatedProducts: [],
          video: ""
        });

      }
    } catch (error) {
      AxiosToastError(error);
    }
  };

  return (
    <section>
      <div className="p-2 bg-white shadow-md flex items-center justify-between">
        <h2 className="font-semibold">Upload Product</h2>
      </div>

      <div className="grid p-3">
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-1">
            <label htmlFor="name" className="font-medium">
              Name
            </label>
            <input
              id="name"
              type="text"
              placeholder="Enter product name"
              name="name"
              value={data.name}
              onChange={handleChange}
              required
              className="bg-blue-50 p-2 outline-none border focus-within:border-green-200 rounded"
            />
          </div>

          <div className="grid gap-1">
            <label htmlFor="description" className="font-medium">
              Description
            </label>
            <textarea
              id="description"
              placeholder="Enter product description"
              name="description"
              value={data.description}
              onChange={handleChange}
              required
              rows={3}
              className="bg-blue-50 p-2 outline-none border focus-within:border-green-200 rounded resize-none"
            />
          </div>

          <div>
            <p className="font-medium">Image</p>
            <label
              htmlFor="productImage"
              className="bg-blue-50 h-24 border rounded flex justify-center items-center cursor-pointer"
            >
              <div className="text-center flex justify-center items-center flex-col">
                {imageLoading ? (
                  <ButtonLoading />
                ) : (
                  <>
                    <FaCloudUploadAlt size={35} />
                    <p>Upload Image</p>
                  </>
                )}
              </div>
              <input
                type="file"
                id="productImage"
                className="hidden"
                accept="image/*"
                onChange={handleUploadImage}
              />
            </label>

            <div className="flex flex-wrap gap-4 mt-2">
              {data.image.map((img, index) => (
                <div
                  key={img + index}
                  className="h-20 w-20 bg-blue-50 border relative group"
                >
                  <img
                    src={getImageUrl(img)}
                    alt={img}
                    className="w-full h-full object-scale-down cursor-pointer"
                    onClick={() => setViewImageURL(img)}
                  />
                  <div
                    onClick={() => handleDeleteImage(index)}
                    className="absolute bottom-0 right-0 p-1 bg-red-600 rounded text-white hidden group-hover:block cursor-pointer"
                  >
                    <MdDelete />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-1">
            <p className="font-medium">Product Video</p>
            {!data.video ? (
              <label
                htmlFor="productVideo"
                className="bg-blue-50 h-24 border rounded flex justify-center items-center cursor-pointer hover:bg-blue-100 transition-all border-dashed border-blue-300"
              >
                <div className="text-center flex justify-center items-center flex-col">
                  {videoLoading ? (
                    <ButtonLoading />
                  ) : (
                    <>
                      <FaVideo size={35} className="text-blue-500" />
                      <p className="text-sm font-semibold mt-1">Upload Product Video</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  id="productVideo"
                  className="hidden"
                  accept="video/*"
                  onChange={handleUploadVideo}
                />
              </label>
            ) : (
              <div className="relative group w-full aspect-video max-w-sm bg-black rounded-xl overflow-hidden border shadow-lg">
                <video src={getImageUrl(data.video)} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4">
                  <button
                    type="button"
                    onClick={() => setViewVideoURL(data.video)}
                    className="p-2 bg-white text-black rounded-full hover:scale-110 transition-all"
                  >
                    Preview
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteVideo}
                    className="p-2 bg-red-600 text-white rounded-full hover:scale-110 transition-all"
                  >
                    <MdDelete size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-1">
            <label className="font-medium">Category</label>
            <select
              className="bg-blue-50 border w-full p-2 rounded"
              value={selectCategory}
              onChange={(e) => {
                const value = e.target.value;
                const category = allCategory.find((el) => el._id === value);
                if (
                  category &&
                  !data.category.some((el) => el._id === category._id)
                ) {
                  setData((prev) => ({
                    ...prev,
                    category: [...prev.category, category],
                  }));
                }
                setSelectCategory("");
              }}
            >
              <option value="">Select Category</option>
              {allCategory.map((c) => (
                <option value={c._id} key={c._id}>
                  {c.name}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-3">
              {data.category.map((c, index) => (
                <div
                  key={c._id + index}
                  className="text-sm flex items-center gap-1 bg-blue-50 mt-2 p-1 rounded"
                >
                  <span>{c.name}</span>
                  <IoClose
                    size={20}
                    className="hover:text-red-500 cursor-pointer"
                    onClick={() => handleRemoveCategory(index)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-1">
            <label className="font-medium">Sub Category</label>
            <select
              className="bg-blue-50 border w-full p-2 rounded"
              value={selectSubCategory}
              onChange={(e) => {
                const value = e.target.value;
                const subCategory = allSubCategory.find(
                  (el) => el._id === value
                );
                if (
                  subCategory &&
                  !data.subCategory.some((el) => el._id === subCategory._id)
                ) {
                  setData((prev) => ({
                    ...prev,
                    subCategory: [...prev.subCategory, subCategory],
                  }));
                }
                setSelectSubCategory("");
              }}
            >
              <option value="">Select Sub Category</option>
              {allSubCategory.map((sc) => (
                <option value={sc._id} key={sc._id}>
                  {sc.name}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-3">
              {data.subCategory.map((c, index) => (
                <div
                  key={c._id + index}
                  className="text-sm flex items-center gap-1 bg-blue-50 mt-2 p-1 rounded"
                >
                  <span>{c.name}</span>
                  <IoClose
                    size={20}
                    className="hover:text-red-500 cursor-pointer"
                    onClick={() => handleRemoveSubCategory(index)}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 border p-4 rounded-xl bg-gray-50/50 border-gray-100">
            <div className="flex items-center justify-between">
              <label className="font-bold text-gray-800 uppercase text-xs tracking-widest">Product Units / Variants</label>
              <button 
                type="button"
                onClick={() => setData(prev => ({ ...prev, variants: [...prev.variants, { unit: "", mrp: "", price: "", discount: 0, stock: "" }] }))}
                className="text-[10px] bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-black uppercase shadow-sm active:scale-95 transition-all"
              >
                + Add Unit
              </button>
            </div>

            <div className="space-y-4">
              {data.variants.map((variant, index) => (
                <div key={index} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm relative group">
                  {data.variants.length > 1 && (
                    <button 
                      type="button"
                      onClick={() => {
                        const updated = [...data.variants];
                        updated.splice(index, 1);
                        setData(prev => ({ ...prev, variants: updated }));
                      }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs shadow-md opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                      <IoClose />
                    </button>
                  )}
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="grid gap-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Unit Name</label>
                      <input 
                        type="text" placeholder="750 ml" value={variant.unit}
                        onChange={(e) => {
                          const updated = [...data.variants];
                          updated[index].unit = e.target.value;
                          setData(prev => ({ ...prev, variants: updated }));
                        }}
                        required className="bg-gray-50 border border-gray-100 p-2 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase">MRP (₹)</label>
                      <input 
                        type="number" placeholder="40" value={variant.mrp}
                        onChange={(e) => {
                          const updated = [...data.variants];
                          updated[index].mrp = e.target.value;
                          setData(prev => ({ ...prev, variants: updated }));
                        }}
                        required className="bg-gray-50 border border-gray-100 p-2 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Price (₹)</label>
                      <input 
                        type="number" placeholder="35" value={variant.price}
                        onChange={(e) => {
                          const updated = [...data.variants];
                          updated[index].price = e.target.value;
                          setData(prev => ({ ...prev, variants: updated }));
                        }}
                        required className="bg-gray-50 border border-gray-100 p-2 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Disc (%)</label>
                      <input 
                        type="number" value={getDiscountPercent(variant.mrp, variant.price)} readOnly
                        aria-label="Calculated discount percentage"
                        className="bg-gray-100 border border-gray-100 p-2 rounded-xl text-xs font-bold text-gray-500 outline-none"
                      />
                    </div>
                    <div className="grid gap-1">
                      <label className="text-[9px] font-black text-gray-400 uppercase">Stock</label>
                      <input 
                        type="number" placeholder="100" value={variant.stock}
                        onChange={(e) => {
                          const updated = [...data.variants];
                          updated[index].stock = e.target.value;
                          setData(prev => ({ ...prev, variants: updated }));
                        }}
                        required className="bg-gray-50 border border-gray-100 p-2 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-3 border p-4 rounded-xl bg-gray-50/50 border-gray-100">
            <label className="font-bold text-gray-800 uppercase text-xs tracking-widest">Related Products</label>
            <div className="relative">
              <input 
                type="text"
                placeholder="Search products to relate..."
                value={relatedSearch}
                onChange={handleSearchRelated}
                className="bg-white border border-gray-100 p-3 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-green-500"
              />
              {relatedLoading && (
                <div className="absolute right-3 top-3">
                  <ButtonLoading />
                </div>
              )}
              {relatedResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-100 shadow-2xl rounded-xl mt-2 z-50 overflow-hidden">
                  {relatedResults.map(product => (
                    <div 
                      key={product._id}
                      onClick={() => handleAddRelated(product)}
                      className="p-3 hover:bg-green-50 cursor-pointer flex items-center gap-3 border-b border-gray-50 last:border-0"
                    >
                      <img src={getImageUrl(product.image[0])} className="w-10 h-10 object-scale-down bg-gray-50 rounded-lg" alt="" />
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-800">{product.name}</span>
                        <span className="text-[10px] text-gray-400">{product.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-3 mt-2">
              {data.relatedProducts.map((product, index) => (
                <div 
                  key={product._id}
                  className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-2 rounded-xl text-xs font-bold border border-green-100"
                >
                  <img src={getImageUrl(product.image[0])} className="w-6 h-6 object-scale-down mix-blend-multiply" alt="" />
                  <span>{product.name}</span>
                  <IoClose 
                    className="cursor-pointer hover:text-red-500" 
                    size={16} 
                    onClick={() => handleRemoveRelated(index)}
                  />
                </div>
              ))}
            </div>
          </div>


          {Object.keys(data.more_details).map((k, index) => (
            <div className="grid gap-1.5 bg-slate-50/70 p-3 rounded-lg border border-slate-200" key={index}>
              <div className="flex items-center justify-between">
                <label htmlFor={k} className="font-semibold text-slate-800 text-sm">
                  {k}
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...data.more_details };
                    delete next[k];
                    setData((prev) => ({ ...prev, more_details: next }));
                  }}
                  className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <IoClose size={16} /> Remove
                </button>
              </div>
              <textarea
                id={k}
                rows={4}
                placeholder={`Enter ${k} (e.g. 1) Product Name: ... 2) Quantity: ... or each point on a new line)`}
                value={data.more_details[k]}
                onChange={(e) => {
                  const value = e.target.value;
                  setData((prev) => ({
                    ...prev,
                    more_details: { ...prev.more_details, [k]: value },
                  }));
                }}
                required
                className="bg-white p-2.5 outline-none border focus-within:border-green-300 rounded resize-y text-sm"
              />
              <p className="text-[11px] text-slate-500">
                Tip: Enter each specification on a new line or as numbered points (e.g. 1) ..., 2) ...)
              </p>
            </div>
          ))}

          <div
            onClick={() => setOpenAddField(true)}
            className="hover:bg-green-400 bg-white py-1 px-3 w-32 text-center hover:text-white font-semibold border border-green-300  cursor-pointer rounded"
          >
            Add Fields
          </div>

          <button className="bg-green-100 hover:text-white hover:bg-green-400 py-2 rounded font-semibold">
            Submit
          </button>
        </form>
      </div>

      {ViewImageURL && (
        <ViewImage url={getImageUrl(ViewImageURL)} close={() => setViewImageURL("")} />
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
    </section>
  );
};

export default UploadProduct;
