import * as d3 from 'd3';
import { Selection, event } from 'd3';
import { geoMercator, geoPath } from 'd3-geo';
import React, { useEffect, createRef, useState, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import data from './geojson.json';
import shuffle from './shuffle';

const DEFAULT_FILL = 'rgb(175, 157, 150)';
const WRONG_FILL = 'red';
const CORRECT_FILL = 'green';


export default function Map(): JSX.Element {
  const [missed, setMissed] = useState<string[]>([]);
  const [neighbToFind, setNeighb] = useState();
  const [allNeighbs, setAllNeighbs] = useState(shuffle(data.features.map((d) => d.properties.name)));
  const [selected, setSelected] = useState();
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

  const applyMouseover = useCallback((el: Selection<d3.BaseType, {}, null, undefined>, text: string | ((d: any) => string)) => {
    return el.on("mousemove", function(d: any){
      if (tooltipRef.current) {
        tooltipRef.current.style.top = (event.pageY-10)+"px";
        tooltipRef.current.style.left = (event.pageX+10)+"px";
        tooltipRef.current.style.visibility = 'visible';
        tooltipRef.current.innerHTML = typeof text === 'function' ? text(d) : text;
      }
    })
    .on("mouseout", function(){
      if (tooltipRef.current) {
        tooltipRef.current.style.visibility = 'hidden';
      }
    });
  },[tooltipRef]);

  const removeMouseover = useCallback((el: Selection<d3.BaseType, {}, null, undefined>) => {
    return el.on("mousemove", null).on("mouseout", null);
  },[])

  useEffect(
    () => {
      d3.selectAll('svg path')
        .each(function(this: any) { removeMouseover(d3.select(this))});
      resetBoard();
    },
    [applyMouseover, removeMouseover]
  );

  useEffect(
    () => {
      if (!selected) {
        return;
      }

      d3.selectAll('svg path').filter((d: any) => d.properties.name === selected)
        .style('fill', '#FFEB3B');
      return () => {
        d3.selectAll('svg path').filter((d: any) => d.properties.name === selected)
        .style('fill', function(d: any) {
          if (allNeighbs.includes(d.properties.name)) {
            return DEFAULT_FILL;
          }
          else if (missed.includes(d.properties.name)) {
            return WRONG_FILL;
          }
          return CORRECT_FILL;
        })}
    },
    [selected, allNeighbs, missed]
  );

  useEffect(
    () => {
      if (!neighbToFind) {
        return;
      }

      function eventHandler(this: any, d: any) {
        if (d.properties.name !== selected) {
          return setSelected(d.properties.name);
        }
        else if (d.properties.name === neighbToFind) {
          d3.selectAll('svg path').filter((dd: any) => d.properties.name === dd.properties.name)
            .each(function(el: any){
              d3.select(this).style('fill', CORRECT_FILL).style('opacity', 1);
              applyMouseover(d3.select(this), el.properties.name);
            })
        } else {
          d3.selectAll('svg path').filter((dd: any) => neighbToFind === dd.properties.name)
            .each(function(el: any){
              d3.select(this).style('fill', WRONG_FILL).style('opacity', 1)
              applyMouseover(d3.select(this), el.properties.name);
            })
          setMissed((misses) => misses.concat(neighbToFind));
        }
        if (svg.current) {
          svg.current.selectAll('path').on('mouseover', function() {
            d3.select(this).style('opacity', 0.5);
          });
        }
        setSelected(null);
        nextNeighb();
      }

      d3.selectAll('path')
        .on('click', (d: any) => [...allNeighbs, neighbToFind].includes(d.properties.name) ? eventHandler(d) : null );
    },
    [neighbToFind, nextNeighb, allNeighbs, selected, tooltipRef, applyMouseover]
  )

  useLayoutEffect(
    () => {
      
      const ref = rootRef.current;
      if (!ref) {
        return;
      }

      const width = window.outerWidth;
      const height = window.outerHeight - 200;
      svg.current = d3.select(ref).append("svg").attr("width", width).attr("height", height);

      const projection = geoMercator().scale(1).translate([0, 0]).precision(0);
      const path = geoPath().projection(projection);
      const bounds = path.bounds(data as any);

      const xScale = width / Math.abs(bounds[1][0] - bounds[0][0]);
      const yScale = height / Math.abs(bounds[1][1] - bounds[0][1]);
      const scale = xScale < yScale ? xScale : yScale;

      const transl: [number, number] = [(width - scale * (bounds[1][0] + bounds[0][0])) / 2, (height - scale * (bounds[1][1] + bounds[0][1])) / 2];
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

  const GameMode = () => (
    <div className="pure-u-1 pure-u-md-1-3">
      <button type="button" onClick={startGame} id="start-game-btn">Start New Game</button>
      { neighbToFind && <div>
        <div><p>Can you find and click on {neighbToFind}?</p></div>
        <div><button type="button" onClick={skip}>Skip and come back later</button></div>
        </div>}
        {selected && <span>Tap again to confirm</span>}
    </div>
  )

  const BottomRow = () => (
    <div className="pure-u-1 pure-u-md-1-3">
      <span>Having trouble? <Link to={'/location'}>Quit the quiz and learn the neighbs</Link></span>
    </div>
  )

  return (
    <div>

      <div style={{margin: 'auto auto'}} className="pure-g">
        <div className="pure-u-1 pure-u-md-1-3">
          <GameMode />
        </div>
        <div ref={rootRef} className="pure-u-1"/>
        <aside style={{float: 'right'}} className="pure-u-1 ure-u-md-1-2">
            <h4>Missed Neighbs</h4>
            <pre>{JSON.stringify(missed, null, 2)}</pre>
        </aside>
        <BottomRow />
      </div>
      <div id="tooltip" ref={tooltipRef} style={{position: 'absolute', 'zIndex': 10, visibility: 'hidden'}}></div>
    </div>
  );
}
