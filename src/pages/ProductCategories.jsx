import { Link } from "react-router-dom"
import { FaChevronRight } from "react-icons/fa6"
import { useSelector } from "react-redux"
import ProductLoading from "../components/ProductLoading"
import { getImageUrl } from "../utils/getImageUrl"

const ProductCategories = () => {
  const categories = useSelector(state => state.product.allCategory)
  const loading = useSelector(state => state.product.loadingCategory)

  return (
    <section className="min-h-screen bg-[#fffdfb]">
      <div className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/" className="hover:text-orange-600">Home</Link>
          <FaChevronRight className="h-2.5 w-2.5 text-slate-300" />
          <span className="text-slate-800">Categories</span>
        </nav>

        <div className="mb-6">
          <p className="mb-1 text-xs font-extrabold uppercase tracking-[0.22em] text-orange-600">Shop by category</p>
          <h1 className="font-heading text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">All Categories</h1>
          <p className="mt-2 text-sm text-slate-500">Choose a category to explore its products.</p>
        </div>

        {loading && categories.length === 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {new Array(10).fill(null).map((_, index) => (
              <ProductLoading key={`category-loading-${index}`} />
            ))}
          </div>
        ) : categories.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {categories.map(category => (
              <Link
                key={category._id}
                to={`/products?category=${encodeURIComponent(category._id)}`}
                className="group overflow-hidden rounded-2xl border border-orange-100 bg-white transition hover:-translate-y-1 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/10"
              >
                <div className="aspect-[1.35/1] overflow-hidden bg-orange-50/50">
                  <img
                    src={getImageUrl(category.image)}
                    alt={category.name}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex items-center justify-between gap-2 p-3 sm:p-4">
                  <h2 className="line-clamp-1 font-heading text-sm font-bold text-slate-900 transition group-hover:text-orange-600 sm:text-base">
                    {category.name}
                  </h2>
                  <FaChevronRight className="h-3 w-3 shrink-0 text-orange-500 transition group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-orange-200 bg-white py-16 text-center">
            <h2 className="font-heading text-xl font-bold text-slate-900">No categories available</h2>
            <p className="mt-2 text-sm text-slate-500">Please check back later.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default ProductCategories
