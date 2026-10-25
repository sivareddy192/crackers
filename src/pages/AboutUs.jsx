import { Link } from 'react-router-dom'

const AboutUs = () => (
  <section className='container mx-auto max-w-4xl px-4 py-10 sm:py-14'>
    <header className='rounded-3xl border border-orange-200 bg-orange-50 p-7 text-black sm:p-10'>
      <p className='text-xs font-black uppercase tracking-[0.2em] text-orange-800'>About Trace</p>
      <h1 className='mt-3 text-3xl font-black tracking-tight text-black sm:text-4xl'>A little more sparkle for your celebrations</h1>
      <p className='mt-4 max-w-2xl text-sm leading-6 text-black sm:text-base'>
        Trace is an online destination for discovering crackers and fireworks for festive moments and special occasions.
      </p>
    </header>
    <section className='mt-7 space-y-5 rounded-3xl border border-slate-200 bg-white p-6 text-sm leading-7 text-black shadow-sm sm:p-8'>
      <h2 className='text-xl font-black text-slate-900'>What we do</h2>
      <p>
        We make it easier to browse celebration products, review their details, and place an order online. Product availability, descriptions, and delivery options are shown on the storefront and may vary by location and season.
      </p>
      <h2 className='pt-2 text-xl font-black text-slate-900'>Safety comes first</h2>
      <p>
        Fireworks must always be handled responsibly. Please review our <Link className='font-bold text-orange-700 hover:underline' to='/safety-tips'>Fireworks Safety Tips</Link>, follow the product packaging, and check the laws that apply where you live before purchasing or using any product.
      </p>
      <p>
        For help with a product or an order, use the support options provided on the website. We are glad to help make your celebration a safer and more enjoyable one.
      </p>
    </section>
  </section>
)

export default AboutUs
