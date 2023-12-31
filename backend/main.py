from flask import Flask, request, jsonify, abort, send_file, Response
from werkzeug.utils import secure_filename
from werkzeug.wsgi import FileWrapper
import shutil
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
import pandas as pd
import os
from flask_cors import CORS
import threading
import uuid

custom_objects = {'KerasLayer': hub.KerasLayer}
train_model = tf.keras.models.load_model('model/review_classifier.h5', custom_objects=custom_objects)


app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
# CORS(app)


# set maximum upload size to 1MB
app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024

# Store results of background jobs here
results = {}

def capitalize_sentences(sentences):
    if isinstance(sentences, str):
        # Convert single string to list
        sentences = [sentences]

    capitalized_sentences = []

    for sentence in sentences:
        # Ensure each string ends with a period
        if not sentence.endswith('.'):
            sentence += '.'

        split_sentence = sentence.split('. ')
        capitalized_split_sentence = [sent.capitalize() for sent in split_sentence]
        capitalized_sentence = '. '.join(capitalized_split_sentence)
        capitalized_sentences.append(capitalized_sentence)

    # Return string if only one sentence is present, else return list
    if len(capitalized_sentences) == 1:
        return capitalized_sentences[0]
    else:
        return capitalized_sentences




def single_review_background_task(review, job_id):
    try:
        temp = review
        review = np.array([review], dtype=object)
        predict = train_model.predict([review])
        result = predict[0][0]
        # Check if the result is closer to 1 or 0
        results[job_id] = {'status': 'done', 'reviews': str(temp),'results': True if result > 0 else False}

        return results[job_id]
    except Exception as e:
        results[job_id] = {'status': 'error', 'error': str(e)}
        return results[job_id]

def multiple_reviews_background_task(file_path, job_id):
    try:
        df = pd.read_excel(file_path)
        if df.columns[0].lower() == "review" or df.columns[0].lower() == "reviews":
            reviews = df.iloc[:, 0].values
            predictions = train_model.predict(reviews)
            os.remove(file_path)
            results[job_id] = {'status': 'done', 'reviews': reviews.tolist(), 'results': [True if result > 0.5 else False for result in predictions]}
            return results[job_id]
        else:
            os.remove(file_path)
            results[job_id] = {'status': 'format', 'error': 'Error: The format of the excel file is incorrect.'}
            return results[job_id]
    except Exception as e:
        results[job_id] = {'status': 'error', 'error': str(e)}
        return results[job_id]
    
def download_file_query(getReviews, getResults, job_id):
    try:

        df = pd.DataFrame({
            'Review': getReviews,
            'Analysis': getResults
        })
        filename = job_id + ".xlsx"
        file_path = os.path.join('files', filename)

        # Write the DataFrame to an Excel file
        df.to_excel(file_path, index=False)


        results[job_id] = {'status': 'done', 'file_path': file_path}
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

        review = capitalize_sentences(review) 

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
        if results[job_id]['status'] == 'done':
            if (not isinstance(results[job_id]['results'], bool)):
                # This is a multiple reviews job
                return jsonify({"reviews": results[job_id]['reviews'], "results": results[job_id]['results']})
            else:
                # This is a single review job
                return jsonify({"reviews": results[job_id]['reviews'], "results": results[job_id]['results']})
        elif results[job_id]['status'] == 'format':
            return jsonify({"status": "format", "error": results[job_id]['error']}), 204
        else:
            # The job encountered an error
            return jsonify({"status": "error", "error": results[job_id]['error']}), 400
    else:
        return "Job not done", 202
    
@app.route('/download_file/<job_id>', methods=['GET'])
def download_excel_file(job_id):
    if job_id in results and results[job_id]['status'] == 'done':
        filename = job_id + ".xlsx"
        file_path = os.path.join('files', filename)
        if os.path.exists(file_path):
            def generate():
                with open(file_path, "rb") as f:
                    yield from FileWrapper(f)
                os.remove(file_path)  # delete the file after sending

            # Wrap the generator in a response and set necessary headers
            response = Response(generate(), mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response.headers.set('Content-Disposition', 'attachment', filename=filename)
            return response
        else:
            return jsonify({"status": "error", "error": "File does not exist"}), 400
    else:
        return jsonify({"status": "error", "error": "Job not done or does not exist"}), 202

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

@app.route('/download/', methods=['POST'])
def download_file():
    if not os.path.exists('files'):
        os.makedirs('files')

    data = request.get_json()
    getReviews = data['reviews']
    getResults = data['results']


    getReviews = capitalize_sentences(getReviews)
    newResults = ['Positive' if result else 'Negative' for result in getResults]

    # Generate a unique job ID
    job_id = str(uuid.uuid4())
    # Start the background task
    thread = threading.Thread(target=download_file_query, args=(getReviews, newResults, job_id))
    thread.start()
    # Immediately return the job ID
    return jsonify({"job_id": job_id})

@app.errorhandler(413)
def too_large(e):
    return "File is too large", 413

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=4500)
