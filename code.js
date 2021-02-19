var visualizationCanvas;
var gl;

var rainFramebuffer;
var rainRenderbuffer;
var rainTexturebuffer;
var rainTexture;
var rainsSamplerLocation;

var edgeTexture;

var faceTexturebuffer;
var faceFramebuffer;
var faceRenderbuffer;
var faceTexture;
var faceSamplerLocation;

var shaderProgram;
var indicesLength;
var timeLocation;
var modeLocation;
var positionLocation;
var TEXTURE_WIDTH = 1024;

$(document).ready(function () {
    visualizationCanvas = document.getElementById("visualization");

    var vertCode = $("#vertexShader").html();
    var fragCode = $("#fragmentShader").html();
    download("libs/simplex.glsl", function (simplex) {
        gl = visualizationCanvas.getContext('experimental-webgl');
        compileShaders(gl,            
            vertCode.replace('#include<libs/noise>', simplex),
            fragCode.replace('#include<libs/noise>', simplex)
        );


        rainTexturebuffer = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, rainTexturebuffer);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TEXTURE_WIDTH, TEXTURE_WIDTH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        rainRenderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, rainRenderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, TEXTURE_WIDTH, TEXTURE_WIDTH);
        rainFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, rainFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rainTexturebuffer, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rainRenderbuffer);

        faceTexturebuffer = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, faceTexturebuffer);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, TEXTURE_WIDTH, TEXTURE_WIDTH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        faceRenderbuffer = gl.createRenderbuffer();
        gl.bindRenderbuffer(gl.RENDERBUFFER, faceRenderbuffer);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, TEXTURE_WIDTH, TEXTURE_WIDTH);
        faceFramebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, faceFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, faceTexturebuffer, 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, faceRenderbuffer);

        initScene();
        loop(0);
    });

});

function initScene() {
    gl.useProgram(shaderProgram);

    // get shader locations
    positionLocation = gl.getAttribLocation(shaderProgram, "position");
    timeLocation = gl.getUniformLocation(shaderProgram, "time");
    modeLocation = gl.getUniformLocation(shaderProgram, "drawMode");
    faceSamplerLocation = gl.getUniformLocation(shaderProgram, "sampler[0]");
    rainSamplerLocation = gl.getUniformLocation(shaderProgram, "sampler[1]");


    // initialize shader variables

    // init vertices and indices
    var vertices = [];
    var indices = [];
    var length = 2;

    vertices.push(0);
    vertices.push(0);
    vertices.push(0);
    vertices.push(1);
    vertices.push(1);
    vertices.push(0);
    vertices.push(1);
    vertices.push(1);

    indices.push(0);
    indices.push(1);
    indices.push(2);
    indices.push(3);
    indices.push(2);
    indices.push(1);

    // create vertex buffer
    var vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLocation);

    // create index buffer
    var indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    indicesLength = indices.length;

    faceTexture = loadImage('normal.png', gl.TEXTURE0, function () {

    });

    rainTexture = loadImage('matrix.png', gl.TEXTURE1, function () {
        
    });

    edgeTexture = loadImage('edge.png', gl.TEXTURE1, function () {
        
    });
}

function bindTexture(gl, uniform, position, texture) {
    gl.uniform1i(uniform, position);
    gl.activeTexture(gl.TEXTURE0 + position);
    gl.bindTexture(gl.TEXTURE_2D, texture);
}

function loadImage(src, index, callback) {
    const texture = gl.createTexture();
    this.img = new Image();
    this.img.onload = function () {
        gl.activeTexture(gl.TEXTURE0+index);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
        gl.generateMipmap(gl.TEXTURE_2D);
        callback();
    };
    this.img.src = src;
    return texture;
}

function compileShaders(gl, vertexShaderCode, fragmentShaderCode) {

    console.log(vertexShaderCode, fragmentShaderCode);



    // compile vertex shader
    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertexShaderCode);
    gl.compileShader(vertShader);
    var err1 = gl.getShaderInfoLog(vertShader);
    if (err1) {
        alert(err1);
    }

    // compile fragment shader
    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragmentShaderCode);
    gl.compileShader(fragShader);
    var err2 = gl.getShaderInfoLog(fragShader);
    if (err2) {
        alert(err2);
    }

    // link shaders
    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
}

function draw(time) {
    drawVisualization(time);
}

function drawVisualization(time) {
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.depthFunc(gl.LEQUAL);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clearDepth(1.0);

    gl.viewport(0.0, 0.0, visualizationCanvas.width, visualizationCanvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform1f(timeLocation, time);
    
    gl.uniform1i(modeLocation, 0);
    bindTexture(gl, faceSamplerLocation, 0, faceTexture);
    bindTexture(gl, rainSamplerLocation, 1, rainTexture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, rainFramebuffer);
    gl.drawElements(gl.TRIANGLES, indicesLength, gl.UNSIGNED_SHORT, 0);


    gl.uniform1i(modeLocation, 1);
    bindTexture(gl, faceSamplerLocation, 0, faceTexture);
    bindTexture(gl, rainSamplerLocation, 1, rainTexturebuffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, faceFramebuffer);
    gl.drawElements(gl.TRIANGLES, indicesLength, gl.UNSIGNED_SHORT, 0);

    gl.uniform1i(modeLocation, 2);
    bindTexture(gl, faceSamplerLocation, 0, edgeTexture);
    bindTexture(gl, rainSamplerLocation, 1, faceTexturebuffer);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.drawElements(gl.TRIANGLES, indicesLength, gl.UNSIGNED_SHORT, 0);
}
