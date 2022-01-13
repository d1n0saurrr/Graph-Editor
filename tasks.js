function paintPath(path) {
    alert('Путь: ' + path)
    for (let i = 0; i < path.length - 1; i++) {
        let curve = layer.findOne(`#line_${path[i]}_${path[i + 1]}_${nodes.get(path[i]).get(path[i + 1]).length - 1}`) !== undefined ?
            layer.findOne(`#line_${path[i]}_${path[i + 1]}_${nodes.get(path[i]).get(path[i + 1]).length - 1}`) :
            layer.findOne(`#line_${path[i + 1]}_${path[i]}_${nodes.get(path[i + 1]).get(path[i]).length - 1}`)
        curve.stroke('red')
    }

    save(path, "Сохранить путь?")
}

function returnDefaultPath(path) {
    for (let i = 0; i < path.length - 1; i++) {
        let curve = layer.findOne(`#line_${path[i]}_${path[i + 1]}_${nodes.get(path[i]).get(path[i + 1]).length - 1}`) !== undefined ?
            layer.findOne(`#line_${path[i]}_${path[i + 1]}_${nodes.get(path[i]).get(path[i + 1]).length - 1}`) :
            layer.findOne(`#line_${path[i + 1]}_${path[i]}_${nodes.get(path[i + 1]).get(path[i]).length - 1}`)
        curve.stroke('blue')
    }
}

function paintCommand(path) {
    addHistoryCommand({
        undo: () => {
            returnDefaultPath(path)
        },
        redo: () => {
            paintPath(path)
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

function startEndPathPaint(procedure) {
    let start = prompt("Введите начальную вершину", '0')
    let end = prompt("Введите конечную вершину", '0')
    start = getId(start)
    end = getId(end)
    let path = procedure(start, end)
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
    } else {
        let path = []

        for (let i = end; i !== -1; i = p[i])
            path.push(i)

        path = path.reverse()
        return path
    }
}