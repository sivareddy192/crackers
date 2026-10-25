import { useCallback, useEffect, useMemo, useState } from "react"
import { useSelector } from "react-redux"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { FaChevronRight, FaFire, FaRotateLeft } from "react-icons/fa6"
import { IoSearch } from "react-icons/io5"
import ProductBox from "../components/ProductBox"
import ProductLoading from "../components/ProductLoading"
import SummaryApi from "../common/SummaryApi"
import Axios from "../utils/Axios"
import AxiosToastError from "../utils/AxiosToastError"

const PAGE_SIZE = 12

const ProductCatalog = () => {
  const categories = useSelector(state => state.product.allCategory)
  const location = useLocation()
  const navigate = useNavigate()
  const categoryFromUrl = useMemo(
    () => new URLSearchParams(location.search).getAll("category"),
    [location.search]
  )
  const [products, setProducts] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPage, setTotalPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState({
    categoryIds: categoryFromUrl,
    minPrice: "",
    maxPrice: "",
    sort: "featured",
    offersOnly: false
  })
  const [priceDraft, setPriceDraft] = useState({ min: "", max: "" })

  const fetchProducts = useCallback(async (signal) => {
    try {
      setLoading(true)
      const response = await Axios({
        ...SummaryApi.searchProduct,
        signal,
        data: {
          search,
          page,
          limit: PAGE_SIZE,
          categoryIds: filters.categoryIds,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          sort: filters.sort,
          offersOnly: filters.offersOnly
        }
      })
      const responseData = response.data

      if (!responseData.success) {
        throw new Error(responseData.message || "Could not load products")
      }

      setProducts(previous => page === 1 ? responseData.data : [...previous, ...responseData.data])
      setTotalCount(responseData.totalCount)
      setTotalPage(responseData.totalPage)
    } catch (error) {
      if (error.code !== "ERR_CANCELED") {
        AxiosToastError(error)
      }
    } finally {
      if (!signal?.aborted) setLoading(false)
    }
  }, [filters, page, search])

  useEffect(() => {
    const controller = new AbortController()
    fetchProducts(controller.signal)
    return () => controller.abort()
  }, [fetchProducts])

  useEffect(() => {
    setProducts([])
    setPage(1)
    setFilters(previous => (
      previous.categoryIds.length === categoryFromUrl.length &&
      previous.categoryIds.every((id, index) => id === categoryFromUrl[index])
        ? previous
        : { ...previous, categoryIds: categoryFromUrl }
    ))
  }, [categoryFromUrl])

  const updateFilters = (updates) => {
    setProducts([])
    setPage(1)
    setFilters(previous => ({ ...previous, ...updates }))
  }

  const toggleCategory = (categoryId) => {
    const nextCategoryIds = filters.categoryIds.includes(categoryId)
      ? filters.categoryIds.filter(id => id !== categoryId)
      : [...filters.categoryIds, categoryId]
    const searchParams = new URLSearchParams()
    nextCategoryIds.forEach(id => searchParams.append("category", id))
    navigate(nextCategoryIds.length ? `/products?${searchParams.toString()}` : "/products", { replace: true })
    updateFilters({ categoryIds: nextCategoryIds })
  }

  const applySearch = (event) => {
    event.preventDefault()
    setProducts([])
    setPage(1)
    setSearch(searchInput.trim())
  }

  const applyPriceRange = (event) => {
    event.preventDefault()
    const minPrice = priceDraft.min === "" ? "" : Math.max(0, Number(priceDraft.min))
    const maxPrice = priceDraft.max === "" ? "" : Math.max(0, Number(priceDraft.max))
    updateFilters({ minPrice, maxPrice })
  }

  const clearFilters = () => {
    navigate("/products", { replace: true })
    setProducts([])
    setPage(1)
    setSearch("")
    setSearchInput("")
    setPriceDraft({ min: "", max: "" })
    setFilters({
      categoryIds: [],
      minPrice: "",
      maxPrice: "",
      sort: "featured",
      offersOnly: false
    })
  }

  const selectedCategoryNames = categories
    .filter(category => filters.categoryIds.includes(category._id))
    .map(category => category.name)
  const selectedCategoryName = selectedCategoryNames.length
    ? selectedCategoryNames.join(", ")
    : ""
  const shownProducts = Math.min(products.length, totalCount)

  const categoryFilters = (
    <div className="space-y-3">
      {categories.map(category => (
        <label
          key={category._id}
          className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-slate-700 hover:text-orange-600"
        >
          <input
            type="checkbox"
            checked={filters.categoryIds.includes(category._id)}
            onChange={() => toggleCategory(category._id)}
            className="h-4 w-4 accent-orange-500"
          />
          <span className="min-w-0 flex-1 truncate">{category.name}</span>
        </label>
      ))}
      {categories.length === 0 && (
        <p className="text-sm text-slate-400">Categories are loading...</p>
      )}
    </div>
  )

  return (
    <section className="min-h-screen bg-[#fffdfb]">
      <div className="mx-auto max-w-[1440px] px-3 py-5 sm:px-5 lg:px-8 lg:py-7">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-xs font-semibold text-slate-500">
          <Link to="/" className="hover:text-orange-600">Home</Link>
          <FaChevronRight className="h-2.5 w-2.5 text-slate-300" />
        {selectedCategoryName ? (
          <>
            <Link to="/categories" className="hover:text-orange-600">Categories</Link>
            <FaChevronRight className="h-2.5 w-2.5 text-slate-300" />
            <span className="text-slate-800">{selectedCategoryName}</span>
          </>
        ) : (
          <span className="text-slate-800">Products</span>
        )}
        </nav>

        <div className="grid gap-5 lg:grid-cols-[235px_minmax(0,1fr)] lg:gap-5">
          <aside className="hidden lg:block">
            <div className="mb-5">
              <h1 className="font-heading text-3xl font-black tracking-tight text-slate-950">{selectedCategoryName || "All Products"}</h1>
              <p className="mt-1 text-sm text-slate-500">Discover our premium collection</p>
            </div>
            <div className="sticky top-24 rounded-2xl border border-orange-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-heading text-lg font-bold text-slate-900">Filters</h2>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 text-xs font-bold text-orange-600 hover:text-orange-700"
                >
                  <FaRotateLeft className="h-3 w-3" /> Clear
                </button>
              </div>
              <div className="border-b border-slate-100 pb-5">
                <h3 className="mb-3 font-heading text-base font-bold text-slate-900">Categories</h3>
                {categoryFilters}
              </div>
              <form onSubmit={applyPriceRange} className="border-b border-slate-100 py-5">
                <h3 className="mb-3 font-heading text-base font-bold text-slate-900">Price Range</h3>
                <div className="mb-3 grid grid-cols-2 gap-2">
                  <label className="text-[11px] font-semibold text-slate-500">
                    Min (₹)
                    <input
                      type="number"
                      min="0"
                      value={priceDraft.min}
                      onChange={event => setPriceDraft(previous => ({ ...previous, min: event.target.value }))}
                      placeholder="0"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-800 outline-none focus:border-orange-400"
                    />
                  </label>
                  <label className="text-[11px] font-semibold text-slate-500">
                    Max (₹)
                    <input
                      type="number"
                      min="0"
                      value={priceDraft.max}
                      onChange={event => setPriceDraft(previous => ({ ...previous, max: event.target.value }))}
                      placeholder="Any"
                      className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-slate-800 outline-none focus:border-orange-400"
                    />
                  </label>
                </div>
                <button type="submit" className="w-full rounded-lg bg-orange-500 py-2 text-xs font-extrabold text-white transition hover:bg-orange-600">
                  Apply Price
                </button>
              </form>
              <div className="pt-5">
                <label htmlFor="catalog-sort" className="mb-2 block font-heading text-base font-bold text-slate-900">Sort By</label>
                <select
                  id="catalog-sort"
                  value={filters.sort}
                  onChange={event => updateFilters({ sort: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none focus:border-orange-400"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">New Arrivals</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </aside>

          <main className="min-w-0">
            <div className="mb-3 flex items-end justify-between gap-3 lg:hidden">
              <div>
                <h1 className="font-heading text-3xl font-black tracking-tight text-slate-950">{selectedCategoryName || "All Products"}</h1>
                <p className="mt-1 text-sm text-slate-500">Discover our premium collection</p>
              </div>
              <p className="pb-1 text-right text-xs font-bold text-slate-600">
                Showing {shownProducts === 0 ? 0 : 1}–{shownProducts} of {totalCount} products
              </p>
            </div>

            <div className="mb-3 flex min-w-0 items-center gap-3">
              <form onSubmit={applySearch} className="flex min-w-0 flex-1 gap-2">
                <div className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-orange-400">
                  <IoSearch className="h-5 w-5 shrink-0 text-slate-500" />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={event => setSearchInput(event.target.value)}
                    placeholder="Search products..."
                    className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </div>
                <button type="submit" className="rounded-xl bg-orange-500 px-4 text-sm font-extrabold text-white hover:bg-orange-600">
                  Search
                </button>
              </form>
              <p className="hidden shrink-0 text-sm font-bold text-slate-600 lg:block">
                Showing {shownProducts === 0 ? 0 : 1}–{shownProducts} of {totalCount} products
              </p>
              <button
                type="button"
                onClick={() => setFiltersOpen(open => !open)}
                aria-expanded={filtersOpen}
                className="flex h-11 shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 lg:hidden"
              >
                Filters <FaFire className="h-3.5 w-3.5 text-orange-500" />
              </button>
            </div>

            {filtersOpen && (
              <div className="mb-4 space-y-5 rounded-2xl border border-orange-200 bg-white p-4 lg:hidden">
                <div>
                  <h2 className="mb-3 font-heading font-bold text-slate-900">Categories</h2>
                  <div className="grid grid-cols-2 gap-3">{categoryFilters}</div>
                </div>
                <form onSubmit={applyPriceRange}>
                  <h2 className="mb-2 font-heading font-bold text-slate-900">Price Range</h2>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={priceDraft.min}
                      onChange={event => setPriceDraft(previous => ({ ...previous, min: event.target.value }))}
                      placeholder="Min price"
                      className="w-1/2 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                    />
                    <input
                      type="number"
                      min="0"
                      value={priceDraft.max}
                      onChange={event => setPriceDraft(previous => ({ ...previous, max: event.target.value }))}
                      placeholder="Max price"
                      className="w-1/2 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-orange-400"
                    />
                  </div>
                  <button type="submit" className="mt-2 rounded-lg bg-orange-500 px-4 py-2 text-xs font-bold text-white">Apply Price</button>
                </form>
                <div className="flex items-center gap-3">
                  <label htmlFor="catalog-sort-mobile" className="text-sm font-bold text-slate-700">Sort By</label>
                  <select
                    id="catalog-sort-mobile"
                    value={filters.sort}
                    onChange={event => updateFilters({ sort: event.target.value })}
                    className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none"
                  >
                    <option value="featured">Featured</option>
                    <option value="newest">New Arrivals</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                  <button type="button" onClick={clearFilters} className="text-xs font-bold text-orange-600">Clear</button>
                </div>
              </div>
            )}

            <div className="mb-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                onClick={() => {
                  navigate("/products", { replace: true })
                  updateFilters({ categoryIds: [], offersOnly: false, sort: "featured" })
                }}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition ${filters.categoryIds.length === 0 && !filters.offersOnly && filters.sort === "featured" ? "bg-orange-500 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-orange-300"}`}
              >
                All Products
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate("/products", { replace: true })
                  updateFilters({ categoryIds: [], offersOnly: false, sort: "newest" })
                }}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition ${filters.sort === "newest" ? "bg-orange-500 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-orange-300"}`}
              >
                New Arrivals
              </button>
              <button
                type="button"
                onClick={() => {
                  navigate("/products", { replace: true })
                  updateFilters({ categoryIds: [], offersOnly: true, sort: "offers" })
                }}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-extrabold transition ${filters.offersOnly ? "bg-orange-500 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-orange-300"}`}
              >
                Offers
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 sm:gap-4">
              {loading && products.length === 0 && new Array(PAGE_SIZE).fill(null).map((_, index) => (
                <ProductLoading key={`catalog-loading-${index}`} />
              ))}
              {products.map(product => (
                <ProductBox key={product._id} data={product} catalog />
              ))}
            </div>

            {!loading && products.length === 0 && (
              <div className="rounded-2xl border border-dashed border-orange-200 bg-white py-16 text-center">
                <h2 className="font-heading text-xl font-bold text-slate-900">No products found</h2>
                <p className="mt-2 text-sm text-slate-500">Try changing your search or filters.</p>
                <button type="button" onClick={clearFilters} className="mt-4 text-sm font-extrabold text-orange-600 hover:text-orange-700">
                  Clear filters
                </button>
              </div>
            )}

            {page < totalPage && (
              <div className="flex justify-center py-8">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setPage(current => current + 1)}
                  className="rounded-xl border border-orange-300 bg-white px-8 py-3 text-sm font-extrabold text-orange-600 transition hover:bg-orange-50 disabled:cursor-wait disabled:opacity-50"
                >
                  {loading ? "Loading..." : "Load More Products"}
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  )
}

export default ProductCatalog
