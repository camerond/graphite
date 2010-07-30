$(function() {
  var graphite = new Graphite($("#graph"), $("table"), {
    bezier_curve: 0,
    gutter_x: 4,
    draw_grid_x: false,
    max_y_value: 100,
    path: {
      bezier_curve: 0,
      stroke_width: 2,
      fill_opacity: 0
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

  var overlays = {};
  
  $('<div />').addClass('avgLine').appendTo($("#graph"));

  graphite.trigger.mouseoverGraph = function(i) {
  }

  graphite.trigger.mouseoutGraph = function(i) {
    graphite.tooltip.fadeOut(100);
    $('.avgLine').fadeOut(100);
  }

  graphite.trigger.beforePath = function(i) {
    if(i.index == 0) {
      i.attr.stroke_width = 1;
    }
    return i;
  }

  graphite.trigger.beforePoint = function(i) {
    if((i.index == 1) || (i.index == i.parent.points.length)) {
      i.attr.radius = 0;
    }
    return i;
  }

  graphite.trigger.mouseoverPath = function(path) {
  }

  graphite.trigger.mouseoverPoint = function(point) {
    var avg = 0;
    $.each(point.parent.points, function() {
      avg += this.amount;
    });
    avg = avg / point.parent.points.length;
    $('.avgLine').animate({'top': graphite.getYOffset(avg)}, 100).fadeIn(100);

    var t = graphite.tooltip;
    t.text(point.amount);
    var x = point.x - t.innerWidth() / 2;
    var y = point.y - t.outerHeight() - 10;
    t.animate({left: x, top: y}, 100).fadeIn(100);
    return point;
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

