import React from 'react'
import { AdlerLogo, AnvinLogo } from '../assets/images'

function Footer() {
  return (
    <div className='custom-conatiner bg-white  flex justify-between items-center py-3 rounded-t-xl  h-[10%]  '>
        <div>
            <img src={AdlerLogo} width={'100%'} height={'100%'} className='w-30' alt='adler-logo'/>
        </div>
        <div className='flex items-center gap-2 font-[500]'>
        Powered by<img src={AnvinLogo} width={'100%'} height={'100%'} className='w-30' alt='anvin-logo'/>
        </div>
    </div>
  )
}

export default Footer