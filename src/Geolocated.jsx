import React, { useEffect, useState } from 'react';
import {geolocated } from 'react-geolocated';
import { insidePolygon } from 'geolocation-utils';
import _data from './data.json';

const data = _data;

function Demo(props) {
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
        ? <div>
          <h3>Neigbourhood {neighb}</h3>
          <table>
          <tbody>
            <tr><td>latitude</td><td>{props.coords.latitude}</td></tr>
            <tr><td>longitude</td><td>{props.coords.longitude}</td></tr>
            {/* <tr><td>altitude</td><td>{props.coords.altitude}</td></tr>
            <tr><td>heading</td><td>{props.coords.heading}</td></tr>
            <tr><td>speed</td><td>{props.coords.speed}</td></tr> */}
          </tbody>
        </table>
        </div>
        : <div>Getting the location data&hellip; </div>;
}


export default geolocated({
  positionOptions: {
    enableHighAccuracy: true,
  },
  userDecisionTimeout: 5000,
})(Demo);