/*	HorizontalBarChart library file for creating a simple D3 horizontal bar chart (showing bars height left to right) .
 * 
 * 	Parameters: 	id		- jQuery element (e.g. #barChart) that will contain the bar chart
 * 					config	- Optional configuration array that includes options for margin size, width, height, etc.
 * 
 *  Example Use: 	Create the object with a call like: 
 *  					var barChart = new HorizontalBarChart("#barChart", config = {title: "Chart Title", width: 720, height: 500});
 *  
 *  				Then, after creating the object call barChart.redrawChart(data) with your data array to draw the chart.
 *  				An example data array showing "Apples" and "Oranges" as bars would look like:
 *  					{x: 5, y: "Apples"},
 *  					{x: 10, y: "Oranges"}
 *  
 *  				Subsequent calls to redrawChart() will delete the previous chart and draw a new one.
 */
function HorizontalBarChart(id, config) {
		
		config = config ? config : {};
		var margin = {	top: config.top || 60, 
						right: config.right || 45, 
						bottom: config.bottom || 60, 
						left: config.left || 100
					 },
						width = (config.width || 820) - margin.left - margin.right,
						height = (config.height || 860) - margin.top - margin.bottom;
		
		if (config.shrinkWidthToFit === true){
			var windowWidth = $(window).width();
			
			if (windowWidth < width + 100 + margin.left + margin.right){
				width = windowWidth - 100 - margin.left - margin.right;
			}
		}

		var axisFormat = d3.format("d");
		
		var colors = [
						"#5687d1",
						"#7b615c",
						"#de783b",
						"#6ab975",
						"#a173d1",
						"#bbbbbb",
						"#ffaa00",
						"#d1d173",
						"#b96a7e",
						"#028F5C",
						"#1c297c",
						"#ff6666",
						"#b27600"
					  ];
			
		  this.generateColor = function(i) {
			  //hex = Math.floor(Math.random()*16777215).toString(16);
			  hex = Math.floor((i/1000)*16777215).toString(16);

			  return '#' + "000000".substring(0, 6-hex.length) + hex;
		  };
		  
		  this.resetDimensions = function(newWidth, newHeight){
				width = newWidth - margin.left - margin.right;
				height = newHeight - margin.top - margin.bottom;
		  };
			
		  // Draws the chart, expects a data array with 'x' and 'y' values.
		  this.redrawChart = function(data) {
			// Lower chart height if small amount of bars (55 pixel height default)
			  var maxBarHeight = (config.maxBarHeight || 55);
			  if (data.length * maxBarHeight < height){
				  height = (data.length * maxBarHeight) + 20;
			  }
			  
			  d3.select(id).selectAll('svg').remove();
			  this.createChart(data);
		  };
		  
		  this.createChart = function(data) {
		  
				var colorOrdinal = d3.scale.ordinal()
						.range(colors);

				var x = d3.scale.linear()
					.range([0, width]);

				var y = d3.scale.ordinal()
					.rangeRoundBands([0, height], .1, 0.5);

				var xAxis = d3.svg.axis()
					.scale(x)
					.orient("bottom")
					.tickFormat(axisFormat);
				
				var xAxisTop = d3.svg.axis()
					.scale(x)
					.orient("top")
					.tickFormat(axisFormat);

				var yAxis = d3.svg.axis()
					.scale(y)
					.orient("left");
		  
			 var svg = d3.select(id).append("svg")
				 .attr("width", width + margin.left + margin.right)
				 .attr("height", height + margin.top + margin.bottom)
			   .append("g")
				 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			
			  data.forEach(function(d) {
				d.x = +d.x;
			  });
			  
			  x.domain([0, d3.max(data, function(d) { return d.x; })]);
			  y.domain(data.map(function(d, i) { return d.y; }));

			  svg.append("g")
				  .attr("class", "x axis")
				  .attr("transform", "translate(0," + height + ")")
				  .call(xAxis)
				.append("text")
				  .attr("x", width)
				  .attr("dy", "-0.4em")
				  .style("text-anchor", "end")
				  .text(config.xAxisLabel);

			  svg.append("g")
				  .attr("class", "y axis")
				  .call(yAxis);
				  
			  svg.append("g")
				  .attr("class", "x axis")
				  .call(xAxisTop)
				.append("text")
				  .attr("x", width)
				  .attr("dy", "1.0em")
				  .style("text-anchor", "end")
				  .text(config.xAxisLabel);

			  svg.selectAll(".bar")
				  .data(data)
				.enter().append("rect")
				  .attr("class", "bar")
				  .attr("y", function(d) { return y(d.y); })
				  .attr("height", y.rangeBand())
				  .attr("x", 0)
				  .attr("width", function(d) { return x(d.x); })
				  .style("fill", function(d, i) {	if (config.multipleColors) {
														if (colors.length <= i) {
															  hex = Math.floor(((i+1)/1000)*16777215).toString(16);
															  return '#' + "000000".substring(0, 6-hex.length) + hex;
															}
															return colorOrdinal(d.y);
													}
													else
														return colorOrdinal(0);
												});
												
				    // Value labels on side of bars
				var xTextPadding = config.barLabelPadding || 15;
				svg.selectAll(".valueLabel")
					.data(data)
					.enter()
					.append("text")
					.attr("class", "valueLabel")
					.attr("text-anchor", "middle")
					.attr("fill", "black")
					.attr("y", function(d,i) {
						return y(d.y) + y.rangeBand()/2 + 5;
					})
					.attr("x", function(d,i) {
						return x(d.x) + xTextPadding;
					})
					.text(function(d){
						 return d.x;
					});
					
			    // Chart title
				svg.append("text")
					.attr("x", (width / 2))             
					.attr("y", 0 - (margin.top / 2))
					.attr("text-anchor", "middle")
					.attr("class", "chartTitle")
					.style("text-decoration", "underline")
					.text(config.title);
				
				/* MD: Example of changing text size of y axis labels wider than left margin 
				 *     if you want to use this make sure to comment out the substring'd input
				 *     in reportsD3.js 
				 **/
//				svg.selectAll(".y.axis .tick > text")
//				  	.style("font-size", function(d)	{ 
//													  var bbox = this.getBBox();
//													  var origSize = parseFloat($(".y.axis .tick > text").css('font-size'));
//													  if (bbox.width > margin.left){
//														  var scale = (bbox.width/margin.left);
//														  return (origSize - 1) / scale;  // Dynamic smaller size
//														  //return 10;  // If you want a static smaller size
//													  }	  
//				  									});
					
			  d3.select(config.sortCheckbox).on("change", change);

			  var sortTimeout = setTimeout(function() {
				d3.select("input").property("checked", true).each(change);
			  }, 2000);

			  function change() {
				clearTimeout(sortTimeout);

				// Copy-on-write since tweens are evaluated after a delay.
				var y0 = y.domain(data.sort(this.checked
					? function(a, b) { return b.x - a.x; }
					: function(a, b) { return d3.ascending(a.y, b.y); })
					.map(function(d) { return d.y; }))
					.copy();
				

				svg.selectAll(".bar")
					.sort(function(a, b) { return y0(a.y) - y0(b.y); });
				svg.selectAll(".valueLabel")
					.sort(function(a, b) { return y0(a.y) - y0(b.y); });

				var transition = svg.transition().duration(750),
					delay = function(d, i) { return i * 50; };

				transition.selectAll(".bar")
					.delay(delay)
					.attr("y", function(d) { return y0(d.y); });
					
				transition.selectAll(".valueLabel")
					.delay(delay)
					.attr("y", function(d) { return y0(d.y)+y.rangeBand()/2 + 5; })
					.attr("fill", "black");

				transition.select(".y.axis")
					.call(yAxis)
				  .selectAll("g")
					.delay(delay);
			  }
		  };
}