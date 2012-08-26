
define(function(require) {
	var quads   = [];
	var results = [];
	var lastNode = {x:0, y:0};

	function instantiate(x, y, width, height, max) {

		var rootNode = {
			         x : x,
			         y : y,
			        hw : width >> 1,
			        hh : height >> 1,
			childNodes : [],
			  elements : [],
	 		     color : ''
		};

		var quad = {
			       root : rootNode,
			maxElements : max
		}

		quads.push(quad);

		console.log('x:' + quad.root.x + " y: " + quad.root.y);

		return quads.length - 1;
	}

	function subdivide(entry) {
		var qw = entry.hw >> 1;
		var qh = entry.hh >> 1;

		//console.log('qw:' + qw);
		//console.log('qh:' + qh);

		entry.childNodes.push( {
				 x : entry.x - qw,
				 y : entry.y - qh,
				hw : qw,
				hh : qh,
		childNodes : [],
		  elements : [],
		     color : ''
		} );
		//console.log('x:' + (entry.x - qw) + " y: " + (entry.y - qh));

		entry.childNodes.push( {
				 x : entry.x + qw,
				 y : entry.y - qh,
				hw : qw,
				hh : qh,
		childNodes : [],
		  elements : [],
		     color : ''
		} );

		//console.log('x:' + (entry.x + qw) + " y: " + (entry.y - qh));

		entry.childNodes.push( {
				 x : entry.x - qw,
				 y : entry.y + qh,
				hw : qw,
				hh : qh,
		childNodes : [],
		  elements : [],
		     color : ''
		} );

		//console.log('x:' + (entry.x - qw) + " y: " + (entry.y + qh));

		entry.childNodes.push( {
				 x : entry.x + qw,
				 y : entry.y + qh,
				hw : qw,
				hh : qh,
		childNodes : [],
		  elements : [],
		     color : ''
		} );
		//console.log('x:' + (entry.x + qw) + " y: " + (entry.y + qh));
	}

	function collectChildren(node) {

		if(node.childNodes.length)
		{
			console.log("PARENT");
			collectChildren(node.childNodes[QuadTree.TOP_LEFT]);
			collectChildren(node.childNodes[QuadTree.TOP_RIGHT]);
			collectChildren(node.childNodes[QuadTree.BOTTOM_LEFT]);
			collectChildren(node.childNodes[QuadTree.BOTTOM_RIGHT]);
		}
		else
		{
			console.log("+" + node.elements.length);
			for(var i=0; i<node.elements.length; i++)
			{
				results.push(node.elements[i]);
			}
		}

	}

	function categorize(entry, x, y) {
		if(x < entry.x)
		{
			if(y < entry.y)
			{
				return QuadTree.TOP_LEFT;
			}
			else
			{
				return QuadTree.BOTTOM_LEFT;
			}
		}
		else
		{
			if(y < entry.y)
			{
				return QuadTree.TOP_RIGHT;
			}
			else
			{
				return QuadTree.BOTTOM_RIGHT;
			}
		}
	}

	function addElement(inst, element) {
		var entry   = quads[inst];
		var curNode;
		var moving;
		var quadrant;

		/* Find the right leaf node. */
		curNode = findLeafNode(entry.root, element.x, element.y);

		/* If the leaf node is full, subdivide it and reshuffle elements down. */
		while(curNode.elements.length === entry.maxElements)
		{
			subdivide(curNode);

			for(var i=0; i<curNode.elements.length; i++)
			{
				moving   = curNode.elements[i];
				quadrant = categorize(curNode, moving.x, moving.y);

				curNode.childNodes[quadrant].elements.push(moving);
			}
			curNode.elements.length = 0;

			/* Try the appropriate child next. */
			quadrant = categorize(curNode, element.x, element.y);
			curNode = curNode.childNodes[quadrant];
		}

		/* curNode will contain the element. */
		curNode.elements.push(element);
	}

	function fitsInNode(node, x, y, hw, hh) {
		// left
		if((node.x - node.hw) > (x - hw))
			return false;
		
		// right
		if((node.x + node.hw) < (x + hw))
			return false;
		
		// top
		if((node.y - node.hh) > (y - hh))
			return false;
		
		// bottom
		if((node.y + node.hh) < (y + hh))
			return false;

		return true;
	}

	function findBestFit(startNode, x, y, hw, hh) {
		var quadrant;
		var curNode    = startNode;
		var parentNode = startNode;
		var stillFits  = true;

		//console.log(curNode);
		//console.log(curNode.elements.length);

		while((curNode.childNodes.length > 0) && stillFits)
		{
			quadrant = categorize(curNode, x, y);
			//console.log(quadrant);

			parentNode = curNode;

			curNode    = curNode.childNodes[quadrant];
			stillFits  = fitsInNode(curNode, x, y, hw, hh);
		}

		if(stillFits)
			return curNode;
		else
			return parentNode;
	}

	function findLeafNode(startNode, x, y) {
		var curNode = startNode;

		while(curNode.childNodes.length > 0)
		{
			quadrant = categorize(curNode, x, y);
			curNode  = curNode.childNodes[quadrant];
		}

		return curNode;
	}

	function findInRect2(inst, x, y, width, height) {
		var entry   = quads[inst];
		var hw      = width>>1;
		var hh      = height>>1;
		var curNode = findBestFit(entry.root, x+hw, y+hh, hw, hh);

		/* Skip collection if best fit matches last best fit */
		if((lastNode.x !== curNode.x) ||
		   (lastNode.y !== curNode.y))
		{
			lastNode.color = '';
			lastNode = curNode;
			curNode.color = '255, 0, 0';
			console.log(curNode);

			results.length = 0;
			collectChildren(curNode);
		}

		return results;
	}


	function findInRect(inst, x, y, width, height) {
		var entry   = quads[inst];
		var curNode = entry.root;

		results.length = 0;

		/* Find the right leaf node elements for all 4 corners and add to result set. */
		results = results.concat(findLeafNode(entry.root, x,         y).elements);
		results = results.concat(findLeafNode(entry.root, x + width, y).elements);
		results = results.concat(findLeafNode(entry.root, x,         y + height).elements);
		results = results.concat(findLeafNode(entry.root, x + width, y + height).elements);

		return results;
	}

	function drawNode(node, xoff, yoff, ctx) {
		if(node.childNodes.length)
		{
			drawNode(node.childNodes[QuadTree.TOP_LEFT], xoff, yoff, ctx);
			drawNode(node.childNodes[QuadTree.TOP_RIGHT], xoff, yoff, ctx);
			drawNode(node.childNodes[QuadTree.BOTTOM_LEFT], xoff, yoff, ctx);
			drawNode(node.childNodes[QuadTree.BOTTOM_RIGHT], xoff, yoff, ctx);

			if(node.color !== '')
			{
			    ctx.strokeStyle = 'rgba(' + node.color + ', 1.0)';
	        	ctx.lineWidth   = '1';
	        	ctx.rect(node.x-node.hw+xoff, node.y-node.hh+yoff, node.hw<<1, node.hh<<1);
	        	ctx.stroke();
        	}
		}
		else
		{
			if(node.color !== '')
			{
			    ctx.strokeStyle = 'rgba(' + node.color + ', 1.0)';
	        	ctx.lineWidth   = '1';
	        	ctx.rect(node.x-node.hw+xoff, node.y-node.hh+yoff, node.hw<<1, node.hh<<1);
	        	ctx.stroke();
        	}
    	}
	}

	function drawNodes(inst, xoff, yoff, ctx) {
		var entry   = quads[inst];

		var curNode = entry.root;

		drawNode(curNode, xoff, yoff, ctx);
	}

	var QuadTree = {};

	QuadTree.instantiate  = instantiate;
	QuadTree.addElement   = addElement;
	QuadTree.findInRect   = findInRect;
	QuadTree.findInRect2  = findInRect2;
	QuadTree.drawNodes    = drawNodes;

	QuadTree.TOP_LEFT     = 0;
	QuadTree.TOP_RIGHT    = 1;
	QuadTree.BOTTOM_LEFT  = 2;
	QuadTree.BOTTOM_RIGHT = 3;

	return QuadTree;
});