import React, { useState, useEffect } from 'react';
import { get, post } from '@aws-amplify/api-rest'; // Correct import
import './App.css';

function App() {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    fetchStates();
    generateYears();
  }, []);

  const fetchStates = async () => {
    try {
      const response = await get({
        apiName: 'RealEstatePredictorAPI',
        path: '/states',
        options: {}
      });
      console.log('States response:', response); // Debug log
    // Handle nested response if necessary
      const data = response.body ? JSON.parse(response.body) : response;
      console.log('Parsed states data:', data); // Debug log
      // Use response directly (already parsed JSON)
      setStates(response.states || []);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchCities = async (state) => {
    if (state) {
      try {
        const response = await get({
          apiName: 'RealEstatePredictorAPI',
          path: `/cities/${state}`,
          options: {}
        });
        // Use response directly (already parsed JSON)
        setCities(response.cities || []);
        setSelectedCity('');
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    }
  };

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    setYears([...Array(11).keys()].map(i => currentYear - 5 + i));
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    fetchCities(state);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = { city: selectedCity, state: selectedState, year: selectedYear };
    try {
      const response = await post({
        apiName: 'RealEstatePredictorAPI',
        path: '/predict',
        options: {
          body
        }
      });
      // Use response directly (already parsed JSON)
      setPrediction(response.predicted_price);
    } catch (error) {
      setPrediction(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="App">
      <h1>Real Estate Price Predictor</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>State: </label>
          <select value={selectedState} onChange={handleStateChange}>
            <option value="">Select State</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        <div>
          <label>City: </label>
          <select value={selectedCity} onChange={e => setSelectedCity(e.target.value)} disabled={!selectedState}>
            <option value="">Select City</option>
            {cities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Year: </label>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)} disabled={!selectedCity}>
            <option value="">Select Year</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={!selectedYear}>Predict</button>
      </form>
      {prediction && <div>Predicted Price: ${Number(prediction).toLocaleString()}</div>}
    </div>
  );
}

export default App;
