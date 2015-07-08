/*	BarChart library file for creating a simple D3 bar chart.
 * 
 * 	Parameters: 	id		- jQuery element (e.g. #barChart) that will contain the bar chart
 * 					config	- Optional configuration array that includes options for margin size, width, height, etc.
 * 
 *  Example Use: 	Create the object with a call like: 
 *  					var barChart = new BarChart("#barChart", config = {title: "Chart Title", width: 720, height: 500});
 *  
 *  				Then, after creating the object call barChart.redrawChart(data) with your data array to draw the chart.
 *  				An example data array showing "Apples" and "Oranges" as bars would look like:
 *  					{x: "Apples", y: 5},
 *  					{x: "Oranges", y: 10}
 *  
 *  				Subsequent calls to redrawChart() will delete the previous chart and draw a new one.
 */

function BarChart(id, config) {
		
		config = config ? config : {};
		var margin = {	top: config.top || 55, 
						right: config.right || 20, 
						bottom: config.bottom || 150, 
						left: config.left || 50
					 },
						width = (config.width || 720) - margin.left - margin.right,
						height = (config.height || 530) - margin.top - margin.bottom;
		
		if (config.shrinkWidthToFit === true){
			var windowWidth = $(window).width();
			
			if (windowWidth < width + 50 + margin.left + margin.right){
				width = windowWidth - 50 - margin.left - margin.right;
			}
		}

		var formatPercent = d3.format("d");
		
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
			
		/*
		 * Generate new bar colors (removing randomization so that multiple graphs have same colors)
		 */
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
			d3.select(id).selectAll('svg').remove();
			this.createChart(data);
		  };

		  this.createChart = function(data) {
				var colorOrdinal = d3.scale.ordinal()
						.range(colors);

				var x = d3.scale.ordinal()
					.rangeRoundBands([0, width], .1, 0.5);

				var y = d3.scale.linear()
					.range([height, 0]);

				var xAxis = d3.svg.axis()
					.scale(x)
					.orient("bottom");

				var yAxis = d3.svg.axis()
					.scale(y)
					.orient("left")
					.tickFormat(formatPercent);
		  
			 var svg = d3.select(id).append("svg")
				 .attr("width", width + margin.left + margin.right)
				 .attr("height", height + margin.top + margin.bottom)
			   .append("g")
				 .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			
			  data.forEach(function(d) {
				d.y = +d.y;
			  });

			  x.domain(data.map(function(d, i) { return d.x; }));
			  y.domain([0, d3.max(data, function(d) { return d.y; })]);

			  svg.append("g")
				  .attr("class", "x axis")
				  .attr("transform", "translate(0," + height + ")")
				  .call(xAxis)
				  .selectAll("text")  
					.style("text-anchor", "end")
//					.attr("dx", "-4em")
					.attr("dx", (config.textDx || "-4em"))
					.attr("dy", "2em")
	//				.attr("dx", "-.8em")
	//				.attr("dy", ".15em")
					.attr("transform", function(d) {
						return "rotate(-65)" 
				  });

			  svg.append("g")
				  .attr("class", "y axis")
				  .call(yAxis)
				.append("text")
				  .attr("transform", "rotate(-90)")
				  .attr("y", 6)
				  .attr("dy", ".71em")
				  .style("text-anchor", "end")
				  .text(config.yAxisLabel);
			  
				svg.append("text")
		        .attr("x", (width / 2))             
		        .attr("y", 0 - (margin.top / 2))
		        .attr("text-anchor", "middle") 
		        .attr("class", "chartTitle")
		        .style("text-decoration", "underline")  
		        .text(config.title);

			  svg.selectAll(".bar")
				  .data(data)
				.enter().append("rect")
				  .attr("class", "bar")
				  .attr("x", function(d) { return x(d.x); })
				  .attr("width", x.rangeBand())
				  .attr("y", function(d) { return y(d.y); })
				  .attr("height", function(d) { return height - y(d.y); })
				  .style("fill", function(d, i) {	if (config.multipleColors) {
														if (colors.length <= i) {
														  hex = Math.floor(((i+1)/1000)*16777215).toString(16);
														  return '#' + "000000".substring(0, 6-hex.length) + hex;
														}
														return colorOrdinal(d.x);
				  									}
													else
														return colorOrdinal(0);
												});
												
				    // Value labels on top of bars
					var yTextPadding = config.barLabelPadding || -10;
					svg.selectAll(".valueLabel")
						.data(data)
						.enter()
						.append("text")
						.attr("class", "valueLabel")
						.attr("text-anchor", "middle")
						.attr("fill", "white")
						//.attr("x", function(d,i) {
							//return x(d.x)+x.rangeBand()/2;
						//})
						.attr("y", function(d,i) {
							return y(d.y) + yTextPadding;
						})
						.text(function(d){
							 return d.y;
						});
					

			  d3.select(config.sortCheckbox).on("change", change);

			  var sortTimeout = setTimeout(function() {
				d3.select("input").property("checked", true).each(change);
			  }, 2000);

			  function change() {
				clearTimeout(sortTimeout);

				// Copy-on-write since tweens are evaluated after a delay.
				var x0 = x.domain(data.sort(this.checked
					? function(a, b) { return b.y - a.y; }
					: function(a, b) { return d3.ascending(a.x, b.x); })
					.map(function(d) { return d.x; }))
					.copy();
				

				svg.selectAll(".bar")
					.sort(function(a, b) { return x0(a.x) - x0(b.x); });
				svg.selectAll(".valueLabel")
					.sort(function(a, b) { return x0(a.x) - x0(b.x); });

				var transition = svg.transition().duration(750),
					delay = function(d, i) { return i * 50; };

				transition.selectAll(".bar")
					.delay(delay)
					.attr("x", function(d) { return x0(d.x); });
					
				transition.selectAll(".valueLabel")
					.delay(delay)
					.attr("x", function(d) { return x0(d.x)+x.rangeBand()/2; })
					.attr("fill", "black");

				transition.select(".x.axis")
					.call(xAxis)
				  .selectAll("g")
					.delay(delay);
			  }
		  };
}