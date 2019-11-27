import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {geolocated, GeolocatedProps } from 'react-geolocated';
import { insidePolygon, toLatLon } from 'geolocation-utils';
import data from '../data.json';
import Map from './Map';

function PleaseEnableGeo() {
  return <div>
    <span>Please enable geolocation to find your location in the city.</span>
  </div>
}

function CurrentNeighb({ neighb }: { neighb: string }) {
  return <div>
    <span>Current Neighbourhood {neighb}</span>
  </div>
}

function GeolocationIsNotEnabled() {
  return (<div>
    <span>Geolocation is not available.</span>
  </div>)
}

function Geolocated(props: GeolocatedProps) {
  const [neighb, setNeighb] = useState<string>();
  const { latitude: lat, longitude: lon } = props.coords || {};
  useEffect(
    () => {
      if (lat && lon) {
        const neighb = data.find((d) => insidePolygon(
          toLatLon({lat, lon}), 
          d['the_geom'].map(([lat, lon]) => ({ lat, lon })))
        );
        if (neighb) {
          setNeighb(neighb.name);
        }
      }
    },
    [lat, lon]
  );
  const { isGeolocationEnabled, isGeolocationAvailable } = props;
  return (
    <div>
      { !isGeolocationEnabled && <PleaseEnableGeo />}
      { !isGeolocationAvailable && <GeolocationIsNotEnabled />}
      { neighb && <CurrentNeighb neighb={neighb} />}
      <Map location={{lat, lon}} />
      <div>
        <span>Think you know SF well?  <Link to="/quiz">Take our neighborhood quiz</Link></span>
      </div>

    </div>
  );
}


export default geolocated({
  positionOptions: {
    enableHighAccuracy: true,
  },
  watchPosition: true,
  userDecisionTimeout: 5000,
})(Geolocated);