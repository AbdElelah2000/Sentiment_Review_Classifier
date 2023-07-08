from flask import Flask, request, jsonify, abort
from werkzeug.utils import secure_filename
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import pandas as pd
import os
from dotenv import load_dotenv
from flask_cors import CORS
import threading
import uuid

custom_objects = {'KerasLayer': hub.KerasLayer}
train_model = tf.keras.models.load_model('model/review_classifier.h5', custom_objects=custom_objects)

load_dotenv('.venv/.env.local')

DEBUG = bool(os.getenv('DEBUG'))

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
# CORS(app)


app.config["DEBUG"] = DEBUG

# set maximum upload size to 1MB
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024

# Store results of background jobs here
results = {}

def single_review_background_task(review, job_id):
    try:
        temp = review
        review = np.array([review], dtype=object)
        predict = train_model.predict([review])
        result = predict[0][0]
        # Check if the result is closer to 1 or 0
        results[job_id] = {'status': 'done', 'reviews': str(temp),'results': True if result > 0.5 else False}
        # print(results[job_id])
        return results[job_id]
    except Exception as e:
        results[job_id] = {'status': 'error', 'error': str(e)}
        return results[job_id]

def multiple_reviews_background_task(file_path, job_id):
    try:
        df = pd.read_excel(file_path)
        reviews = df.iloc[:, 0].values
        predictions = train_model.predict(reviews)
        results[job_id] = {'status': 'done', 'reviews': reviews.tolist(), 'results': [True if result > 0.5 else False for result in predictions]}
        return results[job_id]
    except Exception as e:
        results[job_id] = {'status': 'error', 'error': str(e)}
        return results[job_id]

def allowed_file(filename):
    # check if the file has a valid extension
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in {'xlsx', 'xls'}

@app.route("/", methods=["POST"])
def server():
    if request.method == "POST":
        data = request.get_json()
        review = data['review']
        # Generate a unique job ID
        job_id = str(uuid.uuid4())
        # Start the background task
        thread = threading.Thread(target=single_review_background_task, args=(review, job_id))
        thread.start()
        # Immediately return the job ID
        return jsonify({"job_id": job_id})

    
@app.route("/result/<job_id>")
def get_result(job_id):
    # Check if the job is done
    if job_id in results:
        # print(results[job_id])
        if results[job_id]['status'] == 'done':
            if (not isinstance(results[job_id]['results'], bool)):
                # This is a multiple reviews job
                return jsonify({"reviews": results[job_id]['reviews'], "results": results[job_id]['results']})
            # else:
            #     # This is a single review job
            #     return jsonify({"reviews": results[job_id]['reviews'], "results": results[job_id]['results']})
        else:
            # The job encountered an error
            return jsonify({"status": "error", "error": results[job_id]['error']}), 400
    else:
        return "Job not done", 202

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'myFile' not in request.files:
        abort(400, 'No file part in the request.')
        
    file = request.files['myFile']

    if file.filename == '':
        abort(400, 'No selected file.')

    if not allowed_file(file.filename):
        abort(400, 'File type not allowed. Please upload an Excel file.')

    filename = secure_filename(file.filename)

    if not os.path.exists('files'):
        os.makedirs('files')

    file_path = os.path.join('files', filename)
    file.save(file_path)

    # Generate a unique job ID
    job_id = str(uuid.uuid4())
    # Start the background task
    thread = threading.Thread(target=multiple_reviews_background_task, args=(file_path, job_id))
    thread.start()
    # Immediately return the job ID
    return jsonify({"job_id": job_id})

@app.errorhandler(413)
def too_large(e):
    return "File is too large", 413

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
