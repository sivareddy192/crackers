import { BsShieldCheck } from 'react-icons/bs';
import { MdOutlineSupportAgent, MdOutlineVerified } from 'react-icons/md';
import { FaCreditCard, FaEnvelope, FaLocationDot, FaMoneyBillWave, FaPhone, FaTruckFast } from 'react-icons/fa6';
import { Link } from 'react-router-dom';
import logoAvif from "../assets/trace-logo.avif";
import logoPng from "../assets/trace-logo.png";

const Footer = () => {
  const benefits = [
    { icon: <MdOutlineVerified size={22} aria-hidden="true" />, title: 'Quality Products', detail: 'Carefully selected' },
    { icon: <BsShieldCheck size={22} aria-hidden="true" />, title: 'Secure Payments', detail: 'Online payment or cash on delivery' },
    { icon: <FaTruckFast size={22} aria-hidden="true" />, title: 'Safe Delivery', detail: 'Delivery options at checkout' },
    { icon: <MdOutlineSupportAgent size={22} aria-hidden="true" />, title: 'Customer Support', detail: 'Help with orders and products' }
  ]

  return (
    <footer className='mt-12 border-t-4 border-orange-500 bg-white text-slate-800'>
      <div className='border-b border-slate-200'>
        <div className='container mx-auto grid grid-cols-2 gap-4 px-4 py-6 md:grid-cols-4 md:gap-6'>
          {benefits.map(benefit => (
            <div key={benefit.title} className='flex items-center gap-3 border-slate-200 md:border-r md:px-2 last:border-r-0'>
              <div className='flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600'>
                {benefit.icon}
              </div>
              <div>
                <h3 className='text-sm font-black text-slate-900'>{benefit.title}</h3>
                <p className='mt-0.5 text-xs text-slate-600'>{benefit.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className='container mx-auto grid gap-8 px-4 py-9 sm:grid-cols-2 lg:grid-cols-5 lg:gap-7'>
        <div className='space-y-3 lg:border-r lg:border-slate-200 lg:pr-6'>
          <Link to='/' aria-label="Tracly Home" className='inline-block'>
            <picture>
              <source srcSet={logoAvif} type="image/avif" />
              <img
                src={logoPng}
                width='144'
                height='72'
                alt='Tracly Crackers'
                loading="lazy"
                decoding="async"
                className='w-36 h-auto'
              />
            </picture>
          </Link>
          <p className='text-xs font-bold text-orange-700'>Celebrate brighter. Celebrate responsibly.</p>
          <p className='text-sm leading-6 text-slate-700'>
            Tracly Crackers brings you fireworks and festive crackers for brighter, happier celebrations. Choose responsibly and follow every product safety instruction.
          </p>
        </div>

        <nav aria-label='Shop' className='lg:border-r lg:border-slate-200 lg:pr-6'>
          <h2 className='mb-4 text-base font-black text-slate-900'>Shop</h2>
          <ul className='space-y-2.5 text-sm'>
            {['Flower Pots', 'Sparklers', 'Fountains', 'Chakri', 'Rockets', 'Gift Packs'].map(category => (
              <li key={category}>
                <Link to={`/search?q=${encodeURIComponent(category)}`} className='text-slate-700 hover:text-orange-700'>{category}</Link>
              </li>
            ))}
            <li><Link to='/categories' className='font-bold text-orange-700 hover:text-orange-800'>Browse all products</Link></li>
          </ul>
        </nav>

        <nav aria-label='Customer support' className='lg:border-r lg:border-slate-200 lg:pr-6'>
          <h2 className='mb-4 text-base font-black text-slate-900'>Customer Support</h2>
          <ul className='space-y-2.5 text-sm'>
            <li><Link to='/contact-us' className='text-slate-700 hover:text-orange-700'>Contact Us</Link></li>
            <li><Link to='/dashboard/myorders' className='text-slate-700 hover:text-orange-700'>Order Tracking</Link></li>
            <li><Link to='/cart' className='text-slate-700 hover:text-orange-700'>View Cart</Link></li>
            <li><Link to='/dashboard/address' className='text-slate-700 hover:text-orange-700'>Delivery Addresses</Link></li>
          </ul>
        </nav>

        <nav aria-label='Important information' className='lg:border-r lg:border-slate-200 lg:pr-6'>
          <h2 className='mb-4 text-base font-black text-slate-900'>Important Info</h2>
          <ul className='space-y-2.5 text-sm'>
            <li><Link to='/safety-tips' className='text-slate-700 hover:text-orange-700'>Safety Guidelines</Link></li>
            <li><Link to='/terms-and-conditions' className='text-slate-700 hover:text-orange-700'>Terms &amp; Conditions</Link></li>
            <li><Link to='/dashboard/privacy' className='text-slate-700 hover:text-orange-700'>Privacy Policy</Link></li>
            <li><Link to='/about-us' className='text-slate-700 hover:text-orange-700'>About Us</Link></li>
          </ul>
        </nav>

        <section>
          <h2 className='mb-4 text-base font-black text-slate-900'>Celebrate Safely</h2>
          <p className='text-sm leading-6 text-slate-700'>
            Use fireworks only where permitted, supervise children, and keep a safe distance.
          </p>
          <Link to='/safety-tips' className='mt-3 inline-flex items-center gap-2 text-sm font-bold text-orange-700 hover:text-orange-800'>
            <BsShieldCheck aria-hidden='true' /> Read Safety Tips
          </Link>
        </section>
      </div>

      <div className='border-y border-slate-200'>
        <div className='container mx-auto grid gap-5 px-4 py-5 sm:grid-cols-3'>
          <a href='tel:+917095730374' aria-label="Call Tracly customer care" className='flex items-center gap-3 hover:text-orange-700'>
            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600'><FaPhone aria-hidden='true' /></span>
            <span><span className='block text-xs text-slate-600'>Call Us</span><span className='text-sm font-bold text-slate-900'>+91 7095730374</span></span>
          </a>
          <a href='mailto:munnareddy03457@gmail.com' aria-label="Email Tracly customer care" className='flex items-center gap-3 hover:text-orange-700'>
            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600'><FaEnvelope aria-hidden='true' /></span>
            <span><span className='block text-xs text-slate-600'>Email Us</span><span className='text-sm font-bold text-slate-900'>munnareddy03457@gmail.com</span></span>
          </a>
          <div className='flex items-center gap-3'>
            <span className='flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-50 text-orange-600'><FaLocationDot aria-hidden='true' /></span>
            <span><span className='block text-xs text-slate-600'>Our Location</span><span className='text-sm font-bold text-slate-900'>Andhra Pradesh, India</span></span>
          </div>
        </div>
      </div>

      <div className='border-b border-slate-200'>
        <div className='container mx-auto flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center'>
          <p className='shrink-0 text-sm font-bold text-slate-900 sm:w-32'>We Accept</p>
          <div className='flex flex-wrap gap-3'>
            <span className='inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800'>
              <FaCreditCard className='text-orange-600' aria-hidden='true' /> Secure online payment
            </span>
            <span className='inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800'>
              <FaMoneyBillWave className='text-orange-600' aria-hidden='true' /> Cash on Delivery
            </span>
          </div>
        </div>
      </div>

      <div className='bg-slate-50/70 py-5'>
        <div className='container mx-auto flex flex-col gap-3 px-4 text-xs font-medium text-slate-600 sm:flex-row sm:items-center sm:justify-between'>
          <p>© 2026 Tracly Crackers. All rights reserved.</p>
          <p className='flex items-center gap-2'><BsShieldCheck className='shrink-0 text-orange-600' aria-hidden="true" /> Sale and delivery subject to applicable local laws and permissions. Use fireworks responsibly.</p>
          <div className='flex items-center gap-4'>
            <Link to='/dashboard/privacy' className='hover:text-orange-700'>Privacy Policy</Link>
            <Link to='/terms-and-conditions' className='hover:text-orange-700'>Terms &amp; Conditions</Link>
            <Link to='/safety-tips' className='hover:text-orange-700'>Safety</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
