;(function($, $$){
	
	$$.fn.core = function( fnMap, options ){
		for( var name in fnMap ){
			var fn = fnMap[name];
			$$.Core.prototype[ name ] = fn;
		}
	};
	
	$$.Core = function( opts ){
		if( !(this instanceof $$.Core) ){
			return new $$.Core(opts);
		}

		var cy = this;
		
		var defaults = {
			layout: {
				name: "grid"
			},
			renderer: {
				name: "svg"
			},
			style: { // actual default style later specified by renderer
			}
		};
		
		var options = $.extend(true, {}, defaults, opts);
		
		if( options.container == null ){
			$.error("Cytoscape.js must be called on an element; specify `container` in options or call on selector directly with jQuery, e.g. $('#foo').cy({...});");
			return;
		} else if( $(options.container).size() > 1 ){
			$.error("Cytoscape.js can not be called on multiple elements in the functional call style; use the jQuery selector style instead, e.g. $('.foo').cy({...});");
			return;
		}
		
		this._private = {
			options: options, // cached options
			style: options.style,
			nodes: {}, // id => node object
			edges: {}, // id => edge object
			live: {}, // event name => array of callback defns
			selectors: {}, // selector string => selector for live
			listeners: [], // list of listeners
			animation: { 
				// normally shouldn't use collections here, but animation is not related
				// to the functioning of Selectors, so it's ok
				elements: null // elements queued or currently animated
			},
			scratch: {}, // scratch object for core
			layout: null,
			renderer: null,
			notificationsEnabled: true, // whether notifications are sent to the renderer
			zoomEnabled: true,
			panEnabled: true
		};

		cy.initRenderer( options.renderer );

		// initial load
		cy.load(options.elements, function(){ // onready
			var data = cy.container().data("cytoscape");
			
			if( data == null ){
				data = {};
			}
			data.cy = cy;
			data.ready = true;
			
			if( data.readies != null ){
				$.each(data.readies, function(i, ready){
					cy.bind("ready", ready);
				});
				
				data.readies = [];
			}
			
			$(options.container).data("cytoscape", data);
			
			cy.startAnimationLoop();
			
			if( $$.is.fn( options.ready ) ){
				options.ready.apply(cy, [cy]);
			}
			
			cy.trigger("ready");
		}, options.done);
	};

	$$.corefn = $$.Core.prototype; // short alias
	

	$$.fn.core({
		getElementById: function( id ){
			return this._private.nodes[id] || this._private.edges[id] || new $$.Collection( this );
		},

		addToPool: function( ele ){
			this._private[ ele._private.group ][ ele._private.data.id ] = ele;
		},

		removeFromPool: function( ele ){
			delete this._private[ ele._private.group ][ ele._private.data.id ];
		},

		container: function(){
			return $( this._private.options.container );
		},

		options: function(){
			return $$.util.copy( this._private.options );
		},
		
		json: function(params){
			var json = {};
			var cy = this;
			
			json.elements = {};
			cy.elements().each(function(i, ele){
				var group = ele.group();
				
				if( json.elements[group] == null ){
					json.elements[group] = [];
				}
				
				json.elements[group].push( ele.json() );
			});

			json.style = cy.style();
			json.scratch = $$.util.copy( cy.scratch() );
			json.zoomEnabled = cy._private.zoomEnabled;
			json.panEnabled = cy._private.panEnabled;
			json.layout = $$.util.copy( cy._private.options.layout );
			json.renderer = $$.util.copy( cy._private.options.renderer );
			
			return json;
		}
		
	});	
	
})(jQuery, jQuery.cytoscape);