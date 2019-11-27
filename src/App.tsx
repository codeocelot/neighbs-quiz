import React from 'react';
import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import './App.scss';
import 'purecss';
import Map from './Map';
import Geolocated from './Geolocated/Geolocated';

if (process.env.NODE_ENV === 'production') {
  if(window.location.href.substr(0,5) !== 'https'){
    window.location.href = window.location.href.replace('http', 'https');
  }
}


const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <div>
          
          <Switch>
            <Route path="/location">
              <Geolocated />
            </Route>
            <Route path="/quiz">
              <Map />
            </Route>
            <Route>
              <Redirect to="/location" />
            </Route>
          </Switch>
        </div>
      </div>
    </Router>
  );
}

export default App;
