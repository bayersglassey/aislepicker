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



/**************
* AISLE & BIN *
**************/

function Aisle(id){
    this.id = id;
}

function Bin(id, x, y){
    this.id = id;
    this.label = 'bin-' + String(id);
    this.x = x;
    this.y = y;
}



/*************
* SIMULATION *
*************/

function Simulation(n_aisles, n_bins_per_aisle){
    this.n_aisles = n_aisles;
    this.n_bins_per_aisle = n_bins_per_aisle;

    this.aisles = [];
    this.bins = [];
    for(var i = 0; i < n_aisles; i++){
        var aisle_id = this.aisles.length;
        this.aisles.push(new Aisle(aisle_id));
        for(var j = 0; j < n_bins_per_aisle; j++){
            var bin_id = this.bins.length
            var x = (j + .5) / n_bins_per_aisle;
            var y = (i + .5) / n_aisles;
            this.bins.push(new Bin(bin_id, x, y));
        }
    }

    /* route: Array of bin ids, in the order in which bins
    are to be "visited" */
    this.route = [];
}
extend(Simulation.prototype, {
    route_add_bin: function(bin){
        var i = this.route.indexOf(bin.id);
        if(i >= 0)return;
        this.route.push(bin.id);
    },
    route_remove_bin: function(bin){
        var i = this.route.indexOf(bin.id);
        if(i < 0)return;
        this.route.splice(i, 1);
    },
    route_swap: function(i, j){
        var temp = this.route[i];
        this.route[i] = this.route[j];
        this.route[j] = temp;
    },
    route_move_bin_left: function(bin){
        var i = this.route.indexOf(bin.id);
        if(i < 0 || i < 1)return;
        this.route_swap(i, i-1);
    },
    route_move_bin_right: function(bin){
        var i = this.route.indexOf(bin.id);
        if(i < 0 || i >= this.route.length - 1)return;
        this.route_swap(i, i+1);
    },
    get_bin_dist: function(bin1, bin2){
        if(bin1.y === bin2.y)return Math.abs(bin1.x - bin2.x);
        var d = Math.abs(bin1.y - bin2.y);
        var x_left = bin1.x + bin2.x;
        var x_right = (1-bin1.x) + (1-bin2.x);
        d += Math.min(x_left, x_right);
        return d;
    },
    get_route_dist: function(){
        var d = 0;
        for(var i = 0; i < this.route.length - 1; i++){
            var bin1 = this.bins[this.route[i]];
            var bin2 = this.bins[this.route[i+1]];
            d += this.get_bin_dist(bin1, bin2);
        }
        return d;
    },
});




/********************
* SIMULATION RUNNER *
********************/

function SimulationRunner(elems){
    this.elems = elems;
    this.main = elems.main;
    this.canvas = elems.canvas;
    this.controls = elems.controls.elements;

    this.sim = null;
    this.bin1 = null;
    this.bin2 = null;

    this.border_x = .1;
    this.border_y = .1;
    this.bin_radius = .05;

    this.attach_listeners();
}
extend(SimulationRunner.prototype, {
    attach_listeners: function(){
        var runner = this;

        function restart(event){
            runner.restart();
        }
        function change_bin(event){
            var target = event.target;
            var bin_id = parseInt(target.value);
            var bin_attr = target.name.substr(0, 4);
            runner[bin_attr] = isNaN(bin_id)? null: runner.sim.bins[bin_id];
            runner.render();
        }
        function change_bin_label(event){
            var target = event.target;
            var bin_attr = target.name.substr(0, 4);
            var bin = runner[bin_attr];
            bin.label = target.value;
            runner.render();
        }

        this.controls.n_aisles.addEventListener('change', restart);
        this.controls.n_bins_per_aisle.addEventListener('change', restart);
        this.controls.bin1.addEventListener('change', change_bin);
        this.controls.bin2.addEventListener('change', change_bin);
        this.controls.bin1_label.addEventListener('change', change_bin_label);
        this.controls.bin2_label.addEventListener('change', change_bin_label);

        this.controls.bin1_add.addEventListener('click', function(event){
            runner.sim.route_add_bin(runner.bin1);
            runner.render();
        });
        this.controls.bin1_remove.addEventListener('click', function(event){
            runner.sim.route_remove_bin(runner.bin1);
            runner.render();
        });
        this.controls.bin1_move_left.addEventListener('click', function(event){
            runner.sim.route_move_bin_left(runner.bin1);
            runner.render();
        });
        this.controls.bin1_move_right.addEventListener('click', function(event){
            runner.sim.route_move_bin_right(runner.bin1);
            runner.render();
        });
    },
    start: function(){
        var n_aisles = parseInt(this.controls.n_aisles.value);
        var n_bins_per_aisle = parseInt(this.controls.n_bins_per_aisle.value);
        console.log("Starting runner...", n_aisles, n_bins_per_aisle);
        if(n_aisles > 10){
            this.message("Too many aisles!");
        }else if(n_bins_per_aisle > 10){
            this.message("Too many bins per aisle!");
        }else if(n_aisles > 0 && n_bins_per_aisle > 0){
            this.sim = new Simulation(n_aisles, n_bins_per_aisle);
        }
        this.render();
    },
    stop: function(){
        this.sim = null;
        this.bin1 = null;
        this.bin2 = null;
    },
    restart: function(){
        this.stop();
        this.start();
    },
    message: function(msg){
        alert(msg);
    },
    render: function(){
        hide(this.elems.loading);
        show(this.elems.main);
        show(this.elems.controls);

        var ctx = this.canvas.getContext('2d');
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        showif(this.elems.controls_route, this.sim);
        if(this.sim){
            this.controls.route.value = this.sim.route;
            this.controls.route_dist.value = this.sim.get_route_dist();

            this.render_bin_options(this.controls.bin1, this.sim.bins, this.bin1);

            showif(this.elems.controls_bin1, this.bin1);
            if(this.bin1){
                this.render_bin_options(this.controls.bin2, this.sim.bins, this.bin2);
                this.controls.bin1_label.value = this.bin1.label;

                var in_route = this.sim.route.indexOf(this.bin1.id) >= 0;
                showif(this.controls.bin1_add, !in_route);
                showif(this.controls.bin1_remove, in_route);
                showif(this.controls.bin1_move_left, in_route);
                showif(this.controls.bin1_move_right, in_route);
            }

            showif(this.elems.controls_bin2, this.bin2);
            if(this.bin2){
                this.controls.bin2_label.value = this.bin2.label;
                this.controls.dist.value = this.sim.get_bin_dist(this.bin1, this.bin2);
            }

            this.render_aisles();
            this.render_bins();
        }
    },
    render_bin_options: function(select, bins, selected_bin){
        while(select.options.length > 0)select.options.remove(0);

        var option = document.createElement('option');
        option.textContent = "<none>";
        select.appendChild(option);

        for(var i = 0; i < bins.length; i++){
            var bin = bins[i];
            var option = document.createElement('option');
            option.value = i;
            option.textContent = bin.label;
            select.appendChild(option);
        }

        if(selected_bin)select.value = selected_bin.id;
    },
    render_aisles: function(){
        var ctx = this.canvas.getContext('2d');
        var cw = this.canvas.width;
        var ch = this.canvas.height;

        var n_aisles = this.sim.n_aisles;

        var border_x = this.border_x * cw;
        var border_y = this.border_y * ch;
        var aisle_w = cw - border_x * 2;
        var aisle_h = (ch - border_y * 2) / n_aisles;
        var aisle_separator_h = .05 * ch;

        var l = border_x;
        var r = cw - border_x;
        var t = border_y;
        var b = ch - border_y;

        /* render aisles */
        for(var i = 0; i < n_aisles; i++){
            var x = border_x;
            var y = border_y + aisle_h * i;
            var w = aisle_w;
            var h = aisle_h;
            ctx.fillStyle = '#eee';
            ctx.fillRect(x, y, w, h);
        }

        /* render aisle separators */
        for(var i = 0; i < n_aisles + 1; i++){
            var x = border_x;
            var y = border_y + aisle_h * i - aisle_separator_h / 2;
            var w = aisle_w;
            var h = aisle_separator_h;
            ctx.fillStyle = '#ddd';
            ctx.fillRect(x, y, w, h);
        }
    },
    render_bins: function(){
        var ctx = this.canvas.getContext('2d');
        var cw = this.canvas.width;
        var ch = this.canvas.height;
        var stx = this.canvas.offsetWidth / cw;
        var sty = this.canvas.offsetHeight / ch;

        var n_aisles = this.sim.n_aisles;
        var n_bins_per_aisle = this.sim.n_bins_per_aisle;

        var border_x = this.border_x * cw;
        var border_y = this.border_y * ch;
        var aisle_w = cw - border_x * 2;
        var aisle_h = (ch - border_y * 2) / n_aisles;

        var base_font_h = 14;

        var bins = this.sim.bins;
        for(var i = 0; i < bins.length; i++){
            var bin = bins[i];
            var x = border_x + bin.x * aisle_w;
            var y = border_y + bin.y * (ch - border_y * 2);
            var r = this.bin_radius * Math.min(cw, ch);
            var color = '#39f';
            var font_h = base_font_h;
            var font_color = '#009';
            var font_bold = false;

            if(bin === this.bin1){
                r *= 1.4;
                color = '#99f';
                font_h += 3;
                font_bold = true;
            }else if(bin === this.bin2){
                r *= 1.2;
                color = '#93f';
                font_h += 1;
                font_bold = true;
            }

            drawCircle(ctx, x, y, r);
            ctx.fillStyle = color;
            ctx.fill();

            ctx.font = font('serif', font_h, font_bold);
            ctx.fillStyle = font_color;
            var font_w = ctx.measureText(bin.label).width;
            ctx.fillText(bin.label, x - font_w / 2, y + font_h / 2);
        }
    },
});

