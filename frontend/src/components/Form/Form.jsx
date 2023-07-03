import React, {useState} from 'react';
import './form.css';
import loading_img from '../../assets/loader.svg'

const Form = () => {
    const [review, setReview] = useState('');
    const [loading, setLoading] = useState(false);
    const [reviews, setReviews] = useState([]);
    const [results, setResults] = useState([]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!review)
        {
            return setLoading(false);
        }
        setLoading(true);
        fetch('http://127.0.0.1:5050/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                review: review
            })
        })
        .then(response => response.json())
        .then(data => {
            setReviews([review, ...reviews]);
            checkResult(data.job_id);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }

    const checkResult = (jobId) => {
        fetch(`http://127.0.0.1:5050/result/${jobId}`)
        .then(response => {
            if (response.status === 202) {
                setTimeout(() => checkResult(jobId), 1000);
            } else {
                response.json().then(data => {
                    setResults([data.review, ...results]);
                    setLoading(false);
                });
            }
        });
    }

    return(
        <div className="app">
            <form className='form-style' id='form' onSubmit={handleSubmit}>
                <label>Enter Review:</label>
                <br/>
                <textarea
                name="Review" 
                value={review}
                onChange={(event) => setReview(event.target.value)}
                rows={5}
                cols={40}
                />
                <button type='submit'>Submit</button>
            </form>
            {loading ? (
                <div className="loading"><img className='loader_img' src={loading_img} alt="loading" /></div>
            ) : (
                <div className="results">
                {reviews.map((review, index) => (
                    <div key={index} className="reviewItem">
                    <div className="review">
                        <h3>Review</h3>
                        <p>{review}</p>
                    </div>
                    <div className={`result ${results[index] ? "positive" : "negative"}`}>
                        <h3>Result</h3>
                        <p>{results[index] ? "Positive" : "Negative"}</p>
                    </div>
                    </div>
                ))}
                </div>
            )}
        </div>
    );
}

export default Form;
