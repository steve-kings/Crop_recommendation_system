 document.addEventListener('DOMContentLoaded', function() {
        // Grab all the elements we need - doing this at the top saves time later
        const form = document.getElementById('crop-recommendation-form');
        const loadingSection = document.getElementById('loading-section');
        const formSection = document.getElementById('form-section');
        const resultSection = document.getElementById('result-section');
        
        // Weather widget elements - there's probably a better way to do this but this works!
        const weatherLocationEl = document.getElementById('weather-location');
        const weatherDateEl = document.getElementById('weather-date');
        const weatherTempEl = document.getElementById('weather-temp');
        const weatherDescEl = document.getElementById('weather-desc');
        const weatherIconEl = document.getElementById('weather-icon');
        const weatherHumidityEl = document.getElementById('weather-humidity');
        const weatherWindEl = document.getElementById('weather-wind');
        const weatherPressureEl = document.getElementById('weather-pressure');
        const weatherRainfallEl = document.getElementById('weather-rainfall');
        const rainfallMonthlyEl = document.getElementById('rainfall-monthly');
        const rainfallSubtitleEl = document.getElementById('rainfall-subtitle');
        const weatherStatusEl = document.getElementById('weather-status');
        const weatherWidget = document.querySelector('.weather-widget');
        const locationSearchInput = document.getElementById('location-search');
        
        // Popup elements for the weather data use confirmation
        const prefillPopup = document.getElementById('prefill-popup');
        const popupLocation = document.getElementById('popup-location');
        const popupTemp = document.getElementById('popup-temp');
        const popupHumidity = document.getElementById('popup-humidity');
        const popupRainfall = document.getElementById('popup-rainfall');
        const popupConfirm = document.getElementById('popup-confirm');
        const popupCancel = document.getElementById('popup-cancel');
        const popupClose = document.getElementById('popup-close');
        
        // Hide the sections we don't need right away
        loadingSection.style.display = 'none';
        resultSection.style.display = 'none';
        
        // Store the weather data globally so we can access it from different functions
        let weatherInfo = null;
        let rainfallInfo = null;
        
        // Start by getting the user's weather - this auto-runs when the page loads
        getWeatherData();
        
        // Set up event listeners for the search functionality
        document.getElementById('search-button').addEventListener('click', searchLocation);
        locationSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault(); // Don't submit the form
                searchLocation();
            }
        });
        
        // Let the user get back to their current location with this button
        document.getElementById('get-my-location').addEventListener('click', function() {
            locationSearchInput.value = ''; // Clear whatever they searched for
            getWeatherData();
        });
        
        // These buttons let users grab individual weather values for the form
        document.getElementById('use-current-temp').addEventListener('click', function() {
            if (weatherInfo) {
                document.getElementById('temperature').value = Math.round(weatherInfo.main.temp);
                // A little animation to show it worked - people miss it otherwise
                this.classList.add('btn-success');
                this.classList.remove('btn-outline-secondary');
                setTimeout(() => {
                    this.classList.remove('btn-success');
                    this.classList.add('btn-outline-secondary');
                }, 1000);
            }
        });
        
        document.getElementById('use-current-humid').addEventListener('click', function() {
            if (weatherInfo) {
                document.getElementById('humidity').value = Math.round(weatherInfo.main.humidity);
                // Same feedback animation
                this.classList.add('btn-success');
                this.classList.remove('btn-outline-secondary');
                setTimeout(() => {
                    this.classList.remove('btn-success');
                    this.classList.add('btn-outline-secondary');
                }, 1000);
            }
        });
        
        document.getElementById('use-current-rainfall').addEventListener('click', function() {
            if (rainfallInfo) {
                document.getElementById('rainfall').value = Math.round(rainfallInfo.monthlySumMM);
                // Visual feedback again
                this.classList.add('btn-success');
                this.classList.remove('btn-outline-secondary');
                setTimeout(() => {
                    this.classList.remove('btn-success');
                    this.classList.add('btn-outline-secondary');
                }, 1000);
            }
        });
        
        // Main button to use ALL weather data at once
        document.getElementById('use-weather-data-btn').addEventListener('click', function() {
            if (weatherInfo) {
                // Fill in the popup with current values
                popupLocation.textContent = weatherInfo.name;
                popupTemp.textContent = `${Math.round(weatherInfo.main.temp)}°C`;
                popupHumidity.textContent = `${weatherInfo.main.humidity}%`;
                
                if (rainfallInfo && rainfallInfo.hasRainfall) {
                    popupRainfall.textContent = `${Math.round(rainfallInfo.monthlySumMM)} mm`;
                } else {
                    // Grab it from the display if our object is missing it for some reason
                    popupRainfall.textContent = `${weatherRainfallEl.textContent}`;
                }
                
                // Show the confirmation popup
                prefillPopup.classList.add('active');
            }
        });
        
        // Handle the popup buttons
        popupConfirm.addEventListener('click', function() {
            if (weatherInfo) {
                // They said yes - fill all the weather fields
                document.getElementById('temperature').value = Math.round(weatherInfo.main.temp);
                document.getElementById('humidity').value = Math.round(weatherInfo.main.humidity);
                
                // Rainfall could come from a couple places
                if (rainfallInfo && rainfallInfo.hasRainfall) {
                    document.getElementById('rainfall').value = Math.round(rainfallInfo.monthlySumMM);
                } else {
                    // Try to parse it from the display
                    const rainText = weatherRainfallEl.textContent;
                    const rainVal = parseInt(rainText);
                    if (!isNaN(rainVal)) {
                        document.getElementById('rainfall').value = rainVal;
                    }
                }
                
                // Hide the popup
                prefillPopup.classList.remove('active');
                
                // Add a little highlight to show which fields we filled
                const filledFields = ['temperature', 'humidity', 'rainfall'];
                filledFields.forEach(fieldId => {
                    const field = document.getElementById(fieldId);
                    if (field.value) {
                        field.classList.add('is-valid');
                        setTimeout(() => {
                            field.classList.remove('is-valid');
                        }, 2000);
                    }
                });
            }
        });
        
        // They decided not to use the weather data
        popupCancel.addEventListener('click', function() {
            prefillPopup.classList.remove('active');
        });
        
        // X button to close the popup
        popupClose.addEventListener('click', function() {
            prefillPopup.classList.remove('active');
        });
        
        // Also close the popup if they click outside of it
        prefillPopup.addEventListener('click', function(e) {
            if (e.target === prefillPopup) {
                prefillPopup.classList.remove('active');
            }
        });
        
        // Handle the form submission for crop recommendations
        form.addEventListener('submit', async function(e) {
            e.preventDefault(); // Don't actually submit the form
            
            // Show the loading spinner and hide the form
            formSection.style.display = 'none';
            loadingSection.style.display = 'block';
            resultSection.style.display = 'none';
            
            // Grab all the values from the form
            const cropData = {
                N: parseFloat(document.getElementById('nitrogen').value),
                P: parseFloat(document.getElementById('phosphorus').value),
                K: parseFloat(document.getElementById('potassium').value),
                temperature: parseFloat(document.getElementById('temperature').value),
                humidity: parseFloat(document.getElementById('humidity').value),
                ph: parseFloat(document.getElementById('ph').value),
                rainfall: parseFloat(document.getElementById('rainfall').value)
            };
            
            try {
                // Send the data to our Python backend
                const response = await fetch('http://127.0.0.1:5000/predict', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(cropData)
                });
                
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                
                const result = await response.json();
                
                // Show the recommendation results
                showResults(result, cropData);
                
            } catch (error) {
                console.error('Error:', error);
                alert('Error getting recommendation. Please try again.');
            } finally {
                loadingSection.style.display = 'none';
            }
        });
        
        // Back button to try another recommendation
        document.getElementById('back-button').addEventListener('click', function() {
            resultSection.style.display = 'none';
            formSection.style.display = 'block';
            form.reset();
        });
        
        // Home button to go back to the main page
        document.getElementById('home-button').addEventListener('click', function() {
            window.location.href = 'index.html';
        });
        
        // Function to display recommendation results
        function showResults(data, formData) {
            // Get the crop name from the response
            const cropName = data.predicted_crop;
            document.getElementById('crop-name').textContent = cropName;
            
            // Try to find an image for this crop
            const imageName = cropName.toLowerCase().replace(/\s+/g, '_');
            document.getElementById('crop-image').src = `/assets/images/${imageName}.jpg`;
            document.getElementById('crop-image').alt = cropName;
            
            // If we don't have an image for this crop, use a default
            document.getElementById('crop-image').onerror = function() {
                this.src = '/assets/images/default_crop.jpg';
                console.warn(`Couldn't find an image for ${cropName}, using default`);
            };
            
            // Show all the parameters the user entered
            const paramsContainer = document.getElementById('input-parameters');
            paramsContainer.innerHTML = '';
            
            // Give human-readable labels
            const niceLables = {
                N: 'Nitrogen',
                P: 'Phosphorus',
                K: 'Potassium',
                temperature: 'Temperature (°C)',
                humidity: 'Humidity (%)',
                ph: 'pH Value',
                rainfall: 'Rainfall (mm)'
            };
            
            // Add each parameter to the results
            for (const [key, value] of Object.entries(formData)) {
                const paramDiv = document.createElement('div');
                paramDiv.className = 'col-md-4 mb-2';
                paramDiv.innerHTML = `
                    <div class="parameter-box">
                        <strong>${niceLables[key] || key}:</strong> ${value}
                    </div>
                `;
                paramsContainer.appendChild(paramDiv);
            }
            
            // Show the results section
            resultSection.style.display = 'block';
        }
        
        // Function to initialize weather - called on page load
        function getWeatherData() {
            // Show loading spinner for weather
            document.getElementById('weather-loading').style.display = 'block';
            document.getElementById('weather-content').style.display = 'none';
            document.getElementById('weather-error').style.display = 'none';
            
            // Set today's date in the widget
            const today = new Date();
            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            weatherDateEl.textContent = today.toLocaleDateString(undefined, dateOptions);
            
            // Update status to show we're working on it
            weatherStatusEl.innerHTML = '<i class="bi bi-arrow-clockwise fa-spin"></i> Finding your location...';
            
            // Try to get the user's location from their browser
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    position => {
                        // Success! We got their coordinates
                        fetchWeatherByCoords(position.coords.latitude, position.coords.longitude);
                        weatherStatusEl.innerHTML = '<i class="bi bi-geo-alt"></i> Current location';
                    },
                    handleLocationError, // Something went wrong
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
            } else {
                // Their browser doesn't support geolocation
                showWeatherError("Your browser doesn't support location services. Try searching for a location instead.");
            }
        }
        
        // Function to search for weather by city name
        function searchLocation() {
            const searchTerm = locationSearchInput.value.trim();
            
            if (searchTerm) {
                // Show loading state
                document.getElementById('weather-loading').style.display = 'block';
                document.getElementById('weather-content').style.display = 'none';
                document.getElementById('weather-error').style.display = 'none';
                
                // Update status indicator
                weatherStatusEl.innerHTML = '<i class="bi bi-search"></i> Searched location';
                
                // Fetch weather for this location
                fetchWeatherByCity(searchTerm);
            } else {
                // They didn't enter anything to search for
                locationSearchInput.classList.add('is-invalid');
                setTimeout(() => {
                    locationSearchInput.classList.remove('is-invalid');
                }, 1000);
            }
        }
        
        // Function to fetch weather for a city name
        async function fetchWeatherByCity(city) {
            try {
                // First get the current weather via backend proxy
                const weatherResponse = await fetch(
                    `/api/weather/city?city=${encodeURIComponent(city)}`
                );
                
                if (!weatherResponse.ok) {
                    if (weatherResponse.status === 404) {
                        throw new Error("We couldn't find that location. Please check the spelling and try again.");
                    } else {
                        throw new Error(`Weather API error (${weatherResponse.status})`);
                    }
                }
                
                const weatherData = await weatherResponse.json();
                weatherInfo = weatherData; // Save this globally
                
                // Now get the forecast for rainfall data via backend proxy
                const forecastResponse = await fetch(
                    `/api/weather/forecast?city=${encodeURIComponent(city)}`
                );
                
                if (!forecastResponse.ok) {
                    // We can still show the weather even if forecast fails
                    console.warn('Forecast API error, using estimated rainfall');
                    const estimatedRainfall = estimateRainfallFromWeather(weatherData);
                    rainfallInfo = estimatedRainfall;
                    updateWeatherDisplay(weatherData, estimatedRainfall);
                    return;
                }
                
                const forecastData = await forecastResponse.json();
                
                // Calculate rainfall from the forecast
                const rainfallData = calculateRainfall(forecastData);
                rainfallInfo = rainfallData;
                
                // Update the UI with both sets of data
                updateWeatherDisplay(weatherData, rainfallData);
                
            } catch (error) {
                console.error('Weather fetch error:', error);
                showWeatherError(error.message);
            }
        }
        
        // Function to fetch weather for coordinates
        async function fetchWeatherByCoords(lat, lon) {
            try {
                // Get current weather conditions via backend proxy
                const weatherResponse = await fetch(
                    `/api/weather/current?lat=${lat}&lon=${lon}`
                );
                
                if (!weatherResponse.ok) {
                    throw new Error(`Weather API error (${weatherResponse.status})`);
                }
                
                const weatherData = await weatherResponse.json();
                weatherInfo = weatherData; // Save globally
                
                // Get forecast for rainfall via backend proxy
                const forecastResponse = await fetch(
                    `/api/weather/forecast?lat=${lat}&lon=${lon}`
                );
                
                if (!forecastResponse.ok) {
                    // We can still show weather if forecast fails
                    console.warn('Forecast API error, using estimated rainfall');
                    const estimatedRainfall = estimateRainfallFromWeather(weatherData);
                    rainfallInfo = estimatedRainfall;
                    updateWeatherDisplay(weatherData, estimatedRainfall);
                    return;
                }
                
                const forecastData = await forecastResponse.json();
                
                // Calculate rainfall from forecast
                const rainfallData = calculateRainfall(forecastData);
                rainfallInfo = rainfallData;
                
                // Update the display
                updateWeatherDisplay(weatherData, rainfallData);
                
            } catch (error) {
                console.error('Weather fetch error:', error);
                showWeatherError("Sorry, we couldn't get the weather data. Please try again later.");
            }
        }
        
        // Function to calculate rainfall from forecast data
        function calculateRainfall(forecastData) {
            let totalRain = 0;
            let hasRainfall = false;
            let dataSource = "forecast";
            
            // Sum up rainfall from all forecast intervals (every 3 hours for 5 days)
            forecastData.list.forEach(interval => {
                if (interval.rain && interval.rain['3h']) {
                    totalRain += interval.rain['3h'];
                    hasRainfall = true;
                }
            });
            
            // Convert to monthly estimate - roughly 6x the 5-day total
            const monthlyRain = totalRain * 6;
            
            // If we didn't find any rainfall data in the forecast, estimate it
            if (!hasRainfall) {
                // Get the weather ID from the first forecast entry
                const weatherId = forecastData.list[0].weather[0].id;
                dataSource = "estimate";
                
                // If it's a rainy weather condition, estimate based on that
                if (weatherId >= 200 && weatherId < 700) {
                    // Add some randomness to make it look more natural
                    const randomness = Math.random() * 0.5 + 0.5; // Between 0.5 and 1.0
                    
                    // Estimates based on weather type
                    if (weatherId >= 200 && weatherId < 300) { // Thunderstorm
                        totalRain = 15 * randomness;
                    } else if (weatherId >= 300 && weatherId < 400) { // Drizzle
                        totalRain = 5 * randomness;
                    } else if (weatherId >= 500 && weatherId < 600) { // Rain
                        totalRain = 10 * randomness;
                    } else if (weatherId >= 600 && weatherId < 700) { // Snow
                        totalRain = 8 * randomness; // Snow equivalent in water
                    }
                    
                    hasRainfall = true;
                } else {
                    // For clear/cloudy, estimate based on location and season
                    const latitude = forecastData.city.coord.lat;
                    const currentMonth = new Date().getMonth(); // 0-11
                    
                    // Super basic climate zone estimation
                    // Probably not accurate for everywhere, but good enough for now
                    if (Math.abs(latitude) > 40) { // Temperate zones
                        totalRain = [80, 70, 65, 60, 55, 50, 45, 50, 55, 65, 75, 80][currentMonth] / 30; // Daily avg
                    } else if (Math.abs(latitude) > 23) { // Subtropical
                        totalRain = [40, 45, 50, 55, 60, 30, 20, 25, 30, 40, 45, 40][currentMonth] / 30;
                    } else { // Tropical
                        totalRain = [20, 30, 50, 70, 120, 180, 200, 190, 150, 100, 60, 30][currentMonth] / 30;
                    }
                    
                    // Add some randomness again
                    totalRain = totalRain * (0.8 + Math.random() * 0.4);
                    hasRainfall = true;
                    dataSource = "climate";
                }
                
                // Convert daily to monthly
                const monthlyEstimate = totalRain * 30;
                return {
                    hasRainfall,
                    dailySumMM: totalRain,
                    monthlySumMM: monthlyEstimate,
                    dataSource: dataSource
                };
            }
            
            return {
                hasRainfall,
                dailySumMM: totalRain,
                monthlySumMM: monthlyRain,
                dataSource: dataSource
            };
        }
        
        // Fallback function if we can't get forecast data
        function estimateRainfallFromWeather(weatherData) {
            const weatherId = weatherData.weather[0].id;
            let dailyRain = 0;
            let hasRainfall = true;
            let source = "current";
            
            // Start with any rain that might be happening right now
            if (weatherData.rain) {
                dailyRain = weatherData.rain['1h'] ? weatherData.rain['1h'] * 24 : 0;
                if (weatherData.rain['3h']) {
                    dailyRain = weatherData.rain['3h'] * 8; // 3h -> daily
                }
            } else {
                // No current rain, use weather code to estimate
                if (weatherId >= 200 && weatherId < 300) { // Thunderstorm
                    dailyRain = 10 + Math.random() * 15;
                } else if (weatherId >= 300 && weatherId < 400) { // Drizzle
                    dailyRain = 2 + Math.random() * 5;
                } else if (weatherId >= 500 && weatherId < 600) { // Rain
                    dailyRain = 5 + Math.random() * 15;
                } else if (weatherId >= 600 && weatherId < 700) { // Snow
                    dailyRain = 3 + Math.random() * 10; // As water equivalent
                } else {
                    // Probably not raining
                    const latitude = weatherData.coord.lat;
                    const currentMonth = new Date().getMonth();
                    
                    // Rough climate-based estimates again
                    if (Math.abs(latitude) > 40) { // Temperate
                        dailyRain = [2.5, 2.3, 2.1, 2.0, 1.8, 1.7, 1.5, 1.7, 1.8, 2.1, 2.3, 2.5][currentMonth];
                    } else if (Math.abs(latitude) > 23) { // Subtropical
                        dailyRain = [1.3, 1.5, 1.7, 1.8, 2.0, 1.0, 0.7, 0.8, 1.0, 1.3, 1.5, 1.3][currentMonth];
                    } else { // Tropical
                        dailyRain = [0.7, 1.0, 1.7, 2.3, 4.0, 6.0, 6.7, 6.3, 5.0, 3.3, 2.0, 1.0][currentMonth];
                    }
                    source = "climate";
                }
            }
            
            // Convert to monthly - this is super rough
            const monthlyRain = dailyRain * 30;
            
            return {
                hasRainfall,
                dailySumMM: dailyRain,
                monthlySumMM: monthlyRain,
                dataSource: source
            };
        }
        
        // Update the weather display with all our data
        function updateWeatherDisplay(data, rainfallData) {
            // Add the fade-in animation
            const weatherContent = document.getElementById('weather-content');
            weatherContent.classList.remove('weather-animation');
            void weatherContent.offsetWidth; // Force reflow so animation restarts
            weatherContent.classList.add('weather-animation');
            
            // Update location name
            weatherLocationEl.textContent = data.name;
            
            // Update temperature and description
            weatherTempEl.textContent = `${Math.round(data.main.temp)}°C`;
            weatherDescEl.textContent = data.weather[0].description;
            
            // Update weather icon
            const iconCode = data.weather[0].icon;
            weatherIconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
            weatherIconEl.alt = data.weather[0].description;
            
            // Update the detail cards
            weatherHumidityEl.textContent = `${data.main.humidity}%`;
            weatherWindEl.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`; // m/s to km/h
            weatherPressureEl.textContent = `${data.main.pressure} hPa`;
            
            // Update rainfall displays
            if (rainfallData.hasRainfall) {
                // Daily rainfall in the weather details
                weatherRainfallEl.textContent = `${Math.round(rainfallData.dailySumMM)} mm`;
                
                // Monthly rainfall in the feature section
                rainfallMonthlyEl.textContent = `${Math.round(rainfallData.monthlySumMM)} mm`;
                
                // Explain where this number came from
                if (rainfallData.dataSource === "forecast") {
                    rainfallSubtitleEl.textContent = "Based on weather forecast data";
                } else if (rainfallData.dataSource === "estimate") {
                    rainfallSubtitleEl.textContent = "Estimated from current weather conditions";
                } else if (rainfallData.dataSource === "climate") {
                    rainfallSubtitleEl.textContent = "Estimated from typical climate patterns";
                } else if (rainfallData.dataSource === "current") {
                    rainfallSubtitleEl.textContent = "Estimated from current weather data";
                }
            } else {
                // No rainfall (unusual but possible)
                weatherRainfallEl.textContent = "0 mm";
                rainfallMonthlyEl.textContent = "0 mm";
                rainfallSubtitleEl.textContent = "No rainfall expected";
            }
            
            // Set the background color based on weather condition
            const weatherId = data.weather[0].id;
            const isDaytime = iconCode.includes('d'); // 'd' for day, 'n' for night in the icon code
            
            // Adjust gradient based on weather type and time of day
            // Spent way too much time tweaking these colors!
            if (weatherId >= 200 && weatherId < 300) {
                // Thunderstorm
                weatherWidget.style.background = isDaytime 
                    ? 'linear-gradient(135deg,rgb(5, 5, 5),rgb(229, 236, 243))'
                    : 'linear-gradient(135deg,rgb(18, 18, 19),rgb(238, 238, 243))';
            } else if (weatherId >= 300 && weatherId < 400) {
                // Drizzle
                weatherWidget.style.background = isDaytime
                    ? 'linear-gradient(135deg, #757F9A, #D7DDE8)'
                    : 'linear-gradient(135deg, #373B44, #4286f4)';
            } else if (weatherId >= 500 && weatherId < 600) {
                // Rain
                weatherWidget.style.background = isDaytime
                    ? 'linear-gradient(135deg, #536976, #292E49)'
                    : 'linear-gradient(135deg,rgb(0, 2, 12),rgb(17, 17, 17))';
            } else if (weatherId >= 600 && weatherId < 700) {
                // Snow
                weatherWidget.style.background = isDaytime
                    ? 'linear-gradient(135deg, #E6DADA, #274046)'
                    : 'linear-gradient(135deg,rgb(10, 10, 10), #b6fbff)';
            } else if (weatherId >= 700 && weatherId < 800) {
                // Atmosphere (fog, mist, etc)
                weatherWidget.style.background = isDaytime
                    ? 'linear-gradient(135deg, #B79891, #94716B)'
                    : 'linear-gradient(135deg, #606c88,rgb(15, 15, 15))';
            } else if (weatherId === 800) {
                // Clear sky
                weatherWidget.style.background = isDaytime
                    ? 'linear-gradient(135deg,rgb(15, 15, 15),rgb(13, 13, 14))'
                    : 'linear-gradient(135deg, #141E30, #243B55)';
            } else {
                // Clouds
                weatherWidget.style.background = isDaytime
                    ? 'linear-gradient(135deg,rgb(12, 12, 12), #eef2f3)'
                    : 'linear-gradient(135deg, #232526, #414345)';
            }
            
            // Show the weather content and hide the loading spinner
            document.getElementById('weather-loading').style.display = 'none';
            document.getElementById('weather-content').style.display = 'flex';
        }
        
        // Handle errors when trying to get the user's location
        function handleLocationError(error) {
            console.warn("Geolocation error:", error);
            let errorMsg = "We couldn't access your location";
            
            if (error.code === 1) {
                errorMsg = "Location access denied. Please enable location services or search for a location.";
            } else if (error.code === 2) {
                errorMsg = "Your location is currently unavailable. Please try searching instead.";
            } else if (error.code === 3) {
                errorMsg = "Location request timed out. Please try searching for your location.";
            }
            
            showWeatherError(errorMsg);
            
            // Still show the weather content so they can search
            document.getElementById('weather-content').style.display = 'flex';
            weatherStatusEl.innerHTML = '<i class="bi bi-exclamation-triangle"></i> Location not available';
        }
        
        // Show an error message in the weather widget
        function showWeatherError(message) {
            const errorBox = document.getElementById('weather-error');
            errorBox.textContent = message;
            document.getElementById('weather-loading').style.display = 'none';
            errorBox.style.display = 'block';
        }
    });