# AislePicker

A tiny Javascript widget for playing with
[the Vehicle Routing Problem](https://en.wikipedia.org/wiki/Vehicle_routing_problem),
a.k.a. "VHP" for short.


## Vehicle Routing Problem

Its most general form is something like:

* You have a weighted graph: a bunch of nodes connected by edges, where each edge has a weight.
You can think of the weight of an edge as being the distance between
its nodes, or the cost of travelling from one to the other.

* For any set of nodes, the game is to come up with a route which hits
each one, while minimizing the cost or "travel time".


## AislePicker's graph

AislePicker generates very specific kinds of graph,
which model the aisles of a grocery store.
The edge weights are calculated to simulate a shopper who can
only travel back and forth along aisles, or up and down at the
sides of the store to reach other aisles.

