from flask import Flask, request, jsonify
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np
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
CORS(app)

app.config["DEBUG"] = DEBUG

# Store results of background jobs here
results = {}

def background_task(review, job_id):
    review = np.array([review], dtype=object)
    predict = train_model.predict(review)
    result = predict[0][0]
    # Check if the result is closer to 1 or 0
    results[job_id] = True if result > 0.5 else False

@app.route("/", methods=["GET", "POST"])
def server():
    if request.method == "POST":
        data = request.get_json()
        review = data['review']
        # Generate a unique job ID
        job_id = str(uuid.uuid4())
        # Start the background task
        thread = threading.Thread(target=background_task, args=(review, job_id))
        thread.start()
        # Immediately return the job ID
        return jsonify({"job_id": job_id})

@app.route("/result/<job_id>")
def get_result(job_id):
    # Check if the job is done
    if job_id in results:
        return jsonify({"review": results[job_id]})
    else:
        return "Job not done", 202

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)
