Line(Point(100, 30), Point(400, 30));
const db = DraggableBox("red");
set(left(db), 100);
// how to restrict movement of `db` to be on the line?
// - make it only Draggable in the x direction...
// - make it somehow the projection of the mouse onto the line somehow?
