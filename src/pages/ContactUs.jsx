import { FaEnvelope, FaLocationDot, FaPhone } from 'react-icons/fa6'
import { Link } from 'react-router-dom'

const contactMethods = [
  {
    icon: <FaPhone aria-hidden='true' />,
    label: 'Call Us',
    value: '+91 7095730374',
    href: 'tel:+917095730374'
  },
  {
    icon: <FaEnvelope aria-hidden='true' />,
    label: 'Email Us',
    value: 'munnareddy03457@gmail.com',
    href: 'mailto:munnareddy03457@gmail.com'
  }
]

const ContactUs = () => (
  <section className='container mx-auto max-w-5xl px-4 py-10 sm:py-14'>
    <header className='rounded-3xl border border-orange-200 bg-orange-50 p-7 text-black shadow-lg sm:p-10'>
      <p className='text-xs font-black uppercase tracking-[0.2em] text-orange-800'>We are here to help</p>
      <h1 className='mt-3 text-3xl font-black tracking-tight text-black sm:text-4xl'>Contact Us</h1>
      <p className='mt-4 max-w-2xl text-sm leading-6 text-black sm:text-base'>
        Get in touch with Trace Crackers for help with products, orders, or general questions.
      </p>
    </header>

    <div className='mt-7 grid gap-4 md:grid-cols-3'>
      {contactMethods.map(method => (
        <a
          key={method.label}
          href={method.href}
          className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-orange-300 hover:shadow-md'
        >
          <span className='flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-lg text-orange-600'>
            {method.icon}
          </span>
          <h2 className='mt-4 font-black text-slate-900'>{method.label}</h2>
          <p className='mt-1 break-words text-sm text-black'>{method.value}</p>
        </a>
      ))}

      <div className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
        <span className='flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 text-lg text-orange-600'>
          <FaLocationDot aria-hidden='true' />
        </span>
        <h2 className='mt-4 font-black text-slate-900'>Our Location</h2>
        <p className='mt-1 text-sm text-black'>Andhra Pradesh, India</p>
      </div>
    </div>

    <p className='mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950'>
      When contacting us about an order, include your order details so we can help. For fireworks handling and use guidance, please read our{' '}
      <Link to='/safety-tips' className='font-bold underline decoration-amber-500 underline-offset-2'>Safety Tips</Link>.
    </p>
  </section>
)

export default ContactUs
