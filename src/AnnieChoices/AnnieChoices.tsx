import * as d3 from 'd3';
import { Selection, event } from 'd3';
import { geoMercator, geoPath } from 'd3-geo';
import React, { Fragment, useEffect, createRef, useState, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import data from '../geojson.json';
import annieChoices from './choices.json';
import shuffle from '../shuffle';

const DEFAULT_FILL = 'rgb(175, 157, 150)';
const WRONG_FILL = 'red';
const CORRECT_FILL = 'green';

enum Mode {
  game,
  learn,
}

export default function Map(): JSX.Element {
  const [missed, setMissed] = useState<string[]>([]);
  const [neighbToFind, setNeighb] = useState();
  const [allNeighbs, setAllNeighbs] = useState(shuffle(data.features.map((d) => d.properties.name)));
  const [mode, setMode] = useState<Mode>(Mode.game);
  const rootRef = useMemo(() => createRef<HTMLDivElement>(), []);
  let svg = useRef<Selection<SVGSVGElement, unknown, null, undefined>>();

  const tooltipRef = useRef() as React.MutableRefObject<HTMLInputElement>;

  function resetBoard() {
    setAllNeighbs(shuffle(data.features.map((d) => d.properties.name)));
    setMissed([]);
    d3.selectAll('svg path').style("fill", DEFAULT_FILL).style("stroke", "#ffffff");
  }

  function startGame() {
    resetBoard();
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
        .style("fill", (d: any) => annieChoices.includes(d.properties.name) ? CORRECT_FILL: DEFAULT_FILL)
        .style("stroke", "#ffffff");

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

  const GameMode = () => (
    mode === Mode.game 
    ? (
      <Fragment>
        <button type="button" onClick={startGame} id="start-game-btn">Start New Game</button>
        { neighbToFind && <div>
          <div><p>Can you find and click on {neighbToFind}?</p></div>
          <div><button type="button" onClick={skip}>Skip and come back later</button></div>
          </div>}
        <aside style={{float: 'right'}}>

          <h4>Missed Neighbs</h4>
          <pre>{JSON.stringify(missed, null, 2)}</pre>
        </aside>
      </Fragment>
    ) : (
      <div/>
    )
  )

  return (
    <div style={{width: '900px', padding: '30px', margin: 'auto auto'}}>
      <div>
        <label htmlFor="game-mode">Learn Mode</label>
        <input type="checkbox" name="game-mode" onChange={() => setMode(mode === Mode.game ? Mode.learn : Mode.game)} />
      </div>
      <div>
        <GameMode />
      </div>
      <div ref={rootRef}/>
      <div id="tooltip" ref={tooltipRef} style={{position: 'absolute', 'zIndex': 10, visibility: 'hidden'}}></div>

    </div>
  );
}
