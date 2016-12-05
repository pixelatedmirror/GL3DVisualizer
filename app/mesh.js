
var gl;

var smoothing = 8;
var nRows = 64;
var nColumns = 64;

analyser.fftSize = 2048;
var bufferLength = analyser.fftSize;
var dataArray = new Uint8Array(bufferLength);

var buffer = [];
var bufLen = 5;

var data = new Array(nRows);
data.fill(new Array(nColumns).fill(0));


var pointsArray = [];

var fColor;

var near = -10;
var far = 10;
var radius = 6.0;
//var theta  = -Math.PI/2;
//var phi    = -Math.PI/4;
console.log("var theta="+theta+";\nvar phi="+phi+";")
var theta=-1.57;
var phi=-0.8727335374002834;
var dr = 5.0 * Math.PI/180.0;

var camera = {
    near: -10,
    far: 5,
    aspect: 0.7,
    fovAngle: 45,
    z: .4
}

const black = vec4(0.0, 0.0, 0.0, 1.0);
const red = vec4(1.0, 0.0, 0.0, 1.0);
//var dx = 0.0, dy = 0.0, dz = 0.0;
//console.log("var dx="+dx+", dy="+dy+", dz="+dz+";")
var dx=-0.27497259058634904, dy=0.6095288320997905, dz=0.0008958460067709551;

const up = vec3(0.0, 1.0, 0.0);

var modelViewMatrixLoc, projectionMatrixLoc;

var vBufferId;

window.onresize = function resize(){
    var canvas = document.getElementById( "gl-canvas" );
    canvas.width=window.innerWidth-50;
    canvas.height=window.innerHeight-50;
    gl.viewport( 0, 0, canvas.width, canvas.height );
    console.log(canvas.width + "," + canvas.height)
}

window.onload = function init()
{
    var canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }
    canvas.width=window.innerWidth-50;
    canvas.height=window.innerHeight-50;

    gl.viewport( 0, 0, canvas.width, canvas.height );
    
    gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
    
    // enable depth testing and polygon offset
    // so lines will be in front of filled triangles
    
    //gl.enable(gl.DEPTH_TEST);
    //gl.depthFunc(gl.LESS);
    gl.enable(gl.POLYGON_OFFSET_FILL);
    gl.polygonOffset(1.0, 2.0);

// vertex array of nRows*nColumns quadrilaterals 
// (two triangles/quad) from data
    
    for(var i=0; i<nRows-1; i++) {
        for(var j=0; j<nColumns-1;j++) {
            pointsArray.push( vec4(2*i/nRows-1, data[i][j], 2*j/nColumns-1, 1.0));
            pointsArray.push( vec4(2*(i+1)/nRows-1, data[i+1][j], 2*j/nColumns-1, 1.0)); 
            pointsArray.push( vec4(2*(i+1)/nRows-1, data[i+1][j+1], 2*(j+1)/nColumns-1, 1.0));
            pointsArray.push( vec4(2*i/nRows-1, data[i][j+1], 2*(j+1)/nColumns-1, 1.0) );
    }
}
    //
    //  Load shaders and initialize attribute buffers
    //
    var program = initShaders( gl, "mountain-terrain-shader", "fragment-shader" );
    gl.useProgram( program );
    

    vBufferId = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );
    gl.bufferData( gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);
    
    var vPosition = gl.getAttribLocation( program, "vPosition" );
    gl.vertexAttribPointer( vPosition, 4, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( vPosition );
    
    fColor = gl.getUniformLocation(program, "fColor");
 
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
	initControls();

    render();
 
}

function initControls(){
    keyHandler();
}
function keyHandler(){
    document.addEventListener('mousewheel', function(event)
    {
        event.preventDefault();
        if (event.deltaY > 0) camera.z += 0.1;
        else camera.z -= 0.1;        
    })
    document.addEventListener('keydown', function(event)
    {
        event = event || window.event;
        if (event.ctrlKey)
        {
            event.preventDefault();
            switch (event.keyCode)
            {
                case 37 || 65: //left arrow
                    theta -= dr;
                    break;
                case 39 || 68: //right arrow
                    theta += dr;
                    break;
                case 38 || 87: //up arrow
                    phi += dr;
                    break;
                case 40 || 83: //down arrow
                    phi -= dr;
                    break;
                default:
                    break;
            }
        }
        else
        {
            //up
            if (event.keyCode == 38 || event.keyCode == 87)
            {
                event.preventDefault();
                dx += Math.sin(theta) * 0.1 * Math.sin(phi);
                dy -= Math.sin(theta) * 0.1 * Math.cos(phi);
                dz += Math.sin(phi) * 0.1 * Math.cos(theta);
            }
            //down
            else if (event.keyCode == 40 || event.keyCode == 83)
            {
                event.preventDefault();
                dx -= Math.sin(theta) * 0.1 * Math.sin(phi);
                dy += Math.sin(theta) * 0.1 * Math.cos(phi);
                dz -= Math.sin(phi) * 0.1 * Math.cos(theta);
            }
            //left
            else if (event.keyCode == 37 || event.keyCode == 65)
            {
                event.preventDefault();
                dx += Math.cos(theta) * 0.1;
                dz += Math.sin(theta) * 0.1;
            }
            //right
            else if (event.keyCode == 39 || event.keyCode == 68)
            {
                event.preventDefault();
                dx -= Math.cos(theta) * 0.1;
                dz -= Math.sin(theta) * 0.1;
            }
       }
});
}
function degToRad(degrees){
	return degrees * Math.PI / 180;
}
function radToDeg(r){
	return r * 180 / Math.PI;
}

function render()
{
  analyser.getByteTimeDomainData(dataArray);
  var newArray = new Array(nColumns);
  newArray.fill(0);
  var factor = (dataArray.length)/nColumns;

  for(var i=0;i<dataArray.length;i++){
    newArray[Math.floor(i/factor)]+=((dataArray[i]-127)/255);
  } 
  for(var i=0;i<64;i++){
    newArray[i]/=factor;
  }
  var canvas = document.getElementById( "gl-canvas" );

  buffer.push(newArray);
  if(buffer.length>bufLen) buffer.shift();
  console.log(buffer.length);

  var line = Array(buffer[0].length);
  line.fill(0.0);

  
  for(var i=0;i<buffer[0].length;i++){
    for(var j=0;j<buffer.length;j++){
        line[i]+=buffer[j][i]/(Math.abs(j-buffer.length/2));
    }
    line[i]/=buffer.length;
  }

  data.shift();
  data.push(line);
  //console.log(line);
  
    //data.shift();
    //data.push(newArray.slice(0,nColumns));

    /*var data2  = data.map(function(arr) {
                            return arr.slice();
                          });*/

    function smoothArray( values, smoothing ){
      for(var j=0;j<values[0].length;++j){
          var value = values[0][j]; // start with the first input
          for (var i=1, len=values.length; i<len; ++i){
            var currentValue = values[i][j];
            value += (currentValue - value) / smoothing;
            values[i][j] = value;
          }
      }
    }

    function smoothArray2( values, smoothing ){
      for(var j=0;j<values.length;++j){
          var value = values[j][0]; // start with the first input
          for (var i=1, len=values[j].length; i<len; ++i){
            var currentValue = values[j][i];
            value += (currentValue - value) / (smoothing/2);
            values[j][i] = value;
          }
          value = values[j][values[j].length-1];
          for (var i=values[j].length-2; i>=0; --i){
            var currentValue = values[j][i];
            value += (currentValue - value) / (smoothing/2);
            values[j][i] = value;
          }
      }
    }

    function remSS(values){
        for(var i=0;i<values.length;i++){
            var total=0;
            var count=0;
            for(var j=0;j<values[i].length;j++){
                total+=values[i][j];
                count++;
            }
            var avg=total/count;
            //console.log(avg);
            for(var j=0;j<values[i].length;j++){
                values[i][j]-=avg;
            }
        }
    }

    remSS(data);
    var scale = 1.5;
    var shift = 0.1;

    //smoothArray(data2, smoothing);
    //smoothArray2(data2, 3);
    //data2 = data2.slice(smoothing, data2.length-smoothing);

    pointsArray = [];
    for(var i=0; i<nRows-1; i++) {
        for(var j=0; j<nColumns-1;j++) {
            pointsArray.push( vec4(2*i/nRows-1,     shift+scale*data[i][j],     2*j/nColumns-1,      camera.z));
            pointsArray.push( vec4(2*(i+1)/nRows-1, shift+scale*data[i+1][j],   2*j/nColumns-1,      camera.z)); 
            pointsArray.push( vec4(2*(i+1)/nRows-1, shift+scale*data[i+1][j+1], 2*(j+1)/nColumns-1,  camera.z));
            pointsArray.push( vec4(2*i/nRows-1,     shift+scale*data[i][j+1],   2*(j+1)/nColumns-1,  camera.z));
        }
    }

    gl.bindBuffer( gl.ARRAY_BUFFER, vBufferId );

    gl.bufferSubData( gl.ARRAY_BUFFER, 0, flatten(pointsArray));


    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    var eye = vec3( radius*Math.sin(theta)*Math.cos(phi) + dx, 
                    radius*Math.sin(theta)*Math.sin(phi) + dy,
                    radius*Math.cos(theta) + dz) ;
    var at = vec3(dx, dy, dz);

    modelViewMatrix = lookAt( eye, at, up );
    projectionMatrix = perspective(camera.fovAngle, camera.aspect, camera.near, camera.far);

    gl.uniformMatrix4fv( modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    gl.uniformMatrix4fv( projectionMatrixLoc, false, flatten(projectionMatrix) );
    
    // draw each quad as two filled red triangles
    // and then as two black line loops
    var currentMax = 0;
   /* for (var m = 0; m < pointsArray.length; m++){
        
        //res =  Math.max.apply(pointsArray[m].map(function(o) {return o[2]}));
        //console.log(res);
    }*/
    var col = new Array();
    for(var i=0; i<pointsArray.length; i+=4) { 
        for (var j = 0; j < pointsArray[i].length; j++){
            col[j] = (pointsArray[pointsArray.length-4-i][j]);
        }
      //  console.log(col);
        if (col[1] < 0.25){
            col = rgbToHsl(0, col[1], 0);
        }
        else if (col[1] > 0.25){
            col = col = rgbToHsl(col[0], col[1], col[1]/2);
        }
       // col = rgbToHsl(0, col[1], 0);
       // console.log(col);
        col[3] = 1.0;
        var magenta = vec4(1,1,0,1);  //magenta means use shader colors
        gl.uniform4fv(fColor, flatten(magenta));
        gl.drawArrays( gl.LINE_LOOP, pointsArray.length-4-i, 4 );
        gl.uniform4fv(fColor, flatten(magenta));
        gl.drawArrays( gl.TRIANGLE_FAN, pointsArray.length-4-i, 4 );
        
    }
    

    requestAnimFrame(render);
}