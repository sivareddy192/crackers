import { Link } from 'react-router-dom'

const TermsAndConditions = () => (
  <section className='container mx-auto max-w-4xl px-4 py-10 sm:py-14'>
    <header className='rounded-3xl border border-orange-200 bg-orange-50 p-7 text-black sm:p-10'>
      <p className='text-xs font-black uppercase tracking-[0.2em] text-orange-800'>Please read carefully</p>
      <h1 className='mt-3 text-3xl font-black tracking-tight text-black sm:text-4xl'>Terms and Conditions</h1>
      <p className='mt-4 max-w-2xl text-sm leading-6 text-black sm:text-base'>
        These terms apply when you browse or place an order through the Trace website.
      </p>
    </header>
    <div className='mt-7 space-y-6 rounded-3xl border border-slate-200 bg-white p-6 text-black shadow-sm sm:p-8'>
      <section>
        <h2 className='font-black text-slate-900'>1. Eligibility and lawful use</h2>
        <p className='mt-2 text-sm leading-6 text-black'>You must be legally permitted to purchase the products offered in your location. You are responsible for checking and following applicable laws, restrictions, and age requirements. We may decline or cancel an order where fulfillment would not be lawful.</p>
      </section>
      <section>
        <h2 className='font-black text-slate-900'>2. Product information and availability</h2>
        <p className='mt-2 text-sm leading-6 text-black'>We aim to show product descriptions, prices, and availability accurately. Products and delivery options may vary by location and can change without notice. Please check the product packaging for the complete instructions and warnings.</p>
      </section>
      <section>
        <h2 className='font-black text-slate-900'>3. Orders and payment</h2>
        <p className='mt-2 text-sm leading-6 text-black'>An order request is subject to availability and confirmation. The applicable price, charges, and payment options are presented during checkout. Please ensure your contact and delivery details are accurate.</p>
      </section>
      <section>
        <h2 className='font-black text-slate-900'>4. Delivery, cancellation, and returns</h2>
        <p className='mt-2 text-sm leading-6 text-black'>Delivery availability and timing depend on your location and order. Contact support as soon as possible if you need help with an order. Any cancellation, return, or refund request is handled according to applicable law and the order-specific policy communicated by Trace.</p>
      </section>
      <section>
        <h2 className='font-black text-slate-900'>5. Fireworks safety</h2>
        <p className='mt-2 text-sm leading-6 text-black'>You are responsible for storing, transporting, and using products safely and lawfully. Follow all product instructions, keep fireworks away from children and ignition sources, and review the <Link className='font-bold text-orange-700 hover:underline' to='/safety-tips'>Fireworks Safety Tips</Link>.</p>
      </section>
      <section>
        <h2 className='font-black text-slate-900'>6. Changes and contact</h2>
        <p className='mt-2 text-sm leading-6 text-black'>We may update these terms when our services or requirements change. Continued use of the website after an update means you accept the revised terms. For questions about these terms or an order, contact Trace through the support options on the website.</p>
      </section>
    </div>
  </section>
)

export default TermsAndConditions
