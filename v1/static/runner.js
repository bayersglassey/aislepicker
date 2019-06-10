'use strict';



var MENU_NAMES = ['sim', 'graph', 'picklists'];



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
        this.elem.addEventListener('submit', function(event){
            event.preventDefault();
        });
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

    this.menus = {};
    for(var i = 0; i < MENU_NAMES.length; i++){
        var menu_name = MENU_NAMES[i];
        var menu_elem = this.elems['menu_' + menu_name];
        this.menus[menu_name] = new Menu(menu_elem);
    }

    var select = this.menus.sim.controls.json_default;
    clear_options(select);
    for(var i = 0; i < DEFAULT_RUNNER_DATA.length; i++){
        var data = DEFAULT_RUNNER_DATA[i];
        add_option(select, i, data.title);
    }

    this.attach_listeners();
    this.start();

    var data = DEFAULT_RUNNER_DATA[0];
    this.load_serializable_data(data);

    this.render();
}
extend(SimulationRunner.prototype, {
    start: function(){
        this.sim = new Simulation();
        this.selected_nodes = [];
        this.dragging = false;

        this.title = "New Simulation";
        this.bgimg = "/v1/static/img/default-floor-plan.png";
        this.node_radius = 8;

        this.picklists = [];
        this.selected_picklist = null;
    },
    restart: function(){
        this.start();
    },
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

        document.addEventListener('keydown', function(event){
            if(event.target === document.body){
                if(event.keyCode === K_DELETE){
                    if(event.shiftKey){
                        runner.remove_selected_edges();
                    }else{
                        runner.remove_selected_nodes();
                    }
                    runner.render();
                }
            }
        });

        for(var key in this.menus){
            if(!this.menus.hasOwnProperty(key))continue;
            this.menus[key].elem.addEventListener('change', function(event){
                runner.render()
            });
        }

        this.menus.sim.controls.title.addEventListener('change', function(event){
            runner.title = event.target.value;
            runner.render();
        });
        this.menus.sim.controls.bgimg.addEventListener('change', function(event){
            runner.bgimg = event.target.value;
            runner.render();
        });
        this.menus.sim.controls.node_radius.addEventListener('change', function(event){
            runner.node_radius = parseInt(event.target.value) || 1;
            runner.render();
        });
        this.menus.sim.controls.json_default_load.addEventListener('click', function(event){
            var name = runner.menus.sim.controls.json_default.value;
            var data = DEFAULT_RUNNER_DATA[name];
            runner.restart();
            runner.load_serializable_data(data);
            runner.render();
        });
        this.menus.sim.controls.json_save.addEventListener('click', function(event){
            var text = serialize(runner);
            runner.menus.sim.controls.json_text.value = text;
        });
        this.menus.sim.controls.json_load.addEventListener('click', function(event){
            var text = runner.menus.sim.controls.json_text.value;
            runner.restart();
            deserialize(runner, text);
            runner.render();
        });
        this.menus.sim.controls.clear.addEventListener('click', function(event){
            runner.restart();
            runner.render();
        });

        this.menus.graph.controls.node_label.addEventListener('change', function(event){
            var node = runner.get_selected_node();
            if(!node)return;
            node.label = event.target.value;
            runner.render();
        });
        this.menus.graph.controls.node_radius.addEventListener('change', function(event){
            var node = runner.get_selected_node();
            if(!node)return;
            node.radius = parseInt(event.target.value) || 1;
            runner.render();
        });

        this.menus.picklists.controls.picklist.addEventListener('change', function(event){
            var i = parseInt(event.target.value);
            runner.selected_picklist = isNaN(i)? null: runner.picklists[i];
            runner.render();
        });
        this.menus.picklists.controls.title.addEventListener('change', function(event){
            runner.selected_picklist.title = event.target.value;
            runner.render();
        });
        this.menus.picklists.controls.create.addEventListener('click', function(event){
            var picklist = runner.create_picklist();
            runner.selected_picklist = picklist;
            runner.render();
        });
        this.menus.picklists.controls.items_add.addEventListener('click', function(event){
            runner.add_picklist_items();
            runner.render();
        });
        this.menus.picklists.controls.items_remove.addEventListener('click', function(event){
            runner.remove_picklist_items();
            runner.render();
        });
        this.menus.picklists.controls.items_select.addEventListener('click', function(event){
            runner.select_picklist_items();
            runner.render();
        });
        this.menus.picklists.controls.item_label.addEventListener('change', function(event){
            var item = runner.get_selected_picklist_item();
            if(!item)return;
            item.label = event.target.value;
            runner.render();
        });
        this.menus.picklists.controls.item_weight.addEventListener('change', function(event){
            var item = runner.get_selected_picklist_item();
            if(!item)return;
            item.weight = event.target.value;
            runner.render();
        });

        for(var i = 0; i < MENU_NAMES.length; i++){
            var menu_name = MENU_NAMES[i];
            var toggle_btn = this.elems['menu_toggle_' + menu_name];
            toggle_btn.menu_name = menu_name;
            toggle_btn.addEventListener('click', function(event){
                var menu_name = event.target.menu_name;
                var x = event.pageX;
                var y = event.pageY;
                runner.menus[menu_name].toggle();
                runner.menus[menu_name].move(x, y);
                runner.render();
            });
        }
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
    remove_selected_nodes: function(){
        for(var i = 0; i < this.selected_nodes.length; i++){
            this.sim.remove_node(this.selected_nodes[i]);
        }
        this.clear_selected_nodes();
    },
    remove_selected_edges: function(){
        for(var i = 0; i < this.selected_nodes.length; i++){
            var node = this.selected_nodes[i];
            for(var j = 0; j < node.edges.length; j++){
                var edge = node.edges[j];
                if(this.selected_nodes.indexOf(edge.dst_node) < 0)continue;
                node.remove_edge(edge); j--;
            }
        }
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
    get_selected_node: function(){
        if(this.selected_nodes.length !== 1)return null;
        return this.selected_nodes[0];
    },
    get_selected_nodepair: function(){
        if(this.selected_nodes.length !== 2)return null;
        return this.selected_nodes;
    },
    add_picklist: function(title, nodes){
        var id = this.picklists.length;
        title = title || "Picklist-" + id;
        var picklist = new Picklist(id, title, nodes);
        this.picklists.push(picklist);
        return picklist;
    },
    create_picklist: function(){
        return this.add_picklist(undefined, this.selected_nodes);
    },
    add_picklist_items: function(){
        var picklist = this.selected_picklist;
        if(!picklist)return;
        for(var i = 0; i < this.selected_nodes.length; i++){
            var node = this.selected_nodes[i];
            picklist.add_item(node);
        }
    },
    remove_picklist_items: function(){
        var picklist = this.selected_picklist;
        if(!picklist)return;
        for(var i = 0; i < picklist.items.length; i++){
            var item = picklist.items[i];
            if(this.selected_nodes.indexOf(item.node) >= 0){
                picklist.remove_item(item);
                i--;
            }
        }
    },
    select_picklist_items: function(){
        var picklist = this.selected_picklist;
        if(!picklist)return;
        this.clear_selected_nodes();
        for(var i = 0; i < picklist.items.length; i++){
            this.add_selected_node(picklist.items[i].node);
        }
    },
    get_selected_picklist_item: function(){
        var picklist = this.selected_picklist;
        if(!picklist)return;
        var selected_item = null;
        for(var i = 0; i < picklist.items.length; i++){
            var item = picklist.items[i];
            if(this.selected_nodes.indexOf(item.node) >= 0){
                if(selected_item)return null;
                selected_item = item;
            }
        }
        return selected_item;
    },
    message: function(msg){
        alert(msg);
    },
    get_serializable_data: function(){
        var picklists_data = [];
        for(var i = 0; i < this.picklists.length; i++){
            var picklist = this.picklists[i]
            picklists_data.push(picklist.get_serializable_data());
        }
        return {
            title: this.title,
            bgimg: this.bgimg,
            node_radius: this.node_radius,
            sim: this.sim.get_serializable_data(),
            picklists: picklists_data,
        };
    },
    load_serializable_data: function(data){
        this.title = data.title;
        this.bgimg = data.bgimg;
        this.node_radius = data.node_radius;
        this.sim.load_serializable_data(data.sim);
        for(var i = 0; i < data.picklists.length; i++){
            var picklist_data = data.picklists[i];
            var picklist = this.add_picklist(picklist_data.title);
            for(var j = 0; j < picklist_data.items.length; j++){
                var item_data = picklist_data.items[j];
                var node = this.sim.nodes[item_data.node];
                picklist.add_item(node, item_data.weight, item_data.label);
            }
        }
    },
    render: function(){
        hide(this.elems.loading);
        show(this.elems.main);

        this.canvas.style.backgroundImage = url(this.bgimg);


        var selected_node = this.get_selected_node();
        var selected_nodepair = this.get_selected_nodepair();
        var selected_picklist_item = this.get_selected_picklist_item();

        var selected_path = selected_nodepair?
            this.sim.get_shortest_path(
                selected_nodepair[0], selected_nodepair[1]): null;

        this.render_clear();
        this.render_edges();
        if(selected_path)this.render_path(selected_path);
        this.render_nodes();
        this.render_picklist();
        this.render_node_labels();
        this.render_dragbox();

        this.menus.sim.controls.title.value = this.title;
        this.menus.sim.controls.bgimg.value = this.bgimg;
        this.menus.sim.controls.node_radius.value = this.node_radius;

        for(var key in this.menus){
            if(!this.menus.hasOwnProperty(key))continue;
            this.menus[key].render();
        }

        showif(this.elems.menu_selected_node, selected_node);
        if(selected_node){
            var menu = this.menus.graph;
            menu.controls.node_label.value = selected_node.label;
            menu.controls.node_radius.value = selected_node.radius;
        }

        showif(this.elems.menu_selected_nodepair, selected_nodepair);
        if(selected_nodepair){
            var menu = this.menus.graph;
            var node1 = selected_nodepair[0];
            var node2 = selected_nodepair[1];
            menu.controls.nodepair_dist.value = node1.get_dist(node2);
            menu.controls.nodepair_path_dist.value = selected_path.dist;
        }

        var select = this.menus.picklists.controls.picklist;
        clear_options(select);
        add_option(select, '', "<none>");
        for(var i = 0; i < this.picklists.length; i++){
            var picklist = this.picklists[i];
            add_option(select, i, picklist.title);
        }
        select.value = this.selected_picklist? this.selected_picklist.id: '';

        showif(this.elems.menu_selected_picklist, this.selected_picklist);
        if(this.selected_picklist){
            var menu = this.menus.picklists;
            menu.controls.title.value = this.selected_picklist.title;
        }

        showif(this.elems.menu_selected_picklist_item, selected_picklist_item);
        if(selected_picklist_item){
            var menu = this.menus.picklists;
            menu.controls.item_label.value = selected_picklist_item.label;
            menu.controls.item_weight.value = selected_picklist_item.weight;
        }
    },
    render_clear: function(){
        var ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },
    render_nodepair_line: function(node, dst_node){
        var ctx = this.canvas.getContext('2d');
        ctx.moveTo(node.x, node.y);
        ctx.lineTo(dst_node.x, dst_node.y);
    },
    render_edges: function(){
        var ctx = this.canvas.getContext('2d');
        var nodes = this.sim.nodes;
        for(var i = 0; i < nodes.length; i++){
            var node = nodes[i];
            for(var j = 0; j < node.edges.length; j++){
                var edge = node.edges[j];
                var dst_node = edge.dst_node;
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#aaa';
                ctx.beginPath();
                this.render_nodepair_line(node, dst_node);
                ctx.stroke();
            }
        }
    },
    render_path: function(path){
        var nodes = path.nodes;
        for(var i = 1; i < nodes.length; i++){
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#0a3';
            ctx.beginPath();
            this.render_nodepair_line(nodes[i-1], nodes[i]);
            ctx.stroke();
        }
    },
    render_nodes: function(){
        var ctx = this.canvas.getContext('2d');
        var nodes = this.sim.nodes;
        for(var i = 0; i < nodes.length; i++){
            var node = nodes[i];
            var r = node.radius;

            var is_selected = this.node_is_selected(node);
            ctx.lineWidth = 1;
            if(is_selected){
                ctx.strokeStyle = '#f00';
                ctx.fillStyle = '#f77';
            }else{
                ctx.strokeStyle = '#000';
                ctx.fillStyle = 'transparent';
                if(node.label){
                    ctx.strokeStyle = '#555';
                }
            }

            ctx.beginPath();
            drawCircle(ctx, node.x, node.y, r);
            ctx.fill();
            ctx.stroke();
        }
    },
    render_node_labels: function(){
        var ctx = this.canvas.getContext('2d');
        var nodes = this.sim.nodes;
        for(var i = 0; i < nodes.length; i++){
            var node = nodes[i];
            if(node.label){
                var is_selected = this.node_is_selected(node);
                var text_h = 16;
                var bold = false;
                ctx.fillStyle = '#000';
                if(is_selected){
                    ctx.fillStyle = '#900';
                    text_h = 18;
                    bold = true;
                }
                ctx.font = font('serif', text_h, bold);
                var text_w = ctx.measureText(node.label).width;
                ctx.fillText(node.label, node.x - text_w / 2, node.y + text_h / 2);
            }
        }
    },
    render_picklist: function(){
        var picklist = this.selected_picklist;
        if(!picklist)return;

        var ctx = this.canvas.getContext('2d');

        for(var i = 0; i < picklist.items.length; i++){
            var item = picklist.items[i];
            var node = item.node;
            var rad = node.radius + 2;
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#00f';
            ctx.strokeRect(node.x - rad, node.y - rad, rad * 2, rad * 2);
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
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#f00';
        ctx.strokeRect(x, y, w, h);

        ctx.globalAlpha = .2;
        ctx.fillStyle = '#f00';
        ctx.fillRect(x, y, w, h);

        ctx.restore();
    },
});

