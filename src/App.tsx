import React from 'react';
import './App.css';
import Map from './Map';
import Geolocated from './Geolocated';

if (process.env.NODE_ENV === 'production') {
  if(window.location.href.substr(0,5) !== 'https'){
    window.location.href = window.location.href.replace('http', 'https');
  }
}


const App: React.FC = () => {
  return (
    <div className="App">
      <div>
        <Geolocated />
        <Map />
      </div>
    </div>
  );
}

export default App;
