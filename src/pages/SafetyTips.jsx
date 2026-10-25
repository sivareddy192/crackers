const tips = [
  {
    title: 'Use fireworks only where permitted',
    detail: 'Check local rules and choose a clear, open outdoor area away from buildings, vehicles, dry grass, and crowds.'
  },
  {
    title: 'Read the label and follow directions',
    detail: 'Use each product only as described on its packaging. Do not alter, combine, or dismantle fireworks.'
  },
  {
    title: 'Keep children supervised',
    detail: 'A responsible adult should supervise the celebration. Children should never handle or light fireworks.'
  },
  {
    title: 'Keep your distance',
    detail: 'Light one item at a time at arm’s length, then move back promptly. Never lean over a lit firework.'
  },
  {
    title: 'Be ready for accidents',
    detail: 'Keep water or a suitable fire extinguisher nearby. Wear close-fitting clothing and avoid loose or flowing fabric.'
  },
  {
    title: 'Do not relight a dud',
    detail: 'If a firework does not go off, do not approach or relight it. Wait and follow its package disposal instructions.'
  },
  {
    title: 'Store and dispose of products carefully',
    detail: 'Keep unused fireworks in their original packaging in a cool, dry place away from heat and flames. Dispose of used items safely.'
  },
  {
    title: 'Look after people, animals, and the environment',
    detail: 'Keep pets indoors and consider neighbours who may be sensitive to noise. Clean up debris after the area is safe.'
  }
]

const SafetyTips = () => (
  <section className='container mx-auto max-w-5xl px-4 py-10 sm:py-14'>
    <header className='rounded-3xl border border-orange-200 bg-orange-50 p-7 text-black shadow-lg sm:p-10'>
      <p className='text-xs font-black uppercase tracking-[0.2em] text-orange-800'>Celebrate responsibly</p>
      <h1 className='mt-3 text-3xl font-black tracking-tight text-black sm:text-4xl'>Fireworks Safety Tips</h1>
      <p className='mt-4 max-w-2xl text-sm leading-6 text-black sm:text-base'>
        A safe celebration starts before anything is lit. Follow these general precautions and always obey the instructions printed on each product.
      </p>
    </header>
    <section aria-label='Fireworks safety guidance' className='mt-7 grid gap-4 sm:grid-cols-2'>
      {tips.map((tip, index) => (
        <article key={tip.title} className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
          <div className='flex gap-4'>
            <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-sm font-black text-orange-700'>
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h2 className='font-black text-slate-900'>{tip.title}</h2>
              <p className='mt-2 text-sm leading-6 text-black'>{tip.detail}</p>
            </div>
          </div>
        </article>
      ))}
    </section>
    <p className='mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950'>
      These are general precautions, not a substitute for product-specific instructions or local laws. If there is an emergency, move to safety and contact your local emergency services.
    </p>
  </section>
)

export default SafetyTips
