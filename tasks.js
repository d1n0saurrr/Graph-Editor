function getCurve(from, to) {
    return layer.findOne(`#line_${from}_${to}_${nodes.get(from).get(to).length - 1}`) !== undefined ?
        layer.findOne(`#line_${from}_${to}_${nodes.get(from).get(to).length - 1}`) :
        layer.findOne(`#line_${to}_${from}_${nodes.get(from).get(to).length - 1}`)
}

function paintPath(path, isSaving = true, text) {
    alert(text + path)

    for (let i = 0; i < path.length - 1; i++) {
        let curve = getCurve(path[i], path[i + 1])
        curve.stroke('red')
    }

    if (isSaving)
        save(path, "Сохранить путь?")
}

function returnDefaultPath(path) {
    for (let i = 0; i < path.length - 1; i++) {
        let curve = getCurve(path[i], path[i + 1])
        curve.stroke('blue')
    }
}

function paintCommand(path, isSaving = true, text = "Путь: ") {
    addHistoryCommand({
        undo: () => {
            returnDefaultPath(path)
        },
        redo: () => {
            paintPath(path, isSaving, text)
        }
    }).redo()
}

async function save(text, message) {
    await new Promise(resolve => setTimeout(resolve, 500))
    let save = confirm(message)

    if (save) {
        let handle = await window.showSaveFilePicker()
        let stream = await handle.createWritable()
        await stream.write(text)
        await stream.close()
    }
}

function getAdjMatrix() {
    let matrix = []
    for (let i = 1; i < trs.length; i++) {
        matrix.push([])
        for (let j = 1; j < trs[i].cells.length; j++) {
            matrix[i - 1].push(parseInt(trs[i].cells[j].textContent))
        }
    }

    return matrix
}

function getAdjLists() {
    let matrix = []
    for (let nodes1 of nodes.values()) {
        let list = []
        for (let node2 of nodes1.keys())
            list.push(node2)

        matrix.push(list)
    }

    return matrix
}

async function generate() {
    function randomInt(max) {
        return Math.floor(Math.random() * max)
    }

    let count = prompt("Введите количество вершин", "1")
    let matrix = Array(parseInt(count)).fill(0)

    for (let i = 0; i < count; i++)
        matrix[i] = Array(parseInt(count)).fill(0)

    for (let i = 0; i < count; i++)
        for (let j = i + 1; j < count; j++)
            if (randomInt(101) > 60) {
                matrix[i][j] = matrix[j][i] = 1
            }

    let handle = await window.showSaveFilePicker()
    let stream = await handle.createWritable()
    stream.write(" ")
    for (let i = 0; i < count; i++) {
        stream.write(" " + i)
    }

    stream.write("\r\n")

    for (let i = 0; i < matrix.length; i++) {
        stream.write(i)
        let text = ''
        for (let j = 0; j < matrix.length; j++) {
            text += " " + matrix[i][j]
        }

        stream.write(text)

        if (i !== matrix.length - 1)
            stream.write("\r\n")
    }

    stream.close()
}

function startEndPathPaint(procedure) {
    let start = prompt("Введите начальную вершину", '0')
    let end = prompt("Введите конечную вершину", '0')
    start = getId(start)
    end = getId(end)
    let path = procedure(start, end)

    if (path !== undefined)
        paintCommand(path)
}

function bfs(start, end) {
    let queue = [], visited = [], d = [Array(nodes.size).fill(0)], p = [Array(nodes.size).fill(0)]
    queue.push(start)
    visited.push(start)
    p[start] = -1

    while(queue.length > 0) {
        let v = queue.shift()
        for(let [neighbor, weight] of nodes.get(v)) {
            if(weight[0] !== 0 && !visited.includes(neighbor)) {
                queue.push(neighbor)
                visited.push(neighbor)
                d[neighbor] = d[neighbor] + 1
                p[neighbor] = v
            }
        }
    }

    if (!visited.includes(end)) {
        alert(`От вершины ${start} нет пути до вершины ${end}`)
        return undefined
    } else {
        let path = []
        for (let i = end; i !== -1; i = p[i])
            path.push(i)

        path = path.reverse()
        return path
    }
}