/*	StackedBarChart library file for creating a simple D3 stacked bar chart (with stacked to grouped capability).
 * 
 * 	Parameters: 	id		- jQuery element (e.g. #stackedChart) that will contain the stacked bar chart
 * 					config	- Optional configuration array that includes options for margin size, width, height, etc.
 * 
 *  Example Use: 	Create the object with a call like: 
 *  					var stackedChart = new StackedBarChart("#stackedChart", config = {title: "Chart Title", width: 720, height: 500});
 *  
 *  				Then, after creating the object call stackedChart.redrawChart(data) with your data array to draw the chart.
 *  				An example data array showing the amount of "Apples" and "Oranges" from two different farms would look like:
 *						[{
 *							"name": "Apples",
 *							"values": [
 *							  { x: "Farm 1", y: 100},
 *							  { x: "Farm 2", y: 125}
 *							]
 *						  },
 *						  {
 *							"name": "Oranges",
 *							"values": [
 *							  { x: "Farm 1", y: 200},
 *							  { x: "Farm 2", y: 230}
 *							]
 *						}]
 *						  
 *					NOTE: All x values (farms in this case) need to have an entry in the "values" array. This means that you 
 *					 may need to add entries where the y values are 0.
 *  
 *  				Subsequent calls to redrawChart() will delete the previous chart and draw a new one.
 */
function StackedBarChart(id, config) {
		
		config = config ? config : {};
		var margin = {	top: config.top || 30, 
						right: config.right || 150, // Space for the legend
						bottom: config.bottom || 100, 
						left: config.left || 50
					 },
						width = (config.width || 1060) - margin.left - margin.right,
						height = (config.height || 500) - margin.top - margin.bottom;
		
		if (config.shrinkWidthToFit === true){
			var windowWidth = $(window).width();
			
			if (windowWidth < width + 50 + margin.left + margin.right){
				width = windowWidth - 50 - margin.left - margin.right;
			}
		}
						
		formatValue = d3.format("d");
			
		  this.generateColor = function(i) {
			  //hex = Math.floor(Math.random()*16777215).toString(16);
			  hex = Math.floor((i/1000)*16777215).toString(16);

			  return '#' + "000000".substring(0, 6-hex.length) + hex;
		  };
		  
		  this.resetDimensions = function(newWidth, newHeight){
				width = newWidth - margin.left - margin.right;
				height = newHeight - margin.top - margin.bottom;
		  };
			
		  this.redrawChart = function(data) {
			d3.select(id).selectAll('svg').remove();
			this.createChart(data);
		  };
		  
		  this.createChart = function(data) {
			   var n = data.length, // number of layers
					m = data[0].values.length, // number of samples per layer
					stack = d3.layout.stack().values(function(d) { return d.values;}),
					layers = stack(data),
					yGroupMax = d3.max(layers, function(layer) { return d3.max(layer.values, function(d) { return d.y; }); }),
					yStackMax = d3.max(layers, function(layer) { return d3.max(layer.values, function(d) { return d.y0 + d.y; }); });

				var x = d3.scale.ordinal()
					//.domain(d3.range(m))
					.domain(data[0].values.map(function(d) { return d.x; }))
					.rangeRoundBands([0, width], .25);

				var y = d3.scale.linear()
					.domain([0, yStackMax])
					.range([height, 0]);
				
				var color = d3.scale.ordinal()
			    	.range(["#98abc5", "#6b486b", "#ff8c00"]);
				
				// If more than 3 layers add more colors (or default to linear scale)
				if (n > 3 && n <= 7){
					color = d3.scale.ordinal()
				    	//.range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);
						.range(["#5687d1", "#7b615c", "#de783b", "#6ab975", "#a173d1", "#bbbbbb", "#ffaa00",]);
				}	
				else if (n > 7){
					color = d3.scale.linear()
						.domain([0, n - 1])
						.range(["#98abc5", "#ff8c00"]);	
				}

				var xAxis = d3.svg.axis()
					.scale(x)
					.tickSize(0)
					.tickPadding(6)
					.orient("bottom");
					
				var yAxis = d3.svg.axis()
					.scale(y)
					.orient("left")
					.tickFormat(formatValue);

				var svg = d3.select(id).append("svg")
					.attr("width", width + margin.left + margin.right)
					.attr("height", height + margin.top + margin.bottom)
				  .append("g")
					.attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				var layer = svg.selectAll(".layer")
					.data(layers)
				  .enter().append("g")
					.attr("class", "layer")
					.style("fill", function(d, i) { return color(i); });

				var rect = layer.selectAll("rect")
					.data(function(d) { return d.values; })
				  .enter().append("rect")
					.attr("x", function(d) { return x(d.x); })
					.attr("y", height)
					.attr("width", x.rangeBand())
					.attr("height", 0);

				rect.transition()
					.delay(function(d, i) { return i * 10; })
					.attr("y", function(d) { return y(d.y0 + d.y); })
					.attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); });

				svg.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")")
					.call(xAxis)
					.selectAll("text")  
					.style("text-anchor", "end")
					.attr("dx", "-.8em")
					.attr("dy", ".15em")
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

                  /* Initialize tooltip */
                tip = d3.tip().attr('class', 'd3-tip').html(function(d) { return d.y; });

                  /* Invoke the tip in the context of your visualization */
                 svg.call(tip)

                svg.selectAll("rect")
                      .on('mouseover',tip.show)
                      .on('mouseout', tip.hide);

				// Hover/tooltip text for rectangles
				//svg.selectAll("rect")
				//.on("mouseover", function(d){
				//	var xPos = parseFloat(d3.select(this).attr("x"));
				//	var yPos = parseFloat(d3.select(this).attr("y"));
				//	var height = parseFloat(d3.select(this).attr("height"))
				//	var width = parseFloat(d3.select(this).attr("width"))
                //
				//	d3.select(this).attr("stroke","blue").attr("stroke-width",0.8);
                //
				//	svg.append("text")
				//		.attr("x",xPos)
				//		.attr("y",yPos +height/2)
				//		.attr("class","tooltip")
				//		//.text(Math.floor(d.y));
				//		.text(d.y);
                //
				//})
				//.on("mouseout",function(){
				//	svg.select(".tooltip").remove();
				//	d3.select(this).attr("stroke","pink").attr("stroke-width",0.2);
                //
				//})
				
				// Create a legend for the layer colors
				var legendColors = [];
				for (i = layers.length-1; i >=0; i--) { 
					legendColors.push({color: color(i), text: layers[i].name});
				}
				
				var legend = svg.append("g")
					.attr("class", "legend")
					.attr("height", 100)
					.attr("width", 100)
					.attr('transform', 'translate(-20,50)');
					
				var legendRect = legend.selectAll('rect').data(legendColors);

				legendRect.enter()
					.append("rect")
					.attr("x", width + 15)
					.attr("width", 10)
					.attr("height", 10);

				legendRect
					.attr("y", function(d, i) {
						return i * 20;
					})
					.style("fill", function(d) {
						return d.color;
					});

				var legendText = legend.selectAll('text').data(legendColors);

				legendText.enter()
					.append("text")
					.attr("x", width + 32);

				legendText
					.attr("y", function(d, i) {
						return i * 20 + 9;
					})
					.text(function(d) {
						return d.text;
					});
				
				svg.append("text")
			        .attr("x", (width / 2))             
			        .attr("y", 0 - (margin.top / 2))
			        .attr("text-anchor", "middle")  
			        .style("text-decoration", "underline")
			        .attr("class", "chartTitle")
			        .text(config.title);
					
 				d3.selectAll(config.stackedBtn).on("change", change);
				d3.selectAll(config.groupedBtn).on("change", change); 
				
				//d3.selectAll("input").on("change", change);

				var timeout = setTimeout(function() {
				  //d3.select("input[value=\"grouped\"]").property("checked", true).each(change); // Don't want to auto switch at start
				}, 2000);

				function change() {
				  clearTimeout(timeout);
				  if (this.value === "grouped") transitionGrouped();
				  else transitionStacked();
				}

				function transitionGrouped() {
				  y.domain([0, yGroupMax]);

				  rect.transition()
					  .duration(500)
					  .delay(function(d, i) { return i * 10; })
					  .attr("x", function(d, i, j) {return x(d.x) + x.rangeBand() / n * j; })
					  .attr("width", x.rangeBand() / n)
					.transition()
					  .attr("y", function(d) { return y(d.y); })
					  .attr("height", function(d) { return height - y(d.y); });
					  
				   // Need to refresh y axis on change
				   svg.selectAll("g.y.axis")
					 .call(yAxis);
				}

				function transitionStacked() {
				  y.domain([0, yStackMax]);

				  rect.transition()
					  .duration(500)
					  .delay(function(d, i) { return i * 10; })
					  .attr("y", function(d) { return y(d.y0 + d.y); })
					  .attr("height", function(d) { return y(d.y0) - y(d.y0 + d.y); })
					.transition()
					  .attr("x", function(d) { return x(d.x); })
					  .attr("width", x.rangeBand());
					  
				   svg.selectAll("g.y.axis")
					 .call(yAxis);
				}
		  };
}