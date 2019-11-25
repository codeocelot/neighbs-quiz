import React, { useEffect, useState } from 'react';
import {geolocated } from 'react-geolocated';
import { insidePolygon } from 'geolocation-utils';
import _data from './data.json';

const data = _data;

function Geolocated(props) {
  const [neighb, setNeighb] = useState();
  const { latitude: lat, longitude: lon } = props.coords || {};
  useEffect(
    () => {
      if (lat) {
        const neighb = data.find((d) => insidePolygon([lat, lon], d['the_geom'] ));
        if (neighb) {
          setNeighb(neighb.name);
        }
      }
    },
    [lat, lon]
  )
  return !props.isGeolocationAvailable
    ? <div>Your browser does not support Geolocation</div>
    : !props.isGeolocationEnabled
      ? <div>Geolocation is not enabled</div>
      : props.coords
        ? neighb 
            ? (
              <div>
              <h3>Current Neigbourhood: {neighb}</h3>
              </div>
            )
            : (
              <div>Could not find current neighbourhood.  Are you in the city?</div>
            )
        : <div>Getting the location data&hellip; </div>;
}


export default geolocated({
  positionOptions: {
    enableHighAccuracy: true,
  },
  watchPosition: true,
  userDecisionTimeout: 5000,
})(Geolocated);