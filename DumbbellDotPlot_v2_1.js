define( ["qlik","jquery", "text!./DumbbellDotPlot_v2_1.css", "./lib_DumbbellDotPlot_v2_1/d3.min", "./lib_DumbbellDotPlot_v2_1/axisAPI"], function ( e,$, cssContent ) {

	'use strict';


  	//append the syle sheet to the head
  	$("<style>").html(cssContent).appendTo("head");

	return {
		initialProperties: {
			version: 1.0,
			qHyperCubeDef: {
				qDimensions: [],
				qMeasures: [],
				qInitialDataFetch: [{
					qWidth: 10,
					qHeight: 1000
				}]
			}
		},
		
		//property panel
		definition: {
			type: "items",
			component: "accordion",
			items: {
				dimensions: {
					uses: "dimensions",
					min: 8,
					max: 8
				},
				measures: {
					uses: "measures",
					min: 2,
					max: 2
				},
				sorting: {
					uses: "sorting"
				},
				addons: {  
						 uses: "addons",  
						 items: {  
							  dataHandling: {  
								   uses: "dataHandling"  
							  }  
						 }  
					},
				settings: {
					uses: "settings",
					items: {
						colorPanel: {
							type: "items",
							label: "Custom colors",
							items: {
								color1: {
									type: "string",
									label: "Bar Color",
									ref: "myproperties.color1",
									defaultValue: "blue"
								},
								color2: {
									type: "string",
									label: "Start Day/Week/Month Color",
									ref: "myproperties.color2",
									defaultValue: "red"
								},
								color3: {
									type: "string",
									label: "End Day/Week/Month Color",
									ref: "myproperties.color3",
									defaultValue: "green"
								},
								color4: {
									type: "string",
									label: "Lab Color Normal",
									ref: "myproperties.color4",
									defaultValue: "blue"
								}
								
							}
						}
					}

				}
			}
		},
		support: {
		  snapshot: true, //snapshot - include in story
		  export: true,   //export to PDF, PowerPoint and image
		  exportData: true //export data to excel 
		},

		paint: function ( $element, layout ) {
			
			

		
			//Get element height and width and set and id for the container
			
			var height = $element.height(),
                width = $element.width(),
                id = "container1_" + layout.qInfo.qId;
			
			
			if (document.getElementById(id)) {
				// if it has been created, empty it's contents so we can redraw it
				$("#" + id).empty();
				$("#" + id).css({top: '0%', left: '0%', position:'absolute'});
			}
			else {
				// if it hasn't been created, create it with the appropiate id and size
			 	$element.append($('<div />').attr("id", id).width(width).height(height));
				
			}
				
			
			//data information variables
			var self = this;
            
          	///////////////////////////////////////////////////////////////////////////////////Code start to fetch more data
			var lastrow = 0, me = this;
			var matrix = [];
			//loop through the rows we have and render
			this.backendApi.eachDataRow( function ( rownum, row ) {
						lastrow = rownum;
						
				});
			if(this.backendApi.getRowCount() > lastrow +1)
			{
				//we havent got all the rows yet, so get some more
				var requestPage = [{
					qTop: lastrow + 1,
					qLeft: 0,
					qWidth: 9, //should be # of columns
					qHeight: Math.min( 1111, this.backendApi.getRowCount() - lastrow )
					}];
			   this.backendApi.getData( requestPage ).then( function ( dataPages ) {
					//when we get the result trigger paint again
					me.paint( $element,layout );
				   } );
			}else { //if we are at the last row...
				//var bigMatrix = [];
				//use flattenPages function to create large master qMatrix
				var moredata = layout.qHyperCube.qDataPages;
				
				for(var i = 0; i<moredata.length;i++){
					
					for (var j = 0; j < moredata[i].qMatrix.length; j++) 
					{
						
						if(moredata[i].qMatrix[j][5].qText == "-" && moredata[i].qMatrix[j][6].qText == "-")
						{							//Eliminate data where start date/day and end date/date are both null
							
						}
						else
						{	
											
							matrix.push(moredata[i].qMatrix[j]);
						}
							
					}
					
				}
				
							
				//////Initialize an array to get all day/dates. If the array is empty display a message. ////////////////////
				var startenddateday = [];			
				for (var t = 0; t<matrix.length; t++)
				{
					if(matrix[t][5].qText == "-"|| matrix[t][5].qText === undefined) 
					{							// If start date/day is null or undefined
						
					}
					else if(layout.qHyperCube.qMeasureInfo[1].qMax == 1)  					
					{							// If start date/day is study day
						startenddateday.push(matrix[t][5].qText);
						
					}else if(valid_date_flag(matrix[t][5].qText))
					{							// If start date/day is a valid date
						startenddateday.push(matrix[t][5].qText);
					}
						
					if(matrix[t][6].qText == "-"|| matrix[t][6].qText === undefined)
					{							// If end date/day is null or undefined
						
					}else if(layout.qHyperCube.qMeasureInfo[1].qMax == 1)  					
					{							// If end date/day is study day
						startenddateday.push(matrix[t][6].qText);
						
					}else if(valid_date_flag(matrix[t][6].qText))
					{							// If end date/day is a valid date
						startenddateday.push(matrix[t][6].qText);
					}
					
				}
				
				if(startenddateday.length == 0)
				{								// If dates array is empty display a message
					$("#" + id).empty();
					$("#" + id).css({top: '50%', left: '30%', position:'absolute'});
					$("#" + id).html("This chart is not displayed because it contains undefined values in Date/Day variables. ");
					
					
				}
				else
				{								// If dates array is not empty 
					$("#" + id).empty();		// Empty the contents to ensure there is no display message
					$("#" + id).css({top: '0%', left: '0%', position:'absolute'});
					///////////Set the Legend Labels based on the selection of date or study day/week/month columns//////////
					if(layout.qHyperCube.qMeasureInfo[1].qMax == 1)  					
					{ 							// If Study day/week/month button is selected
					
						var legendLabels = [];
						legendLabels.push("Start Day/Week/Month");
						legendLabels.push("End Day/Week/Month");
						legendLabels.push("Normal");
						legendLabels.push("High/Abnormal");
						legendLabels.push("Low");
						legendLabels.push("Other");
						legendLabels.push("SAE");
						legendLabels.push("No Result");
					}
					else {						// If Event date button is selected
						var legendLabels = [];
						legendLabels.push("Start Date");
						legendLabels.push("End Date");
						legendLabels.push("Normal");
						legendLabels.push("High/Abnormal");
						legendLabels.push("Low");
						legendLabels.push("Other");
						legendLabels.push("SAE");
						legendLabels.push("No Result");
					}
					viz_DumbbellDotPlot_v2_1(matrix, legendLabels, height, width, id, layout, self,startenddateday);
					
					
				}
				
			
			}
					
		}//////////////////Code end for fetch more data and display
		
		
		

	};///////////return

} );/////////define
	var viz_DumbbellDotPlot_v2_1 = function(data, legendLabels, height, width, id, layout, self,startenddateday) {
				
						/* If Start Date/day column is not poplated don't perform any calculations */
						if(startenddateday.length == 0)
						{
							return;
										
										
						}else
						{ 								////If start date/day columns has valid values perform all calculations
							var margin = {top: 10, right: 20, bottom: 20, left: 20};

							width = width - margin.left - margin.right;
							height = height - margin.top - margin.bottom;

							  
								////Create an array of events
								var yLabels = [];
								
								for (var i = 0;i<data.length;i++)
								{
									
									if(data[i][0] === undefined ||  data[i][0].qText == "-")
									{						// If event is null
										//return null;
									}
									else if((data[i][5].qText == "-" ) && (data[i][6].qText == "-" ))
									{						// If both start and end date/day are null
										
									}
									else
									{	
										var str = data[i][0].qText;
										var strLen = str.length;
										if(layout.qHyperCube.qMeasureInfo[1].qMax == 1)  					
										{						// If start/end day/week/month button is selected
											yLabels.push(str);
										}else if(valid_date_flag(data[i][5].qText) || valid_date_flag(data[i][6].qText))
										{						// If Event Date button is selected
											yLabels.push(str);
										}
										
									}

								}
								if(yLabels.length == 0)
								{					//if there are no events
									$("#" + id).empty();
									$("#" + id).css({top: '50%', left: '30%', position:'absolute'});
									$("#" + id).html("This chart is not displayed because it contains only NULL or undefined values. ");
									return;
										
								}else
								{
									$("#" + id).css({top: '0%', left: '0%', position:'absolute'});
								
									yLabels = yLabels.filter(function(v,i) { return yLabels.indexOf(v) == i; }); 	 	//Eliminate duplicate events in the y-axis labels
									
									//// Create space between 2 events
									var n = yLabels.length;
									var p = height;
									var h = n*20;
									//var h = n*p/10;
									var s = height/11;
									
									if(n>11)
									{
										var y = d3.scale.linear()
																	
													.domain([0, n])
												   //.range([height-40,-ord.length]);
												   .range([height-40,-h]);
												   //.range([height-margin.bottom-margin.top-6,-40]);
									}else {
										var y = d3.scale.linear()
																	
													.domain([0, n])
												   .range([height-40,-n]);
												   //.range([height-40,-n*p/9]);
												   //.range([height-margin.bottom-margin.top-6,-40]);
									}
									
									  
								var yAxis = d3.svg.axis()
												.scale(y)
												.orient('left')
												.ticks(yLabels.length)
												.tickSize(0)
												.tickFormat(function(d,i) {
													if(yLabels[d] === undefined)
													{
														return null;
													}else
													{			////Split the LB events to extract Domain an event . LB events are loaded along with Category
																	////using | as separator
														var index_of = yLabels[d].indexOf('|');
														var yLabels_temp;
														if(index_of < 0)
															yLabels_temp = yLabels[d];
														else
															yLabels_temp = yLabels[d].substring(index_of+2,yLabels[d].length);
														if (yLabels_temp.length > 23)
															return yLabels_temp.substring(0,23)+'...';
														else 
															return yLabels_temp;
													}
														
												})
												.tickPadding(8)
												;
												  
									
									
								var svg = d3.select("#"+id).append("svg")
										.attr("width", width + margin.left + margin.right)
										.attr("height", height + margin.top + margin.bottom)
										// add a group to that svg element for all of the subsequent visual elements.
										// use this group to offset the positions of the sub-elements by the margins
									  .append("g")
										//.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
										.attr("transform", "translate(" + 0 + "," + 0 + ")");


									var yAxis_g = svg.append("g")
											.attr("class", "y axis")
											.call(yAxis)
											;

									// Determine the width of the axis
									var yAxis_width = yAxis_g[0][0].getBoundingClientRect().width;

									// Remove the test yAxis
									yAxis_g.remove();
									//var yAxis_width = yAxis[0][0].getBoundingClientRect().width;

									// Update chart margin based on the yAxis width
									margin.left = margin.left + yAxis_width;

									// Create the chart height and width based on the new margin values
									height = height - margin.top - margin.bottom;
									width = width - margin.left - margin.right;

									// Move the svg group based on the new chart margins
									
									svg.attr("transform","translate(" + margin.left + "," + margin.top + ")"+ " scale(" + 1 + ")");
									
									/* Conditions for x-axis and datapoints for study day/week/month or event date button*/
									
									if(layout.qHyperCube.qMeasureInfo[1].qMax == 1)  					
									{									//// If study day/week/month is selected to be represented in x-axis i.e if type of field is numeric ,
																		//// create the x-axis with a linear scale and plot all the data points 
										var dimensions = layout.qHyperCube.qDimensionInfo;
										var x = d3.scale.linear().range([0, width]);
										var xAxis = d3.svg.axis().scale(x).orient('bottom');
										
										//Create an array of max and mins from study day/week/month dimensions, helps create the x domain
										
										var minMaxArray = [];
										if(!isNaN(dimensions[5].qMin)){				// Start day/week/month
											minMaxArray.push(dimensions[5].qMin);
											minMaxArray.push(dimensions[5].qMax);
										}
										if(!isNaN(dimensions[6].qMin)){				// End day/week/month
											minMaxArray.push(dimensions[6].qMin);
											minMaxArray.push(dimensions[6].qMax);
										}
										
										var dayextent = d3.extent(minMaxArray);
										
										if(dayextent[1] == dayextent[0])			//If min and max days/weeks/months are equal create an extent of +/- 2 days/weeks/months
										{
											dayextent[1] = dayextent[1] + 2;
											dayextent[0] = dayextent[0] - 2;
										}
										else 
										{										//If min and max days/weeks/months are not equal create an extent of +/- 2% of difference between start and end days/weeks/months
										
											var daysdiff = Math.ceil((dayextent[1] - dayextent[0])*0.02);

											dayextent[1] = dayextent[1] + daysdiff;
											dayextent[0] = dayextent[0] - daysdiff;
										}
										
										
										//use the extent of minMaxArray for domain
										x.domain(dayextent);
									
										////create a rect to handle scroll options
										svg.append("rect")												
											.attr("width", width)
											.attr("height", height)
										;
									  
										var objects = svg.append("svg")									
										  .classed("objects", true)
										  .attr("width", width)
										  .attr("height", height)
										;
										//append xAxis
										svg.append('g')
											.attr('class', 'x axis')
											.attr("transform", "translate(0,"+ (height)+")")
											.call(xAxis);
											
										//append yAxis
										svg.append('g')
											.attr('class', 'y axis')
											  .call(yAxis)
											  .append('text')
											  .attr('class', 'label')
											  .attr('y', -( margin.left - margin.bottom))
											  //.attr('x', -height/2 - margin.top)
											  .attr('x', 0)
											  .attr('transform', 'rotate(-90)')
											  .attr('text-anchor', 'middle')
											  .attr('fill', '#000000')
											  .attr('stroke', 'none')
											  .style('font-weight','normal')
											  //.text(layout.qHyperCube.qDimensionInfo[0].qFallbackTitle)
											  ;
										  
										svg.selectAll('.tick text')
										.style('font-weight','normal')
										;  
									
										
										//variable which holds the colorscheme properties
										var colors = layout.myproperties.colorscheme;
										
										//groupings for the visualiztion objects
										var dumbBell = objects.selectAll('.dumbBell').data(data).enter().append('g').attr('class', 'dumbBell');
										
										////Draw line when there is a start and end days/weeks/months and domain is not LB
										dumbBell.append('line')
											.attr('x1', function(d) { 
												if(!isNaN(d[5].qNum) && d[1].qText != "LB" && !isNaN(d[6].qNum)) return x(d[5].qNum);
												
											})
											.attr('x2', function(d) {
												if(!isNaN(d[6].qNum) && d[1].qText != "LB" && !isNaN(d[5].qNum)) return x(d[6].qNum);
											})
											.attr('y1', function (d) {
												if(!isNaN(d[5].qNum) && d[1].qText != "LB" && !isNaN(d[6].qNum))
												{
													if(d[0].qIsOtherCell){
													return y("Others");
													}
													
													var yof;
													for (var i = 0; i < yLabels.length; i++){
														if (d[0].qText == yLabels[i]){
														   yof = i;
															break;
													   }
													}
													return y(yof);
												}								
												
											})
											.attr('y2', function (d) {
												if(!isNaN(d[5].qNum) && d[1].qText != "LB" && !isNaN(d[6].qNum))
												{
													if(d[0].qIsOtherCell){
														return y("Others");
													}
													
													var yof;
													for (var i = 0; i < yLabels.length; i++){
														if (d[0].qText == yLabels[i]){
															yof = i;
															break;
													   }
													}
													   return y(yof);
												}						  
												  
											})
											.attr('stroke', function (d,i){
												if(!isNaN(d[5].qNum) && !isNaN(d[6].qNum) && d[1].qText != "LB")
													return layout.myproperties.color1;
												
											})
											.attr('stroke-width',1)
											.style("opacity", .7) 
											.append("title").text(function(d) {
												
												var str = "", event ="";
												if(d[1].qText != "LB")
												{
													var event_dim =d[0].qText;
													var index_of_seperator = event_dim.indexOf('|');
													if(index_of_seperator >= 0){
														event = event_dim.substring(index_of_seperator + 2,event_dim.length);
													}
													else 
														event = event_dim.substring(0,event_dim.length);
													var eventCategory = event_dim.substring(0,index_of_seperator - 1);
													
													if(d[1].qText == "EX" || d[1].qText == "CM")  
													{
														str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nDose Amount:\t\t"+ d[7].qText+"\nStart Day/Week/Month:\t"+d[5].qText+"\nEnd Day/Week/Month:\t"+d[6].qText; 
													
													}else {
														str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nStart Day/Week/Month:\t"+d[5].qText+"\nEnd Day/Week/Month:\t"+d[6].qText; 
													
													}
													return str;
												}						
												
											})
											
											;
										////Represent the start of a SAE as a red circle
										dumbBell.append('circle')
											.attr('r', function(d){
												return 5;
												
											})
											.attr('cx', function(d){ 
												if(d[4].qText != '-')
													if(!isNaN(d[5].qNum) && d[1].qText.toUpperCase() == 'AE' && d[4].qText.toUpperCase() == 'Y') 
														return x(d[5].qNum);
											})
											.attr('cy', function(d) {
												if(d[4].qText != '-')
													if(!isNaN(d[5].qNum) && d[1].qText.toUpperCase() == 'AE' && d[4].qText.toUpperCase() == 'Y') 
													{
														if(d[0].qIsOtherCell ){
															return y("Others");
														}
														
														for (var i = 0; i < yLabels.length; i++)
														   if (d[0].qText == yLabels[i])
															  return y(i);
												  
													}
												
												
											})
											.attr('fill', function (d){ 
												var str = "none";
												if(d[4].qText == "-")
												{
													return str;
												}
												else if(d[1].qText.toUpperCase() == 'AE' && d[4].qText.toUpperCase() == 'Y' && !isNaN(d[5].qNum) ){
													
													return "red";
												}
												return str;
											})
											.style("opacity", .7) 
											.append("title").text(function(d) {
												
												var yof = "";
												var str = "", event ="";
												if(d[4].qText != '-')
													if(!isNaN(d[5].qNum) && d[1].qText.toUpperCase() == 'AE' && d[4].qText.toUpperCase() == 'Y') 
													{
														var event_dim =d[0].qText;
														var index_of_seperator = event_dim.indexOf('|');
														if(index_of_seperator >= 0){
															event = event_dim.substring(index_of_seperator + 2,event_dim.length);
														}
														else 
															event = event_dim.substring(0,event_dim.length);
														var eventCategory = event_dim.substring(0,index_of_seperator - 1);
														  
														str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nStart Day/Week/Month:\t"+d[5].qText; 
														return str;
													}
													
												
												
											});
											////Represent the end of a SAE as a red circle
											dumbBell.append('circle')
											.attr('r', function(d){
												return 5;
												
											})
											.attr('cx', function(d){ 
												if(d[4].qText != '-')
													if(!isNaN(d[6].qNum) && d[1].qText.toUpperCase() == 'AE' && d[4].qText.toUpperCase() == 'Y') 
														return x(d[6].qNum);
											})
											.attr('cy', function(d) {
												if(d[4].qText != '-')
													if(!isNaN(d[6].qNum) && d[1].qText.toUpperCase() == 'AE' && d[4].qText.toUpperCase() == 'Y') 
													{
														if(d[0].qIsOtherCell ){
															return y("Others");
														}
														for (var i = 0; i < yLabels.length; i++)
														   if (d[0].qText == yLabels[i])
															  return y(i);
													}
												
												 
											})
											.attr('fill', function (d){ 
												var str = "none";
												if(d[4].qText == "-")
												{
													return str;
												}
												else if(d[1].qText.toUpperCase() == 'AE' && d[4].qText.toUpperCase() == 'Y' && !isNaN(d[6].qNum) ){
													
													return "red";
												}
												return str;
											})
											.style("opacity", .7) 
											.append("title").text(function(d) {
												var yof = "";
												var str = "", event ="";
												if(d[4].qText != '-')
													if(!isNaN(d[6].qNum) && d[1].qText.toUpperCase() == 'AE' && d[4].qText.toUpperCase() == 'Y') 
													{
														var event_dim =d[0].qText;
														var index_of_seperator = event_dim.indexOf('|');
														if(index_of_seperator >= 0){
															event = event_dim.substring(index_of_seperator + 2,event_dim.length);
														}
														else 
															event = event_dim.substring(0,event_dim.length);
														var eventCategory = event_dim.substring(0,index_of_seperator - 1);
														
														str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nEnd Day/Week/Month:\t"+d[6].qText; 
														return str;
													}
												
												
												
											});
											
										////////Represent Start days/weeks/months of AE, CM and EX as a blue triangle facing right
										dumbBell.append("polygon")													//To represent Start Day/Week/Month triangles AE,CM and EX Results 
										.attr("points", function (d) {
											
											if(!isNaN(d[5].qNum)){
												
												var str = " ";
												var yCor;
												
												if((d[1].qText.toUpperCase() == 'AE' && (d[4].qText == '-' || d[4].qText.toUpperCase() == 'N') ) || d[1].qText.toUpperCase() == 'CM' || d[1].qText.toUpperCase() == 'EX' )
												{						//Shape Conditions for Start Day/Week/Month
														for (var i = 0; i < yLabels.length; i++){
															if (d[0].qText == yLabels[i])
														   {
															   yCor = y(i);
															   break;
														   }
														}	
														str = (x(d[5].qNum) -7 ) + ',' + (yCor - 7) + ',' + x(d[5].qNum) + ',' + (yCor) + ',' + (x(d[5].qNum) - 7) + ',' + (yCor +7);
														return str;
												}
																		
											}	
													
												
										})
										.attr('fill', function (d){ 
											
											var str = "none";
											if(!isNaN(d[5].qNum))
												if((d[1].qText.toUpperCase() == 'AE' && (d[4].qText == '-' || d[4].qText.toUpperCase() == 'N') ) || d[1].qText.toUpperCase() == 'CM' || d[1].qText.toUpperCase() == 'EX' )
												{	
													return layout.myproperties.color2;
												}
											return str;
											
										})
										.style("opacity", .7) 
										.append("title").text(function(d) {
											
											var yof = "";
											var str = "", event ="";
											if(!isNaN(d[5].qNum))
												
												if((d[1].qText.toUpperCase() == 'AE' && (d[4].qText == '-' || d[4].qText.toUpperCase() == 'N') ) || d[1].qText.toUpperCase() == 'CM' || d[1].qText.toUpperCase() == 'EX' )
												{
													var event_dim =d[0].qText;
													var index_of_seperator = event_dim.indexOf('|');
													if(index_of_seperator >= 0){
														event = event_dim.substring(index_of_seperator + 2,event_dim.length);
													}
													else 
														event = event_dim.substring(0,event_dim.length);
													var eventCategory = event_dim.substring(0,index_of_seperator - 1);
													
													if(d[1].qText == "EX" || d[1].qText == "CM")  
													{
														str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nDose Amount:\t\t"+ d[7].qText+"\nStart Day/Week/Month:\t"+d[5].qText; 
													
													}else{
														str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nStart Day/Week/Month:\t"+d[5].qText; 
													
													}
													return str;
												}
											
											
										})
										;
										////////Represent End days/weeks/months of AE, CM and EX as a blue triangle facing left
										
										dumbBell.append("polygon")													//To represent End Day/Week/Month triangles AE,CM and EX Results 
										.attr("points", function (d) {	
										
											if(!isNaN(d[6].qNum)){
												
												var str = " ";
												var yCor;
												
												if((d[1].qText.toUpperCase() == 'AE' && (d[4].qText == '-' || d[4].qText.toUpperCase() == 'N') ) || d[1].qText.toUpperCase() == 'CM' || d[1].qText.toUpperCase() == 'EX' )
												{						//Shape Conditions for End Day/Week/Month
														for (var i = 0; i < yLabels.length; i++){
															if (d[0].qText == yLabels[i])
														   {
															   yCor = y(i);
															   break;
														   }
														}	
														str = (x(d[6].qNum) +7 ) + ',' + (yCor - 7) + ',' + x(d[6].qNum) + ',' + (yCor) + ',' + (x(d[6].qNum) + 7) + ',' + (yCor +7);
														return str;
												}
												
											}				
											
										})
										.attr('fill', function (d){ 
											var str = "none";
											if(!isNaN(d[6].qNum))
												if((d[1].qText.toUpperCase() == 'AE' && (d[4].qText == '-' || d[4].qText.toUpperCase() == 'N') ) || d[1].qText.toUpperCase() == 'CM' || d[1].qText.toUpperCase() == 'EX' )
												{	
													return layout.myproperties.color3;
												}
											return str;
											
										})
										.style("opacity", .7) 
										.append("title").text(function(d) {
											
											var yof = "";
											var str = "", event ="";
											if(!isNaN(d[6].qNum))
												if((d[1].qText.toUpperCase() == 'AE' && (d[4].qText == '-' || d[4].qText.toUpperCase() == 'N') ) || d[1].qText.toUpperCase() == 'CM' || d[1].qText.toUpperCase() == 'EX' )
												{
													var event_dim =d[0].qText;
													var index_of_seperator = event_dim.indexOf('|');
													if(index_of_seperator >= 0){
														event = event_dim.substring(index_of_seperator + 2,event_dim.length);
													}
													else 
														event = event_dim.substring(0,event_dim.length);
													var eventCategory = event_dim.substring(0,index_of_seperator - 1);
													
													 if(d[1].qText == "EX" || d[1].qText == "CM")  
													 {
														 str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nDose Amount:\t\t"+ d[7].qText+"\nEnd Day/Week/Month:\t"+d[6].qText; 
													
													 }else{
														 str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nEnd Day/Week/Month:\t"+d[6].qText; 
													
													 }
													return str;
												}
											
											
										})
										;
									
										/*
											Triangles to represent Lab Results
										*/
									dumbBell.append("polygon")													//To represent triangles and rectangle in case of Lab Results with Range low
										.attr("points", function (d) {											//High and Normal
											
											var str = " ";
											var yCor;
											for (var i = 0; i < yLabels.length; i++){
												if (d[0].qText == yLabels[i])
											   {
												   yCor = y(i);
												   break;
											   }
											}	 
										
											if(d[2].qText === undefined || d[2].qText == "-" || !(d[2].qText.toUpperCase() == 'LOW' || d[2].qText.toUpperCase() == 'NORMAL' || d[2].qText.toUpperCase() == 'ABNORMAL' || d[2].qText.toUpperCase() == 'HIGH'))					/////If indicator is NULL, represent a dash or rectangle
											{
												if(d[1].qText.toUpperCase() == 'LB' && !isNaN(d[5].qNum)) {		////If domain is LB and Study days/weeks/months is numeric
													if(d[7].qText === undefined || d[7].qText == "-")			////If character result i.e event value is null, repesent as a grey dash 
													{
														str = (x(d[5].qNum) - 5) + ',' + (yCor - 1) + ',' + (x(d[5].qNum) - 5) + ',' + (yCor + 1) + ',' + (x(d[5].qNum) + 5) + ',' + (yCor + 1) + ',' +(x(d[5].qNum) + 5) + ',' + (yCor - 1);
														return str;
													}
													else{														////If character result i.e event value is not null, repesent as a grey rectangle
												
														str = (x(d[5].qNum) - 5) + ',' + (yCor - 3) + ',' + (x(d[5].qNum) - 5) + ',' + (yCor + 3) + ',' + (x(d[5].qNum) + 5) + ',' + (yCor + 3) + ',' +(x(d[5].qNum) + 5) + ',' + (yCor - 3);
														return str;
													}
													
												}
												//return str;
											} 
											else 
											{													/////If indicator is not null, represent as rectangle and tringle
												if(d[1].qText.toUpperCase() == 'LB' && d[2].qText.toUpperCase() == 'LOW' && !isNaN(d[5].qNum))
												{												////If Lab result indicator is LOW, represnt a triangle pointing downwards
													str = (x(d[5].qNum) - 7) + ',' + (yCor - 7) + ',' + x(d[5].qNum) + ',' + (yCor + 7) + ',' + (x(d[5].qNum) + 7) + ',' + (yCor - 7);
													return str;
												}else if(d[1].qText.toUpperCase() == 'LB' && d[2].qText.toUpperCase() == 'NORMAL' && !isNaN(d[5].qNum)) 
												{												////If Lab result indicator is NORMAL, represnt a rectangle 
													str = (x(d[5].qNum) - 5) + ',' + (yCor - 3) + ',' + (x(d[5].qNum) - 5) + ',' + (yCor + 3) + ',' + (x(d[5].qNum) + 5) + ',' + (yCor + 3) + ',' +(x(d[5].qNum) + 5) + ',' + (yCor - 3);
													return str;
												}else if(d[1].qText.toUpperCase() == 'LB' && (d[2].qText.toUpperCase() == 'HIGH' || d[2].qText.toUpperCase() == 'ABNORMAL') && !isNaN(d[5].qNum))
												{												////If Lab result indicator is HIGH, represnt a triangle pointing upwards
													str = (x(d[5].qNum) - 7) + ',' + (yCor + 7) + ',' + x(d[5].qNum) + ',' + (yCor - 7) + ',' + (x(d[5].qNum) + 7) + ',' + (yCor + 7);
													return str;
												}
												//return str; 
											}
												
										})
										.attr('fill', function (d)
										{ 
											var str = "none";
											if(d[1].qText.toUpperCase() == 'LB' && !isNaN(d[5].qNum)) 	////If domain is LB and Study days/weeks/months is numeric
											{
												if(d[7].qText === undefined || d[7].qText == "-" || d[2].qText === undefined || d[2].qText == "-" || !(d[2].qText.toUpperCase() == 'LOW' || d[2].qText.toUpperCase() == 'NORMAL' || d[2].qText.toUpperCase() == 'ABNORMAL' || d[2].qText.toUpperCase() == 'HIGH') )
												{												////If there is no Lab result captured or no indicator, use grey color 
													return "grey";
												}else 
												{
													if(d[2].qText.toUpperCase() == 'LOW' )
													{											////If Lab result indicator is LOW, use Gold color
														str = "gold";
														return str;
													}else if(d[2].qText.toUpperCase() == 'NORMAL')
													{											////If Lab result indicator is NORMAL, use a colorwhich can also be set in front end. Default is set as steelblue color
														return layout.myproperties.color4;
													}else if(d[2].qText.toUpperCase() == 'HIGH' || d[2].qText.toUpperCase() == 'ABNORMAL')
													{											////If Lab result indicator is HIGH, use Red color
														str = "red";
														return str;
													}
													return "none";
												
												}
											}else return "none";
											
											
										})
										.style("opacity", .7) 
										.append("title").text(function(d) {											//Tooltip 
											
											var str = "", event ="";
											if(d[1].qText == 'LB' && !isNaN(d[5].qNum))
											{
												var event_dim =d[0].qText;
												var index_of_seperator = event_dim.indexOf('|');
												if(index_of_seperator >= 0){
													event = event_dim.substring(index_of_seperator + 2,event_dim.length);
												}
												else 
													event = event_dim.substring(0,event_dim.length);
												var eventCategory = event_dim.substring(0,index_of_seperator - 1);
											
												if((d[2].qText === undefined || d[2].qText == "-") && isNaN(d[8].qNum))
												{											////If there is no Numeric Lab result captured and no indicator, Provide all lab details and result available in dimension
													str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nLab Day/Week/Month:\t"+ d[5].qNum +"\nLab Result:\t\t"+ d[7].qText+  "\nIndicator:\t\t"+ "-";
													
												}
												else if((d[2].qText === undefined || d[2].qText == "-") && !isNaN(d[8].qNum))
												{											////If there is a Numeric Lab result captured and no indicator, Provide all lab details and numeric result available in measure
													str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nLab Day/Week/Month:\t"+ d[5].qNum +"\nLab Result:\t\t"+ d[8].qText+  "\nIndicator:\t\t"+ "-";
													
												}
												else if(isNaN(d[8].qNum))
												{											////If there is no Numeric Lab result captured and an indicator, Provide all lab details and numeric result available in dimension
													str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nLab Day/Week/Month:\t"+ d[5].qNum +"\nLab Result:\t\t"+ d[7].qText+  "\nIndicator:\t\t"+ d[2].qText;
												
												}
												else 
												{											////If there is a Numeric Lab result captured and an indicator, Provide all lab details and numeric result available in measure
													str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nLab Day/Week/Month:\t"+ d[5].qNum +"\nLab Result:\t\t"+ d[8].qText+  "\nIndicator:\t\t"+ d[2].qText;
												
												}
											}
											
											return str;
											
										})
										;
									}
									else 
									{												//// If date is selected to be represented in x-axis i.e if numeric representation isnot equal to text representation,
																					//// create the x-axis with a time scale and plot all the data points 
										// var customTimeFormat = d3.time.format.multi([
											// //[".%L", function(d) { return d.getMilliseconds(); }], 		
											// [":%S", function(d) { return d.getSeconds(); }],
											// ["%I:%M", function(d) { return d.getMinutes(); }],
											// ["%I %p", function(d) { return d.getHours(); }],
											// //["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
											// ["%b %d", function(d) { return d.getDate() != 1; }],
											// //["%B", function(d) { return d.getMonth(); }],
											// ["%b", function(d) { return d.getMonth(); }],
											// ["%Y", function() { return true; }]
											
										// ]);
										var customTimeFormat = d3.time.format.multi([
											[".%L", function(d) { return d.getMilliseconds(); }], 		
											["%H:%M:%S", function(d) { return d.getSeconds(); }],
											["%H:%M", function(d) { return d.getMinutes(); }],				//24 hour
											["%H:%M", function(d) { return d.getHours(); }],				//24 hour
											//["%a %d", function(d) { return d.getDay() && d.getDate() != 1; }],
											["%b %d", function(d) { return d.getDate() != 1; }],
											//["%B", function(d) { return d.getMonth(); }],
											["%b %d", function(d) { return d.getMonth(); }], 			//abbreviated month
											["%Y", function() { return true; }]
											
										]);

										var x = d3.time.scale()
											.range([0, width]);

										var xAxis = d3.svg.axis()
											.scale(x)
											.tickFormat(customTimeFormat)
											//.tickFormat(d3.time.format("%Y-%m-%d %H:%M:%S"));
											//.tickFormat(d3.time.format("%Y-%m-%d"))
											;
											

										/*Create an array of start and end dates, helps create the x domain. Apply imputation where ever applicable using the below defined 
										funtion imputed_date_iso*/
														  
										var dimensionDates = [];
										//var parseDate = d3.time.format("%Y-%m-%d");					// d3 defined function
										var iso = d3.time.format("%Y-%m-%dT%H:%M:%S.%LZ");
										
										for (var m=0;m<data.length;m++)
										{
											var x_date ;
											
											if (valid_date_flag(data[m][5].qText))
											{
												x_date = imputed_date_iso(data[m][5].qText);			//If start date is not null, add to the dimension dates array
												dimensionDates.push(iso.parse(x_date));
											}
											if (valid_date_flag(data[m][6].qText))
											{
												x_date = imputed_date_iso(data[m][6].qText);			//If end date is not null, add to the dimension dates array
												dimensionDates.push(iso.parse(x_date));
											}
											
										}
										  
										//use the extent of dimensionDates for domain. In order to line with study day/week/month, create an extent of +- 2 dates for the x-axis
										var dateExtent = d3.extent(dimensionDates, function(d,i) { return d; });
									  
										var one_day=1000*60*60*24;
										if(dateExtent[1] == dateExtent[0])
										{
											dateExtent[0] = d3.time.day.offset(dateExtent[0],-2);
											dateExtent[1] = d3.time.day.offset(dateExtent[1],2);
										}
										else
										{
											var daysdiff_date = Math.ceil((dateExtent[1].getTime()-dateExtent[0].getTime())*0.02/(one_day));
											dateExtent[1] = d3.time.day.offset(dateExtent[1],daysdiff_date);
											dateExtent[0] = d3.time.day.offset(dateExtent[0],-daysdiff_date);
										
										}
										 
												  
										x.domain(dateExtent);
									  
										svg.append("rect")												
												.attr("width", width)
												.attr("height", height)
											;
										  
										var objects = svg.append("svg")									
												.classed("objects", true)
												.attr("width", width)
												.attr("height", height)
											;
										svg.append('g')
												.attr('class', 'x axis')
												.attr("transform", "translate(0,"+ (height)+")")
												.call(xAxis)
											;
												
											//append yAxis
										svg.append('g')
												.attr('class', 'y axis')
												  .call(yAxis)
												  .append('text')
												  .attr('class', 'label')
												  .attr('y', -( margin.left - margin.bottom))
												  .attr('x', -height/2 - margin.top)
												  .attr('transform', 'rotate(-90)')
												  .attr('text-anchor', 'middle')
												  //.attr('font-size', '13px')
												 // .attr('font-family', 'arial')
												  .attr('fill', '#000000')
												  .attr('stroke', 'none')
												  .style('font-weight','normal')
												  //.text(layout.qHyperCube.qDimensionInfo[0].qFallbackTitle)
												  ;
											  
										svg.selectAll('.tick text')
											.style('font-weight','normal')
											;  
										
										 
										//variable which holds the colorscheme properties
										var colors = layout.myproperties.colorscheme;
										
										//groupings for the visualiztion objects
										var dumbBell = objects.selectAll('.dumbBell').data(data).enter().append('g').attr('class', 'dumbBell');
										
										/* Create a line between start date and end date for events which have start date and end date and domain is not LB. If there is no end date then don't create a line.*/
										
										dumbBell.append('line')
											.attr('x1', function(d) { 
												if(d[1].qText != "LB" && valid_date_flag(d[5].qText) && valid_date_flag(d[6].qText))
												{						////If Start date is not null
													return x(iso.parse(imputed_date_iso(d[5].qText)));
													
												}
															
											})
											.attr('x2', function(d) {
												if(d[1].qText != "LB" && valid_date_flag(d[5].qText)&& valid_date_flag(d[6].qText))
												{						////If End date is not null

													return x(iso.parse(imputed_date_iso(d[6].qText)));
													
												}
											})
											.attr('y1', function (d) {
												if(d[1].qText != "LB" && valid_date_flag(d[5].qText)&& valid_date_flag(d[6].qText)){
													if(d[0].qIsOtherCell)
													{
														return y("Others");
													}
														
													var yof;
													for (var i = 0; i < yLabels.length; i++)
													{
														if (d[0].qText == yLabels[i])
														{						////Get the y-cordinate of the event
															yof = i;
															break;
														}
													}
													return y(yof);
												}
												
												//debugger;
												
											})
											.attr('y2', function (d){
												if(d[1].qText != "LB" && valid_date_flag(d[5].qText) && valid_date_flag(d[6].qText)){
													if(d[0].qIsOtherCell)
													{
														return y("Others");
													}
														
													var yof;
													for (var i = 0; i < yLabels.length; i++)
													{							////Get the y-cordinate of the event
														if (d[0].qText == yLabels[i])
														{
															yof = i;
															break;
														}
													}
													return y(yof);
												}
												
												  
												  
											})
											.attr('stroke', function (d,i){
												if(valid_date_flag(d[5].qText) && valid_date_flag(d[6].qText) && d[1].qText != "LB")
												{							////If start and end dates are not null
													return layout.myproperties.color1;
												}
													
												//else return "transparent";
											})
											.attr('stroke-width',1)
											.style("opacity", .7) 
											.append("title").text(function(d) {
												
												var yof = "";
												var str = "", event ="";
												
												
												if(d[1].qText != "LB" && valid_date_flag(d[5].qText) && valid_date_flag(d[6].qText))
												{
													var event_dim = d[0].qText;
													var index_of_seperator = event_dim.indexOf('|');
													if(index_of_seperator >= 0)
													{
														event = event_dim.substring(index_of_seperator + 2,event_dim.length);
													}else 
														event = event_dim.substring(0,event_dim.length);
													var eventCategory = event_dim.substring(0,index_of_seperator - 1);
														
													if(d[1].qText == "EX" || d[1].qText == "CM")
													{
														str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nDose Amount:\t\t"+ d[7].qText+"\nStart Date:\t\t"+d[5].qText+"\nEnd Date:\t\t"+d[6].qText; 
													
													}else
													{
														str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nStart Date:\t\t"+d[5].qText+"\nEnd Date:\t\t"+d[6].qText; 
													
													}
													
													return str;
												}
												
												
											})
											
											;
											
										// /*Create circles for SAE's*/
										// /*Start date of an SAE*/
										dumbBell.append('circle')
											.attr('r', function(d){
												return 5;
												
											})
											.attr('cx', function(d){ 
											  if(d[4].qText != '-')
												if(d[1].qText == 'AE' && d[4].qText.toUpperCase() == 'Y' && valid_date_flag(d[5].qText))
												{						////If start date is not null
													return x(iso.parse(imputed_date_iso(d[5].qText)));
													
												}
											})
											.attr('cy', function(d) {
												if(d[4].qText != '-')
													if(d[1].qText == 'AE' && d[4].qText.toUpperCase() == 'Y' && valid_date_flag(d[5].qText) )
													{
														if(d[0].qIsOtherCell ){
															return y("Others");
														}
														
														for (var i = 0; i < yLabels.length; i++)
														   if (d[0].qText == yLabels[i])
															  return y(i);
														  
													}
												
												
												
											})
											.attr('fill', function (d){ 
												var str = "transparent";
												if(d[4].qText == "-")
												{
													return str;
												}
												else if(d[1].qText.toUpperCase() == 'AE' && d[4].qText.toUpperCase() == 'Y' && valid_date_flag(d[5].qText) ){
													
													return "red";
												}
												return str;
											})
											.style("opacity", .7) 
											.append("title").text(function(d) {
												
												var yof = "";
												var str = "", event ="";
												if(d[4].qText != '-')
													if(d[1].qText == 'AE' && d[4].qText.toUpperCase() == 'Y' && valid_date_flag(d[5].qText)  )
													{
														var event_dim = d[0].qText;
														var index_of_seperator = event_dim.indexOf('|');
														if(index_of_seperator >= 0){
															event = event_dim.substring(index_of_seperator + 2,event_dim.length);
														}
														else 
															event = event_dim.substring(0,event_dim.length);
														var eventCategory = event_dim.substring(0,index_of_seperator - 1);
														
														str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nStart Date:\t\t"+d[5].qText; 
														return str;
													}
												
												
											});
										
										/*End date of an SAE*/
										dumbBell.append('circle')
											.attr('r', function(d){
												return 5;
												
											})
											.attr('cx', function(d){ 
												if(d[4].qText != '-')
													if(d[1].qText == 'AE' && d[4].qText.toUpperCase() == 'Y' && valid_date_flag(d[6].qText))
													{
														return x(iso.parse(imputed_date_iso(d[6].qText)));
														
													}
											})
											.attr('cy', function(d) {
												if(d[4].qText != '-')
													if(d[1].qText == 'AE' && d[4].qText.toUpperCase() == 'Y' && valid_date_flag(d[6].qText))
													{
														if(d[0].qIsOtherCell )
														{
															return y("Others");
														}
													
														for (var i = 0; i < yLabels.length; i++)
														   if (d[0].qText == yLabels[i])
															  return y(i);
													}
													
																			 
											})
											.attr('fill', function (d){ 
												var str = "none";
												if(d[4].qText == "-")
												{
													return str;
												}else if(d[1].qText.toUpperCase() == 'AE' && d[4].qText.toUpperCase() == 'Y' && valid_date_flag(d[6].qText))
												{
													
													return "red";
												}
												return str;
											})
											.style("opacity", .7) 
											.append("title").text(function(d) {
												var yof = "";
												var str = "", event ="";
												
												if(d[4].qText != '-')
													if(d[1].qText == 'AE' && d[4].qText.toUpperCase() == 'Y' && valid_date_flag(d[6].qText))
													{ 
														var event_dim = d[0].qText;
														var index_of_seperator = event_dim.indexOf('|');
														if(index_of_seperator >= 0)
														{
															event = event_dim.substring(index_of_seperator + 2,event_dim.length);
														}else 
															event = event_dim.substring(0,event_dim.length);
														var eventCategory = event_dim.substring(0,index_of_seperator - 1);
														
														str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nEnd Date:\t\t"+d[6].qText; 
														return str;
													}
											});
											
										/*Create triangles to represent Start Date of AE which is not SAE ,CM and EX Events*/
											
										dumbBell.append("polygon")													
											.attr("points", function (d) {
												
												if(valid_date_flag(d[5].qText) )
												{
													
													var str = " ";
													var yCor;
														 
																
													if((d[1].qText.toUpperCase() == 'AE' && (d[4].qText == '-' || d[4].qText.toUpperCase() == 'N') ) || d[1].qText.toUpperCase() == 'CM' || d[1].qText.toUpperCase() == 'EX' )
													{		
														for (var i = 0; i < yLabels.length; i++)
														{
															if (d[0].qText == yLabels[i])
															{
															   yCor = y(i);
															   break;
															}
														}
														str = (x(iso.parse(imputed_date_iso(d[5].qText))) -7 ) + ',' + (yCor - 7) + ',' + x(iso.parse(imputed_date_iso(d[5].qText))) + ',' + (yCor) + ',' + (x(iso.parse(imputed_date_iso(d[5].qText))) - 7) + ',' + (yCor +7);
														return str;
													}
													
												}	
														
													
											})
											.attr('fill', function (d){ 
												
												var str = "none";
												if(valid_date_flag(d[5].qText) )
													if((d[1].qText.toUpperCase() == 'AE' && (d[4].qText == '-' || d[4].qText.toUpperCase() == 'N') ) || d[1].qText.toUpperCase() == 'CM' || d[1].qText.toUpperCase() == 'EX' )
													{	
														return layout.myproperties.color2;
													}
												return str;
												
											})
											.style("opacity", .7) 
											.append("title").text(function(d) {
												
												var yof = "";
												var str = "", event ="";
												if(valid_date_flag(d[5].qText))
													if((d[1].qText.toUpperCase() == 'AE' && (d[4].qText == '-' || d[4].qText.toUpperCase() == 'N') ) || d[1].qText.toUpperCase() == 'CM' || d[1].qText.toUpperCase() == 'EX' )	
													{
														var event_dim = d[0].qText;
														var index_of_seperator = event_dim.indexOf('|');
														if(index_of_seperator >= 0)
														{
															event = event_dim.substring(index_of_seperator + 2,event_dim.length);
														}else 
															event = event_dim.substring(0,event_dim.length);
														var eventCategory = event_dim.substring(0,index_of_seperator - 1);
														
														if(d[1].qText == "EX" || d[1].qText == "CM")
														{
															str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nDose Amount:\t\t"+ d[7].qText+"\nStart Date:\t\t"+d[5].qText; 
														
														}else
														{
															str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nStart Date:\t\t"+d[5].qText; 
														}										
														return str;
													}
												
												
											})
											;
											
											/*Create triangles to represent End Date of AE which is not SAE ,CM and EX Events*/
											dumbBell.append("polygon")													
											.attr("points", function (d) {	
											
												if(valid_date_flag(d[6].qText) ){
													
													var str = " ";
													var yCor;
														 
													
																		
													if((d[1].qText.toUpperCase() == 'AE' && (d[4].qText == '-' || d[4].qText.toUpperCase() == 'N') ) || d[1].qText.toUpperCase() == 'CM' || d[1].qText.toUpperCase() == 'EX' )
													{						//Shape Conditions for Start Day/Week/Month
														for (var i = 0; i < yLabels.length; i++)
														{
															if (d[0].qText == yLabels[i])
														   {
															   yCor = y(i);
															   break;
														   }
														}
														str = (x(iso.parse(imputed_date_iso(d[6].qText))) +7 ) + ',' + (yCor - 7) + ',' + x(iso.parse(imputed_date_iso(d[6].qText))) + ',' + (yCor) + ',' + (x(iso.parse(imputed_date_iso(d[6].qText))) + 7) + ',' + (yCor +7);
														return str;
													}
													
													
												}				
												
											})
											.attr('fill', function (d){ 
												var str = "none";
												if(valid_date_flag(d[6].qText) )
												{
													if((d[1].qText.toUpperCase() == 'AE' && (d[4].qText == '-' || d[4].qText.toUpperCase() == 'N') ) || d[1].qText.toUpperCase() == 'CM' || d[1].qText.toUpperCase() == 'EX' )
													{	
														return layout.myproperties.color3;
													}
												}
												return str;
												
											})
											.style("opacity", .7) 
											.append("title").text(function(d) {
												
												var str = "", event ="";
												if(valid_date_flag(d[6].qText) )
													if((d[1].qText.toUpperCase() == 'AE' && (d[4].qText == '-' || d[4].qText.toUpperCase() == 'N') ) || d[1].qText.toUpperCase() == 'CM' || d[1].qText.toUpperCase() == 'EX' )
													{	
														var event_dim = d[0].qText;
														var index_of_seperator = event_dim.indexOf('|');
														if(index_of_seperator >= 0)
														{
															event = event_dim.substring(index_of_seperator + 2,event_dim.length);
														}else 
															event = event_dim.substring(0,event_dim.length);
														var eventCategory = event_dim.substring(0,index_of_seperator - 1);
														
														if(d[1].qText == "EX" || d[1].qText == "CM")
														{
															str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nDose Amount:\t\t"+ d[7].qText+"\nEnd Date:\t\t"+d[6].qText; 
														
														}else
														{
															str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nEnd Date:\t\t"+d[6].qText; 
														
														}
														return str;
													}
												
											})
											;
										
											/*
												Triangles to represent Lab Results
											*/
										dumbBell.append("polygon")													//To represent triangles and rectangle in case of Lab Results with Range low
											.attr("points", function (d) {											//High and Normal
												
												var str = " ";
												var yCor;
												for (var i = 0; i < yLabels.length; i++){
													if (d[0].qText == yLabels[i])
												   {
													   yCor = y(i);
													   break;
												   }
												}	

												if(d[2].qText === undefined || d[2].qText == "-" || !(d[2].qText.toUpperCase() == 'LOW' || d[2].qText.toUpperCase() == 'NORMAL' || d[2].qText.toUpperCase() == 'ABNORMAL' || d[2].qText.toUpperCase() == 'HIGH'))					/////If indicator is NULL, represent a dash or rectangle
												{
													if(d[1].qText.toUpperCase() == 'LB' && valid_date_flag(d[5].qText) ) {		////If domain is LB and Start Date is not null
														if(d[7].qText === undefined || d[7].qText == "-")			////If character result i.e event value is null, represent as a grey dash 
														{
															str = (x(iso.parse(imputed_date_iso(d[5].qText))) - 5) + ',' + (yCor - 1) + ',' + (x(iso.parse(imputed_date_iso(d[5].qText))) - 5) + ',' + (yCor + 1) + ',' + (x(iso.parse(imputed_date_iso(d[5].qText))) + 5) + ',' + (yCor + 1) + ',' +(x(iso.parse(imputed_date_iso(d[5].qText))) + 5) + ',' + (yCor - 1);
															return str;
														}
														else{														////If character result i.e event value is not null, repesent as a grey rectangle
													
															str = (x(iso.parse(imputed_date_iso(d[5].qText))) - 5) + ',' + (yCor - 3) + ',' + (x(iso.parse(imputed_date_iso(d[5].qText))) - 5) + ',' + (yCor + 3) + ',' + (x(iso.parse(imputed_date_iso(d[5].qText))) + 5) + ',' + (yCor + 3) + ',' +(x(iso.parse(imputed_date_iso(d[5].qText))) + 5) + ',' + (yCor - 3);
															return str;
														}
														
													}
													//return str;
												} 
												else 
												{													/////If indicator is not null, represent as rectangle and triangle
													if(d[1].qText.toUpperCase() == 'LB' && d[2].qText.toUpperCase() == 'LOW' && valid_date_flag(d[5].qText) )
													{												////If Lab result indicator is LOW, represent a triangle pointing downwards
														str = (x(iso.parse(imputed_date_iso(d[5].qText))) - 7) + ',' + (yCor - 7) + ',' + x(iso.parse(imputed_date_iso(d[5].qText))) + ',' + (yCor + 7) + ',' + (x(iso.parse(imputed_date_iso(d[5].qText))) + 7) + ',' + (yCor - 7);
														return str;
													}else if(d[1].qText.toUpperCase() == 'LB' && d[2].qText.toUpperCase() == 'NORMAL' && valid_date_flag(d[5].qText)) 
													{												////If Lab result indicator is NORMAL, represent a rectangle 
														str = (x(iso.parse(imputed_date_iso(d[5].qText))) - 5) + ',' + (yCor - 3) + ',' + (x(iso.parse(imputed_date_iso(d[5].qText))) - 5) + ',' + (yCor + 3) + ',' + (x(iso.parse(imputed_date_iso(d[5].qText))) + 5) + ',' + (yCor + 3) + ',' +(x(iso.parse(imputed_date_iso(d[5].qText))) + 5) + ',' + (yCor - 3);
														return str;
													}else if(d[1].qText.toUpperCase() == 'LB' && (d[2].qText.toUpperCase() == 'HIGH' || d[2].qText.toUpperCase() == 'ABNORMAL') && valid_date_flag(d[5].qText) )
													{												////If Lab result indicator is HIGH, represent a triangle pointing upwards
														str = (x(iso.parse(imputed_date_iso(d[5].qText))) - 7) + ',' + (yCor + 7) + ',' + x(iso.parse(imputed_date_iso(d[5].qText))) + ',' + (yCor - 7) + ',' + (x(iso.parse(imputed_date_iso(d[5].qText))) + 7) + ',' + (yCor + 7);
														return str;
													}
													
													//return str; 
												}						
												
													
											})
											.attr('fill', function (d){ 
											
												var str = "none";
												if(d[1].qText == 'LB' && valid_date_flag(d[5].qText))
												{
													if(d[7].qText === undefined || d[7].qText == "-" || d[2].qText === undefined || d[2].qText == "-"|| !(d[2].qText.toUpperCase() == 'LOW' || d[2].qText.toUpperCase() == 'NORMAL' || d[2].qText.toUpperCase() == 'ABNORMAL' || d[2].qText.toUpperCase() == 'HIGH'))	 
													{												////If there is no Lab result captured or any indicator other than low, high,normal or abnormal, use grey color 
														return "grey";
													}else 
													{
														if(d[2].qText.toUpperCase() == 'LOW' )
														{											////If Lab result indicator is LOW, use Gold color
															str = "gold";
															return str;
														}else if(d[2].qText.toUpperCase() == 'NORMAL')
														{											////If Lab result indicator is NORMAL, use a colorwhich can also be set in front end. Default is set as steelblue color
															return layout.myproperties.color4;
														}else if(d[2].qText.toUpperCase() == 'HIGH' || d[2].qText.toUpperCase() == 'ABNORMAL')
														{											////If Lab result indicator is HIGH, use Red color
															str = "red";
															return str;
														}
														return "none";
													
													}
													
												}else return "none";
												
											})
											.style("opacity", .7) 
											.append("title").text(function(d) {											
												var str = "", event = "";
												if(d[1].qText == 'LB' && valid_date_flag(d[5].qText))
												{
													var event_dim = d[0].qText;
													var index_of_seperator = event_dim.indexOf('|');
													if(index_of_seperator >= 0){
														event = event_dim.substring(index_of_seperator + 2,event_dim.length);
													}
													else 
														event = event_dim.substring(0,event_dim.length);
													var eventCategory = event_dim.substring(0,index_of_seperator - 1);
													
													if((d[2].qText === undefined || d[2].qText == "-") && isNaN(d[8].qNum))
													{											////If there is no Numeric Lab result captured and no indicator, Provide all lab details and result available in dimension
														str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nLab Date/Time:\t\t"+ d[5].qText +"\nLab Result:\t\t"+ d[7].qText+  "\nIndicator:\t\t"+ "-";
														
													}
													else if((d[2].qText === undefined || d[2].qText == "-") && !isNaN(d[8].qNum))
													{											////If there is a Numeric Lab result captured and no indicator, Provide all lab details and numeric result available in measure
														str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nLab Date/Time:\t\t"+ d[5].qText +"\nLab Result:\t\t"+ d[8].qText+  "\nIndicator:\t\t"+ "-";
														
													}
													else if(isNaN(d[8].qNum))
													{											////If there is no Numeric Lab result captured and an indicator, Provide all lab details and numeric result available in dimension
														str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nLab Date/Time:\t\t"+ d[5].qText +"\nLab Result:\t\t"+ d[7].qText+  "\nIndicator:\t\t"+ d[2].qText;
													
													}
													else 
													{											////If there is a Numeric Lab result captured and an indicator, Provide all lab details and numeric result available in measure
														str = "Subject:\t\t\t"+d[3].qText+"\nDomain:\t\t\t"+d[1].qText+ "\nEvent Category:\t\t"+eventCategory+ "\nEvent:\t\t\t"+event+"\nLab Date/Time:\t\t"+ d[5].qText +"\nLab Result:\t\t"+ d[8].qText+  "\nIndicator:\t\t"+ d[2].qText;
													
													}
													return str;
												}
												
														
											})
											;
											
									}
									
									var zoom = svg.call(d3.behavior.zoom()
												.x(x)
												.y(y)
												//.scaleExtent([1, 2])
												.scaleExtent([1,Number.POSITIVE_INFINITY])
												.on("zoom", function () {												//Zoom functionality
													 
													svg.select("g.x.axis").call(xAxis);
													svg.select("g.y.axis").call(yAxis);
													
													/////
													svg.selectAll('.tick text')
														//.style('font-size', '10px')
														.style('font-weight','normal')
														;
														
													svg.selectAll('.y.axis>.tick')												//Tooltip for y-axis labels
														.append('title')
														.text(function(d,i) {
																  if(yLabels[d] === undefined){
																	  return null;
																  }else {
																	  
																		return yLabels[d];
																  }
														});
														
													svg.selectAll('.x.axis>.tick')												//Tooltip for x-axis labels
														.append('title')
														.text(function(d) {
																if(layout.qHyperCube.qMeasureInfo[1].qMax == 1)  					
																{
																	return d;
																}
																else
																	return iso(d).substring(0,10)+" "+iso(d).substring(11,23);
														});
													
													svg.selectAll(".dumbBell").attr("transform", "translate(" + d3.event.translate + ")" + " scale(" + d3.event.scale + ")");
													
													
												}));				
																		
									//create and append the legend based on the LegendLabels Array
									
									var legend = svg.selectAll('.legend')											
										.data(legendLabels).enter()
											.append('g')
												.attr('class', 'legend')
												.attr('transform', 'translate(' + -(width/2 - 30) +','+(height*2/3 - margin.top)+')'); 
												

									
									legend.append("polygon")													//To represent triangles and rectangle in case of Lab Results 
										.attr("points", function (d,i) {											//with Range Low, High and Normal and start and end dates
											var str = " ";
														
											/////
											var yCor = height/3 + margin.bottom + 2*margin.top + 5
												// var offset = 110;
												var offset = 160;
												var rightOffset = 20;
												var xOffset = 6;
												var yStartEndOffset = 6;
												var yRectOffset = 4;
												var yHighLowOffset = 5;
											/////
											if(layout.qHyperCube.qMeasureInfo[1].qMax == 1)  					
											{
														  
												if(i == 0){
													//str = (width*2/3 + ((i) * offset) + margin.right+ (rightOffset - 15) ) + ',' + (yCor - yStartEndOffset) + ',' + (width*2/3 + ((i) * offset) + margin.right+ (rightOffset - 15) + xOffset) + ',' + (yCor) + ',' + (width*2/3 + ((i) * offset) + margin.right+ (rightOffset - 15) ) + ',' + (yCor + yStartEndOffset);
													str = (width*2/3 + ((i-1) * offset) + (rightOffset + 60)) + ',' + (yCor - yStartEndOffset) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset + 60) + xOffset) + ',' + (yCor) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset + 60) ) + ',' + (yCor + yStartEndOffset);
													
													return str;
												}
												if(i == 1){
													str = (width*2/3 + ((i-1) * offset) + (rightOffset + 70) + xOffset) + ',' + (yCor - yStartEndOffset) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset + 70)) + ',' + (yCor) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset + 70) +xOffset) + ',' + (yCor + yStartEndOffset);
													return str;
												}
											}else
											{
												if(i == 0){
													str = (width*2/3 + ((i-1) * offset) + (rightOffset + 130)) + ',' + (yCor - yStartEndOffset) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset + 130) + xOffset) + ',' + (yCor) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset + 130) ) + ',' + (yCor + yStartEndOffset);
													
													return str;
												}
												if(i == 1){
													str = (width*2/3 + ((i-1) * offset) + (rightOffset + 70) + xOffset) + ',' + (yCor - yStartEndOffset) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset + 70)) + ',' + (yCor) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset + 70) +xOffset) + ',' + (yCor + yStartEndOffset);
													return str;
												}
											}
											
											if(i == 2){
												str = (width*2/3 + ((i-1) * offset) + (rightOffset + 10) - xOffset) + ',' + (yCor - yRectOffset) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset + 10) - xOffset) + ',' + (yCor + yRectOffset) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset + 10) + xOffset) + ',' + (yCor + yRectOffset) + ',' +(width*2/3 + ((i-1) * offset) + (rightOffset + 10) + xOffset) + ',' + (yCor - yRectOffset);
												return str;
											}
											if(i == 3){
												str = (width*2/3 + ((i-1) * offset) + (rightOffset - 12) -xOffset) + ',' + (yCor  +yHighLowOffset) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset - 12) ) + ',' + (yCor-yHighLowOffset) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset - 12) +xOffset) + ',' + (yCor+yHighLowOffset);
												return str;
											}
											if(i == 4){
												str = (width*2/3 + ((i-1) * offset) + (rightOffset - 100) - xOffset) + ',' + (yCor  -yHighLowOffset) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset - 100) ) + ',' + (yCor+yHighLowOffset) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset - 100) +xOffset) + ',' + (yCor-yHighLowOffset);
												return str;
											}
											if(i == 5){
												str = (width*2/3 + ((i-1) * offset) + (rightOffset - 175) - xOffset) + ',' + (yCor - yRectOffset) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset - 175) - xOffset) + ',' + (yCor + yRectOffset) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset - 175) + xOffset) + ',' + (yCor + yRectOffset) + ',' +(width*2/3 + ((i-1) * offset) + (rightOffset - 175) + xOffset) + ',' + (yCor - yRectOffset);
												return str;
											}
											if(i == 7){
												str = (width*2/3 + ((i-1) * offset) + (rightOffset - 315) - xOffset) + ',' + (yCor - yRectOffset + 3) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset - 315) - xOffset) + ',' + (yCor + yRectOffset - 3) + ',' + (width*2/3 + ((i-1) * offset) + (rightOffset - 315) + xOffset) + ',' + (yCor + yRectOffset - 3) + ',' +(width*2/3 + ((i-1) * offset) + (rightOffset - 315) + xOffset) + ',' + (yCor - yRectOffset + 3);
												return str;
											}
										})
										.attr('fill', function (d,i){ 
											if(i === 1) return layout.myproperties.color3;
											if(i === 0) return layout.myproperties.color2;
											if(i === 2) return layout.myproperties.color4;
											if(i === 3) return "red";
											if(i === 4) return "gold";
											if(i === 5 || i === 7) return "grey";
										 return "none";
										})
										;
										
										legend.append('circle')									//To represent red circle in case of SAE
										.attr('cx', function(d, i) { 
											if(i == 5){
													var offset = 130;
													var rightOffset = 30;
													return width*2/3 + ((i-1) * offset) + rightOffset + 10;
												}
											
										})
										.attr('cy', function(d,i){
											if(i == 5)
												return (height/3 + margin.bottom + 2*margin.top + 5);
											
										})
										.attr('r', function(d,i){
											if(i == 5)
												return 5;
											
										})
										.attr('fill', function(d,i) {
											if(i == 5) return "red";
										});
										
									legend.append('text')										//Text for legend
										.attr('x', function(d, i) { 
											
											/////
											// if(layout.qHyperCube.qMeasureInfo[1].qMax == 1)  					
											// {
												// if(i == 0) return width*2/3 + ((-1) * 60);
												// if(i == 1) return width*2/3 + ((i) * 120);
											// }else
											// {
												// if(i == 0) return width*2/3 + ((i) * 130);
												// if(i == 1) return width*2/3 + ((i) * 130);
											// }

											
											// if(i == 2) return width*2/3 + ((i) * 120);
											// if(i == 3) return width*2/3 + ((i) * 115);
											// if(i == 4) return width*2/3 + ((i) * 115);
											// if(i == 5) return width*2/3 + ((i) * 110);
											// if(i == 6) return width*2/3 + ((i) * 108);
											// if(i == 7) return width*2/3 + ((i) * 108);
											if(layout.qHyperCube.qMeasureInfo[1].qMax == 1)  					
											{
												if(i == 0) return width*2/3 + ((i-1) * 160);
												if(i == 1) return width*2/3 + ((i) * 10);
											}else
											{
												if(i == 0) return width*2/3 + ((i-1) * 70);
												if(i == 1) return width*2/3 + ((i) * 50);
											}

											
											if(i == 2) return width*2/3 + ((i) * 70);
											if(i == 3) return width*2/3 + ((i) * 88);
											if(i == 4) return width*2/3 + ((i) * 92);
											if(i == 5) return width*2/3 + ((i) * 89);
											if(i == 6) return width*2/3 + ((i) * 87);
											if(i == 7) return width*2/3 + ((i) * 87);
											//////
										})
										.attr('y', function(d){
											return (height/3 + margin.bottom + 2*margin.top);
										})
										.attr('dy', '.85em')
										.attr('font-size', function(d, i) { 
											return '12px';
										})
										//.style('font-family', 'arial')
										.style('font-weight','normal')
										.style('text-anchor', 'middle')
										.text(function (d,i) { 
											if(i === 1 || i == 0 || i == 2 || i == 3 || i == 4 || i == 5 || i == 6 || i == 7)return d; 
											else return null;
										});
										
										d3.selectAll('.y.axis>.tick')												//Tooltip for y-axis labels
											.append('title')
											.text(function(d,i) {
													  if(yLabels[d] === undefined){
														  return null;
													  }else {
														  
															return yLabels[d];
													  }
											});
										
										d3.selectAll('.x.axis>.tick')												//Tooltip for x-axis labels
											.append('title')
											.text(function(d) {
													if(layout.qHyperCube.qMeasureInfo[1].qMax == 1)  					
													{
														return d;
													}
													else
														return iso(d).substring(0,10)+" "+iso(d).substring(11,23);
											});
									}
								
						}
						
						
					};
var imputed_date_iso = function(arr_date)
			{
				if(arr_date.length == 10)
					return arr_date+"T00:00:00.000Z";
				else if(arr_date.length == 11)
					return arr_date+"00:00:00.000Z";
				else if(arr_date.length == 13)
					return arr_date+":00:00.000Z";
				else if(arr_date.length == 16)
					return arr_date+":00.000Z";
				else if(arr_date.length == 19)
					return arr_date+".000Z";
				else if(arr_date.length == 23)
					return arr_date+"Z";
				
				
			};
			var valid_date_flag = function(datevalue)
			{
				if(datevalue == "-" || (datevalue.indexOf('T') < 10 && datevalue.indexOf('T') >= 0))
				{
					return false;
				}else if(datevalue.indexOf('T') == 10 && (datevalue.substring(11, datevalue.length).indexOf('-')) < 0)
				{
					return true;
				}else if(datevalue.indexOf('T') < 0 && datevalue.length == 10)
				{
					return true;
				}else 
				{
					return false;
				}
					
			};
