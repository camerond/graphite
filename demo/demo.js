$(function() {
  var graphite = new Graphite($("#graph"), {
    bezier_curve: 0,
    gutter_x: 4,
    max_y_value: 100,
    grid: {
      draw_x: true,
      draw_y: true,
      gap_y: 20,
      color: "#ccc"
    },
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

  $('<div />').addClass('avgLine').appendTo($("#graph"));

  graphite.trigger.mouseoverGraph = function(i) {
  }

  graphite.trigger.mouseoutGraph = function(i) {
    graphite.tooltip.fadeOut(100);
    $('.avgLine').fadeOut(100);
  }

  graphite.trigger.beforePath = function(i) {
    return i;
  }

  graphite.trigger.beforePoint = function(i) {
    if((i.index == 0) || (i.index == i.parent.points.length-1)) {
      i.attr.radius = 0;
    }
    return i;
  }

  graphite.trigger.mouseoverPath = function(path) {
  }

  graphite.trigger.mouseoverPoint = function(point) {
    var avg = 0;
    var parent = point.parent
    $.each(parent.points, function() {
      avg += this.amount;
    });
    avg = avg / parent.points.length;
    $('.avgLine').css('background', parent.attr.color);
    $('.avgLine').animate({'top': graphite.getYOffset(avg)}, 100).fadeIn(100);

    var t = graphite.tooltip;
    t.text(point.amount);
    var x = point.x - t.innerWidth() / 2;
    var y = point.y - t.outerHeight() - 10;
    t.animate({left: x, top: y}, 100).fadeIn(100);
    return point;
  }

  graphite.setLabels(['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul'])
  graphite.addPath('test path', [19, 20, 50, 22.5, 42.1, 43.6, 12], {color: '#004156'});
  graphite.addPath('test path 2', [86, 51, 24, 51, 1, 27, 54]);

});

