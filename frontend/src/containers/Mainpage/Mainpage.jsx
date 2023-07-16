import React from 'react';
import './mainpage.scss';
import Form from '../../components/Form/Form'
import { Button } from '@nextui-org/react';
import { useState } from 'react';
import { ReviewContext } from '../../contexts/ReviewContext.js';
import Modal from '../../components/Modal/Modal';

const Mainpage = () => {
  const [pressed, setPressed] = useState(false)
  const [reviews, setReviews] = useState([]);
  const [results, setResults] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [positiveCount, setPositiveCount] = useState(null)
  const [negativeCount, setNegativeCount] = useState(null)


  const checkResult = async (jobId) => {
    try {
        const response = await fetch(`http://127.0.0.1:4500/download_file/${jobId}`);
        if (response.status === 202) {
            setTimeout(() => checkResult(jobId), 1000);
            return; // return here to prevent the rest of the code from executing
        }
        if (!response.ok) {
            if (response.status === undefined) {
                console.error('Unexpected response object:', response);
                throw new Error("Unexpected response object");
            } else {
                throw new Error("HTTP error " + response.status);
            }
        }
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'file.xlsx'); // or any other extension
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error('Error:', error);
        setModalContent('Error: An Error has occured with the file upload.');
        setShowModal(true);
    }
  }

  const stats = () => {
    if (results.length === 0)
    {
      setModalContent('Error: You need to first have a submitted reviews before getting the stats of the results.');
      return setShowModal(true);
    }

    var count = 0;
    for (let i = 0; i < results.length; i++) {
      if (results[i] === true) {
        count++;
      }
    }
    setPositiveCount(count)

    count = 0;
    for (let i = 0; i < results.length; i++) {
      if (results[i] === false) {
        count++;
      }
    }
    setNegativeCount(count)

    setModalContent('The statistics of your reviews:');
    return setShowModal(true);
  }

  const downloadFile = () => {
    if (results.length === 0)
    {
      setModalContent('Error: You need to first have a submitted reviews before getting an excel sheet of the results.');
      return setShowModal(true);
    }
    fetch('http://127.0.0.1:4500/download/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        reviews: reviews,
        results: results
      }),
    })
    .then((response) => response.json())
    .then((data) => {
      checkResult(data.job_id);
    })
      .catch((error) => {
        setModalContent('Error: An error occured with the download of the file.');
        setShowModal(true);
      });
  }

  return (
    <ReviewContext.Provider value={{ reviews, setReviews, results, setResults }}>
      <div className="main-page">
        <div id="stars"></div>
        <div id="stars2"></div>
        <div id="stars3"></div>
        <div className='form' ><Form /></div>
        <div className={`file-download ${pressed ? 'active' : ''}`}>
          <h3>Download Excel Sheet</h3>
          <Button size="xs" onPress={downloadFile}>Get file</Button>
          <h3>Show The Statistics</h3>
          <Button size="xs" onPress={stats}>Get Stats</Button>
        </div>
        <Button auto size="xs" onPress={() => {setPressed(!pressed)}} className={`file-menu ${pressed ? 'active' : ''}`}>
            {pressed ? '>' : "<"}
        </Button>
      </div>
      <Modal showModal={showModal} setShowModal={setShowModal} modalContent={modalContent} positiveCount={positiveCount} negativeCount={negativeCount} />
    </ReviewContext.Provider> 
  );
};

export default Mainpage;
