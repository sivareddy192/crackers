import { useState } from 'react'
import { Link } from 'react-router-dom'

const ACKNOWLEDGEMENT_KEY = 'trace-safety-tips-acknowledged'

const SafetyTipsGate = () => {
  const [isAcknowledged, setIsAcknowledged] = useState(
    () => localStorage.getItem(ACKNOWLEDGEMENT_KEY) === 'true'
  )

  const acknowledgeSafetyTips = () => {
    localStorage.setItem(ACKNOWLEDGEMENT_KEY, 'true')
    setIsAcknowledged(true)
  }

  if (isAcknowledged) return null

  return (
    <div className='fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/75 px-4 py-8 backdrop-blur-sm'>
      <section
        aria-labelledby='safety-gate-title'
        aria-modal='true'
        className='my-auto w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8'
        role='dialog'
      >
        <p className='mb-2 text-xs font-black uppercase tracking-[0.2em] text-orange-700'>Before you browse</p>
        <h2 id='safety-gate-title' className='text-2xl font-black tracking-tight text-slate-950 sm:text-3xl'>
          Fireworks Safety Tips
        </h2>
        <p className='mt-3 text-sm leading-6 text-slate-700'>
          Firecrackers can cause serious injury or fire when used incorrectly. Keep these essentials in mind:
        </p>
        <ul className='mt-5 space-y-3 text-sm leading-6 text-slate-800'>
          <li className='flex gap-3'><span className='font-black text-orange-700'>01</span><span>Use fireworks outdoors, only where permitted, and follow every instruction on the product packaging.</span></li>
          <li className='flex gap-3'><span className='font-black text-orange-700'>02</span><span>Children must be supervised by a responsible adult. Never let children light fireworks.</span></li>
          <li className='flex gap-3'><span className='font-black text-orange-700'>03</span><span>Keep a safe distance, wear close-fitting clothing, and keep water nearby.</span></li>
          <li className='flex gap-3'><span className='font-black text-orange-700'>04</span><span>Never relight a firework that fails to ignite. Keep away and follow the package disposal instructions.</span></li>
        </ul>
        <div className='mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <Link to='/safety-tips' className='text-center text-sm font-bold text-orange-700 hover:text-orange-800 sm:text-left'>
            Read the full safety guide
          </Link>
          <button
            type='button'
            onClick={acknowledgeSafetyTips}
            className='rounded-xl bg-orange-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 focus:outline-none focus:ring-4 focus:ring-orange-300'
          >
            OK, I understand
          </button>
        </div>
      </section>
    </div>
  )
}

export default SafetyTipsGate
