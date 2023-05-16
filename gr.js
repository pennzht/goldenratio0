$ = (x) => document.getElementById(x);
elem = (x) => document.createElement(x);
elemns = (x) => document.createElementNS('http://www.w3.org/2000/svg', x);

svg = $('stage');
// iatext = $('iatext');
varwindow = $('varwindow');
element = null;
mousePos = null;
print = console.log;
val = 0;

isarr = Array.isArray;
isstr = (x) => (typeof x === 'string');

function cross (a, b) {
    const [x1, y1, z1] = a;
    const [x2, y2, z2] = b;
    return [y1*z2-z1*y2, z1*x2-x1*z2, x1*y2-y1*x2];
}

function intersect (seg1, seg2) {
    const [_a, x1, y1, x2, y2] = seg1;
    const [_b, x3, y3, x4, y4] = seg2;
    const r = cross (cross ([x1, y1, 1], [x2, y2, 1]),
                     cross ([x3, y3, 1], [x4, y4, 1]));
    return [r[0]/r[2], r[1]/r[2]];
}

function evaluate (def, values) {
    if (isarr (def)) {
        if (def[0] === 'var') {
            return values.get (def[1]);
        } else if (def[0] == '+') {
            return evaluate (def[1], values) + evaluate (def[2], values);
        } else if (def[0] == '-') {
            return evaluate (def[1], values) - evaluate (def[2], values);
        } else if (def[0] == '*') {
            return evaluate (def[1], values) * evaluate (def[2], values);
        } else if (def[0] == '/') {
            return evaluate (def[1], values) / evaluate (def[2], values);
        } else if (def[0] == '**') {
            return evaluate (def[1], values) ** evaluate (def[2], values);
        } else if (def[0] == 'list') {
            return def.slice (1).map ((x) => {
                return evaluate (x, values);
            });
        } else if (def[0] == 'segment') {
            return ['segment'].concat( evaluate (def[1], values)) .concat( evaluate (def[2], values));
        } else if (def[0] == 'intersect') {
            return intersect (evaluate (def[1], values), evaluate (def[2], values));
        } else {
            return NaN;
        }
    } else if (isstr (def)) {
        return values.get (def);
    } else {
        return def;
    }
}

/**
 * A graph representing state of the app.
 */
class Graph {
    constructor (defs, upstrs, downstrs, levels, values) {
        this.defs = defs;
        this.upstrs = upstrs;
        this.downstrs = downstrs;
        this.levels = levels;
        this.values = values;
    }

    static copy (otherGraph) {
        return new Graph (
            new Map (otherGraph.defs),
            new Map (otherGraph.upstrs),
            new Map (otherGraph.downstrs),
            new Map (otherGraph.levels),
            new Map (otherGraph.values),
        );
    }

    show () {
        print (new Map (this.values));
    }

    refresh () {
        const order = Array.from (this.defs.keys());
        order.sort ((a, b) => this.levels.get (a) - this.levels.get (b));
        for (const v of order) {
            const result = evaluate (this.defs.get (v), this.values);
            this.values.set (v, result);
        }
    }

    setValue (nameValuePair) {
        const [name, value] = nameValuePair;
        const defs = this.defs.get (name);
        if (!defs || defs[0] != 'var') {
            print (`Error: tried to set value ${name} which does not exist.`);
            return;
        }
        this.values.set (name, value);
        // Propagates changes.
        let front = new Set([name]);
        const total = new Set([name]);
        while (front.size) {
            const newFront = new Set();
            for (const v of front) {
                for (const next of this.downstrs.get(v)) {
                    if (! total.has (next)) {
                        newFront.add (next);
                        total.add (next);
                    }
                }
            }
            front = newFront;
        }
        const toUpdate = Array.from (total);
        toUpdate.sort ((a, b) => (this.levels.get(a) - this.levels.get(b)));
        print (toUpdate);
        for (const v of toUpdate) {
            const result = evaluate (this.defs.get (v), this.values);
            this.values.set (v, result);
        }
    }
}

Empty = new Graph (new Map(), new Map(), new Map(), new Map(), new Map());

Home = new Graph (
    // defs
    new Map ([['a', ['var', 'a']],  /* independent variable */
              ['e', ['var', 'e']],
              ['b', ['+', 'a', 1]],
              ['c', ['*', 'b', 'b']],
              ['d', ['-', 'c', 'e']],
              ['p', ['list', 'a', 'e']],  /* point */
              ['q', ['list', 'a', 'b']],
              ['A', ['var', 'A']],
              ['B', ['var', 'B']],
              ['C', ['var', 'C']],
              ['D', ['var', 'D']],
              ['L', ['segment', 'A', 'B']],
              ['M', ['segment', 'B', 'C']],
              ['N', ['segment', 'C', 'A']],
              ['O', ['segment', 'A', 'D']],
              ['X', ['intersect', 'M', 'O']],
              ['Y', ['segment', 'X', ['list', 60, 20]]],
             ]),
    // upstrs
    new Map ([['a', []],
              ['e', []],
              ['b', ['a']],
              ['c', ['b']],
              ['d', ['e', 'c']],
              ['p', ['a', 'e']],
              ['q', ['a', 'b']],
              ['A', []],
              ['B', []],
              ['C', []],
              ['L', ['A', 'B']],
              ['M', ['B', 'C']],
              ['N', ['C', 'A']],
             ]),
    // downstrs
    new Map ([['a', ['b', 'p', 'q']],
              ['b', ['c']],
              ['c', ['d']],
              ['e', ['d', 'p', 'q']],
              ['d', []],
              ['p', []],
              ['q', []],
              ['A', ['L', 'N', 'O']],
              ['B', ['L', 'M']],
              ['C', ['M', 'N']],
              ['D', ['O']],
              ['L', []],
              ['M', ['X']],
              ['N', []],
              ['O', ['X']],
              ['X', ['Y']],
              ['Y', []],
             ]),
    // levels
    new Map ([['a', 0],
              ['b', 1],
              ['c', 1],
              ['d', 2],
              ['e', 0],
              ['p', 1],
              ['q', 2],
              ['A', 1],
              ['B', 3],
              ['C', 3],
              ['D', 4],
              ['L', 4],
              ['M', 4],
              ['N', 4],
              ['O', 4],
              ['X', 5],
              ['Y', 6],
             ]),
    // values
    new Map ([['a', 0],
              ['b', null],
              ['c', null],
              ['d', null],
              ['e', 0],
              ['p', null],
              ['q', null],
              ['A', [30, 50]],
              ['B', [50, 50]],
              ['C', [40, 40]],
              ['D', [60, 40]],
              ['L', ['segment', 30, 50, 50, 50]],
              ['M', null],
              ['N', null],
              ['O', null],
              ['X', null],
              ['Y', null],
             ]),
)

Home.show ();

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
        if (element.hasAttribute ('data-var')) {
            // TODO: add back-propagation.
            const v = element.getAttribute ('data-var');
            const dx = newMousePos.x - mousePos.x;
            const dy = newMousePos.y - mousePos.y;
            const val1 = Home.values.get(v);
            let val2;
            if (isarr (val1)) {
                val2 = [val1[0] + dx, val1[1] + dy] ;
            } else {
                val2 = val1 + dx;
            }
            Home.setValue ([v, val2]);
            updateVarwindow (Home);
        } else if (tagName == 'p') {
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

function scrolling (e) {
    e.preventDefault();
    const ctm = svg.getScreenCTM();
    console.log (e.deltaY / ctm.a);
}

function getMousePosition (e) {
    // Current Transformation Matrix
    const ctm = svg.getScreenCTM();
    return {x: (e.clientX - ctm.e) / ctm.a, y: (e.clientY - ctm.f) / ctm.d};
}

svg.addEventListener('mousedown', startdrag);
svg.addEventListener('mouseup', enddrag);
svg.addEventListener('mouseleave', enddrag);
svg.addEventListener('mousemove', drag);
svg.addEventListener('wheel', scrolling);

/* iatext.addEventListener('mousedown', startdrag);
iatext.addEventListener('mouseup', enddrag);
iatext.addEventListener('mousemove', drag); */

// Generate values in varwindow.

function genVarwindow (graph) {
    graph.defs.forEach ((def, key, map) => {
        const disp = elem ('p');
        const value = graph.values.get (key);
        disp.innerText = key + ' = ' + def + ' = ' + value;
        disp.setAttribute ('data-var', key);
        disp.addEventListener('mousedown', startdrag);
        disp.addEventListener('mouseup', enddrag);
        disp.addEventListener('mousemove', drag);
        if (isarr (def) && def[0] === 'var') {
            disp.classList.add ('draggable');
        }
        varwindow.appendChild (disp);

        // Add svg element
        if (isarr (value) && value.length == 2) {
            const [x, y] = value;
            const point = elemns ('circle');
            point.setAttribute ('data-var', key);
            point.setAttribute ('cx', x);
            point.setAttribute ('cy', y);
            point.setAttribute ('r', 1);
            point.setAttribute ('fill', 'blue');
            point.classList.add ('draggable');  // Experimental
            svg.appendChild (point);
        }

        if (isarr (value) && value[0] == 'segment' && value.length == 5) {
            const [_head, x1, y1, x2, y2] = value;
            const path = elemns ('path');
            path.setAttribute ('data-var', key);
            path.setAttribute ('d', ['M', x1, y1, 'L', x2, y2].join(' '));
            path.setAttribute ('stroke', '#555555');
            svg.appendChild (path);
        }
    });
}

function updateVarwindow (graph) {
    const children = varwindow.childNodes;
    for (const child of children) {
        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        print (child);
        const key = child.getAttribute ('data-var');
        child.innerText = key + ' = ' + graph.defs.get(key) + ' = ' + graph.values.get(key);
    }
    const graphics = svg.childNodes;
    for (const child of graphics) {
        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        print (child);
        const key = child.getAttribute ('data-var');
        const coords = graph.values.get (key);
        if (coords != undefined && coords.length == 2) {
            child.setAttribute ('cx', coords[0]);
            child.setAttribute ('cy', coords[1]);
        } else if (coords != undefined && coords.length == 5 && coords[0] == 'segment') {
            const [_head, x1, y1, x2, y2] = coords;
            child.setAttribute ('d', ['M', x1, y1, 'L', x2, y2].join(' '));
        }
    }
}

Home.refresh();
genVarwindow (Home);

