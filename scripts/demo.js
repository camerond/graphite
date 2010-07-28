$(function() {
  var $container = $("#graph");
  var graph = Raphael("graph", $container.width(), $container.height());
  var $table = $("table");
  var data = [], labels = [];
  $table.find("tbody tr").each(function(i) {
    var $tr = $(this);
    for(var i=0; i<$tr.find("td").size(); i++) {
      if(!data[i]) { data[i] = [] };
      data[i][$tr.index()] = $tr.find("td:eq("+i+")").text();
    }
  });
  labels = data.shift();
  var graphite = new Graphite(graph, data, labels, {
    bezier_curve: 0,
    gutter_x: 4,
    draw_grid_x: false,
    max_y_value: 100,
    path: {
      bezier_curve: 0,
      stroke_width: 2,
      bg_opacity: 0.2
    },
    labels_y: {
      draw: false
    },
    labels_x: {
      text_anchor: "end",
      adj_x: -5,
      adj_y: -20,
      font: "bold 11px arial",
      color: "#333"
    }
  });
  
  graphite.trigger.beforePath = function(i) {
    if(i.index == 0) {
      i.attrs.stroke_width = 1;
    }
    return i;
  }
  
  graphite.trigger.beforePoint = function(i) {
    if(i.index == 4) {
      i.attrs.radius = 10;
    }
    return i;
  }
  
  
  graphite.draw();
  graphite.labels();

});

Array.prototype.max = function() {
  var max = this[0];
  var len = this.length;
  for (var i = 1; i < len; i++) if (this[i] > max) max = this[i];
  return max;
}

Array.prototype.min = function() {
  var min = this[0];
  var len = this.length;
  for (var i = 1; i < len; i++) if (this[i] < min) min = this[i];
  return min;
}

