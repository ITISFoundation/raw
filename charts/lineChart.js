/* global raw, d3 */

(function() {
  let model = raw.model();

  let x = model.dimension()
    .title('X Axis')
    .types(Number)

  let traces = model.dimension('traces')
    .title('Y Axis')
    .types(Number)
    .required(1)
    .multiple(true);

  model.map(data => {
    if (!traces()) {
      return;
    }
    return data.map((d, idx) => {
      let obj = {
        x: {},
        y: {}
      };
      if (x() === null) {
        obj['x'] = idx;
      } else {
        obj['x'] = +x(d);
      }
      traces().forEach(t => {
        obj.y[t] = +d[t];
      })
      return obj;
    })
  })


  let chart = raw.chart()
    .title("Line chart")
    .description("Line charts display information as a series of data points called 'markers' connected by straight line segments")
    .thumbnail("imgs/lineChart.png")
    .category('Other')
    .model(model)

  // visualiziation options
  // Width
  const width = chart.number()
    .title('Width')
    .defaultValue(800)

  // Height
  const height = chart.number()
    .title('Height')
    .defaultValue(600)

  // Margin
  const margins = chart.number()
    .title('Margin')
    .defaultValue(40)

  // Radius
  const dots = chart.number()
    .title('Dot radius')
    .defaultValue(2)

  // Legend width
  const legendWidth = chart.number()
    .title('Legend width')
    .defaultValue(100)

  // Chart colors
  const colors = chart.color()
    .title("Color scale")

  // Drawing function
  // selection represents the d3 selection (svg)
  // data is not the original set of records
  // but the result of the model map function
  chart.draw((selection, data) => {
    let g = selection
      .attr("width", +width())
      .attr("height", +height())
      .append("g")

    // Define margins
    const margin = {
      top: margins(),
      right: margins(),
      bottom: margins(),
      left: margins()
    };

    const w = width() - margin.left;
    const h = height() - margin.bottom;
    const xAxisLabelHeight = 35;

    // Define color scale domain
    // Get the list of all possible values from first element
    // Use it to define the colors domain
    const allColors = Object.keys(data[0].y);
    colors.domain(allColors);

    // svg size
    selection
      .attr("width", width() + legendWidth())
      .attr("height", height())

    const xScale = d3.scaleLinear()
      .domain([d3.min(data, d => {
        return d.x;
      }), d3.max(data, d => {
        return d.x;
      })])
      .range([margin.left, width()-margin.left]);

    const yScale = d3.scaleLinear()
      .domain([d3.min(data, d => {
        return d3.min(Object.values(d.y));
      }), d3.max(data, d => {
        return d3.max(Object.values(d.y));
      })])
      .range([height()-margin.left, margin.left]);

    // Draw charts
    traces().forEach(t => {
      let valueline = d3.line()
        .x(d => {
          return xScale(d.x);
        })
        .y(d => {
          return yScale(d.y[t]);
        });

      selection.append("path")
        .datum(data)
        .attr("class", "line")
        .style("fill", "none")
        .style("stroke", () => {
          return colors()(t);
        })
        .attr("d", valueline);

      // Dots
      selection.selectAll("line-circle")
        .data(data)
        .enter().append("circle")
        .attr("class", "data-circle")
        .attr("r", dots())
        .attr("cx", d => {
          return xScale(d.x);
        })
        .attr("cy", d => {
          return yScale(d.y[t]);
        })
        .attr("fill", () => {
          return colors()(t);
        })
    });

    // After all the charts, draw axes
    selection.append("g")
      .attr("class", "x axis")
      .style("font-size", "10px")
      .style("font-family", "Arial, Helvetica")
      .attr("transform", "translate(" + margin.left + "," + (h*data.length) + ")")
      .call(d3.axisBottom(xScale));

    // text label for the x axis
    g.append("text")
      .attr("transform", "translate("+ (width()/2) +","+ (height()-margin.top+xAxisLabelHeight) +")")
      .style("text-anchor", "middle")
      .text(x() ? x()[0] : 'x');

    const xAxis = d3.axisBottom(xScale).tickSize(6, -h);
    const yAxis = d3.axisLeft(yScale).ticks(10).tickSize(6, -w);

    g.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(" + margin.left + ",0)")
      .call(yAxis);

    g.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + h + ")")
      .call(xAxis);

    g.selectAll(".axis")
      .selectAll("text")
      .style("font", "10px Arial, Helvetica")

    g.selectAll(".axis")
      .selectAll("path")
      .style("fill", "none")
      .style("stroke", "#000000")
      .style("shape-rendering", "crispEdges")

    g.selectAll(".axis")
      .selectAll("line")
      .style("fill", "none")
      .style("stroke", "#000000")
      .style("shape-rendering", "crispEdges")


    // Legend
    const legendXPos = width();
    const legendYPos = 20;
    g.append("g")
      .attr("class", "legendOrdinal")
      .attr("transform", "translate("+legendXPos+",+"+legendYPos+")");

    let labels = [];
    let rgbs = [];
    traces().forEach(t => {
      labels.push(t);
      rgbs.push(colors()(t));
    });
    const ordinal = d3.scaleOrdinal()
      .domain(labels)
      .range(rgbs);

    const legendOrdinal = d3.legendColor()
      .scale(ordinal);
    
    g.select(".legendOrdinal")
      .call(legendOrdinal);
  })
})();
