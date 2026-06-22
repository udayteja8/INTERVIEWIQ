from flask import Flask
from flask_cors import CORS

from routes.auth_routes import auth_bp
from routes.interview_routes import interview_bp



app = Flask(__name__)

CORS(
    app,
    resources={
        r"/*": {
            "origins": "*"
        }
    }
)
@app.route("/")
def home():
    return {
        "status": "success",
        "message": "InterviewIQ Backend Running"
    }
app.register_blueprint(auth_bp)

app.register_blueprint(interview_bp)
if __name__ == "__main__":
    print(app.url_map)
    app.run(debug=True)