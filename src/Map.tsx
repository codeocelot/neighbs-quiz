import * as d3 from 'd3';
import { Selection } from 'd3';
import { geoMercator, geoPath } from 'd3-geo';
import React, { useEffect, createRef, useState, useLayoutEffect, useRef, useMemo } from 'react';
import data from './geojson.json';

let names = data.features.map((d) => d.properties.name);

function shuffle(a: string[]): string[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

shuffle(names);

export default function Map(): JSX.Element {
  const [missed, setMissed] = useState([]);
  const [neighbToFind, setNeighb] = useState();
  const rootRef = useMemo(() => createRef<HTMLDivElement>(), []);
  let svg = useRef<Selection<SVGSVGElement, unknown, null, undefined>>();

  function startGame() {
    names = shuffle(data.features.map((d) => d.properties.name));
    setMissed([]);
    d3.selectAll('svg path').style("fill", "#FB5B1F").style("stroke", "#ffffff");
    nextNeighb();
  }

  function nextNeighb() {
    setNeighb(names[0]);
    names = names.slice(1);
    if (!names.length) {
      alert('game done')
    }
  }

  useEffect(
    () => {
      if (!neighbToFind) {
        return;
      }
      d3.selectAll('path').on('click', function(d: any) {
        if (d.properties.name === neighbToFind) {
          d3.selectAll('svg path').filter((dd: any) => d.properties.name === dd.properties.name)
            .each(function(el){
              d3.select(this).style('fill', 'green').style('opacity', 1);
            })
        } else {
          d3.selectAll('svg path').filter((dd: any) => neighbToFind === dd.properties.name)
            .each(function(el: any){
              d3.select(this).style('fill', 'red').style('opacity', 1);
              d3.select(this).insert('text')
                .attr('dy', '0.5em')
                .text(el.properties.name);
            })
          setMissed((misses) => misses.concat(neighbToFind));
        }
        nextNeighb();
      })
    },
    [neighbToFind]
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
        .attr('pointer-events', 'all')
        .style("fill", "#FB5B1F").style("stroke", "#ffffff");

      svg.current.selectAll('path').on('mouseover', function() {
        d3.select(this).style('opacity', 0.5);
      });
      svg.current.selectAll('path').on('mouseleave', function() {
        d3.select(this).style('opacity', 1);
      })
    },
    [rootRef]
  );
  return (
    <div style={{width: '900px', padding: '30px', margin: 'auto auto'}}>
      <button type="button" onClick={startGame}>Start New Game</button>
      { neighbToFind && <div><p>Can you find and click on {neighbToFind}?</p></div>}
      <aside style={{float: 'right'}}>
        <h4>Missed Neighbs</h4>
        <pre>{JSON.stringify(missed, null, 2)}</pre>
      </aside>
      <div ref={rootRef}/>
    </div>
  );
}