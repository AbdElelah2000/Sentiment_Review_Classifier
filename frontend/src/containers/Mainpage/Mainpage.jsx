import React from 'react';
import './mainpage.scss';
import Form from '../../components/Form/Form'

const Mainpage = () => {
  return (
    <div className="main-page">
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>
      <div className='form' ><Form /></div>
    </div>
  );
};

export default Mainpage;
