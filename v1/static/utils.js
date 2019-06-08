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

function clear_options(select){
    while(select.options.length > 0)select.options.remove(0);
}
function add_option(select, value, title){
    var option = document.createElement('option');
    option.value = value;
    option.textContent = title;
    select.appendChild(option);
}

function serialize(obj){
    var data = obj.get_serializable_data();
    return JSON.stringify(data, null, 4);
}

function deserialize(obj, text){
    var data = JSON.parse(text);
    obj.load_serializable_data(data);
}

var K_DELETE = 46;

