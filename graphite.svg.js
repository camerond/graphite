function Graphite() {
  var graphite = this;
  var defaults = {
    draw_grid_x: true,
    draw_grid_y: true,
    grid_color: '#ccc',
    draw_legends: true,
    max_y_value: false,
    gutter_x: 20,
    gutter_y: 20,
    tooltip_class: 'tooltip',
    point: {
      radius: 4
    },
    path: {
      color: Raphael.getColor(),
      bezier_curve: 10,
      stroke_width: 4,
      fill_opacity: .3
    },
    labels_x: {
      draw: true,
      font: "normal 10px Helvetica, Arial, sans-serif",
      color: "#333333",
      align: "center",
      adj_x: 0,
      adj_y: 0
    },
    labels_y: {
      draw: true,
      font: "normal 10px Helvetica, Arial, sans-serif"
    }
  }
  var opts = $.extend(true, defaults, arguments[1] || {});
  this.attr = function(opt) {
    return opts[opt];
  }

  var graph = initGraph(arguments[0]);
  var labels = [];
  var data = [];
  var gridlines = [];

  this.trigger = {
    beforePoint : {},
    beforePath : {},
    mouseoverPoint : {},
    mouseoutPoint : {},
    mouseoverPath : {},
    mouseoutPath : {},
    mouseoverGraph : {},
    mouseoutGraph : {}
  };

  this.tooltip = $('.' + opts.tooltip_class);

  function fireTrigger(name, obj) {
    var fire = graphite.trigger[name];
    if(typeof fire == 'function') {
      return fire(obj);
    }
    return obj;
  }

  function initGraph($obj) {
    var graph = Raphael("graph", $obj.width(), $obj.height());
    opts.width = graph.canvas.clientWidth;
    opts.height = graph.canvas.clientHeight;

    $("<div />").addClass(opts.tooltip_class).appendTo($obj);

    $obj.mouseenter(function(event) {
      fireTrigger('mouseoverGraph', graph);
    });
    $obj.mouseleave(function(event) {
      fireTrigger('mouseoutGraph', graph);
    });

    return graph;
  }

  this.addPath = function(name, values, newOpts) {

    var pathObj = {
      label: name,
      points: [],
      attr: $.extend({}, opts.path)
    }
    var newPath = $.extend({}, pathObj);
    newPath.attr = $.extend(newPath.attr, newOpts);

    $.each(values, function(k, v) {
      var pointObj = {
        index: k,
        parent: newPath,
        amount: v,
        attr: $.extend({}, opts.point)
      };
      if(v > this.max_y_value) {
        this.max_y_value = v;
      }
      newPath.points.push($.extend({}, pointObj));
    });

    graphite.scale_y = (opts.height - opts.gutter_y * 2) / opts.max_y_value;

    data.push(newPath);
    newPath.element = this.drawPath(newPath);

    this.drawGrid();
    return newPath;

  }

  this.removePath = function(i) {
    data[i].element.remove();
    $.each(data[i].points, function(point) {
      this.element.remove();
    })
    data.splice(i, 1);
  }

  this.addLabels = function(l) {
    labels = l;
    this.scale_x = (opts.width / (labels.length - 1)) - (opts.gutter_x * 2) / (labels.length - 1);
  }

  this.drawPath = function(p) {
    var path = fireTrigger('beforePath', p);
    var c = graph.path("M0,0").attr({fill: "none", stroke: path.attr.color, "stroke-width": path.attr.stroke_width});
    var coordinates = graphite.svgPath(path.points);
    c.attr({path: coordinates});
    if(opts.path.fill_opacity > 0) {
      var bg = graph.path("M0,0").attr({stroke: "none", opacity: path.attr.fill_opacity});
      var bg_values = values + "L" + (opts.width - opts.gutter_x) + "," + (opts.height - opts.gutter_y) +
                      " " + opts.gutter_x + "," + (opts.height - opts.gutter_y) + "z";
      bg.attr({path: bg_values, fill: opts.path.color});
    }
    c.mouseover(function(event) {
      fireTrigger('mouseoverPath', path);
    });
    c.mouseout(function(event) {
      fireTrigger('mouseoutPath', path);
    });
    return c;
  }

  this.getYOffset = function(value) {
    return opts.height - Math.floor(value * this.scale_y) - opts.gutter_y;
  }

  this.labels = function() {
    var increment_x = (opts.width - (opts.gutter_x * 2)) / (data[0].points.length - 1);
    var increment_y = (opts.height - (opts.gutter_y * 2)) / opts.max_y_value;
    if(opts.labels_x.draw) {
      $.each(labels, function(i, label) {
        var x = i * increment_x + opts.gutter_x + opts.labels_x.adj_x;
        var y = opts.height - opts.gutter_y / 2 + opts.labels_x.adj_y;
        graph.text(x, y, label).attr({
          "text-anchor": opts.labels_x.text_anchor, 
          font: opts.labels_x.font, 
          fill: opts.labels_x.color
        });
      });
    }
    if(opts.labels_y.draw) {
      for (var i = 0; i <= opts.max_y_value; i++) {
        graph.text(opts.gutter_x, opts.height - (i * increment_y + opts.gutter_y), i).attr({"text-anchor": "end"});
      }
    }
  }

  this.drawGrid = function() {
    var x_count = data[0].points.length - 1;
    var y_count = opts.max_y_value;
    var grid_path = "M" + opts.gutter_x + ".5," + opts.gutter_y;
    var x_increment = (opts.width - (opts.gutter_x * 2)) / x_count;
    var y_increment = (opts.height - (opts.gutter_y * 2)) / y_count;
    var inner_width = opts.width - opts.gutter_x;
    var inner_height = opts.height - opts.gutter_y;
    if (y_increment < 10) {
      y_increment = 10;
      y_count = (opts.height - opts.gutter_y * 2) / y_increment;
    }
    for (var q = 0; q < x_count; q++) {
      if (q) {
        grid_path += "M" + (q * x_increment + opts.gutter_x + .5) + "," + opts.gutter_y;
      }
      grid_path += "L" + (q * x_increment + opts.gutter_x + .5) + "," + (opts.height - opts.gutter_y);
    }
    for (var q = 0; q < y_count; q++) {
      grid_path += "M" + opts.gutter_x + "," + (q * y_increment + opts.gutter_y + .5) + "L" +
                   inner_width + "," + (q * y_increment + opts.gutter_y + .5);
    }
    grid_path += "M" + (inner_width - .5) + "," + opts.gutter_y + "L" + (inner_width - .5) + "," +
                 (inner_height - .5) + "L" + opts.gutter_x + "," + (inner_height - .5);
    var grid = graph.path(grid_path).attr({fill: "none", "stroke-width": 1, stroke: opts.grid_color}).toBack();
  }

  this.svgPath = function(points) {
    var coordinates = "";
    var x = opts.gutter_x || 0, y = 0;
    var n = points.length;
    for (var i = 0; i < n; i++) {
      var point = points[i];
      point.y = opts.height - (point.amount * graphite.scale_y) + (opts.path.stroke_width / 2) - opts.gutter_y;
      if (i) {
        x += graphite.scale_x;
        coordinates += "S" + [x - opts.path.bezier_curve, (y = point.y), x, y];
      } else {
        coordinates += "M" + [x, (y = point.y)];
      }
      point.x = x;
      var point = fireTrigger('beforePoint', point);
      point.element = this.svgPoint(point);
    }
    return coordinates;
  }

  this.svgPoint = function(point) {
    var x = point.x;
    var y = point.y;
    var circle = graph.circle(x, y, point.attr.radius)
                  .attr({fill: point.parent.attr.color, stroke: "none"});
    circle.mouseover(function(event) {
      fireTrigger('mouseoverPoint', point);
    });
    circle.mouseout(function(event) {
      fireTrigger('mouseoutPoint', point);
    });
    return circle;
  }
}