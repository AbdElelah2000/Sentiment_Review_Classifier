import React, { useState, useEffect, useRef } from 'react';
import './form.css';
import loading_img from '../../assets/loader.svg';
import { Textarea, Button } from '@nextui-org/react';

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
      });
  };

  const onFileChange = (event) => {
    setFile(event.target.files[0]);
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
        <div className="button layout">
          <label className="file-upload">
            <input type="file" onChange={onFileChange} />
            <Button color="secondary" type="button">
              Upload File
            </Button>
          </label>
          <Button color="primary" type="submit">
            Submit
          </Button>
        </div>
      </form>
      {loading ? (
        <div className="loading">
          <img className="loader_img" src={loading_img} alt="loading" />
        </div>
      ) : (
        <div className="results">
          <Button color="primary" onClick={() => handleButtonClick('next')} disabled={currentReviewIndex === reviews.length - 1}>
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
        <Button color="primary" onClick={() => handleButtonClick('prev')} disabled={currentReviewIndex === 0}>
          &gt;
        </Button>
        </div>
      )}
    </div>
  );
};

export default Form;
