import React, {useState} from 'react'
import './form.css'

const Form = () => {
  const [name, setName] = useState('');
    
  const handleSubmit = (event) => {
      event.preventDefault();
      console.log(`${name}`);    
  }

  return(
      <form onSubmit = {handleSubmit}>
          <label>Form Input:</label>
          <br/>
          <input onChange = {(event) => setName(event.target.value)} value = {name}></input>
          <button type = 'submit'>Click to submit</button>
      </form>
  );
}

export default Form