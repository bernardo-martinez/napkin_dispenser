import {Socket, Presence} from "phoenix"

const id = window.location.pathname.split("/")[1]
let isMaster = sessionStorage.getItem("isMaster") == "true"

const socket = new Socket("/socket", {params: {token: window.userToken}})
const channel = socket.channel(`drawing:${id}`, {isMaster: isMaster})
const presence = new Presence(channel);

const clearBtn = document.getElementById( 'clear' );
const newBtn = document.getElementById( 'new' );
const paintCanvas = document.getElementById( 'canvas' );
const info = document.getElementById('info')
const colorPicker = document.querySelector( '.js-color-picker');
const lineWidthRange = document.querySelector( '.js-line-range' );
const lineWidthLabel = document.querySelector( '.js-range-value' );

paintCanvas.width = window.innerWidth;
paintCanvas.height = window.innerHeight - 134;

const context = paintCanvas.getContext( '2d' );
context.lineCap = 'round';

let x = 0, y = 0;
let isMouseDown = false;

function renderOnlineUsers(presence) {
  let response = ""

  presence.list((_id, {metas: [_first, ...rest]}) => {
    let count = rest.length + 1
    response += `online: ${count}`
  })

  info.innerHTML = response
}

const newNapkin = () => {
  const uuid = crypto.randomUUID()
  location.href = "/" + uuid
}   

const clearCanvas = () => {
  if (isMaster) {
    context.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
    channel.push("clear", {})
  }
}

const changeStrokeStyle = (event) => {
  context.strokeStyle = event.target.value; 
}

const changeLineWidth = (event) => {
  const width = event.target.value;
  lineWidthLabel.innerHTML = width;
  context.lineWidth = width;
}

const stopDrawing = () => { isMouseDown = false; }
const startDrawing = event => {
   isMouseDown = true;   
   [x, y] = [event.offsetX, event.offsetY];  
}
const drawLine = event => {
    if ( isMouseDown ) {
        const newX = event.offsetX;
        const newY = event.offsetY;
        context.beginPath();
        context.moveTo( x, y );
        context.lineTo( newX, newY );
        context.stroke();

        const drawAction = {
          type: 'draw',
          startX: x,
          startY: y,
          endX: newX,
          endY: newY,
          color: context.strokeStyle,
          lineWidth: 2
      };
      x = newX;
      y = newY;
      channel.push("draw", drawAction)
    }
}

socket.connect()
presence.onSync(() => renderOnlineUsers(presence));

channel.join()
  .receive("ok", resp => { 
    console.log("Joined successfully", resp);
  
    if(resp.is_master) {
      sessionStorage.setItem("isMaster", true)
    }
  })
  .receive("error", resp => { console.log("Unable to join", resp) })

if (isMaster) {
  paintCanvas.addEventListener( 'mousedown', startDrawing );
  paintCanvas.addEventListener( 'mousemove', drawLine );
  paintCanvas.addEventListener( 'mouseup', stopDrawing );
  paintCanvas.addEventListener( 'mouseout', stopDrawing );
} else {
  channel.on("clear", _payload => {
    context.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
  })

  channel.on("draw", payload => {
    context.beginPath();
    context.moveTo(payload.startX, payload.startY);
    context.lineTo(payload.endX, payload.endY);
    context.strokeStyle = payload.color;
    context.lineWidth = payload.lineWidth;
    context.stroke();
  })
}

colorPicker.addEventListener( 'change', changeStrokeStyle);
lineWidthRange.addEventListener( 'input', changeLineWidth);

clearBtn.addEventListener( 'click', clearCanvas );
newBtn.addEventListener('click', newNapkin);