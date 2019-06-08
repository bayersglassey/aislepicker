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
    this.label = label? label: null;

    this.edges = [];
}
extend(Node.prototype, {
    add_edge: function(dst_node, twoway){
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


