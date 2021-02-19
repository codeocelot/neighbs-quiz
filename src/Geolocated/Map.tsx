import * as d3 from 'd3';
import { Selection } from 'd3';
import { geoMercator, geoPath } from 'd3-geo';
import React, { createRef, useLayoutEffect, useRef, useMemo, useState } from 'react';
import data from '../geojson.json';
import polygonsIntersect from 'polygons-intersect';

const DEFAULT_FILL = 'rgb(175, 157, 150)';

interface IProps {
  location: {
    lat?: number, 
    lon?: number,
    accuracy?: number,
  },
  neighb?: string
}

export default function Map(props: IProps): JSX.Element {
  const rootRef = useMemo(() => createRef<HTMLDivElement>(), []);
  let svg = useRef<Selection<SVGSVGElement, unknown, null, undefined>>();

  const tooltipRef = useRef() as React.MutableRefObject<Selection<SVGTextElement, any, null, undefined>>;
  const [intersectingNeighbs, setIntersectingNeighbs] = useState<string[]>([]);

  const { location: { lat, lon, accuracy }, neighb } = props;

  const projection = useMemo(
    () => geoMercator().scale(1).translate([0, 0]).precision(0),
    []
  );

  useLayoutEffect(
    () => {
      
      const ref = rootRef.current;
      if (!ref) {
        return;
      }

      const width = window.outerWidth;
      const height = window.outerHeight * 0.85 - 100;
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
        .attr('class', 'neighb')
        .attr("d", path as any)
        .attr('data-id', (d: any) => d.id)
        .attr('data-name', (d: { properties: { name: string; }; }) => d.properties.name)
        .attr('id', (d: { properties: { name: string; }; }) => d.properties.name)
        .attr('pointer-events', 'all')
        .style("fill", DEFAULT_FILL).style("stroke", "#ffffff")
        .on("mousemove", function(d: any){
          if (!tooltipRef.current && svg.current) {
            tooltipRef.current = svg.current.append('text')
          }
          const [clat, clon] = path.centroid(d)
          if (svg.current) {
            svg.current.select('text')
              .attr('y', clon)
              .attr('x', clat)
              .text(d.properties.name)
              .attr('text-anchor', 'middle')
              .attr('pointer-events', 'none')
          }
        })
        .on("mouseout", function(){
          if (tooltipRef.current && svg.current) {
            svg.current.select('text').text('')
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
    if (svg.current && lat && lon && accuracy) {
      const circumference = 6371000 * Math.PI * 2;

      const angle = accuracy / circumference * 360;

      const circle = d3.geoCircle().center([lon, lat]).radius(angle);
      const path = geoPath().projection(projection);

      const circleCoords = circle().coordinates[0].map(([y, x]) => ({ x, y }))
      const intersecting = data.features.filter((feature) => {
        const coords = feature.geometry.coordinates[0][0].map(([y, x]: number[]) => ({ y, x }))
        const out = polygonsIntersect(coords, circleCoords)

        return out.length;
      })

      if (intersecting.length) {
        setIntersectingNeighbs(intersecting
          .map((feature) => feature.properties.name)
          .filter((intersectingNeighb) => intersectingNeighb !== neighb));
      }

      svg.current.selectAll('path.location')
        .data([lon, lat])
        .join(
          (enter) => enter
            .append("path")
            .attr('class', 'location')
            .attr("d", path(circle()) || 2)
            .attr("fill","red"),
          (update) => update
            .attr('d', path(circle()) || 2)
        );
    }

  }, [accuracy, lat, lon, neighb, projection])

  return (
    <div style={{margin: 'auto auto'}}>
      {!!intersectingNeighbs.length && <span>Given GPS accuracy, you may also be within {
      intersectingNeighbs.length > 1
        ? intersectingNeighbs.slice(0, -1).join(', ') + ' or ' + intersectingNeighbs.slice(-1)
        : intersectingNeighbs[0]
      }</span>}
      <div ref={rootRef}/>
    </div>
  );
}
