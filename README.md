# 🌾 Panda Smart - Crop Recommendation System

An AI-powered web application that helps farmers make informed crop planting decisions based on soil and environmental conditions.



## 🌟 Features

- 🤖 **Machine Learning Predictions** - Uses Gaussian Naive Bayes algorithm
- 🌍 **Real-time Weather Integration** - Fetches current weather data
- 🌐 **Free Translation** - Dynamic English ↔ Swahili translation
- 📊 **Soil Analysis** - Analyzes N, P, K nutrients
- 🎯 **22 Crop Types** - Recommends from rice, maize, wheat, and more
- 🔒 **Secure API** - Backend proxy for all API calls
- 📱 **Responsive Design** - Works on all devices

## 🚀 Live Demo

**Deployed on Render:** https://panda-smart-crop.onrender.com/


## 🛠️ Technologies Used

### Backend
- **Flask** - Python web framework
- **scikit-learn** - Machine learning library
- **pandas & numpy** - Data processing
- **python-dotenv** - Environment variables
- **gunicorn** - Production server

### Frontend
- **HTML5 & CSS3** - Structure and styling
- **Bootstrap 5** - Responsive design
- **JavaScript** - Dynamic functionality
- **AOS** - Scroll animations

### APIs
- **OpenWeather API** - Weather data
- **MyMemory Translation API** - Free translation (10,000 words/day)

## 📋 Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- OpenWeather API key (free tier)

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/steve-kings/Crop_recommendation_system.git
cd Crop_recommendation_system
```

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
OPENWEATHER_API_KEY=your_api_key_here
```

Get your free API key from: https://openweathermap.org/api

### 4. Run the Application
```bash
python app.py
```

Visit: http://127.0.0.1:5000

**Detailed guide:** See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
## 🎯 Usage

### Get Crop Recommendations

1. **Enter Soil Data:**
   - Nitrogen (N)
   - Phosphorus (P)
   - Potassium (K)
   - pH value

2. **Enter Environmental Data:**
   - Temperature (°C)
   - Humidity (%)
   - Rainfall (mm)

3. **Or Use Weather Data:**
   - Click "Use weather data" button
   - Auto-fills temperature, humidity, and rainfall

4. **Get Recommendation:**
   - Click "Get Recommendation"
   - View suggested crop

### Translate to Swahili

1. Click the **"🌍 Swahili"** button
2. Entire page translates to Swahili
3. Click **"🌍 English"** to switch back

## 🔐 Security Features

- ✅ API keys stored in environment variables
- ✅ Backend proxy for external APIs
- ✅ No secrets exposed in frontend
- ✅ .env file in .gitignore
- ✅ CORS properly configured

## 📊 Supported Crops

The system can recommend 22 different crops:

| Cereals | Pulses | Fruits | Cash Crops |
|---------|--------|--------|------------|
| Rice | Chickpea | Banana | Cotton |
| Maize | Kidney Beans | Mango | Jute |
| | Pigeon Peas | Grapes | Coffee |
| | Moth Beans | Watermelon | |
| | Mung Bean | Muskmelon | |
| | Black Gram | Apple | |
| | Lentil | Orange | |
| | | Papaya | |
| | | Pomegranate | |
| | | Coconut | |

#reate your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## 👥 Authors

- **Stephen Kingori** - Developer
- **Rotich Kibet** - Developer
- **Agnes Mwikali** - Developer

## 🙏 Acknowledgments

- Karatina University - Department of Computer Science
- Dr. Zablon Okari - Project Supervisor
- OpenWeather API - Weather data
- MyMemory Translation API - Free translation service
- Bootstrap Team - UI framework

## 📞 Contact

For questions or support:
- **GitHub:** [@steve-kings](https://github.com/steve-kings)
- **Repository:** [Crop_recommendation_system](https://github.com/steve-kings/Crop_recommendation_system)

## 🌟 Star This Repository

If you find this project helpful, please give it a ⭐!

---

## 🔮 Future Enhancements

- [ ] Add more languages (French, Spanish)
- [ ] Implement user accounts
- [ ] Save recommendation history
- [ ] Add crop care tips
- [ ] Mobile app version
- [ ] Offline mode support
- [ ] SMS notifications

## 📊 API Usage Limits

### OpenWeather API (Free Tier)
- 60 calls/minute
- 1,000,000 calls/month

### MyMemory Translation (Free)
- 10,000 words/day
- No registration required

