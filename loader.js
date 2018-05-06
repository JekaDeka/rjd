
function load_points(data_points, stage) {
    for (var i = data_points.length - 1; i >= 0; i--) {
        addPoint(data_points[i].x, data_points[i].y, 10, "#000", data_points[i].title, stage);
    }
}

function load_edges(data_edges, stage) {
    for (var i = data_edges.length - 1; i >= 0; i--) {
        // console.log(data_edges[i].x1);
        addLine(data_edges[i].x1, data_edges[i].y1, data_edges[i].x2, data_edges[i].y2, 1, "#000", stage);
    }
}

function load_trains(trainInstances, data_train, stage) {
    for (var i = data_train.length - 1; i >= 0; i--) {
        trainInstances.push(
            addTrain(
                data_train[i].id,
                -1000000000,
                -1000000000,
                data_train[i].size,
                data_train[i].type,
                data_train[i].path,
                stage
            )
        );
    }

}

function addPoint(x, y, size, color, title, stage) {
    var g = new createjs.Graphics().beginFill(color).drawCircle(0, 0, size);
    var s = new createjs.Shape(g)
    s.x = x;
    s.y = y;
    // s.snapToPixel = true;
    stage.addChild(s);

    fpsLabel = new createjs.Text(title, "18px Arial", "#000");
    stage.addChild(fpsLabel);
    fpsLabel.x = x;
    fpsLabel.y = y - 3 * size;
}

function addLine(x1, y1, x2, y2, stroke, color, stage) {
    var line = new createjs.Shape();
    line.graphics.setStrokeStyle(stroke);
    line.graphics.beginStroke(color);
    line.graphics.moveTo(x1, y1);
    line.graphics.lineTo(x2, y2);
    line.graphics.endStroke();
    // line.snapToPixel = true;
    stage.addChild(line);
}

function addTrain(id, x, y, size, type, path, stage) {
    color = "#eee";
    if (type == 1) {
        color = "#0c69ff";
    } else if (type == 2) {
        color = "#3daf00";
    } else if (type == 3) {
        color = "#af0000";
    } else if (type == 4) {
        color = "#d1d120";
    } else if (type == 5) {
        color = "#ff8c00";
    } else if (type == 6) {
        color = "#a90ef7";
    }
    var g = new createjs.Graphics().beginFill(color).drawRect(-8, -8, size, size);
    var s = new createjs.Shape(g);
    s.x = x;
    s.y = y;
    // s.snapToPixel = true;
    stage.addChild(s);
    var num = stage.numChildren - 1;


    return new Train(1, num, path, type);
}


function to_seconds(time_as_str) {
    var a = time_as_str.split(':'); // split it at the colons
    // minutes are worth 60 seconds. Hours are worth 60 minutes.
    return (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
}




var LEFT_BORDER = 123
var RIGHT_BORDER = 5894

class Train {

    constructor(id, child_pos, path, type) {
        this.id = id;
        this.child_pos = child_pos;
        this.path = path;
        this.waypoint_index = 0;
        this.remain_length = 0;
        this.arrived = false;
        this.x = this.path[this.waypoint_index].x1;
        this.y = this.path[this.waypoint_index].y1;
        this.type = type;
        this.stop_waypoints = this.init_stop_waypoints();
    }
    get childPos() {
        return this.child_pos;
    }
    // сеттер
    set childPos(newValue) {
        this.child_pos = newValue;
    }

    start_at_time(time) {
    	for (var i = this.path.length - 1; i >= 0; i--) {
    		var start_at = to_seconds(this.path[i].time1);
    		var end_at = to_seconds(this.path[i].time2);
    		if (time / 1000 > start_at && time / 1000 < end_at) {
    			return [this.path[i].x1, this.path[i].y1]
    		}
    	}
    	return [0, 0]
    }

    init_stop_waypoints() {
    	var tmp = []
    	for (var i = 0; i <= this.path.length - 2; i++) {
    		var end_at_now = this.path[i].time2;
    		var start_at_next = this.path[i + 1].time1;
    		if (end_at_now != start_at_next && this.path[i].x2 > LEFT_BORDER && this.path[i].x2 < RIGHT_BORDER ) {
    			tmp.push(i);
    			// this.stop_waypoints.push(i);
    		}

    	}
    	return tmp;
    }

    findWork(current_time)
    {
    	for (var i = this.path.length - 1; i >= 0; i--) {
    		var start_at = to_seconds(this.path[i].time1);
    		var end_at = to_seconds(this.path[i].time2);
    		if (current_time > start_at && current_time < end_at) {
    			this.waypoint_index = i;
    		}
    	}

    }

    findY(x, current_path)
    {
    	var dX = current_path.x1 - current_path.x2
    	var k = 1
    	if (dX != 0) {
    		k = (current_path.y1 - current_path.y2) / dX
    	}
    	var b = current_path.y1 - k * current_path.x1

    	return k*x + b

    }

    move(train_shape, t, scaling) {
    	var second_elapsed = t / 1000;
    	this.findWork(second_elapsed);

    	var current_path = this.path[this.waypoint_index];
    	var start_at = to_seconds(current_path.time1)
        var end_at = to_seconds(current_path.time2)
        

        var deltaT = second_elapsed - start_at;


        var vec_x = current_path.x2 - current_path.x1;
        var vec_y = current_path.y2 - current_path.y1;
        var s = Math.sqrt((vec_x * vec_x) + (vec_y * vec_y))
        var direction1 = vec_x / s
        var direction2 = vec_y / s
        
        
        this.x = current_path.x1 + (vec_x / (end_at - start_at)) * deltaT;
       	this.y = this.findY(this.x, current_path);

       	
		// if (current_path.time2 != to_seconds(this.path[this.waypoint_index + 1].time1)) {
        	// train_shape.x = current_path.x2
        	// train_shape.y =	current_path.y2
        // }
        var stop = (this.stop_waypoints.indexOf(this.waypoint_index) > -1); //true
        
        if (second_elapsed >= start_at && second_elapsed <= end_at) {
        	train_shape.x = this.x
        	train_shape.y = this.y
        }





        if ((second_elapsed > end_at  && this.waypoint_index == this.path.length - 1) ||  (this.x < LEFT_BORDER || this.x > RIGHT_BORDER)  ) {
        		train_shape.x = -1000000;
        		train_shape.y = -1000000;
        }

    }

}
