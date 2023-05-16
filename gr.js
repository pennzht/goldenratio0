stage = document.getElementById('stage');
iatext = document.getElementById('iatext');
element = null;
mousePos = null;
print = console.log;
val = 0;

function startdrag(e) {
    print (e.target);
    if (e.target.classList.contains ('draggable')) {
        element = e.target;
        mousePos = getMousePosition(e);
    }
}

function enddrag(e) {
    element = null;
    mousePos = getMousePosition(e);
}

function drag(e) {
    if (element)  {
        e.preventDefault();
        const tagName = element.tagName.toLowerCase();
        const newMousePos = getMousePosition (e);
        if (tagName == 'p') {
            print ('!!!');
            const dx = newMousePos.x - mousePos.x;
            val += dx;
            element.innerHTML = 'Value = ' + val;
        } else {
            const xName = tagName == 'rect' ? 'x' : 'cx';
            const yName = tagName == 'rect' ? 'y' : 'cy';
            const x = parseFloat(element.getAttributeNS(null, xName));
            element.setAttributeNS(null, xName, x + newMousePos.x - mousePos.x);
            const y = parseFloat(element.getAttributeNS(null, yName));
            element.setAttributeNS(null, yName, y + newMousePos.y - mousePos.y);
        }
        mousePos = newMousePos;
    }
}

function getMousePosition (e) {
    // Current Transformation Matrix
    const ctm = stage.getScreenCTM();
    return {x: (e.clientX - ctm.e) / ctm.a, y: (e.clientY - ctm.f) / ctm.d};
}

stage.addEventListener('mousedown', startdrag);
stage.addEventListener('mouseup', enddrag);
stage.addEventListener('mouseleave', enddrag);
stage.addEventListener('mousemove', drag);

iatext.addEventListener('mousedown', startdrag);
iatext.addEventListener('mouseup', enddrag);
iatext.addEventListener('mousemove', drag);
