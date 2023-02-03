import * as d3 from 'd3';
import { Selection, event, BaseType } from 'd3';
import { geoMercator, geoPath } from 'd3-geo';
import React, { useEffect, createRef, useLayoutEffect, useRef, useMemo, useCallback, SetStateAction, Dispatch } from 'react';
import { Link } from 'react-router-dom';
import data from './geojson.json';
import ListItem from './ListItem';
import shuffle from './shuffle';

const DEFAULT_FILL = 'rgb(175, 157, 150)';
const WRONG_FILL = 'red';
const CORRECT_FILL = 'green';

interface Props {
  missed: string[]
  setMissed: Dispatch<SetStateAction<string[]>>
  neighbToFind: string
  setNeighb: (arg: string) => void
  allNeighbs: string[]
  setAllNeighbs: (arg: string[]) => void
  selected: string
  setSelected: (arg: string) => void
}

interface Feature {
  properties: {
    name: string
  }
}

/*
State
- missed          string[]  strings of missed guesses.
- neighhbToFind   string    current string to find
- allNeighbs      string[]  strings of unfound items
- selected        string    unconfirmed current answer

Events
start
end
new
skip
  selected: false
  neighbToFind: new from allNeighbs
  missed: unchanged

*/
export default function Map(props: Props): JSX.Element {

  const {missed, setMissed, neighbToFind, setNeighb, allNeighbs, setAllNeighbs, selected, setSelected} = props;
  const rootRef = useMemo(() => createRef<HTMLDivElement>(), []);

  let svg = useRef<Selection<SVGSVGElement, unknown, null, undefined>>();

  const tooltipRef = useRef() as React.MutableRefObject<HTMLInputElement>;
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

  const removeTooltips = useCallback(function removeTooltips() {
    d3.selectAll('svg path')
      .each(function(this: any) { removeMouseover(d3.select(this))});
  }, [removeMouseover]);

  const resetBoard = useCallback(function resetBoard() {
    const newArrangement = shuffle(data.features.map((d) => d.properties.name))
    setAllNeighbs(newArrangement.slice(1));
    setNeighb(newArrangement[0])
    setMissed([]);

    d3.selectAll('svg path').style("fill", DEFAULT_FILL).style("stroke", "#ffffff");
    removeTooltips()
  }, [removeTooltips, setNeighb, setAllNeighbs, setMissed])

  function startGame() {
    resetBoard();
  }

  const nextNeighb = useCallback(function nextNeighb() {
    setNeighb(allNeighbs[0]);
    setAllNeighbs(allNeighbs.slice(1));
    if (allNeighbs.length === 0) {
      const score = Math.round((1-(missed.length/data.features.length))*100*100) / 100;
      alert(`game done. Score ${score}% correct`);
    }
  }, [allNeighbs, missed.length, setAllNeighbs, setNeighb])

  function skip() {
    if (neighbToFind) {
      setNeighb(allNeighbs[0]);
      setAllNeighbs(allNeighbs.slice(1).concat(neighbToFind));
    }
  }

  useEffect(
    () => {
      d3.selectAll<BaseType, Feature>('svg path')
      .each(function(el) {
        const name = el.properties.name;
        if (name === selected) {
          d3.select(this).style('fill', '#FFEB3B').style('opacity', 1)
        }
        if (missed.includes(name)) {
          d3.select(this).style('fill', WRONG_FILL).style('opacity', 1)
          applyMouseover(d3.select(this), el.properties.name);
        }
        else if (name !== selected && name !== neighbToFind && !allNeighbs.includes(name)) {
          d3.select(this).style('fill', CORRECT_FILL).style('opacity', 1);
          applyMouseover(d3.select(this), el.properties.name);
        }
      });
      return () => {
        d3.selectAll('svg path').filter((d: any) => d.properties.name === selected)
          .style('fill', function(d: any) {
            return DEFAULT_FILL;
          })
      }
    },
    [applyMouseover, selected, neighbToFind, missed, allNeighbs]
  )

  useEffect(
    () => {
      if (!neighbToFind) {
        return;
      }

      function eventHandler(this: any, d: any) {
        if (!neighbToFind) {
          return
        }
        if (d.properties.name !== selected) {
          return setSelected(d.properties.name);
        }
        else {
          setMissed((misses) => misses.concat(neighbToFind));
        }
        if (svg.current) {
          svg.current.selectAll('path').on('mouseover', function() {
            d3.select(this).style('opacity', 0.5);
          });
        }
        setSelected("");
        nextNeighb();
      }

      d3.selectAll<HTMLElement, Feature> ('path')
        .on('click', (d) => [...allNeighbs, neighbToFind].includes(d.properties.name) ? eventHandler(d) : null );
    },
    [neighbToFind, nextNeighb, allNeighbs, selected, tooltipRef, applyMouseover, setMissed, setSelected]
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
        <div className='prompt'><p>Can you find and click on {neighbToFind}?</p></div>
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
            <h4>Missed Neighborhoods</h4>
            {missed.map((item) => (<ListItem label={item}/>))}
        </aside>
        <BottomRow />
      </div>
      <div id="tooltip" ref={tooltipRef} style={{position: 'absolute', 'zIndex': 10, visibility: 'hidden'}}></div>
    </div>
  );
}
