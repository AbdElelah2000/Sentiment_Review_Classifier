import React from 'react'
import './tool.css'
import format from '../assets/format.png'

export const ToolInfo = () => {
  return (
    <div className='format-img'>
      Please make sure you only upload an excel file with your reviews.
      <br />
      The format of the excel sheet has to be exactly as follows:
      <br />
      <img className='image-size' src={format} alt="formatimage" />
    </div>
  )
}
