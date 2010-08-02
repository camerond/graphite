function Graphite() {
  var graphite = this;
  var defaults = {
    max_y_value: 0,
    gutter_x: 20,
    gutter_y: 20,
    tooltip_class: 'tooltip',
    grid: {
      draw_x: true,
      draw_y: true,
      color: "#ccc",
      gap_y: 0
    },
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
  var user_opts = arguments[1];
  var opts = $.extend(true, defaults, user_opts || {});
  this.attr = function(opt) {
    return opts[opt];
  }

  var graph = initGraph(arguments[0]);
  var labels = [];
  var data = {};

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
    var graph = Raphael($obj.attr('id'), $obj.width(), $obj.height());
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

  this.refresh = function() {
    $.each(data, function(k, v) {
      if(v.element) {
        v.element.remove();
      }
      $.each(v.points, function(k, v) {
        if(v.element) {
          v.element.remove();
        }
      });
      v.element = graphite.drawPath(v);
    });
    this.grid = this.drawGrid();
  }

  this.setYScale = function(v) {
    if(opts.grid.gap_y != 0) {
      opts.max_y_value = v + opts.grid.gap_y - (v % opts.grid.gap_y);
    } else {
      opts.max_y_value = v;
    }
    graphite.scale_y = (opts.height - opts.gutter_y * 2) / opts.max_y_value;
  }

  this.addPath = function(name, values, newOpts) {
    if($.isEmptyObject(data)) {
      this.setYScale(opts.max_y_value);
    }
    var pathObj = {
      points: [],
      attr: $.extend({}, opts.path)
    };
    var newPath = $.extend({}, pathObj);
    newPath.attr = $.extend(newPath.attr, newOpts);
    $.each(values, function(k, v) {
      var pointObj = {
        index: k,
        parent: newPath,
        amount: v,
        attr: $.extend({}, opts.point)
      };
      if(v > opts.max_y_value) {
        graphite.setYScale(v);
      }
      newPath.points.push($.extend({}, pointObj));
    });

    data[name] = newPath;

    this.refresh();

    return newPath;

  }

  this.removePath = function(pathName) {
    var path = data[pathName];
    path.element.remove();
    $.each(path.points, function(point) {
      this.element.remove();
    });
    delete data[pathName];
    if(opts.max_y_value > user_opts.max_y_value) {
      var newMax = user_opts.max_y_value;
      $.each(data, function(k, v) {
        $.each(v.points, function(k, v) {
          if(v.amount > newMax) {
            newMax = v.amount;
          }
        });
      });
      graphite.setYScale(newMax);
    };
    this.refresh();
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
    return opts.height - value * this.scale_y - opts.gutter_y;
  }

  this.labels = function() {
    var increment_x = (opts.width - (opts.gutter_x * 2)) / (labels.length - 1);
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
    if(this.grid) {
      this.grid.remove();
    }

    var inner_width = opts.width - opts.gutter_x * 2;
    var inner_height = opts.height - opts.gutter_y * 2;
    var gap_x, gap_y, count_x, count_y = 0;
    var grid_path = "M" + opts.gutter_x + ".5," + opts.gutter_y;

    if(opts.grid.draw_x) {
      count_x = labels.length - 1;
      gap_x = inner_width / count_x;
    }
    if(opts.grid.draw_y) {
      if(opts.grid.gap_y != 0) {
        gap_y = inner_height / (opts.max_y_value / opts.grid.gap_y);
      } else {
        gap_y = this.scale_y;
      }
      count_y = inner_height / gap_y;
    }

    var grid_width = opts.width - opts.gutter_x;
    var grid_height = opts.height - opts.gutter_y;
    for (var q = 0; q < count_x; q++) {
      var x = Math.round(q * gap_x + opts.gutter_x) + .5;
      if (q) {
        grid_path += "M" + x + "," + opts.gutter_y;
      }
      grid_path += "L" + x + "," + (opts.height - opts.gutter_y);
    }
    for (var q = 0; q < count_y; q++) {
      var y = Math.round(q * gap_y + opts.gutter_y) + .5
      grid_path += "M" + opts.gutter_x + "," + y + "L" +
                   grid_width + "," + y;
    }
    grid_path += "M" + (grid_width - .5) + "," + opts.gutter_y + "L" + (grid_width - .5) + "," +
                     (grid_height - .5) + "L" + opts.gutter_x + "," + (grid_height - .5);
    return graph.path(grid_path).attr({fill: "none", "stroke-width": 1, stroke: opts.grid.color}).toBack();

  }

  this.svgPath = function(points) {
    var coordinates = "";
    var x = opts.gutter_x || 0, y = 0;
    var n = points.length;
    for (var i = 0; i < n; i++) {
      var point = points[i];
      y = opts.height - (point.amount * graphite.scale_y) + (opts.path.stroke_width / 2) - opts.gutter_y;
      if (i) {
        x += graphite.scale_x;
        coordinates += "S" + [x - opts.path.bezier_curve, y, x, y];
      } else {
        coordinates += "M" + [x, y];
      }
      point.x = x;
      point.y = y;
      point.element = this.svgPoint(point);
    }
    return coordinates;
  }

  this.svgPoint = function(point) {
    var point = fireTrigger('beforePoint', point);
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