import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import {
    FaArrowRight, FaBoxOpen, FaCheckCircle, FaClock, FaImage,
    FaPlus, FaShoppingCart, FaSyncAlt, FaTimesCircle
} from 'react-icons/fa'
import { getImageUrl } from '../utils/getImageUrl'

const formatINR = (num) =>
    new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(Number(num) || 0)

const StatCard = ({ icon, label, value, description, theme }) => (
    <article className='rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5'>
        <div className='flex items-start justify-between gap-3'>
            <div className='min-w-0'>
                <p className='text-xs font-bold text-slate-500'>{label}</p>
                <p className='mt-2 text-2xl font-black tracking-tight text-slate-950'>{value}</p>
                <p className='mt-1 text-xs font-medium text-slate-500'>{description}</p>
            </div>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-base ${theme}`}>
                {icon}
            </span>
        </div>
    </article>
)

const AdminDashboard = () => {
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [lastRefresh, setLastRefresh] = useState(null)

    const fetchStats = async () => {
        try {
            setLoading(true)
            setError('')
            const res = await Axios({ ...SummaryApi.admin.getStats })
            if (!res.data?.success) {
                throw new Error(res.data?.message || 'Unable to load dashboard data.')
            }
            setStats(res.data.data)
            setLastRefresh(new Date())
        } catch (err) {
            console.error('Stats fetch error:', err)
            setError(err.response?.data?.message || err.message || 'Unable to load dashboard data.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
        const interval = setInterval(fetchStats, 60000)
        return () => clearInterval(interval)
    }, [])

    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const chartData = Array.from({ length: 7 }, (_, index) => {
        const daysAgo = 6 - index
        const date = new Date()
        date.setDate(date.getDate() - daysAgo)
        const revenueEntry = stats?.dailyRevenue?.find(entry =>
            entry._id.day === date.getDate() &&
            entry._id.month === date.getMonth() + 1 &&
            entry._id.year === date.getFullYear()
        )
        return {
            label: daysAgo === 0 ? 'Today' : days[date.getDay()],
            revenue: revenueEntry?.revenue || 0,
            orders: revenueEntry?.orders || 0
        }
    })
    const maxRevenue = Math.max(...chartData.map(day => day.revenue), 1)

    if (loading && !stats) {
        return (
            <div className='mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8'>
                <div className='h-24 animate-pulse rounded-3xl bg-slate-200' />
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                    {new Array(3).fill(null).map((_, index) => (
                        <div key={index} className='h-36 animate-pulse rounded-2xl bg-slate-200' />
                    ))}
                </div>
                <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
                    {new Array(4).fill(null).map((_, index) => (
                        <div key={index} className='h-28 animate-pulse rounded-2xl bg-slate-200' />
                    ))}
                </div>
                <div className='h-80 animate-pulse rounded-3xl bg-slate-200' />
            </div>
        )
    }

    const totalOrders = stats?.totalOrders || 0
    const orderStatuses = [
        { label: 'Delivered', count: stats?.deliveredCount || 0, color: 'bg-emerald-500', icon: <FaCheckCircle className='text-emerald-600' /> },
        { label: 'In progress', count: stats?.pendingCount || 0, color: 'bg-amber-500', icon: <FaClock className='text-amber-600' /> },
        { label: 'Cancelled', count: stats?.cancelledCount || 0, color: 'bg-rose-500', icon: <FaTimesCircle className='text-rose-600' /> }
    ]

    return (
        <div className='mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:space-y-8 lg:p-8'>
            <header className='flex flex-col justify-between gap-4 rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-7'>
                <div>
                    <p className='text-xs font-bold uppercase tracking-[0.18em] text-orange-600'>Trace admin</p>
                    <h1 className='mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl'>Dashboard overview</h1>
                    <p className='mt-1 text-sm text-slate-500'>
                        {lastRefresh
                            ? `Updated today at ${lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                            : 'Monitor your store performance and orders'}
                    </p>
                </div>
                <button
                    type='button'
                    onClick={fetchStats}
                    disabled={loading}
                    className='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 shadow-xs transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-60'
                >
                    <FaSyncAlt className={loading ? 'animate-spin' : ''} />
                    Refresh data
                </button>
            </header>

            {error && (
                <div role='alert' className='flex flex-col gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between'>
                    <span>{error}</span>
                    <button type='button' onClick={fetchStats} className='shrink-0 font-bold underline underline-offset-2'>
                        Try again
                    </button>
                </div>
            )}

            <section aria-label='Revenue summary' className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                <article className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-orange-950 p-6 text-white shadow-lg shadow-slate-900/10 sm:col-span-1 sm:p-7'>
                    <div aria-hidden='true' className='absolute -right-10 -top-12 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl' />
                    <div className='relative'>
                        <p className='text-sm font-semibold text-slate-300'>Total revenue</p>
                        <p className='mt-3 text-3xl font-black tracking-tight sm:text-4xl'>{formatINR(stats?.totalRevenue)}</p>
                        <div className='mt-6 flex items-center gap-2 text-sm text-slate-300'>
                            <FaShoppingCart className='text-orange-300' />
                            <span><strong className='text-white'>{totalOrders}</strong> completed orders</span>
                        </div>
                    </div>
                </article>

                <article className='rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7'>
                    <p className='text-sm font-semibold text-slate-500'>Revenue today</p>
                    <p className='mt-3 text-3xl font-black tracking-tight text-slate-950'>{formatINR(stats?.todayRevenue)}</p>
                    <div className='mt-6 flex items-center gap-2 text-sm font-semibold text-emerald-700'>
                        <span className='flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50'><FaShoppingCart /></span>
                        {stats?.todayOrders || 0} orders today
                    </div>
                </article>

                <article className='rounded-3xl border border-slate-200/80 bg-white p-6 shadow-sm sm:p-7'>
                    <p className='text-sm font-semibold text-slate-500'>Revenue this month</p>
                    <p className='mt-3 text-3xl font-black tracking-tight text-slate-950'>{formatINR(stats?.monthRevenue)}</p>
                    <p className='mt-6 text-sm font-medium text-slate-500'>Current month performance</p>
                </article>
            </section>

            <section aria-label='Order metrics' className='grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4'>
                <StatCard icon={<FaShoppingCart />} label='Total orders' value={totalOrders} description='All non-cancelled orders' theme='bg-orange-50 text-orange-700' />
                <StatCard icon={<FaCheckCircle />} label='Delivered' value={stats?.deliveredCount || 0} description='Successfully completed' theme='bg-emerald-50 text-emerald-700' />
                <StatCard icon={<FaClock />} label='In progress' value={stats?.pendingCount || 0} description='Awaiting completion' theme='bg-amber-50 text-amber-700' />
                <StatCard icon={<FaTimesCircle />} label='Cancelled' value={stats?.cancelledCount || 0} description='Cancelled orders' theme='bg-rose-50 text-rose-700' />
            </section>

            <section className='rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7'>
                <div className='flex flex-wrap items-start justify-between gap-3'>
                    <div>
                        <h2 className='text-lg font-black tracking-tight text-slate-950'>Revenue performance</h2>
                        <p className='mt-1 text-sm text-slate-500'>Daily sales over the last seven days</p>
                    </div>
                    <span className='rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700'>Last 7 days</span>
                </div>
                <div className='mt-8 flex h-52 items-end justify-between gap-2 sm:gap-5'>
                    {chartData.map((day, index) => {
                        const barHeight = day.revenue > 0 ? Math.max((day.revenue / maxRevenue) * 144, 10) : 4
                        const isToday = index === chartData.length - 1
                        return (
                            <div key={`${day.label}-${index}`} className='flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-3' title={`${day.label}: ${formatINR(day.revenue)}, ${day.orders} orders`}>
                                <span className='hidden text-[10px] font-semibold text-slate-500 sm:block'>{day.revenue > 0 ? formatINR(day.revenue) : ''}</span>
                                <div className='flex h-36 w-full items-end justify-center rounded-xl bg-slate-50'>
                                    <div
                                        role='img'
                                        aria-label={`${day.label}: ${formatINR(day.revenue)} revenue from ${day.orders} orders`}
                                        className={`w-2/3 max-w-12 rounded-t-lg transition-[height] duration-500 ${isToday ? 'bg-orange-500' : 'bg-orange-200'}`}
                                        style={{ height: `${barHeight}px` }}
                                    />
                                </div>
                                <span className={`text-[11px] font-bold ${isToday ? 'text-orange-700' : 'text-slate-500'}`}>{day.label}</span>
                            </div>
                        )
                    })}
                </div>
            </section>

            <section className='grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6'>
                <article className='rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7'>
                    <div className='flex items-center justify-between gap-3'>
                        <div>
                            <h2 className='text-lg font-black tracking-tight text-slate-950'>Top products</h2>
                            <p className='mt-1 text-sm text-slate-500'>Your best sellers by units sold</p>
                        </div>
                        <FaBoxOpen className='text-xl text-orange-500' aria-hidden='true' />
                    </div>
                    {stats?.topProducts?.length ? (
                        <ol className='mt-5 divide-y divide-slate-100'>
                            {stats.topProducts.map((product, index) => (
                                <li key={product._id || product.name || index} className='flex items-center gap-3 py-3 first:pt-0 last:pb-0'>
                                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-black ${index === 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'}`}>
                                        {index + 1}
                                    </span>
                                    {product.image && (
                                        <img
                                            src={getImageUrl(product.image)}
                                            alt=''
                                            className='h-12 w-12 shrink-0 rounded-xl border border-slate-100 bg-slate-50 object-contain p-1'
                                        />
                                    )}
                                    <div className='min-w-0 flex-1'>
                                        <p className='truncate text-sm font-bold text-slate-800'>{product.name || 'Product'}</p>
                                        <p className='mt-1 text-xs text-slate-500'>{product.totalSold || 0} units sold</p>
                                    </div>
                                    <p className='shrink-0 text-right text-sm font-extrabold text-slate-900'>{formatINR(product.revenue)}</p>
                                </li>
                            ))}
                        </ol>
                    ) : (
                        <p className='mt-6 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500'>No product sales to show yet.</p>
                    )}
                </article>

                <article className='rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7'>
                    <div>
                        <h2 className='text-lg font-black tracking-tight text-slate-950'>Order status</h2>
                        <p className='mt-1 text-sm text-slate-500'>Current order distribution</p>
                    </div>
                    <div className='mt-6 space-y-5'>
                        {orderStatuses.map(status => {
                            const percentage = totalOrders ? Math.round((status.count / totalOrders) * 100) : 0
                            return (
                                <div key={status.label}>
                                    <div className='mb-2 flex items-center justify-between gap-3'>
                                        <span className='flex items-center gap-2 text-sm font-semibold text-slate-700'>
                                            {status.icon}{status.label}
                                        </span>
                                        <span className='text-sm font-bold text-slate-900'>{status.count} <span className='font-medium text-slate-400'>({percentage}%)</span></span>
                                    </div>
                                    <div className='h-2 overflow-hidden rounded-full bg-slate-100'>
                                        <div className={`h-full rounded-full transition-[width] duration-500 ${status.color}`} style={{ width: `${percentage}%` }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </article>
            </section>

            <section aria-label='Quick actions' className='rounded-3xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-7'>
                <div className='mb-4'>
                    <h2 className='text-lg font-black tracking-tight text-slate-950'>Quick actions</h2>
                    <p className='mt-1 text-sm text-slate-500'>Jump straight to common tasks</p>
                </div>
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
                    {[
                        { to: '/admin-portal/orders', icon: <FaShoppingCart />, label: 'Manage orders', detail: 'Review and update orders' },
                        { to: '/admin-portal/upload-product', icon: <FaPlus />, label: 'Add a product', detail: 'Update your catalog' },
                        { to: '/admin-portal/banners', icon: <FaImage />, label: 'Manage banners', detail: 'Refresh storefront promotions' }
                    ].map(action => (
                        <Link key={action.to} to={action.to} className='group flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-orange-200 hover:bg-orange-50/60'>
                            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700 transition group-hover:bg-orange-100'>
                                {action.icon}
                            </span>
                            <span className='min-w-0 flex-1'>
                                <span className='block text-sm font-bold text-slate-900'>{action.label}</span>
                                <span className='mt-0.5 block text-xs text-slate-500'>{action.detail}</span>
                            </span>
                            <FaArrowRight className='shrink-0 text-xs text-slate-400 transition group-hover:translate-x-1 group-hover:text-orange-600' aria-hidden='true' />
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    )
}

export default AdminDashboard
