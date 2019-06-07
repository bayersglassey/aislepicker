'use strict';


/****************
* GENERAL UTILS *
****************/

function extend(obj0, obj1){
    for(var key in obj1){
        if(!obj1.hasOwnProperty(key))continue;
        obj0[key] = obj1[key];
    }
    return obj0;
}


function showif(elem, visible){
    elem.style.display = visible? '': 'none';
}
function show(elem){showif(elem, true)}
function hide(elem){showif(elem, false)}

function drawCircle(ctx, x, y, r){
    ctx.beginPath();
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





/*******
* NODE *
********/

function Node(id, x, y, label){
    /* id: index in simulation's list of nodes */
    this.id = id;

    /* x, y: coordinates with respect to canvas */
    this.x = x;
    this.y = y;

    this.label = label? label: null;
}



/*************
* SIMULATION *
*************/

function Simulation(){
    this.nodes = [];
}
extend(Simulation.prototype, {
    add_node: function(node){
        if(this.nodes.indexOf(node) >= 0)return;
        this.nodes.push(node);
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
                menu.drag_offset_x = x - menu.elem.offsetLeft;
                menu.drag_offset_y = y - menu.elem.offsetTop;
            });
        }
        document.addEventListener('mousemove', function(event){
            if(menu.dragging){
                var x = event.pageX;
                var y = event.pageY;
                menu.move(x - menu.drag_offset_x, y - menu.drag_offset_y);
            }
        });
        document.addEventListener('mouseup', function(event){
            menu.dragging = false;
        });
    },
    render: function(){
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

    this.attach_listeners();
    this.render();
}
extend(SimulationRunner.prototype, {
    attach_listeners: function(){
        var runner = this;
        for(var key in this.menus){
            if(!this.menus.hasOwnProperty(key))continue;
            this.menus[key].elem.addEventListener('change', function(event){
                runner.render()
            });
        }
    },
    message: function(msg){
        alert(msg);
    },
    render: function(){
        hide(this.elems.loading);
        show(this.elems.main);

        var bgimg = this.menus.sim.controls.bgimg.value;
        this.canvas.style.backgroundImage = url(bgimg);

        var ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for(var key in this.menus){
            if(!this.menus.hasOwnProperty(key))continue;
            this.menus[key].render();
        }
    },
});

