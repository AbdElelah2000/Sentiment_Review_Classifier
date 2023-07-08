import React, { useState, useEffect, useRef, useContext } from 'react';
import './form.css';
import loading_img from '../../assets/loader.svg';
import { Textarea, Button, Spacer } from '@nextui-org/react';
import Modal from '../Modal/Modal';
import { ReviewContext } from '../../contexts/ReviewContext.js';

const Form = () => {
  const [single_review, SetSingleReview] = useState('');
  const [loading, setLoading] = useState(false);
  const { reviews, setReviews, results, setResults } = useContext(ReviewContext);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [animate, setAnimate] = useState(false);
  const prevReviewIndex = useRef(currentReviewIndex);
  const [file, setFile] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState('');
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    setAnimate(true);
    setTimeout(() => setAnimate(false), 500);
  }, [currentReviewIndex]);

  const handleButtonClick = (direction) => {
    prevReviewIndex.current = currentReviewIndex;

    if (direction === 'prev' && currentReviewIndex > 0) {
      setCurrentReviewIndex(currentReviewIndex - 1);
    } else if (direction === 'next' && currentReviewIndex < reviews.length - 1) {
      setCurrentReviewIndex(currentReviewIndex + 1);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!single_review) {
      return setLoading(false);
    }
    setLoading(true);

    fetch('http://127.0.0.1:4500/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        review: single_review,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setReviews(prevReviews => [single_review, ...prevReviews]);
        setResults(prevResults => [data.single_result, ...prevResults]);
        checkResult(data.job_id);
      })
      .catch((error) => {
        setModalContent('Error: An Error has occured with the review submit, please try again later.');
        setShowModal(true);
      });
  };

  const checkResult = (jobId, isFileUpload = false) => {
    fetch(`http://127.0.0.1:4500/result/${jobId}`)
      .then((response) => {
        if (response.status === 202) {
          setTimeout(() => checkResult(jobId, isFileUpload), 1000);
        } else {
          response.json().then((data) => {
            if (isFileUpload) {
              setReviews(data.reviews.concat(reviews));
              setResults(data.results.concat(results));
              setShowButtons(true)
              setCurrentReviewIndex(0);
            } 
            else {
              setReviews([data.reviews, ...reviews]);
              setResults([data.results, ...results]);
              setCurrentReviewIndex(0);
              setShowButtons(true)
            }
            setLoading(false);
          });
        }
      }).catch((error) =>{
        setModalContent('Error: An Error has occured with the file upload.');
        setShowModal(true);
      }
      );
  };
  
  const onFileUpload = () => {
    if(!file) {
      setModalContent('Error:\nYou Need to choose a file before uploading it.');
      return setShowModal(true);
    }

    const nameFile = file.name.toString().toLowerCase();

    if (!nameFile.includes(".xlsx")){
      setModalContent('Error:\nWrong file type, currently, this app only supports .xlsx excel sheets.');
      return setShowModal(true);
    }
  
    // Create an object of formData
    const formData = new FormData();
  
    // Update the formData object
    formData.append(
        "myFile",
        file,
        file.name
    );
  
    setLoading(true);

    fetch("http://127.0.0.1:4500/upload", {
        method: 'POST',
        body: formData
    })
    .then((response) => response.json())
    .then((data) => {
      checkResult(data.job_id, true);
    })
    .catch((error) => {
        console.error('Error:', error);
    });
  };
  

  return (
    <div className="app">
      <form className="form-style" id="form" onSubmit={handleSubmit}>
        <br />
        <Textarea
          bordered
          color="primary"
          labelPlaceholder="Review Input"
          rows={4}
          cols={60}
          status="primary"
          name="Review"
          value={single_review}
          onChange={(event) => SetSingleReview(event.target.value)}
        />
        <Spacer y={0.5} />
        <Button color="primary" type="submit">
            Submit
        </Button>

        <br />
        <span style={{color: "#0072f5"}}>OR</span>
        <br />

        <div className="layout">
          <label className="custom-file-upload">
              <input type="file" onChange={(event) => setFile(event.target.files[0])}/>
          </label>
          <Button color="primary" type="button" onPress={onFileUpload}>
            Upload File
        </Button>
        </div>
      </form>
      {loading ? (
        <div className="loading">
          <img className="loader_img" src={loading_img} alt="loading" />
        </div>
      ) : (
        <div className="results">
          <Button auto color="primary" onPress={() => handleButtonClick('prev')} disabled={currentReviewIndex === 0} className={`show-button ${showButtons? 'true' : 'false'}`}>
            &lt;
          </Button>
          {reviews.length > 0 &&
            reviews.map((review, index) => (
              <div
                key={index}
                className={`card ${index === currentReviewIndex ? 'active' : ''} ${
                  prevReviewIndex.current < currentReviewIndex ? 'out' : 'in'
                } ${animate ? 'animate' : ''}`}
              >
                <div className="card-content">
                  <div className="review">
                    <h3>Review</h3>
                    <p className="color-review">{review}</p>
                  </div>
                  <div className={`result ${results[index] ? 'positive' : 'negative'}`}>
                    <h3>Analysis</h3>
                    <div className="result-box">
                      <p>{results[index] ? 'Positive' : 'Negative'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}

          <Button auto color="primary" onPress={() => handleButtonClick('next')} disabled={currentReviewIndex === reviews.length - 1} className={`show-button ${showButtons? 'true' : 'false'}`}>
            &gt;
          </Button>
        </div>
      )}
    <Modal showModal={showModal} setShowModal={setShowModal} modalContent={modalContent} />
    </div>
  );
};

export default Form;
