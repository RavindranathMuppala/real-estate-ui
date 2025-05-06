import React, { useState, useEffect } from 'react';
import { get, post } from '@aws-amplify/api-rest';
import './App.css';

function App() {
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState(JSON.parse(localStorage.getItem('predictions')) || []);

  useEffect(() => {
    fetchStates();
    generateYears();
  }, []);

  const fetchStates = async () => {
    try {
      const res = await get({
        apiName: 'RealEstatePredictorAPI',
        path: '/states',
        options: {},
      });
      console.log('States response:', res);
      const response = await res.response;
      if (response.body) {
        const rawData = await response.body.json();
        const data = rawData.body ? JSON.parse(rawData.body) : rawData;
        console.log('Parsed states data:', data);
        const sortedStates = (data.states || []).sort((a, b) => a.localeCompare(b));
        setStates(sortedStates);
      } else {
        setError('No states data available.');
      }
    } catch (error) {
      setError('Error fetching states: ' + error.message);
      console.error('Error fetching states:', error);
    }
  };

  const fetchCities = async (state) => {
    if (state) {
      try {
        const res = await get({
          apiName: 'RealEstatePredictorAPI',
          path: `/cities/${state}`,
          options: {},
        });
        console.log('Cities response:', res);
        const response = await res.response;
        if (response.body) {
          const rawData = await response.body.json();
          const data = rawData.body ? JSON.parse(rawData.body) : rawData;
          console.log('Parsed cities data:', data);
          const sortedCities = (data.cities || []).sort((a, b) => a.localeCompare(b));
          setCities(sortedCities);
          setSelectedCity('');
        } else {
          setError('No cities data available for the selected state.');
        }
      } catch (error) {
        setError('Error fetching cities: ' + error.message);
        console.error('Error fetching cities:', error);
      }
    }
  };

  const generateYears = () => {
    const startYear = 2012;
    const endYear = 2100;
    setYears([...Array(endYear - startYear + 1).keys()].map((i) => startYear + i));
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    setSelectedCity('');
    setSelectedYear('');
    setPrediction(null);
    setError('');
    fetchCities(state);
  };

  const validateInputs = () => {
    if (!selectedState || !selectedCity || !selectedYear) {
      setError('Please fill all fields.');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateInputs()) return;

    setLoading(true);
    setPrediction(null);
    setError('');

    const body = { city: selectedCity, state: selectedState, year: parseInt(selectedYear) };
    try {
      const res = await post({
        apiName: 'RealEstatePredictorAPI',
        path: '/predict',
        options: { body },
      });
      console.log('Predict response:', res);
      const response = await res.response;
      if (response.body) {
        const rawData = await response.body.json();
        const data = rawData.body ? JSON.parse(rawData.body) : rawData;
        console.log('Parsed predict data:', data);
        setPrediction(data.predicted_price);
        const newPrediction = {
          city: selectedCity,
          state: selectedState,
          year: selectedYear,
          price: data.predicted_price,
          date: new Date().toLocaleString(),
        };
        const updatedHistory = [...history, newPrediction].slice(-5); // Keep last 5 predictions
        setHistory(updatedHistory);
        localStorage.setItem('predictions', JSON.stringify(updatedHistory));
      } else {
        setError('No prediction data returned.');
      }
    } catch (error) {
      setError(`Error: ${error.response?.data?.error || error.message}`);
      console.error('Error predicting price:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App etched">
      <h1>Real Estate Price Predictor</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>State: </label>
          <select value={selectedState} onChange={handleStateChange}>
            <option value="">Select State</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>City: </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={!selectedState}
          >
            <option value="">Select City</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Year: </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            disabled={!selectedCity}
          >
            <option value="">Select Year</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" disabled={loading || !selectedYear}>
          {loading ? 'Predicting...' : 'Predict'}
        </button>
      </form>
      {loading && <div className="loading">Loading...</div>}
      {error && <div className="error">{error}</div>}
      {prediction && (
        <div className="result">
          Predicted Price: ${Number(prediction).toLocaleString()}
        </div>
      )}
      <div className="history">
        <h3>Prediction History</h3>
        {history.length > 0 ? (
          history.map((item, index) => (
            <p key={index}>
              {index + 1}. {item.city}, {item.state}, {item.year} - $
              {Number(item.price).toLocaleString()} ({item.date})
            </p>
          ))
        ) : (
          <p>No predictions yet.</p>
        )}
      </div>
    </div>
  );
}

export default App;
