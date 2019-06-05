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
function font(name, height){
    return px(height) + ' ' + name;
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
    this.label = String(id);
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
        this.aisles.push(new Aisle(this.aisles.length));
        for(var j = 0; j < n_bins_per_aisle; j++){
            this.bins.push(new Bin(this.bins.length, j, i));
        }
    }
}
extend(Simulation.prototype, {
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
        this.controls.n_aisles.addEventListener('change', restart);
        this.controls.n_bins_per_aisle.addEventListener('change', restart);
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
            showif(this.elems.controls_bin1, this.bin1);
            showif(this.elems.controls_bin2, this.bin2);

            this.render_aisles();
            this.render_bins();
        }
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
            var x_percent = (bin.x + .5) / n_bins_per_aisle;
            var y_percent = (bin.y + .5) / n_aisles;
            var x = border_x + x_percent * aisle_w;
            var y = border_y + y_percent * (ch - border_y * 2);
            var r = this.bin_radius * Math.min(cw, ch);
            var font_h = base_font_h;

            if(bin.is_mousedover){
                r *= 1.1;
                font_h += 3;
            }

            drawCircle(ctx, x, y, r);
            ctx.fillStyle = '#39f';
            ctx.fill();

            ctx.font = font('serif', font_h);
            ctx.fillStyle = '#009';
            var font_w = ctx.measureText(bin.label).width;
            ctx.fillText(bin.label, x - font_w / 2, y + font_h / 2);
        }
    },
});

