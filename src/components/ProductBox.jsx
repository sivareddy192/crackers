import React, { useState } from 'react'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { Link } from 'react-router-dom'
import { valideURLConvert } from '../utils/valideURLConvert'
import { getDiscountPercent } from '../utils/PriceWithDiscount'
import { getImageUrl } from '../utils/getImageUrl'
import AddToCartButton from './AddToCartButton'
import { FaHeart, FaRegHeart } from 'react-icons/fa'

const ProductBox = ({ data, catalog = false }) => {
  const [isFavorite, setIsFavorite] = useState(false)

  const url = `/product/${valideURLConvert(data.name)}-${data._id}`

  const getBestAvailableVariant = (p) => {
    const base = { unit: p.unit, price: p.price, mrp: p.mrp, discount: p.discount, stock: p.stock };
    if (Number(base.stock) > 0) return base;
    const active = p.variants?.find(v => Number(v.stock) > 0);
    return active || base;
  };

  const [selectedVariant, setSelectedVariant] = useState(() => getBestAvailableVariant(data));

  React.useEffect(() => {
    const best = getBestAvailableVariant(data);
    setSelectedVariant(best);
  }, [data]);

  const activeProductData = {
    ...data,
    unit: selectedVariant.unit,
    price: selectedVariant.price,
    mrp: selectedVariant.mrp,
    discount: selectedVariant.discount,
    stock: selectedVariant.stock
  }

  const isOutOfStock = !(Number(selectedVariant.stock) > 0);
  const discountPercent = getDiscountPercent(selectedVariant.mrp, selectedVariant.price)

  const toggleFavorite = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsFavorite(!isFavorite)
  }

  const imageSrcSet = `${getImageUrl(data.image, { width: 200, quality: 75 })} 200w, ${getImageUrl(data.image, { width: 320, quality: 75 })} 320w`

  return (
    <div className={`fire-product-card group relative h-full ${catalog ? "w-full min-w-0" : "w-40 shrink-0 md:w-48 lg:w-56"}`}>
      <Link
        to={url}
        state={{ product: data }}
        onClick={() => {
          try {
            sessionStorage.setItem(`trace_p_${data._id}`, JSON.stringify(data));
          } catch (error) {
            console.error("Unable to cache the product before navigation.", error);
          }
        }}
        className={`fire-product-surface flex flex-col bg-white h-full transition-all duration-300 border border-slate-200/70 hover:border-orange-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-500/10 relative overflow-hidden ${catalog ? "rounded-xl p-2 sm:p-3" : "rounded-3xl p-3 lg:p-4"}`}
      >
        <div className={`fire-product-image relative ${catalog ? "aspect-[1.35/1] rounded-lg p-1.5 sm:p-2" : "aspect-square rounded-2xl p-3"} w-full overflow-hidden mb-3 bg-slate-50/70 flex items-center justify-center transition-colors border border-slate-100 group-hover:bg-slate-50`}>
          <img
            src={getImageUrl(data.image, { width: 320, quality: 75 })}
            srcSet={imageSrcSet}
            sizes='(max-width: 640px) 45vw, (max-width: 1024px) 30vw, 220px'
            alt={data.name}
            width="320"
            height="320"
            loading="lazy"
            decoding="async"
            className="relative z-10 w-full h-full object-contain transition-transform duration-500 group-hover:scale-108"
          />

          {discountPercent > 0 && (
            <div className="absolute top-2 left-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-[9px] font-black px-2 py-0.5 rounded-lg shadow-sm z-10 select-none pointer-events-none flex items-center gap-0.5 tracking-tight">
              <span>{discountPercent}%</span>
              <span className="text-[7px] uppercase font-extrabold opacity-90">OFF</span>
            </div>
          )}

          <button
            type="button"
            onClick={toggleFavorite}
            aria-label={isFavorite ? `Remove ${data.name} from favorites` : `Save ${data.name} to favorites`}
            className="absolute top-2 right-2 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md border border-slate-200/80 flex items-center justify-center shadow-xs hover:scale-110 active:scale-95 transition-all cursor-pointer"
          >
            {isFavorite ? (
              <FaHeart className="w-3.5 h-3.5 text-rose-500" aria-hidden="true" />
            ) : (
              <FaRegHeart className="w-3.5 h-3.5 text-slate-500 hover:text-slate-700" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="flex-1 flex flex-col">
          <h3 className={`${catalog ? "text-[11px] sm:text-xs lg:text-[13px] min-h-[1.8rem] lg:min-h-[2.1rem]" : "text-xs lg:text-[13px] min-h-[2rem] lg:min-h-[2.3rem]"} font-bold text-slate-800 line-clamp-2 leading-snug mb-2 tracking-tight group-hover:text-orange-600 transition-colors`}>
              {data.name}
          </h3>

          <div className="mt-auto pt-2 border-t border-slate-100 mb-2.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[15px] lg:text-[17px] font-black text-slate-900 tracking-tight">
                  {DisplayPriceInRupees(selectedVariant.price)}
                </p>
                {discountPercent > 0 && (
                  <div className="flex flex-col items-end leading-tight">
                    <p className="text-[10px] lg:text-[11px] text-slate-500 font-semibold line-through">
                      {DisplayPriceInRupees(selectedVariant.mrp)}
                    </p>
                    <span className="rounded-md bg-emerald-600 px-1.5 py-0.5 text-[8px] lg:text-[9px] text-white font-black">
                      {discountPercent}% OFF
                    </span>
                  </div>
                )}
              </div>

            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="w-full mt-1"
            >
              {!isOutOfStock ? (
                <AddToCartButton data={activeProductData} variant="home-outline" />
              ) : (
                <button
                  type="button"
                  disabled
                  className="w-full h-10 bg-slate-100 text-slate-400 font-extrabold rounded-xl text-xs flex items-center justify-center cursor-not-allowed select-none"
                >
                  Out of Stock
                </button>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default ProductBox
