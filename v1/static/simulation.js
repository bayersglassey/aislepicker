'use strict';



/**************
* NODE & EDGE *
**************/

function Node(id, x, y, radius, label){
    /* id: index in simulation's list of nodes */
    this.id = id;

    /* x, y: coordinates with respect to canvas */
    this.x = x;
    this.y = y;

    this.radius = radius;
    this.label = label || null;

    this.edges = [];
}
extend(Node.prototype, {
    add_edge: function(dst_node, twoway){
        if(typeof twoway === 'undefined')twoway = true;
        var edge = new Edge(dst_node);
        this.edges.push(edge);
        if(twoway){
            dst_node.add_edge(this, false);
        }
        return edge;
    },
    remove_edge: function(edge){
        var i = this.edges.indexOf(edge);
        if(i < 0)return;
        this.edges.splice(i, 1);
    },
    get_dist: function(other_node){
        return dist2d(this.x, this.y, other_node.x, other_node.y);
    },
    get_serializable_data: function(){
        var edges_data = [];
        for(var i = 0; i < this.edges.length; i++){
            var edge = this.edges[i];
            edges_data.push(edge.get_serializable_data());
        }
        return {
            x: this.x,
            y: this.y,
            radius: this.radius,
            label: this.label,
            edges: edges_data,
        };
    },
});

function Edge(dst_node){
    this.dst_node = dst_node;
}
extend(Edge.prototype, {
    get_serializable_data: function(){
        return {
            dst_node: this.dst_node.id,
        };
    },
});

function Path(nodes, dist){
    this.nodes = nodes;
    this.dist = typeof dist !== 'undefined'? dist: this.get_dist();
}
extend(Path.prototype, {
    get_dist: function(){
        var dist = 0;
        for(var i = 1; i < nodes.length; i++){
            dist += nodes[i-1].get_dist(nodes[i]);
        }
        return dist;
    },
});


/*************
* SIMULATION *
*************/

function Simulation(){
    this.nodes = [];
}
extend(Simulation.prototype, {
    add_node: function(x, y, radius, label){
        var id = this.nodes.length;
        var node = new Node(id, x, y, radius, label);
        this.nodes.push(node);
        return node;
    },
    remove_node: function(node){
        var i = this.nodes.indexOf(node);
        if(i < 0)return;
        this.nodes.splice(i, 1);

        var dst_node = node;
        for(var i = 0; i < this.nodes.length; i++){
            var node = this.nodes[i];
            for(var j = 0; j < node.edges.length; j++){
                var edge = node.edges[j];
                if(edge.dst_node !== dst_node)continue;
                node.remove_edge(edge); j--;
            }
        }
    },
    get_node_xy: function(x, y){
        /* Iterate in reverse order so nodes with de facto "highest z order"
        are selected first */
        for(var i = this.nodes.length - 1; i >= 0; i--){
            var node = this.nodes[i];
            var dist = dist2d(node.x, node.y, x, y);
            if(dist < node.radius)return node;
        }
        return null;
    },
    get_shortest_path: function(node0, node1, d){
        if(typeof d === 'undefined')d = this.get_djikstra(node0);

        var nodes = [];
        var node = node1;
        while(node){
            nodes.unshift(node);
            node = d.prev_nodes_by_id[node.id];
        }

        var dist = d.dists_by_id[node1.id];
        return new Path(nodes, dist);
    },
    get_djikstra: function(node0, nodes){
        /* Djikstra's algorithm */

        if(typeof nodes === 'undefined')nodes = this.nodes;
        var unvisited_nodes = nodes.slice();

        /* Array mapping node ids to shortest known distance from node0 */
        var dists_by_id = new Array(nodes.length);

        /* Array mapping node ids to previous node in shortest path */
        var prev_nodes_by_id = new Array(nodes.length);

        /* Initialize */
        for(var i = 0; i < nodes.length; i++){
            dists_by_id[i] = Infinity;
            prev_nodes_by_id[i] = null;
        }
        dists_by_id[node0.id] = 0;

        while(unvisited_nodes.length > 0){
            /* Find unvisited node with smallest dist */
            var node = null;
            var node_dist = Infinity;
            for(var i = 0; i < unvisited_nodes.length; i++){
                var unvisited_node = unvisited_nodes[i];
                var unvisited_node_dist = dists_by_id[unvisited_node.id];
                if(unvisited_node_dist < node_dist){
                    node = unvisited_node;
                    node_dist = unvisited_node_dist;
                }
            }
            if(!node){
                console.log("Couldn't find next node!",
                    unvisited_nodes, dists_by_id, prev_nodes_by_id);
                break;
            }

            /* Remove node from unvisited_nodes */
            unvisited_nodes.splice(unvisited_nodes.indexOf(node), 1);

            for(var i = 0; i < node.edges.length; i++){
                var edge = node.edges[i];
                var dst_node = edge.dst_node;
                if(unvisited_nodes.indexOf(dst_node) < 0)continue;
                var dst_node_dist = node_dist + node.get_dist(dst_node);
                if(dst_node_dist < dists_by_id[dst_node.id]){
                    dists_by_id[dst_node.id] = dst_node_dist;
                    prev_nodes_by_id[dst_node.id] = node;
                }
            }
        }

        return {
            dists_by_id: dists_by_id,
            prev_nodes_by_id: prev_nodes_by_id,
        };
    },
    get_serializable_data: function(){
        var nodes_data = [];
        for(var i = 0; i < this.nodes.length; i++){
            var node = this.nodes[i];
            nodes_data.push(node.get_serializable_data());
        }
        return {
            nodes: nodes_data,
        };
    },
    load_serializable_data: function(data){
        for(var i = 0; i < data.nodes.length; i++){
            var node_data = data.nodes[i];
            var node = this.add_node(node_data.x, node_data.y,
                node_data.radius, node_data.label);
        }
        for(var i = 0; i < data.nodes.length; i++){
            var node_data = data.nodes[i];
            var node = this.nodes[i];
            for(var j = 0; j < node_data.edges.length; j++){
                var edge_data = node_data.edges[j];
                var dst_node = this.nodes[edge_data.dst_node];
                var edge = node.add_edge(dst_node, false);
            }
        }
    },
});


