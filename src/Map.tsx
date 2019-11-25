import * as d3 from 'd3';
import { Selection } from 'd3';
import { geoMercator, geoPath } from 'd3-geo';
import React, { useEffect, createRef, useState, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import data from './geojson.json';
import shuffle from './shuffle';

const DEFAULT_FILL = 'rgb(175, 157, 150)';
const WRONG_FILL = 'red';
const CORRECT_FILL = 'green';

export default function Map(): JSX.Element {
  const [missed, setMissed] = useState([]);
  const [neighbToFind, setNeighb] = useState();
  const [allNeighbs, setAllNeighbs] = useState(shuffle(data.features.map((d) => d.properties.name)));
  const rootRef = useMemo(() => createRef<HTMLDivElement>(), []);
  let svg = useRef<Selection<SVGSVGElement, unknown, null, undefined>>();


  function startGame() {
    setAllNeighbs(shuffle(data.features.map((d) => d.properties.name)));
    setMissed([]);
    d3.selectAll('svg path').style("fill", DEFAULT_FILL).style("stroke", "#ffffff");
    nextNeighb();
  }

  const nextNeighb = useCallback(function nextNeighb() {
    setNeighb(allNeighbs[0]);
    setAllNeighbs(allNeighbs.slice(1));
    if (allNeighbs.length === 0) {
      alert(`game done. Score ${(1-(missed.length/data.features.length))*100}% correct`);
    }
  }, [allNeighbs, missed.length])

  function skip() {
    setNeighb(allNeighbs[0]);
    setAllNeighbs(allNeighbs.slice(1).concat(neighbToFind));
  }

  useEffect(
    () => {
      if (!neighbToFind) {
        return;
      }

      function eventHandler(this: any, d: any) {
        if (d.properties.name === neighbToFind) {
          d3.selectAll('svg path').filter((dd: any) => d.properties.name === dd.properties.name)
            .each(function(el){
              d3.select(this).style('fill', CORRECT_FILL).style('opacity', 1);
            })
        } else {
          d3.selectAll('svg path').filter((dd: any) => neighbToFind === dd.properties.name)
            .each(function(el: any){
              d3.select(this).style('fill', WRONG_FILL).style('opacity', 1);
              d3.select(this).insert('text')
                .attr('dy', '0.5em')
                .text(el.properties.name);
            })
          setMissed((misses) => misses.concat(neighbToFind));
        }
        console.log(this);
        if (svg.current) {
          svg.current.selectAll('path').on('mouseover', function() {
            d3.select(this).style('opacity', 0.5);
          });
        }
        nextNeighb();
      }

      d3.selectAll('path')
        .on('click', (d: any) => [...allNeighbs, neighbToFind].includes(d.properties.name) ? eventHandler(d) : null );
    },
    [neighbToFind, nextNeighb, allNeighbs]
  )

  useLayoutEffect(
    () => {
      
      const ref = rootRef.current;
      if (!ref) {
        return;
      }

      var width = 600, height = 600;
      svg.current = d3.select(ref).append("svg").attr("width", width).attr("height", height);

      var projection = geoMercator().scale(1).translate([0, 0]).precision(0);
      var path = geoPath().projection(projection);
      var bounds = path.bounds(data as any);

      let xScale = width / Math.abs(bounds[1][0] - bounds[0][0]);
      let yScale = height / Math.abs(bounds[1][1] - bounds[0][1]);
      let scale = xScale < yScale ? xScale : yScale;

      var transl: [number, number] = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];
      projection.scale(scale).translate(transl);

      svg.current.selectAll("path")
        .data(data.features)
        .enter()
        .append("path")
        .attr("d", path as any)
        .attr('data-id', (d: any) => d.id)
        .attr('data-name', (d: { properties: { name: string; }; }) => d.properties.name)
        .attr('id', (d: { properties: { name: string; }; }) => d.properties.name)
        .attr('pointer-events', 'all')
        .style("fill", DEFAULT_FILL).style("stroke", "#ffffff");

      svg.current.selectAll('path').on('mouseover', function() {
        d3.select(this).style('opacity', 0.5);
      });
      svg.current.selectAll('path').on('touchend', function() {
        d3.select(this).style('opacity', 1);
      });
      svg.current.selectAll('path').on('mouseleave', function() {
        d3.select(this).style('opacity', 1);
      });
    },
    [rootRef]
  );

  return (
    <div style={{width: '900px', padding: '30px', margin: 'auto auto'}}>
      <button type="button" onClick={startGame} id="start-game-btn">Start New Game</button>
      { neighbToFind && <div>
        <div><p>Can you find and click on {neighbToFind}?</p></div>
        <div><button type="button" onClick={skip}>Skip and come back later</button></div>
        </div>}
      <aside style={{float: 'right'}}>
        <h4>Missed Neighbs</h4>
        <pre>{JSON.stringify(missed, null, 2)}</pre>
      </aside>
      <div ref={rootRef}/>
    </div>
  );
}