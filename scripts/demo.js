$(function() {
  var $container = $("#graph");
  var graph = Raphael("graph", $container.width(), $container.height());
  var $table = $("table");
  var data = [], points = [], labels = [];
  $table.find("tr").each(function(i) {
    if ($("td:last", this).length) {
      data.push(parseInt($("td:last", this).text(), 10));
      labels.push($("td:first", this).text());
    }
  });
  var graphite = new Graphite(graph, data, labels, {
    bezier_curve: 0,
    gutter_x: 4,
    draw_grid_x: false,
    max_y_value: 100,
    labels_y: {
      draw: false
    },
    labels_x: {
      text_anchor: "end",
      adj_x: -5,
      adj_y: -20,
      font: "bold 11px arial",
      color: "#333"
    },
    line: {
      bezier_curve: 0,
      stroke_width: 2,
      bg_opacity: 0
    }
  });
  graphite.draw();
  graphite.labels();

  $("form").submit(function() {
    var tr = $("<tr />");
    var $input = $("input", this);
    var value = parseInt($input.val(), 10);
    if (isNaN(value)) {
      $("form p").text("Enter a number");
      return false;
    }
    if ((value + "").length != $input.val().length) {
      $("form p").text("Invalid character(s) - integers only");
      return false;
    }
    if (value < 0) {
      $("form p").text("Must be a positive number");
      return false;
    }
    data.push(parseInt($input.val(), 10));
    labels.push("New point");
    $("<td />").text("New point").appendTo(tr);
    $("<td />").text(data[data.length - 1]).appendTo(tr);
    tr.appendTo($table);
    $input.val("");
    graph.clear();
    graphite.data = data;
    graphite.draw();
    graphite.labels();
    return false;
  });
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

