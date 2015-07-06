// sequences.js contains the main visualization function draw(),
// used to create the model, as well as functions that allow 
// user interaction


require([
	'root',
  'initializeSkinDropdown', 'initializeProgramDropdown',
    'domready'
], 

function(root, initializeSkinDropdown, initializeProgramDropdown, domReady) 
{
  var draw = function()
  {
    // initialize skin color
    var skin_obj = initializeSkinDropdown;
    var color = skin_obj.defaultSkin(); 

    // Dimensions of sunburst.
    var width = parseInt(d3.select("#chart").style('width'));
    var height = parseInt(d3.select("#chart").style('height'));
    var radius = Math.min(width, height) / 2;


    // Breadcrumb default dimensions: width, height, spacing, width of tip/tail, 
        //multiplier to increase width of breadcrumb based on length of d.title (m >= 7)
    var b = {
      w: 75, h: 30, s: 5, t: 10, m: 8
    };

    // Holds the width of all the nodes in the current path
    var bWidths = [];

    // Minimum width of a breadcrumb is defined by b.w; 
      //addWidth will increase the length of a breadcrumb width based on d.title
    var addWidth = 0;

    // create svg to display sunburst on
    var vis = d3.select("#chart").append("svg:svg")
        .attr("width", width)
        .attr("height", height)
        .append("svg:g")
        .attr("id", "container")
        .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

    // Description of the partition of data
    // The leaf node has a "size" attribute, which its parents size
    // is the sum of its children. The nodes are sorted alphabetically. 
    var partition = d3.layout.partition()
        .size([2 * Math.PI, radius * radius])
        .value(function(d) { return d.size;})
        .sort(compareCourses);

    // Create arcs with these properties
    var arc = d3.svg.arc()
        .startAngle(function(d) { return d.x; })
        .endAngle(function(d) { return d.x + d.dx; })
        .innerRadius(function(d) { return Math.sqrt(d.y); })
        .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });
     
    // Holds the previous model, used to zoom in and out
    var oldStructure = {}; 	

    // Initalize the root with default program name
    var tree = root;
    var default_program_name = initializeProgramDropdown.defaultProgramName(); 

    // Copy of original built root, if needed to refer back to 
    var json = tree.buildRoot(default_program_name); 

    // Start visualization
    createVisualization(json);


    // Main function to draw and set up the visualization, once we have the data.
    function createVisualization(json) {
      // Basic setup of page elements.
      oldStructure = json; 
      initializeBreadcrumbTrail();

      // Bounding circle underneath the sunburst, to make it easier to detect
      // when the mouse leaves the parent g.
      vis.append("svg:circle")
          .attr("r", radius)
          .style("opacity", 0)
    	  .on("click", clickCenter)
        .on("mouseover", mouseInCenter)

    	// start with text in middle
      d3.select("#center")
          .text("Ilios Visualizer")
          
      // create the nodes given partition description above,
      // and create arcs inside of "paths"  
      initializePaths();
	
      // Add the mouseleave handler to the bounding circle.
      d3.select("#container").on("mouseleave", mouseleave) ;
     };


    function initializePaths(){
      var nodes = partition.nodes(json);
      var path = vis.data([json]).selectAll("path")
            .data(nodes)
          .enter().append("svg:path")
          .attr("display", function(d) { return d.depth ? null : "none"; })
          .attr("d", arc)
          .attr("fill-rule", "evenodd")
          .style("fill", function(d) { return pickColor(d)})
          .style("opacity", 1)
          .on("mouseover", mouseover)
          .on("click", click);
    }

     // If click on arc
     function click(d){
    	if(arcHasChildren(d)){
      		updateBreadcrumbs(getAncestors(d, true));
    		zoomIn(d);
    	}
     }
     
     // If click on Circle (Center)
     function clickCenter(){
    	if(oldStructure){
    		updateBreadcrumbs(getAncestors(oldStructure, true));
    		zoomOut()
    	}
     }
     

    function mouseInCenter(d) {
      // Middle text empty
      d3.select("#center")
          .text("")

      // All segments visible
      d3.selectAll("path")
          .style("opacity", 1);
    }

    function mouseover(d) {
      // change text in middle circle to reflect title of node
      d3.select("#center")
          .text(d.title);

      d3.select("#explanation")
          .style("visibility", "");

      var sequenceArray = getAncestors(d);

      // Fade all the segments.
      d3.selectAll("path")
          .style("opacity", 0.3);

      // Then highlight only those that are an ancestor of the current segment.
      vis.selectAll("path")
          .filter(function(node) {
                    return (sequenceArray.indexOf(node) >= 0);
                  })
          .style("opacity", 1);
    }

    // Restore everything to full opacity when moving off the visualization.
    function mouseleave(d) {
      // Deactivate all segments during transition.
      d3.selectAll("path").on("mouseover", null);

      // Transition each segment to full opacity and then reactivate it.
      d3.selectAll("path")
          .transition()
          .duration(300)
          .style("opacity", 1)
          .each("end", function() {
                  d3.select(this).on("mouseover", mouseover);
                });

      d3.select("#explanation")
          .transition()
          .duration(1000)
          .style("visibility", "hidden");   
    }


    // Comparison function used to sort nodes alphabetically 
    function compareCourses(a,b){
      if(a.title < b.title){
        return -1;
      }  
      if(a.title > b.title){
        return 1;
      }
      return 0;
    }
     
    function zoomIn(d)
    {
    	oldStructure = d.parent; 
      // sections represents all 16 sections, 
      var sections = d3.select("#container").selectAll("path")

      sections.remove();
      
      
      var nodes = partition.nodes(d);

      var path = vis.data([d]).selectAll("path")
          .data(nodes)
          .enter().append("svg:path")
          .attr("display", function(d) { return d.depth ? null : "none"; })
          .attr("d", arc)
          .attr("fill-rule", "evenodd")
          .style("fill", function(d) { return pickColor(d)})
          .style("opacity", 1)
          .on("mouseover", mouseover)
          .on("click", click)
          .each(stash) 
          .transition()
          .duration(750)
          .attrTween("d", arcTween);
    }

    function zoomOut(){
      // sections represents all 16 sections, 

      var sections = d3.select("#container").selectAll("path")
      sections.remove();
      
      var d = oldStructure; // ONLY DIFFERENCE
      var nodes = partition.nodes(d);
      
      
      var path = vis.data([d]).selectAll("path")
          .data(nodes)
          .enter().append("svg:path")
          .attr("display", function(d) { return d.depth ? null : "none"; })
          .attr("d", arc)
          .attr("fill-rule", "evenodd")
          .style("fill", function(d) { return pickColor(d)})     
          .style("opacity", 1)
          .on("mouseover", mouseover)
          .on("click", click)
          .each(stash) 
          .transition()
          .duration(750)
          .attrTween("d", arcTween);
      // Set next zoom out structure to the parent node		
      oldStructure = d.parent
    }



    function arcHasChildren(d){
    	if(d.children){
    	return true;
    	}
    	return false; 
    }



    // Given a node in a partition layout, return an array of all of its ancestor
    // nodes, highest first, but excluding the root. isBreadCrumb is set to true when 
    // zooming in and out to force it to always display the root (program) node
    function getAncestors(node, isBreadCrumb) {

      // Give isBreadCrumb a default value of false
   	  isBreadCrumb = typeof isBreadCrumb !== 'undefined' ? isBreadCrumb : false;

      var path = [];
      var current = node;
      while (current.parent) {
        path.unshift(current);
        current = current.parent;
      }
      if(isBreadCrumb)
      {
      	path.unshift(current);
      }
      return path;
    }

    function initializeBreadcrumbTrail() {
      // Add the svg area.
      var trail = d3.select("#sequence").append("svg:svg")
          .attr("width", width)
          .attr("height", 50)
          .attr("id", "trail");

      // reset breadcrumb values
      bWidths = [];

      // Initially have root breadcrumb displayed
      updateBreadcrumbs(getAncestors(oldStructure, true));

      }

    // Generate a string that describes the points of a breadcrumb polygon.
    function breadcrumbPoints(d, i) {
      var points = [];
     
      calculateWidths(d);

      points.push("0,0");
      points.push((b.w + addWidth) + ",0");
      points.push((b.w + addWidth) + b.t + "," + (b.h / 2));
      points.push((b.w + addWidth) + "," + b.h);
      points.push("0," + b.h);
      if (i > 0) { // Leftmost breadcrumb; don't include 6th vertex.
        points.push(b.t + "," + (b.h / 2));
      }

      return points.join(" ");
    }

    function calculateWidths(d) {

      addWidth = 0;
      if(d.title.length * b.m > b.w)
      {
        // extra width to add to the breadcrumb's default width in order to fit node text
        addWidth = (d.title.length * b.m) - b.w;
      }

      bWidths.push(b.w + addWidth);
    }

    // Update the breadcrumb trail to show the current sequence
    function updateBreadcrumbs(nodeArray) {
      // Reset widths of the current trail if at root node
      if (bWidths.length >= nodeArray.length)
      {
        // recaluclate new bWidths
        bWidths = [];
        for(var i = 0; i < nodeArray.length; i++)
        {
          calculateWidths(nodeArray[i]);
        }
      }

      // Data join
      var g = d3.select("#trail")
          .selectAll("g")
          .data(nodeArray, function(d) { return d.title; });

      // Add breadcrumb and label for entering nodes.
      var entering = g.enter().append("svg:g");

      entering.append("svg:polygon")
          .attr("points", breadcrumbPoints)
          .style("fill", function(d) { return pickColor(d)})
          .style("stroke", "black");

      entering.append("svg:text")
          .attr("x", function(d, i) { return ((bWidths[i] + b.t) / 2)})
          .attr("y", b.h / 2)
          .attr("dy", "0.35em")
          .attr("text-anchor", "middle")
          .text(function(d) { return d.title; });

      // Set position for entering and updating nodes.
      g.attr("transform", function(d, i) {
        var newWidthPos = 0;
        for (var x = 0; x < i; x++)
        {
          newWidthPos = newWidthPos + bWidths[x] + b.s;
    
        }
        
        return "translate(" + newWidthPos + ", 0)";
      });

      // Remove exiting nodes.
      g.exit().remove();

    }


    function arcTween(a){
      var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
      return function(t) {
        var b = i(t);
        a.x0 = b.x;
        a.dx0 = b.dx;
        return arc(b);
      };
    };
            
    function stash(d) {
      d.x0 = 0; // d.x;
      d.dx0 = 0; //d.dx;
    }; 

    // Choose color based on ascii value of title
    function pickColor(d){
      var title = d.title;
      var ascii_value = 0;
      for (var i = 0; i < title.length; i++) {
        ascii_value += title[i].charCodeAt(0);
      };
      return color[ascii_value % (color.length)];
    };

    // Change skin based on selection
    var skinChange = function() {
        var colorName = d3.event.target.value;
        
        color = skin_obj.getPallete(colorName); 
      

        var d; 
        if(oldStructure){
          d = oldStructure;
        }
        else{
          d = json; 
        }
        var path = vis.data([d]).selectAll("path")
          .style("fill", function(d) { return pickColor(d)}) 


    }

    //add this event listener to the first menu (as a whole):
    d3.select("#skin-dropdown").on("change", skinChange);

    // Change program and model as reflection of selection
    var programChange = function() {
      var programName = d3.event.target.value;
      json = tree.buildRoot(programName);
      oldStructure = json; 

      var sections = d3.select("#container").selectAll("path")
      sections.remove();


      initializePaths();
      initializeBreadcrumbTrail();
    }

    //add this event listener to the first menu (as a whole):
    d3.select("#program-dropdown").on("change", programChange);
  };


    domReady(function () 
  {
    console.log('ready');
    draw();
  });

});
