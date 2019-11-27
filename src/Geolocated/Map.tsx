import * as d3 from 'd3';
import { Selection, event } from 'd3';
import { geoMercator, geoPath } from 'd3-geo';
import React, { createRef, useLayoutEffect, useRef, useMemo } from 'react';
import data from '../geojson.json';

const DEFAULT_FILL = 'rgb(175, 157, 150)';

interface IProps {
  location: {
    lat?: number, 
    lon?: number,
  }
}

export default function Map(props: IProps): JSX.Element {
  const rootRef = useMemo(() => createRef<HTMLDivElement>(), []);
  let svg = useRef<Selection<SVGSVGElement, unknown, null, undefined>>();

  const tooltipRef = useRef() as React.MutableRefObject<HTMLInputElement>;

  const { location: { lat, lon }} = props;

  const projection = useMemo(
    () => geoMercator().scale(1).translate([0, 0]).precision(0),
    []
  )

  useLayoutEffect(
    () => {
      
      const ref = rootRef.current;
      if (!ref) {
        return;
      }

      const width = window.outerWidth, height = window.outerHeight * 0.8;
      svg.current = d3.select(ref).append("svg").attr("width", width).attr("height", height);

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
        .style("fill", DEFAULT_FILL).style("stroke", "#ffffff")
        .on("mousemove", function(d: any){
          if (tooltipRef.current) {
            tooltipRef.current.style.top = (event.pageY-10)+"px";
            tooltipRef.current.style.left = (event.pageX+10)+"px";
            tooltipRef.current.style.visibility = 'visible';
            tooltipRef.current.innerHTML = d.properties.name;
          }
        })
        .on("mouseout", function(){
          if (tooltipRef.current) {
            tooltipRef.current.style.visibility = 'hidden';
          }
        });

      svg.current.selectAll('path').on('mouseover', function() {
        d3.select(this).style('opacity', 0.5);
      });
      svg.current.selectAll('path').on('touchend', function() {
        d3.select(this).style('opacity', 1);
      });
      svg.current.selectAll('path').on('mouseleave', function() {
        d3.select(this).style('opacity', 1);
      });
      d3.select("svg").attr("align","center")
    },
    [projection, rootRef, tooltipRef]
  );

  useLayoutEffect(() => {
    if (svg.current && lat && lon) {
      svg.current.selectAll('circle')
        .data([[lon, lat]])
        .join(
          (enter) => enter
            .append('circle')
            .attr('cx', (d: any) => (projection(d) as number[])[0])
            .attr('cy', (d: any) => (projection(d) as number[])[1])
            .attr("r", "8px")
            .attr("fill", "red"),
          (update) => update
            .attr('cx', (d: any) => (projection(d) as number[])[0])
            .attr('cy', (d: any) => (projection(d) as number[])[1])
        )
    }

  },[lat, lon, projection])

  return (
    <div style={{margin: 'auto auto'}}>
      <div ref={rootRef}/>
      <div id="tooltip" ref={tooltipRef} style={{position: 'absolute', 'zIndex': 10, visibility: 'hidden'}}></div>
    </div>
  );
}
