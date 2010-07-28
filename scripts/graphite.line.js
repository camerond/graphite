function Graphite() {
  var graphite = this;
  var graph = initGraph(arguments[0]);
  var data = parseData(arguments[1]);
  var defaults = {
    draw_grid_x: true,
    draw_grid_y: true,
    draw_legends: true,
    width: graph.canvas.clientWidth,
    height: graph.canvas.clientHeight,
    max_y_value: data.max(),
    gutter_x: 20,
    gutter_y: 20,
    color: Raphael.getColor(),
    point: {
      radius: 4
    },
    path: {
      bezier_curve: 10,
      stroke: this.color,
      stroke_width: 4,
      fill_opacity: .3
    },
    tooltip: {
      width: 60,
      height: 25,
      radius: 3,
      fill: "#ffffff",
      stroke: "#666666",
      duration: 200,
      style: "popup"
    },
    tooltip_text: {
      font: "normal 10px Helvetica, Arial, sans-serif",
      color: "#333333"
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
  defaults.point.color = defaults.color;
  var opts = $.extend(true, defaults, arguments[2] || {});

  this.trigger = {
    beforePoint : {},
    beforePath : {}
  };
  
  function fireTrigger(name, index, data, attrs) {
    var obj = {
      index: index,
      values: data,
      attrs: attrs
    }
    var fire = graphite.trigger[name];
    if(typeof fire == 'function') {
      return fire(obj);
    }
    return obj;
  }

  function initGraph($obj) {
    return Raphael("graph", $obj.width(), $obj.height());
  }

  function parseData($obj) {

    var data = [];
    $obj.find("tbody tr").each(function(i) {
      var $tr = $(this);
      for(var i=0; i<$tr.find("td").size(); i++) {
        if(!data[i]) { data[i] = [] };
        data[i][$tr.index()] = $tr.find("td:eq("+i+")").text();
      }
    });
    this.labels = data.shift();

    return data;

  }

  this.svgPath = function(data_points) {
    var path = "";
    var x = opts.gutter_x || 0, y = 0;
    var n = data_points.length;
    var increment_x = (opts.width / (n - 1)) - (x * 2) / (n - 1);
    var increment_y = (opts.height - opts.gutter_y * 2) / opts.max_y_value;
    for (var i = 0; i < n; i++) {
      if (i) {
        x += increment_x;
        path += "S" + [x - opts.path.bezier_curve, (y = opts.height - (data_points[i] * increment_y) +
                (opts.path.stroke_width / 2) - opts.gutter_y), x, y];
      } else {
        path += "M" + [x, (y = opts.height - (data_points[i] * increment_y) + (opts.path.stroke_width / 2) - opts.gutter_y)];
      }
      var data = {
        x: x,
        y: y
      };
      var point = fireTrigger('beforePoint', i, data, $.extend(opts.point));
      this.svgPoint(point, labels[i]);
    }
    return path;
  }

  this.draw = function() {
    for(i=0; i<data.length; i++) {
      var path = fireTrigger('beforePath', i, data[i], opts.path);
      var c = graph.path("M0,0").attr({fill: "none", "stroke-width": path.attrs.stroke_width});
      var bg = graph.path("M0,0").attr({stroke: "none", opacity: path.attrs.fill_opacity});

      var values = this.svgPath(path.values, graph);
      var bg_values = values + "L" + (opts.width - opts.gutter_x) + "," + (opts.height - opts.gutter_y) +
                      " " + opts.gutter_x + "," + (opts.height - opts.gutter_y) + "z";
      c.attr({path: values, stroke: opts.color});
      bg.attr({path: bg_values, fill: opts.color});
      if (opts.draw_grid_x) {
        this.grid(0, opts.max_y_value, "#ccc");
      }
      if (opts.draw_grid_y) {
        this.grid(data[0].length - 1, 0, "#ccc");
      }
    }
  }

  this.labels = function() {
    var increment_x = (opts.width - (opts.gutter_x * 2)) / (data[0].length - 1);
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

  this.svgPoint = function(point, label) {
    var offset = point.attrs.radius / 2;
    var x = point.values.x;
    var y = point.values.y;
    var circle = graph.circle(x, y, point.attrs.radius)
                  .attr({fill: point.attrs.color, stroke: "none"});
    if (x >= opts.width - opts.tooltip.width) {
      x = opts.width - opts.tooltip.width - offset - opts.gutter_x - 1;
    }
    if (y >= opts.height - opts.tooltip.height) {
      y = opts.height - opts.tooltip.height - offset - opts.gutter_y - 1;
    }
  }
}