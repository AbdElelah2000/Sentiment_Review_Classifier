import React from 'react';
import './mainpage.scss';
import Form from '../../components/Form/Form'
import { Button } from '@nextui-org/react';
import { useState } from 'react';

const Mainpage = () => {
  const [pressed, setPressed] = useState(false)

  return (
    <div className="main-page">
      <div id="stars"></div>
      <div id="stars2"></div>
      <div id="stars3"></div>
      <div className='form' ><Form /></div>
      <div className={`file-download ${pressed ? 'active' : ''}`}>
        <h3>Download Excel Sheet</h3>
        <Button size="xs">Get file</Button>
      </div>
      <div>
        <Button auto size="xs" onPress={() => {setPressed(!pressed)}} className={`file-menu ${pressed ? 'active' : ''}`}>
          {pressed ? '>' : "<"}
        </Button>
      </div>
    </div>
  );
};

export default Mainpage;
