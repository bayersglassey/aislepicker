'use strict';


/****************
* GENERAL UTILS *
****************/

function extend(obj0, obj1){
    for(var i = 1; i < arguments.length; i++){
        obj1 = arguments[i];
        for(var key in obj1){
            if(!obj1.hasOwnProperty(key))continue;
            obj0[key] = obj1[key];
        }
    }
    return obj0;
}

function getopt(opts, key, default_val){
    if(!opts)return default_val;
    var val = opts[key];
    if(typeof val === 'undefined')return default_val;
    return val;
}


function showif(elem, visible){
    elem.style.display = visible? '': 'none';
}
function show(elem){showif(elem, true)}
function hide(elem){showif(elem, false)}

function drawCircle(ctx, x, y, r){
    ctx.arc(x, y, r, 0, Math.PI * 2);
}

function px(x){return String(x) + 'px'}
function url(x){return 'url(' + String(x) + ')'}
function font(name, height, bold, italic){
    var f = px(height) + ' ' + name;
    if(italic)f = 'italic ' + f;
    if(bold)f = 'bold ' + f;
    return f;
}

function dist2d(x0, y0, x1, y1){
    var x = x1 - x0;
    var y = y1 - y0;
    return Math.sqrt(x*x + y*y);
}

function boxcoll(l0, r0, t0, b0, l1, r1, t1, b1){
    var temp;
    if(l0 > r0){temp = l0; l0 = r0; r0 = temp}
    if(t0 > b0){temp = t0; t0 = b0; b0 = temp}
    if(l1 > r1){temp = l1; l1 = r1; r1 = temp}
    if(t1 > b1){temp = t1; t1 = b1; b1 = temp}
    return (
        r0 > l1 &&
        b0 > t1 &&
        r1 > l0 &&
        b1 > t0
    );
}

function serialize(obj){
    var data = obj.get_serializable_data();
    return JSON.stringify(data, null, 4);
}

function deserialize(obj, text){
    var data = JSON.parse(text);
    obj.load_serializable_data(data);
}





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



/*******
* MENU *
********/

function Menu(elem){
    this.elem = elem;
    this.header_elems = elem.getElementsByClassName('menu-header');

    this.dragging = false;
    this.controls = elem.elements;

    this.visible = elem.style.display !== 'none';

    this.attach_listeners();
}
extend(Menu.prototype, {
    attach_listeners: function(){
        var menu = this;
        for(var i = 0; i < this.header_elems.length; i++){
            var header_elem = this.header_elems[i];
            header_elem.addEventListener('mousedown', function(event){
                var x = event.pageX;
                var y = event.pageY;
                menu.dragging = true;
                menu.dragging_x = x - menu.elem.offsetLeft;
                menu.dragging_y = y - menu.elem.offsetTop;
            });
        }
        document.addEventListener('mousemove', function(event){
            if(menu.dragging){
                var x = event.pageX;
                var y = event.pageY;
                menu.move(x - menu.dragging_x, y - menu.dragging_y);
            }
        });
        document.addEventListener('mouseup', function(event){
            menu.dragging = false;
        });
    },
    toggle: function(){
        this.visible = !this.visible;
    },
    render: function(){
        this.elem.style.display = this.visible? '': 'none';
    },
    move: function(x, y){
        this.elem.style.left = px(x);
        this.elem.style.top = px(y);
    }
});



/********************
* SIMULATION RUNNER *
********************/

function SimulationRunner(elems){
    this.elems = elems;
    this.main = elems.main;
    this.canvas = elems.canvas;
    this.menus = {
        sim: new Menu(elems.menu_sim),
    };

    this.sim = new Simulation();
    this.selected_nodes = [];
    this.dragging = false;

    this.node_radius = 8;

    this.attach_listeners();
    this.render();
}
extend(SimulationRunner.prototype, {
    attach_listeners: function(){
        var runner = this;

        this.canvas.addEventListener('mousedown', function(event){
            var rect = event.target.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            if(event.ctrlKey){
                var node = runner.sim.get_node_xy(x, y);
                if(node){
                    runner.add_edges(node);
                }else{
                    runner.add_node(x, y);
                }
            }else{
                var node = runner.sim.get_node_xy(x, y);
                if(node){
                    if(event.shiftKey){
                        runner.add_selected_node(node);
                    }else{
                        if(runner.node_is_selected(node)){
                            runner.drag_start(x, y, 'move');
                        }else{
                            runner.clear_selected_nodes();
                            runner.add_selected_node(node);
                            runner.drag_start(x, y, 'move');
                        }
                    }
                }else{
                    if(event.shiftKey){
                        runner.drag_start(x, y, 'select');
                    }else{
                        runner.clear_selected_nodes();
                        runner.drag_start(x, y, 'select');
                    }
                }
            }
            runner.render();
        });
        this.canvas.addEventListener('mousemove', function(event){
            var rect = event.target.getBoundingClientRect();
            var x = event.clientX - rect.left;
            var y = event.clientY - rect.top;
            if(runner.dragging){
                runner.drag_move(x, y);
                runner.render();
            }
        });
        document.addEventListener('mouseup', function(event){
            runner.drag_end();
            runner.render();
        });

        for(var key in this.menus){
            if(!this.menus.hasOwnProperty(key))continue;
            this.menus[key].elem.addEventListener('change', function(event){
                runner.render()
            });
        }

        this.menus.sim.controls.json_save.addEventListener('click', function(event){
            var text = serialize(runner);
            runner.menus.sim.controls.json_text.value = text;
        });
        this.menus.sim.controls.json_load.addEventListener('click', function(event){
            var text = runner.menus.sim.controls.json_text.value;
            deserialize(runner, text);
            runner.render();
        });

        this.elems.menu_toggle_sim.addEventListener('click', function(event){
            var x = event.pageX;
            var y = event.pageY;
            runner.menus.sim.toggle();
            runner.menus.sim.move(x, y);
            runner.render();
        });
    },
    drag_start: function(x, y, dragging){
        this.dragging = dragging;
        this.dragging_x0 = x;
        this.dragging_y0 = y;
        this.dragging_x1 = x;
        this.dragging_y1 = y;
    },
    drag_move: function(x, y){
        var mx = x - this.dragging_x1;
        var my = y - this.dragging_y1;
        if(this.dragging === 'move'){
            for(var i = 0; i < this.selected_nodes.length; i++){
                var node = this.selected_nodes[i];
                node.x += mx;
                node.y += my;
            }
        }
        this.dragging_x1 = x;
        this.dragging_y1 = y;
    },
    drag_end: function(){
        if(this.dragging === 'select'){
            var l = this.dragging_x0;
            var r = this.dragging_x1;
            var t = this.dragging_y0;
            var b = this.dragging_y1;
            var nodes = this.sim.nodes;
            for(var i = 0; i < nodes.length; i++){
                var node = nodes[i];
                var rad = node.radius;
                var coll = boxcoll(
                    node.x - rad, node.x + rad,
                    node.y - rad, node.y + rad,
                    l, r, t, b);
                if(coll){
                    this.add_selected_node(node);
                }
            }
        }
        this.dragging = false;
    },
    add_edges: function(node){
        for(var i = 0; i < this.selected_nodes.length; i++){
            var selected_node = this.selected_nodes[i];
            selected_node.add_edge(node);
        }
    },
    add_node: function(x, y){
        var node = this.sim.add_node(x, y, this.node_radius);
        this.add_edges(node);
        this.selected_nodes = [node];
        return node;
    },
    clear_selected_nodes: function(){
        this.selected_nodes.length = 0;
    },
    node_is_selected: function(node){
        return this.selected_nodes.indexOf(node) >= 0;
    },
    add_selected_node: function(node){
        if(this.selected_nodes.indexOf(node) >= 0)return;
        this.selected_nodes.push(node);
    },
    message: function(msg){
        alert(msg);
    },
    get_serializable_data: function(){
        return {
            title: this.menus.sim.controls.title.value,
            bgimg: this.menus.sim.controls.bgimg.value,
            node_radius: this.node_radius,
            sim: this.sim.get_serializable_data(),
        };
    },
    load_serializable_data: function(data){
        this.menus.sim.controls.title.value = data.title;
        this.menus.sim.controls.bgimg.value = data.bgimg;
        this.menus.sim.controls.node_radius.value = data.node_radius;
        this.sim.load_serializable_data(data.sim);
    },
    render: function(){
        hide(this.elems.loading);
        show(this.elems.main);

        var bgimg = this.menus.sim.controls.bgimg.value;
        this.canvas.style.backgroundImage = url(bgimg);

        this.render_clear();
        this.render_edges();
        this.render_nodes();
        this.render_dragbox();

        for(var key in this.menus){
            if(!this.menus.hasOwnProperty(key))continue;
            this.menus[key].render();
        }

        this.node_radius = parseInt(
            this.menus.sim.controls.node_radius.value);
    },
    render_clear: function(){
        var ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    render_edges: function(){
        var ctx = this.canvas.getContext('2d');
        var nodes = this.sim.nodes;
        for(var i = 0; i < nodes.length; i++){
            var node = nodes[i];
            for(var j = 0; j < node.edges.length; j++){
                var edge = node.edges[j];
                var dst_node = edge.dst_node;
                ctx.strokeStyle = '#aaa';
                ctx.beginPath();
                ctx.moveTo(node.x, node.y);
                ctx.lineTo(dst_node.x, dst_node.y);
                ctx.stroke();
            }
        }
    },
    render_nodes: function(){
        var ctx = this.canvas.getContext('2d');
        var nodes = this.sim.nodes;
        for(var i = 0; i < nodes.length; i++){
            var node = nodes[i];
            var r = node.radius;

            var is_selected = this.node_is_selected(node);
            if(is_selected){
                ctx.strokeStyle = '#f00';
                ctx.fillStyle = '#f77';
            }else{
                ctx.strokeStyle = '#000';
                ctx.fillStyle = 'transparent';
            }

            ctx.beginPath();
            drawCircle(ctx, node.x, node.y, r);
            ctx.fill();
            ctx.stroke();
        }
    },
    render_dragbox: function(){
        if(this.dragging !== 'select')return;

        var x = this.dragging_x0;
        var y = this.dragging_y0;
        var w = this.dragging_x1 - x;
        var h = this.dragging_y1 - y;

        var ctx = this.canvas.getContext('2d');
        ctx.save();

        ctx.globalAlpha = .5;
        ctx.strokeStyle = '#f00';
        ctx.strokeRect(x, y, w, h);

        ctx.globalAlpha = .2;
        ctx.fillStyle = '#f00';
        ctx.fillRect(x, y, w, h);

        ctx.restore();
    },
});

