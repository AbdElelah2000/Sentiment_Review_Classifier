import React, { useState, useEffect, useRef } from 'react';
import './form.css';
import loading_img from '../../assets/loader.svg';
import { Textarea, Button, Spacer } from '@nextui-org/react';

const Form = () => {
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [results, setResults] = useState([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [animate, setAnimate] = useState(false);
  const prevReviewIndex = useRef(currentReviewIndex);
  const [file, setFile] = useState(null);

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
    if (!review) {
      return setLoading(false);
    }
    setLoading(true);
    fetch('http://127.0.0.1:5050/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        review: review,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        setReviews([review, ...reviews]);
        checkResult(data.job_id);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };

  const checkResult = (jobId) => {
    fetch(`http://127.0.0.1:5050/result/${jobId}`)
      .then((response) => {
        if (response.status === 202) {
          setTimeout(() => checkResult(jobId), 1000);
        } else {
          response.json().then((data) => {
            
            setResults([data.review, ...results]);
            setLoading(false);
          });
        }
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  };


    // On file upload (click the upload button)
    const onFileUpload = () => {
      const nameFile = file.name.toString().toLowerCase();
      console.log(nameFile);
      if (!nameFile.includes(".xlsx")){
          console.log("WRONG FILE TYPE");
          return;  // Stops the function execution if it's not the right file type
      }
    
      // Create an object of formData
      const formData = new FormData();
    
      // Update the formData object
      formData.append(
          "myFile",
          file,
          file.name
      );
    
      // You don't need to manually set 'Content-Type': 'application/x-www-form-urlencoded'
      // fetch will automatically add the correct content type when using FormData.
      fetch("http://localhost:5050/upload", {
          method: 'POST',
          body: formData
      })
      .then((response) => response.json())
      .then((data) => {
          const jobId = data.job_id;
          checkResult(jobId);
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
          value={review}
          onChange={(event) => setReview(event.target.value)}
        />
        <Spacer y={0.5} />
        <Button color="primary" type="submit">
            Submit
        </Button>

        <br />
        <p>OR</p>
        <br />

        <div className="layout">
          <label className="custom-file-upload">
              <input type="file" onChange={(event) => setFile(event.target.files[0])}/>
          </label>
          <Button color="primary" type="submit" onPress={onFileUpload}>
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
          <Button auto color="primary" onClick={() => handleButtonClick('prev')} disabled={currentReviewIndex === 0}>
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

        <Button auto color="primary" onClick={() => handleButtonClick('next')} disabled={currentReviewIndex === reviews.length - 1}>
            &gt;
          </Button>
        </div>
      )}
    </div>
  );
};

export default Form;