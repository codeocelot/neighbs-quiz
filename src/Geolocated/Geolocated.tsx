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
    <span>Current neighborhood {neighb}</span>
  </div>
}

function GeolocationIsNotEnabled() {
  return (<div>
    <span>Geolocation is not available.</span>
  </div>)
}

function Geolocated(props: GeolocatedProps) {
  const [neighb, setNeighb] = useState<string>();
  const { latitude: lat, longitude: lon, accuracy } = props.coords || {};
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
      <Map location={{lat, lon, accuracy}} neighb={neighb} />
      <div>
        <span>Think you know SF well?  <Link to="/quiz">Take our neighborhood quiz</Link></span>
      </div>
      <hr/>
        <details className="credits">
          <summary>About</summary>
          <div>
            <p>This page will determine which neighborhood of San Francisco you are currently in.  You'll need to be in the city boundaries of San Francisco for this page to be useful for you. If you're not, you can still test your knowledge of the 117 neighborhoods in San Francisco on the <a href="/#/quiz">quiz page</a></p>
            <p>No APIs were harmed in the making of this app. Your location is used solely to determine where you are in the city. Your location data never leaves your browser, and is never shared with anyone, period. Your visit is logged to Google Analytics, simply so I can know how popular this app gets, if it ever does.</p>
            <a href='https://github.com/codeocelot/neighbs-quiz'>Github Repo</a>
            <section>
              <h3>Credits</h3>
              <p>There are many unsung heros who publish their hard work with little recognition and without this project would never exist. Among them:</p>
              <ul>
                <li>The City of San Francisco, and in particular, the lovely folks at <a href="https://datasf.org/opendata/">DataSF</a> for publishing a <a href="https://data.sfgov.org/Geographic-Locations-and-Boundaries/SF-Find-Neighborhoods/pty2-tcw4">list</a> of neighborhood boundaries.</li>
                <li><a href="https://github.com/d3/d3">d3</a></li>
                <li><a target="blank" rel="noreferrer noopener" href="https://bitbucket.org/teqplay/geolocation-utils#readme">geolocation-utils</a></li>
                <li><a target="blank" rel="noreferrer noopener" href="https://github.com/no23reason/react-geolocated">react-geolocated</a></li>
                <li><a target="blank" rel="noreferrer noopener" href="https://github.com/DudaGod/polygons-intersect#readme">polygons-intersect</a></li>
              </ul>
            </section>
          </div>
        </details>

    </div>
  );
}


const Geo = geolocated({
  positionOptions: {
    enableHighAccuracy: true,
  },
  watchPosition: true,
  userDecisionTimeout: 5000,
})(Geolocated);


export default Geo
