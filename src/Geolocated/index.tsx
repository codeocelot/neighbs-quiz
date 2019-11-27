import React from 'react';
import Geolocated from './Geolocated';
import Map from './Map';

export default function GeolocatedMap(): JSX.Element {
  return (<div className="located-page page">
    <Geolocated />
    {/* <Map /> */}
  </div>)
}