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



/**************
* AISLE & BIN *
**************/

function Aisle(id){
    this.id = id;
}

function Bin(id, x, y){
    this.id = id;
    this.title = String(id);
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
    this.controls = elems.controls.elements;
    this.attach_control_listeners();
    this.sim = null;
    this.bin1 = null;
    this.bin2 = null;
}
extend(SimulationRunner.prototype, {
    attach_control_listeners: function(){
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

        showif(this.elems.controls_route, this.sim);
        if(this.sim){
            showif(this.elems.controls_bin1, this.bin1);
            showif(this.elems.controls_bin2, this.bin2);
        }
    },
});

