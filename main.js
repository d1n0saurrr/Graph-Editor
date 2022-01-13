let width = window.innerWidth * 0.7
let height = window.innerHeight * 0.93
let xCenter = width / 2, yCenter = height / 2

let trs
let changingTd
let oldTdValue
let hasChanged

let history = []
let historyAt = -1

let nodes = new Map()
let nodesDrawn = new Map()
let curves = new Map()

let isCreatingNode = false
let isCreatingEdge = false
let idNodeFrom = -1
let idNodeTo = -1
let currentElem
let editCurveName
let editCurve

function show() {
    //console.log(nodes)

    for (let [id1, value] of nodes) {
        console.log(id1 + ":\n")
        for (let [id2, stack] of value) {
            let str = "   " + id2 + ": "
            stack.forEach(s => str = str + s + " ")
            console.log(str)
        }
    }
}

// maxHistoryCount = 10
function addHistoryCommand(command) {
    if (historyAt === 9) {
        history = history.slice(1, historyAt + 10)
        historyAt--
    }
    else if (history.length > historyAt + 1)
        history = history.slice(0, historyAt + 1)

    history.push(command)
    historyAt++
    return command
}

function addToMatrix(id1, id2, weight12, weight21) {
    weight12 = parseInt(weight12)
    weight21 = parseInt(weight21)
    let name

    if (weight12 === 0 && weight21 === 0)
        return

    if (weight12 === 0 && weight21 !== 0) {
        name = addEdge(id1, id2, weight21)
        makeEdgeOriented(layer.findOne('#' + name))
        inverseOrientation(layer.findOne('#' + name))
    } else if (weight12 !== 0 && weight21 === 0) {
        name = addEdge(id1, id2, weight12)
        makeEdgeOriented(layer.findOne('#' + name))
    } else {
        addEdge(id1, id2, weight12)
    }
}

function appendMatrix(id) {
    let th = document.createElement("th")
    th.appendChild(document.createTextNode(id))
    trs[0].appendChild(th)

    for (let i = 1; i < trs.length; i++) {
        let td = document.createElement("td")
        td.appendChild(document.createTextNode('0'))
        td.setAttribute("contenteditable", "true")
        trs[i].appendChild(td)
    }

    let tr = document.createElement("tr")
    th = document.createElement("th")
    th.appendChild(document.createTextNode(id))
    tr.appendChild(th)
    matrix.appendChild(tr)

    for (let i = 1; i < trs.length; i++) {
        let td = document.createElement("td")
        td.appendChild(document.createTextNode('0'))
        td.setAttribute("contenteditable", "true")
        tr.appendChild(td)
    }
}

function removeFromMatrix(id) {
    let i = 0

    for (i; i < trs[0].cells.length; i++) {
        if (trs[0].cells[i].textContent === id.toString()) {
            trs[0].cells[i].remove()
            break
        }
    }

    for (let j = 1; j < trs.length; j++) {
        if (trs[j].cells[0].textContent === id.toString()) {
            trs[j].remove()
            continue
        }

        trs[j].cells[i].remove()
    }
}

function updEdgeMatrix(id1, id2, weight, twoSide) {
    if (weight === -1) {
        trs[id1 + 1].cells[id2 + 1].textContent = trs[id2 + 1].cells[id1 + 1].textContent
        return
    }

    if (weight === -2) {
        if (trs[id1 + 1].cells[id2 + 1].textContent === '0') {
            trs[id1 + 1].cells[id2 + 1].textContent = trs[id2 + 1].cells[id1 + 1].textContent
            trs[id2 + 1].cells[id1 + 1].textContent = 0
        } else {
            trs[id2 + 1].cells[id1 + 1].textContent = trs[id1 + 1].cells[id2 + 1].textContent
            trs[id1 + 1].cells[id2 + 1].textContent = 0
        }

        return
    }

    if (twoSide) {
        if (trs[id2 + 1].cells[id1 + 1].textContent !== 0)
            trs[id2 + 1].cells[id1 + 1].textContent = weight
    }

    trs[id1 + 1].cells[id2 + 1].textContent = weight
}

function changedMatrix(id1, id2, weight, oldWeight) {
    weight = parseInt(weight)
    oldWeight = parseInt(oldWeight)

    let id1id2 = `line_${id1}_${id2}_${0}`, id2id1 = `line_${id2}_${id1}_${0}`
    let curveName = curves.get(id1id2) !== undefined ? id1id2 : id2id1
    let curve = curves.get(curveName)

    let weight21 = nodes.get(id2).get(id1) === undefined ? 0 : nodes.get(id2).get(id1)[0]
    weight21 = parseInt(weight21)

    if (curve === undefined) {
        addHistoryCommand({
            undo: () => deleteEdge(id1, id2),
            redo: () => addEdge(id1, id2, weight)
        })
    } else if (weight === 0 && weight21 === 0) {
        addHistoryCommand({
            undo: () => {
                if (curveName === id1id2) {
                    addEdge(id1, id2, oldWeight)
                    makeEdgeOriented(layer.findOne('#' + curveName))
                } else {
                    addEdge(id2, id1, oldWeight)
                    makeEdgeOriented(layer.findOne('#' + curveName))
                }
            },
            redo: () => {
                if (curveName === id1id2)
                    deleteEdge(id1, id2)
                else
                    deleteEdge(id2, id1)
            }
        })
    } else if (weight === 0) {
        addHistoryCommand({
            undo: () => {
                if (curveName === id1id2) {
                    deleteEdge(id1, id2)
                    addEdge(id1, id2, oldWeight)
                } else {
                    deleteEdge(id2, id1)
                    addEdge(id2, id1, oldWeight)
                }
            },
            redo: () => {
                if (curveName === id1id2) {
                    deleteEdge(id1, id2)
                    addEdge(id1, id2, weight21)
                    makeEdgeOriented(layer.findOne('#' + curveName))
                    inverseOrientation(layer.findOne('#' + curveName))
                } else {
                    deleteEdge(id2, id1)
                    addEdge(id2, id1, weight21)
                    makeEdgeOriented(layer.findOne('#' + curveName))
                }
            }
        })
    } else {
        addHistoryCommand({
            undo: () => {
                if (curveName === id1id2) {
                    deleteEdge(id1, id2)
                    addEdge(id1, id2, weight)
                    makeEdgeOriented(layer.findOne('#' + curveName))
                    inverseOrientation(layer.findOne('#' + curveName))
                } else {
                    deleteEdge(id2, id1)
                    addEdge(id2, id1, weight)
                    makeEdgeOriented(layer.findOne('#' + curveName))
                }
            },
            redo: () => {
                if (curveName === id1id2) {
                    deleteEdge(id1, id2)
                    addEdge(id1, id2, weight)
                } else {
                    deleteEdge(id2, id1)
                    addEdge(id2, id1, weight)
                }
            }
        })
    }

    history[historyAt].redo()
}

function addNode(x, y, id, name = id) {
    nodes.set(id, new Map())
    nodesDrawn.set(id, buildNode(x, y, id, name))
    appendMatrix(name)
}

function deleteNode(id) {
    layer.findOne('#node_' + id).destroy()
    nodesDrawn.delete(id)
    nodes.delete(id)
    removeFromMatrix(id)
}

// создание вершины (также для точек кривых безье)
function buildNode(x, y, id = -1, name = id) {
    let node = new Konva.Group({
        x: x,
        y: y,
        id: 'node_' + id,
        draggable: true
    })

    node.add(new Konva.Circle({
        radius: 12,
        stroke: '#666',
        fill: '#ddd',
        strokeWidth: 2,
    }))

    if (id !== -1) {
        let digits2 = name.toString().length > 1
        let count = name.toString().length
        node.add(new Konva.Text({
            x: digits2 ? -5 * count : -5,
            y: digits2 ? -9 : -8,
            text: name,
            fontSize: 20,
            fontFamily: 'Calibri',
            align: 'center',
        }))
    }

    layer.add(node)

    // add hover styling
    node.on('mouseover', function () {
        document.body.style.cursor = 'pointer'
        //this.children[0].fill('#48e33d')
        this.children[0].strokeWidth(4)
    })

    node.on('mouseout', function () {
        document.body.style.cursor = 'default'
        //this.children[0].fill('#ddd')
        this.children[0].strokeWidth(2)
    })

    node.on('dragmove', function () {
        updateLines(id)
    })

    node.on('dragstart', function () {
        let x = node.x(), y = node.y()
        addHistoryCommand({
            undo: () => {
                node.x(x)
                node.y(y)
                updateLines(id)
            },
            redo: undefined
        })
    })

    node.on('dragend', function () {
        let x = node.x(), y = node.y()
        history[history.length - 1].redo = () => {
            node.x(x)
            node.y(y)
            updateLines(id)
        }
    })

    node.on('click', function (e) {
        if (isCreatingEdge && e.evt.button === 0) {
            if (idNodeFrom === -1) {
                idNodeFrom = id
            } else if (idNodeFrom !== id) {
                idNodeTo = id
                let id1Copy = idNodeFrom, id2Copy = idNodeTo
                let weight = prompt('Введите вес:', '1')
                addHistoryCommand({
                    undo: () => deleteEdge(id1Copy, id2Copy),
                    redo: () => addEdge(id1Copy, id2Copy, weight)
                }).redo()

                idNodeFrom = -1
                idNodeTo = -1
            }

            return
        }

        let nodeMenu = document.getElementById('node_menu')
        let containerRect = stage.container().getBoundingClientRect();
        nodeMenu.style.top =
            containerRect.top + stage.getPointerPosition().y + 4 + 'px';
        nodeMenu.style.left =
            containerRect.left + stage.getPointerPosition().x + 4 + 'px';
        nodeMenu.style.display = 'initial'
    })

    return node
}

// отрисовка ребра (кривой безье)
function drawEdge(curve, name) {
    let bezierLine = new Konva.Shape({
        stroke: 'blue',
        strokeWidth: 4,
        fillEnabled: false,
        id: name,
        sceneFunc: (ctx, shape) => {
            ctx.beginPath()
            ctx.moveTo(curve.start.x(), curve.start.y())
            ctx.bezierCurveTo(
                curve.control1.x(),
                curve.control1.y(),
                curve.control2.x(),
                curve.control2.y(),
                curve.end.x(),
                curve.end.y()
            )
            ctx.fillStrokeShape(shape)
        },
    })
    layer.add(bezierLine)

    // add hover styling
    bezierLine.on('mouseover', function () {
        document.body.style.cursor = 'pointer'
        //this.stroke('green')
        this.opacity(0.5)

        if (curve.startArrow !== undefined && curve.startArrow.visible()) {
            curve.startArrow.opacity(0.5)
        }

        if (curve.endArrow !== undefined && curve.endArrow.visible()) {
            curve.endArrow.opacity(0.5)
        }
    })

    bezierLine.on('mouseout', function () {
        document.body.style.cursor = 'default'
        if (!curve.editing) {
            //this.stroke('blue')
            this.opacity(1)

            if (curve.startArrow !== undefined && curve.startArrow.visible()) {
                curve.startArrow.opacity(1)
            }

            if (curve.endArrow !== undefined && curve.endArrow.visible()) {
                curve.endArrow.opacity(1)
            }
        }
    })

    bezierLine.on('click', function (e) {
        if (e.evt.button === 2) {
            let edgeMenu = document.getElementById('edge_menu')
            let containerRect = stage.container().getBoundingClientRect();
            edgeMenu.style.top =
                containerRect.top + stage.getPointerPosition().y + 4 + 'px';
            edgeMenu.style.left =
                containerRect.left + stage.getPointerPosition().x + 4 + 'px';
            edgeMenu.style.display = 'initial'
            return
        }

        if (curve.editing === false) {
            if (editCurve !== undefined) {
                layer.findOne('#bezierLinePath_' + editCurveName).hide()
                editCurve.control1.hide()
                editCurve.control2.hide()
                editCurve.editing = false
                layer.findOne('#' + editCurveName).stroke('blue')
            }

            editCurveName = name
            editCurve = curve
            layer.findOne('#bezierLinePath_' + name).show()
            curve.control1.show()
            curve.control2.show()
            curve.editing = true
        } else {
            editCurveName = ''
            editCurve = undefined
            layer.findOne('#bezierLinePath_' + name).hide()
            curve.control1.hide()
            curve.control2.hide()
            curve.editing = false
        }

        updateLines()
    })

    let bezierLinePath = new Konva.Line({
        dash: [10, 10, 0, 10],
        strokeWidth: 3,
        stroke: 'black',
        lineCap: 'round',
        id: 'bezierLinePath_' + name,
        opacity: 0.3,
        points: [0, 0],
    })
    layer.add(bezierLinePath)

    return bezierLinePath.getZIndex()
}

function addEdge(idNodeFrom, idNodeTo, weight) {
    if (idNodeFrom === idNodeTo) {
        return makeALoop(nodesDrawn.get(idNodeFrom), weight)
    }

    updEdgeMatrix(idNodeFrom, idNodeTo, weight)
    updEdgeMatrix(idNodeTo, idNodeFrom, weight)
    let oldEdge = undefined, c1, c2, name, min = nodesDrawn.get(idNodeFrom), max = nodesDrawn.get(idNodeTo)

    if (nodes.get(idNodeFrom).get(idNodeTo) === undefined) {
        nodes.get(idNodeFrom).set(idNodeTo, [weight])
    } else {
        oldEdge = curves.get(`line_${idNodeFrom}_${idNodeTo}_${nodes.get(idNodeFrom).get(idNodeTo).length - 1}`)
        nodes.get(idNodeFrom).get(idNodeTo).push(weight)
    }

    if (nodes.get(idNodeTo).get(idNodeFrom) === undefined) {
        nodes.get(idNodeTo).set(idNodeFrom, [weight])
    } else {
        oldEdge = oldEdge === undefined ? curves.get(`line_${idNodeTo}_${idNodeFrom}_${nodes.get(idNodeTo).get(idNodeFrom).length - 1}`) : oldEdge
        nodes.get(idNodeTo).get(idNodeFrom).push(weight)
    }

    name = `line_${idNodeFrom}_${idNodeTo}_${nodes.get(idNodeFrom).get(idNodeTo).length - 1}`

    if (oldEdge !== undefined) {
        c1 = {
            x: oldEdge.control1.x() + 20,
            y: oldEdge.control1.y() + 20
        }
        c2 = {
            x: oldEdge.control2.x() + 20,
            y: oldEdge.control2.y() + 20
        }
    } else {
        let node1 = nodesDrawn.get(idNodeFrom), node2 = nodesDrawn.get(idNodeTo)
        c1 = findDotOnLine(node1, node2, 0.3)
        c2 = findDotOnLine(node1, node2, 0.6)
    }

    curves.set(name, {
        start: min,
        end: max,
        control1: buildNode(c1.x, c1.y).hide(),
        control2: buildNode(c2.x, c2.y).hide(),
        startArrow: undefined,
        endArrow: undefined,
        text: undefined,
        editing: false
    })

    let curve = curves.get(name)
    let text = new Konva.Text({
        x: findMidBLine(curve.start.x(), curve.control1.x(), curve.control2.x(), curve.end.x()),
        y: findMidBLine(curve.start.y(), curve.control1.y(), curve.control2.y(), curve.end.y()),
        id: 'text_' + name,
        text: weight,
        fontSize: 20,
        fontStyle: 'bold',
        fontFamily: 'Calibri',
        fill: 'red',
    })
    layer.add(text)
    curve.text = text

    let zIndex = drawEdge(curve, name)
    curve.control1.setZIndex(zIndex)
    curve.control2.setZIndex(zIndex)
    setZIdxForNodes(zIndex)
    return name
}

function findMidBLine(p0, p1, p2, p3) {
    return p0 * Math.pow(1 - 0.5, 3) + p1 * 3 * 0.5 * Math.pow(1 - 0.5, 2)
        + p2 * 3 * (1 - 0.5) * Math.pow(0.5, 2) + p3 * Math.pow(0.5, 3)
}

// задание Z индекса для вершин
function setZIdxForNodes(zIndex) {
    for (let node of nodesDrawn.values())
        node.setZIndex(zIndex)

    for (let curve of curves.values())
        if (curve.startArrow !== undefined) {
            curve.startArrow.setZIndex(curve.start.getZIndex())
            curve.endArrow.setZIndex(curve.end.getZIndex())
        }
}

function deleteEdge(id1, id2) {
    if (id1 === id2) {
        deleteTheLoop(nodesDrawn.get(id1))
        return
    }

    updEdgeMatrix(id1, id2, 0)
    updEdgeMatrix(id2, id1, 0)
    let length = nodes.get(id1).get(id2).length;

    if (nodes.get(id1).get(id2).length === 1) {
        nodes.get(id1).delete(id2)
    } else {
        nodes.get(id1).get(id2).pop()
    }

    if (nodes.get(id2).get(id1).length === 1) {
        nodes.get(id2).delete(id1)
    } else {
        nodes.get(id2).get(id1).pop()
    }

    let name = `line_${id1}_${id2}_${length - 1}`
    layer.findOne(`#` + name).destroy()
    layer.findOne(`#bezierLinePath_` + name).destroy()
    layer.findOne(`#text_` + name).destroy()
    curves.get(name).control1.destroy()
    curves.get(name).control2.destroy()

    if (curves.get(name).startArrow !== undefined) {
        curves.get(name).startArrow.destroy()
        curves.get(name).endArrow.destroy()
    }

    curves.delete(name)
    editCurve = undefined
    editCurveName = ''
}

// нахождение точек для первоначального расположения точек кривых безье
function findDotOnLine(start, end, percent) {
    let k = (end.y() - start.y()) / (end.x() - start.x())
    let b = (end.x() * start.y() - start.x() * end.y()) / (end.x() - start.x())

    return {
        x: start.x() + percent * (end.x() - start.x()),
        y: k * (start.x() + percent * (end.x() - start.x())) + b
    }
}

function makeALoop(node, weight) {
    let idInt = parseInt(node.id().replace(/node_/, ''))
    let name = `line_${idInt}_${idInt}_0`

    if (curves.get(name) !== undefined)
        if (curves.get(name).text.text() === weight.toString())
            return
        else
            curves.delete(name)

    curves.set(name, {
        start: node,
        end: node,
        control2: buildNode(node.x() + 50, node.y()).hide(),
        control1: buildNode(node.x(), node.y() + 50).hide(),
        startArrow: undefined,
        endArrow: undefined,
        text: undefined,
        editing: false
    })

    let curve = curves.get(name)
    let text = new Konva.Text({
        x: findMidBLine(curve.start.x(), curve.control1.x(), curve.control2.x(), curve.end.x()),
        y: findMidBLine(curve.start.y(), curve.control1.y(), curve.control2.y(), curve.end.y()),
        id: 'text_' + name,
        text: weight,
        fontSize: 20,
        fontStyle: 'bold',
        fontFamily: 'Calibri',
        fill: 'red',
    })

    layer.add(text)
    curve.text = text
    let zIndex = drawEdge(curves.get(name), name)
    curves.get(name).control1.setZIndex(zIndex)
    curves.get(name).control1.setZIndex(zIndex)
    setZIdxForNodes(zIndex)
    updEdgeMatrix(idInt, idInt, weight)
    nodes.get(idInt).set(idInt, [weight])
    return name
}

function deleteTheLoop(node) {
    let idInt = parseInt(node.id().replace(/node_/, ''))
    let name = `line_${idInt}_${idInt}_0`

    curves.get(name).control1.destroy()
    curves.get(name).control2.destroy()
    curves.delete(name)
    layer.findOne(`#` + name).destroy()
    layer.findOne(`#text_` + name).destroy()
    nodes.get(idInt).delete(idInt)
    updEdgeMatrix(idInt, idInt, 0)
}

function makeEdgeOriented(edge) {
    let curve = curves.get(edge.id())
    let from = edge.id().replace(/line_/, '').replace(/_[0-9]+_[0-9]+/, ''),
        to = edge.id().replace(/line_[0-9]+_/, '').replace(/_[0-9]+/, '')

    if (from === to) {
        historyAt--
        history.pop()
        return
    }

    if (curve.startArrow !== undefined)
        return

    curve.startArrow = new Konva.Arrow({
        points: [0, 0],
        stroke: 'blue',
        id: 'startArrow_' + edge.id(),
        strokeWidth: 7,
    })
    layer.add(curve.startArrow)

    curve.endArrow = new Konva.Arrow({
        points: [0, 0],
        stroke: 'blue',
        id: 'endArrow_' + edge.id(),
        strokeWidth: 7,
    })
    layer.add(curve.endArrow)
    curve.startArrow.hide()

    updateArrowOfCurve(curve)
    updEdgeMatrix(parseInt(to), parseInt(from), 0)
    nodes.get(parseInt(to)).get(parseInt(from))[0] = 0
}

function deleteEdgesOrientation(edge) {
    let curve = curves.get(edge.id())
    let from = edge.id().replace(/line_/, '').replace(/_[0-9]+_[0-9]+/, ''),
        to = edge.id().replace(/line_[0-9]+_/, '').replace(/_[0-9]+/, '')

    if (from === to)
        return

    updEdgeMatrix(parseInt(to), parseInt(from), -1)
    nodes.get(parseInt(to)).get(parseInt(from))[0] = nodes.get(parseInt(to)).get(parseInt(from))[0]

    curve.startArrow = undefined
    curve.endArrow = undefined

    layer.findOne(`#startArrow_` + edge.id()).destroy()
    layer.findOne(`#endArrow_` + edge.id()).destroy()
}

function inverseOrientation(edge) {
    let curve = curves.get(edge.id())
    let from = edge.id().replace(/line_/, '').replace(/_[0-9]+_[0-9]+/, ''),
        to = edge.id().replace(/line_[0-9]+_/, '').replace(/_[0-9]+/, '')

    if (from === to) {
        history.pop()
        historyAt--
        return
    }

    if (curve.startArrow === undefined)
        return

    if (curve.startArrow.isVisible()) {
        curve.startArrow.hide()
        curve.endArrow.show()
        updEdgeMatrix(parseInt(from), parseInt(to), -2)

        return
    }

    if (curve.endArrow.isVisible()) {
        curve.endArrow.hide()
        curve.startArrow.show()
    }

    updEdgeMatrix(parseInt(to), parseInt(from), -2)
    let a = nodes.get(parseInt(to)).get(parseInt(from))[0]
    nodes.get(parseInt(to)).get(parseInt(from))[0] = nodes.get(parseInt(from)).get(parseInt(to))[0]
    nodes.get(parseInt(from)).get(parseInt(to))[0] = a
}

// изменение положения стрелки
function updateArrowOfCurve(curve) {
    if (curve.startArrow !== undefined && curve.startArrow.isVisible) {
        let x = curve.start.x() - curve.control1.x()
        let y = curve.start.y() - curve.control1.y()
        /*let one = curve.start, two = curve.control1, three = curve.control2, four = curve.end
        let t1 = 0.05, t2 = 0.1

        let x1 = Math.pow(1 - t1, 3) * one.x() + 3 * Math.pow(1 - t1, 2) * t1 * two.x() + 3 * (1 - t1) * Math.pow(t1, 2) * three.x() + Math.pow(t1, 3) * four.x(),
            y1 =  Math.pow(1 - t1, 3) * one.y() + 3 * Math.pow(1 - t1, 2) * t1 * two.y() + 3 * (1 - t1) * Math.pow(t1, 2) * three.y() + Math.pow(t1, 3) * four.y()
        let x2 = Math.pow(1 - t2, 3) * one.x() + 3 * Math.pow(1 - t2, 2) * t2 * two.x() + 3 * (1 - t2) * Math.pow(t2, 2) * three.x() + Math.pow(t2, 3) * four.x(),
            y2 =  Math.pow(1 - t2, 3) * one.y() + 3 * Math.pow(1 - t2, 2) * t2 * two.y() + 3 * (1 - t2) * Math.pow(t2, 2) * three.y() + Math.pow(t2, 3) * four.y()
        let x3 = (x2 - x1) * Math.cos(0.52) - (y2 - y1) * Math.sin(0.52) + x1,
            y3 = (x2 - x1) * Math.sin(0.52) + (y2 - y1) * Math.cos(0.52) + y1

        console.log(one, two, three, four)
        console.log(x1, y1, x2, y2, x3, y3)

        layer.add(new Konva.Line({
            points: [x1, y1, x3, y3],
            stroke: 'blue',
            strokeWidth: 4
        }))*/

        curve.startArrow.points([
            -Math.sign(x) * Math.abs(x) / 100 + curve.start.x(),
            -Math.sign(y) * Math.abs(y) / 100 + curve.start.y(),
            curve.start.x(),
            curve.start.y(),
        ])
    }

    if (curve.endArrow !== undefined && curve.endArrow.isVisible) {
        let x = curve.end.x() - curve.control2.x()
        let y = curve.end.y() - curve.control2.y()

        curve.endArrow.points([
            -Math.sign(x) * Math.abs(x) / 100 + curve.end.x(),
            -Math.sign(y) * Math.abs(y) / 100 + curve.end.y(),
            curve.end.x(),
            curve.end.y(),
        ])
    }
}

function updateLines(id = -1) {
    if (id !== -1) {
        if (nodes.get(id).size !== 0) {
            for (let [key, value] of nodes.get(id)) {
                for (let i = 0; i < value.length; i++) {
                    let curve = curves.get(`line_${key}_${id}_${i}`) !== undefined ? curves.get(`line_${key}_${id}_${i}`) : curves.get(`line_${id}_${key}_${i}`)
                    curve.text.x(findMidBLine(curve.start.x(), curve.control1.x(), curve.control2.x(), curve.end.x()))
                    curve.text.y(findMidBLine(curve.start.y(), curve.control1.y(), curve.control2.y(), curve.end.y()))

                    if (curve.startArrow !== undefined) {
                        updateArrowOfCurve(curve)
                    }
                }
            }
        }
    }

    if (editCurve === undefined)
        return

    let bezierLinePath = layer.findOne('#bezierLinePath_' + editCurveName)

    bezierLinePath.points([
        editCurve.start.x(),
        editCurve.start.y(),
        editCurve.control1.x(),
        editCurve.control1.y(),
        editCurve.control2.x(),
        editCurve.control2.y(),
        editCurve.end.x(),
        editCurve.end.y(),
    ])

    if (editCurve.startArrow !== undefined) {
        updateArrowOfCurve(editCurve)
    }

    editCurve.text.x(findMidBLine(editCurve.start.x(), editCurve.control1.x(), editCurve.control2.x(), editCurve.end.x()))
    editCurve.text.y(findMidBLine(editCurve.start.y(), editCurve.control1.y(), editCurve.control2.y(), editCurve.end.y()))
}