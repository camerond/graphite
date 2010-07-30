function Graphite() {
  var graphite = this;
  var defaults = {
    draw_grid_x: true,
    draw_grid_y: true,
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
  var opts = $.extend(true, defaults, arguments[2] || {});
  this.attr = function(opt) {
    return opts[opt];
  }

  var graph = initGraph(arguments[0]);
  var labels = [];
  var data = [];

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
      newPath.points.push($.extend({}, pointObj));
    });

    data.push(newPath);
    return newPath;
  }

  this.addLabels = function(l) {
    labels = l;
  }

  this.svgPath = function(points) {
    var values = "";
    var x = opts.gutter_x || 0, y = 0;
    var n = points.length;
    var increment_x = (opts.width / (n - 1)) - (x * 2) / (n - 1);
    var increment_y = (opts.height - opts.gutter_y * 2) / opts.max_y_value;
    for (var i = 0; i < n; i++) {
      var point = points[i];
      point.y = opts.height - (point.amount * increment_y) + (opts.path.stroke_width / 2) - opts.gutter_y;
      if (i) {
        x += increment_x;
        values += "S" + [x - opts.path.bezier_curve, (y = point.y), x, y];
      } else {
        values += "M" + [x, (y = point.y)];
      }
      point.x = x;
      var point = fireTrigger('beforePoint', point);
      this.svgPoint(point);
    }
    return values;
  }

  this.draw = function() {
    $.each(data, function(i) {
      var path = fireTrigger('beforePath', this);
      var c = graph.path("M0,0").attr({fill: "none", "stroke-width": path.attr.stroke_width});
      var values = graphite.svgPath(path.points);
      c.attr({path: values, stroke: path.attr.color});
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
    });
    if (opts.draw_grid_x) {
      this.grid(0, opts.max_y_value, "#ccc");
    }
    if (opts.draw_grid_y) {
      this.grid(data[0].points.length - 1, 0, "#ccc");
    }
  }

  this.getYOffset = function(value) {
    var increment_y = (opts.height - (opts.gutter_y * 2)) / opts.max_y_value;
    var y = opts.height - Math.floor(value * increment_y) - opts.gutter_y;
    return y
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

  this.grid = function(x_count, y_count) {
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
    var grid = graph.path(grid_path).attr({fill: "none", "stroke-width": 1, stroke: arguments[2] || "#000"}).toBack();
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
  }
}