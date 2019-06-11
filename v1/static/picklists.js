'use strict';



/******************
* PICKLIST & ITEM *
******************/

function PicklistItem(id, node, weight, label){
    this.id = id;
    this.node = node;
    this.weight = weight || 1;
    this.label = label || null;
}
extend(PicklistItem.prototype, {
    get_serializable_data: function(){
        return {
            node: this.node.id,
            weight: this.weight,
            label: this.label,
        };
    },
});


function Picklist(id, title, sim, nodes){
    this.id = id;
    this.title = title;
    this.sim = sim;
    this.items = [];
    if(nodes){
        for(var i = 0; i < nodes.length; i++){
            this.add_item(nodes[i]);
        }
    }
}
extend(Picklist.prototype, {
    add_item: function(node, weight, label){
        for(var i = 0; i < this.items.length; i++){
            var item = this.items[i];
            if(this.items[i].node === node)return;
        }
        var id = this.items.length;
        var item = new PicklistItem(id, node, weight, label);
        this.items.push(item);
        return item;
    },
    remove_item: function(item){
        var i = this.items.indexOf(item);
        if(i < 0)return;
        this.items.splice(i, 1);
    },
    get_serializable_data: function(){
        var items_data = [];
        for(var i = 0; i < this.items.length; i++){
            var item = this.items[i];
            items_data.push(item.get_serializable_data());
        }
        return {
            title: this.title,
            items: items_data,
        };
    },
    get_best_route: function(tries){
        if(typeof tries === 'undefined')tries = 1000;

        /* Precalculate shortest paths, reuse for each call to
        get_random_route */
        var shortest_paths = this.get_shortest_paths();

        var best_route = null;
        for(var i = 0; i < tries; i++){
            var route = this.get_random_route(shortest_paths);
            if(!best_route || route.dist < best_route.dist){
                best_route = route;
            }
        }
        return best_route;
    },
    get_shortest_paths: function(){
        /* Returns Array of Array of Path.
        So given shortest_paths, you find the shortest path from node
        i to node j by: shortest_paths[i][j] */

        var shortest_paths = new Array(this.items.length);
        for(var i = 0; i < this.items.length; i++){
            var item = this.items[i];
            var djikstra = this.sim.get_djikstra(item.node);

            /* NOTE: We currently do *not* make the assumption that the
            shortest path from node0 to node1 is same as shortest path
            from node1 to node0, despite the fact that this happens to
            be true.
            If we wanted to do it the other way, we would change j=0
            to j=i+1 below. */
            var item_shortest_paths = new Array(this.items.length);
            for(var j = 0; j < this.items.length; j++){
                var other_item = this.items[j];
                var path = this.sim.get_shortest_path(
                    item.node, other_item.node, djikstra);
                item_shortest_paths[j] = path;
            }
            shortest_paths[i] = item_shortest_paths;
        }
        return shortest_paths;
    },
    get_route_paths: function(route_items, shortest_paths){
        if(!shortest_paths)shortest_paths = this.get_shortest_paths(this.items);

        var route_paths = [];
        for(var i = 1; i < route_items.length; i++){
            var item0 = route_items[i - 1];
            var item1 = route_items[i];
            var path = shortest_paths[item0.id][item1.id];
            route_paths.push(path);
        }
        return route_paths;
    },
    get_random_route: function(shortest_paths){
        var unused_items = this.items.slice();
        var route_items = [];
        while(unused_items.length > 0){
            var item_id = Math.floor(Math.random() * unused_items.length);
            var item = unused_items.splice(item_id, 1)[0];
            route_items.push(item);
        }

        var route_paths = this.get_route_paths(route_items, shortest_paths);
        return new Route(route_items, route_paths);
    },
});



/********
* ROUTE *
********/

function Route(items, paths){
    this.items = items;
    this.paths = paths;
    this.path = this.get_path();
    this.dist = this.path.dist;
}
extend(Route.prototype, {
    get_path: function(){
        var path = new Path();
        for(var i = 0; i < this.paths.length; i++){
            path.concat(this.paths[i]);
        }
        return path;
    },
});

