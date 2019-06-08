'use strict';



/***********
* PICKLIST *
***********/

function PicklistItem(node, weight, label){
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


function Picklist(id, title, nodes){
    this.id = id;
    this.title = title;
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
        var item = new PicklistItem(node, weight, label);
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
});

