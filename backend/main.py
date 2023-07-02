from flask import Flask, request
import tensorflow as tf
import tensorflow_hub as hub
import numpy as np

#pipvenv shell to start virtual python env

custom_objects = {'KerasLayer': hub.KerasLayer}
train_model = tf.keras.models.load_model('model/review_classifier.h5', custom_objects=custom_objects)

app = Flask(__name__)

@app.route("/", methods=["GET", "POST"])
def server():
    if request.method == 'GET':
        new_review = [
            'Thoroughly enjoyed all aspects of our meal. Service attentive, spacious and airy, dishes artistically plated and delicious. A variety of people enjoying special dinners, small and large groups. Both appetizers of focaccia and crab and lobster cakes were scrumptious. The saffron alioli sauce was very tasty. The salmon was perfectly cooked in a lemon pesto beurre sauce with colourful tender crisp vegetables. Spaghetti pescatori was served with a variety of shellfish. An extensive wine menu complements their dinner fare. Everything was as it should be for a fine dining experience. Each dish was however just a little more expensive than other comparable dining experiences. Great for a special occasion.',
            'I ate there on a Wednesday evening. The arugula salad was overwhelmed by bitter radicchio. This was pointed out to the waiter, he added additional arugula to the salad, but I had to pick out the radicchio. I ordered the chicken. When it came out the skin was black. I removed the skin. When I cut into the chicken the chicken was overcooked and dry. It was late and I did not want the kitchen to redo the chicken. If the kitchen cannot get right the first time, there is no assurance that it will be right the second time. The manager did not visit to offer any explanation. This restaurant is crossed off my list.',
            'I made a reservation from reviews I read and have to say it is over priced and my friends and my meals were lacking presentation and taste. The interior lighting is to bright and overall atmosphere lacks sophistication. The washroom and hallway to get to washrooms is a 1980 Tim Hortons at best. It is obvious you need to read many many reviews to know when it all BS. Do not waste your money. We ordered pizza, pasta and had special. All 6 in are party agreed it was horrible food. Only good thing was the waiter. Everything else sucked.',
            'Nice Italian restaurant. Not as much variety as I would like but always can find a good dish. Wine selection here is very impressive and service is always exceptional. Nice outdoor patio area for Covid era. Can’t wait to go back with lockdown is over.'
            ]

        new_review = np.array(new_review, dtype=object)

        predict = train_model.predict(new_review)

        bool_predict = []
        for review in predict:
            if review[0] >= 0:
                bool_predict.append(True)
            else:
                bool_predict.append(False)
        
        return ("Review:" + f'{bool_predict}')
    
    if request.method == "POST":
        new_review = [f"{request.form.get('review')}"]
        print(new_review)
        new_review = np.array(new_review, dtype=object)

        predict = train_model.predict(new_review)

        bool_predict = []
        for review in predict:
            if review[0] >= 0:
                bool_predict.append(True)
            else:
                bool_predict.append(False)
        
        return ("Review:" + f'{bool_predict}')

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5050)